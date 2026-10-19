// Programme de la carte Labo Blocs — Arduino Uno et mBot (carte mCore). Repris de l'essai du jalon 0 (essais/).
// Installé une seule fois dans la carte. Il fait deux choses :
//   1. Mode « Dans la carte » : il garde en EEPROM le programme de l'élève (code octet, 1 Ko au plus)
//      et l'exécute tout seul à chaque mise sous tension, même débranché de l'ordinateur.
//   2. Mode « En direct » : il obéit aux ordres envoyés par le navigateur (protocole v2, ci-dessous).
//
// Protocole v2 (une commande par ligne, 115200 bauds). Le v1 du théâtre d'ombre est gardé tel quel.
//   PING                    → PONG v2 <version firmware> <carte> <octets programme> <capacité>
//   D <broche> <0|1>        → OK            sortie numérique
//   A <broche> <0..255>     → OK            intensité (broches PWM)
//   T <broche> <Hz> <ms>    → OK            note
//   OFF                     → OK            tout éteindre, arrêter les moteurs
//   S <broche> <0..180>     → OK            servo-moteur
//   M <broche> <I|P|O>      → OK            mode : entrée, entrée avec résistance (bouton vers GND), sortie
//   R <broche>              → V <broche> <0|1>       lecture numérique (niveau électrique)
//   RA <broche>             → V <broche> <0..1023>   lecture analogique
//   W [<broche> …]          → OK            surveiller ces entrées : la carte envoie « E <broche> <0|1> »
//                                           à chaque changement (sans broche : arrêter)
//   X <ext> <cmd> [args…]   → V <valeur>    commande d'extension (mBot : moteurs, capteurs, LED)
//   PROG <octets>           → OK            prépare l'envoi d'un programme (efface l'ancien)
//   H <hexadécimal>         → OK            morceau du programme (64 caractères au plus)
//   FIN                     → OK <octets>   vérifie et garde le programme
//   RUN / STOP              → OK            lance / arrête le programme gardé
//   EFFACE                  → OK            « Vider la carte » : efface le programme, tout s'éteint
// Erreurs : ERR CMD, ERR PIN, ERR TAILLE, ERR CRC, ERR FORMAT.
// Sécurité (comme le v1) : en mode direct, sans message pendant 3 s, la carte éteint tout.
// Toute commande du mode direct arrête le programme gardé et éteint tout (il reprendra au prochain démarrage).

#include <Arduino.h>
#include <EEPROM.h>
#include <Servo.h>
#include "vm.h"

// 0.2 : mBot, un moteur seul (extension 1, commande 9).
// 0.3 (mBot seulement) : afficheur LED Matrix 8×16 sur le port 4 (extension 1, commandes 10 à 15). L'Uno reste en 0.2.
#if defined(CARTE_MCORE)
#define VERSION_FIRMWARE "0.3"
#define NOM_CARTE "mcore"
#else
#define VERSION_FIRMWARE "0.2"
#define NOM_CARTE "uno"
#endif

const uint16_t CAPACITE = E2END + 1;
const uint32_t SILENCE_MAX = 3000;

// ---------- Broches ----------
static bool brocheAutorisee(int b) { return b >= 2 && b <= 21; }
static bool brochePwm(int b) { return b == 3 || b == 5 || b == 6 || b == 9 || b == 10 || b == 11; }
// A6 et A7 (20, 21) sont seulement analogiques sur l'ATmega328P en boîtier TQFP (mCore, Nano).
static int lireNiveau(int b) { return b >= 20 ? (analogRead(b - 14) > 512 ? HIGH : LOW) : digitalRead(b); }

// ---------- Servo-moteurs (4 au plus) ----------
static Servo servos[4];
static int8_t brochesServo[4] = {-1, -1, -1, -1};
static void ecrireServo(int b, int angle) {
  int libre = -1;
  for (int i = 0; i < 4; i++) {
    if (brochesServo[i] == b) {
      servos[i].write(angle);
      return;
    }
    if (brochesServo[i] < 0 && libre < 0) libre = i;
  }
  if (libre < 0) return;
  // Angle donné AVANT d'activer le servo : sinon il saute d'abord à 90°.
  servos[libre].write(angle);
  servos[libre].attach(b);
  brochesServo[libre] = b;
}
static void lacherServos() {
  for (int i = 0; i < 4; i++)
    if (brochesServo[i] >= 0) servos[i].detach(), brochesServo[i] = -1;
}

// ---------- mBot (mCore) ----------
#if defined(CARTE_MCORE)
// Moteurs : M1 (gauche) PWM D6, sens D7 ; M2 (droite) PWM D5, sens D4. Vitesse -100 à 100.
static void moteur(int pwm, int sens, float vitesse) {
  int v = (int)(vitesse * 2.55f);
  v = constrain(v, -255, 255);
  pinMode(sens, OUTPUT);
  digitalWrite(sens, v >= 0 ? HIGH : LOW);
  analogWrite(pwm, abs(v));
}
static void moteurs(float gauche, float droite) {
  moteur(6, 7, -gauche); // le moteur gauche est monté à l'envers
  moteur(5, 4, droite);
}
static void moteurSeul(int quel, float vitesse) {
  if (quel == 1) moteur(6, 7, -vitesse);
  else if (quel == 2) moteur(5, 4, vitesse);
}
// Ports RJ25 du mCore : broches S1 et S2.
static const uint8_t PORTS[5][2] = {{0, 0}, {11, 12}, {9, 10}, {A2, A3}, {A0, A1}};
static float ultrasonBroche(int b) {
  pinMode(b, OUTPUT);
  digitalWrite(b, LOW);
  delayMicroseconds(2);
  digitalWrite(b, HIGH);
  delayMicroseconds(10);
  digitalWrite(b, LOW);
  pinMode(b, INPUT);
  unsigned long d = pulseIn(b, HIGH, 25000UL); // 25 ms : au-delà de 4 m
  return d ? d / 58.0f : 400;
}
// Le capteur ultrasons de Makeblock n'a qu'un fil de signal : le 2e du port (S2), comme dans la bibliothèque Makeblock.
static float ultrason(int port) { return port >= 1 && port <= 4 ? ultrasonBroche(PORTS[port][1]) : 0; }
static float ligne(int port) {
  if (port < 1 || port > 4) return 0;
  pinMode(PORTS[port][0], INPUT);
  pinMode(PORTS[port][1], INPUT);
  // 0 : les deux capteurs sur la ligne noire, 3 : les deux sur le blanc (comme mBlock).
  return digitalRead(PORTS[port][0]) * 2 + digitalRead(PORTS[port][1]);
}
// Deux LED RGB (WS2812) sur D13 : envoi bit à bit, interruptions coupées (16 MHz).
static uint8_t couleurs[6];
static void envoyerLed() {
  volatile uint8_t *port = &PORTB;
  uint8_t haut = *port | _BV(5), bas = *port & ~_BV(5);
  pinMode(13, OUTPUT);
  uint8_t sreg = SREG;
  cli();
  for (uint8_t i = 0; i < 6; i++) {
    // Ordre des couleurs du WS2812 : vert, rouge, bleu.
    uint8_t octet = couleurs[(i / 3) * 3 + (i % 3 == 0 ? 1 : i % 3 == 1 ? 0 : 2)];
    for (uint8_t m = 0x80; m; m >>= 1) {
      if (octet & m) {
        *port = haut;
        asm volatile("nop\n nop\n nop\n nop\n nop\n nop\n nop\n nop\n nop\n nop\n");
        *port = bas;
        asm volatile("nop\n nop\n nop\n");
      } else {
        *port = haut;
        asm volatile("nop\n nop\n nop\n");
        *port = bas;
        asm volatile("nop\n nop\n nop\n nop\n nop\n nop\n nop\n nop\n nop\n");
      }
    }
  }
  SREG = sreg;
  delayMicroseconds(60);
}
static void ledRgb(int quelle, int r, int v, int b) {
  for (int i = 0; i < 2; i++) {
    if (quelle != 0 && quelle != i + 1) continue;
    couleurs[i * 3] = constrain(r, 0, 255);
    couleurs[i * 3 + 1] = constrain(v, 0, 255);
    couleurs[i * 3 + 2] = constrain(b, 0, 255);
  }
  envoyerLed();
}

// Afficheur LED Matrix 8×16 de Makeblock sur le port 4 : horloge sur S1 (A0), données sur S2 (A1), comme la
// bibliothèque Makeblock (MeLEDMatrix). 16 colonnes d'un octet, bit 0 = point du haut. Les tables sont les mêmes que
// dans noyau/cartes.js (vérifié par un test).
// Sens de l'afficheur sur le robot : à vérifier avec Thomas (un dessin avec un point en haut à gauche).
#define MATRICE_HAUT_BAS 0      // 1 : retourner le haut et le bas
#define MATRICE_GAUCHE_DROITE 0 // 1 : retourner la gauche et la droite
static const uint8_t MATRICE_SCK = A0, MATRICE_DIN = A1;
static const uint8_t POLICE_MATRICE[475] PROGMEM = {
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x5f, 0x00, 0x00, 0x00, 0x07, 0x00, 0x07, 0x00, 0x14, 0x7f, 0x14, 0x7f, 0x14,
  0x24, 0x2a, 0x7f, 0x2a, 0x12, 0x23, 0x13, 0x08, 0x64, 0x62, 0x36, 0x49, 0x55, 0x22, 0x50, 0x00, 0x05, 0x03, 0x00, 0x00,
  0x00, 0x1c, 0x22, 0x41, 0x00, 0x00, 0x41, 0x22, 0x1c, 0x00, 0x08, 0x2a, 0x1c, 0x2a, 0x08, 0x08, 0x08, 0x3e, 0x08, 0x08,
  0x00, 0x50, 0x30, 0x00, 0x00, 0x08, 0x08, 0x08, 0x08, 0x08, 0x00, 0x60, 0x60, 0x00, 0x00, 0x20, 0x10, 0x08, 0x04, 0x02,
  0x3e, 0x51, 0x49, 0x45, 0x3e, 0x00, 0x42, 0x7f, 0x40, 0x00, 0x42, 0x61, 0x51, 0x49, 0x46, 0x21, 0x41, 0x45, 0x4b, 0x31,
  0x18, 0x14, 0x12, 0x7f, 0x10, 0x27, 0x45, 0x45, 0x45, 0x39, 0x3c, 0x4a, 0x49, 0x49, 0x30, 0x01, 0x71, 0x09, 0x05, 0x03,
  0x36, 0x49, 0x49, 0x49, 0x36, 0x06, 0x49, 0x49, 0x29, 0x1e, 0x00, 0x36, 0x36, 0x00, 0x00, 0x00, 0x56, 0x36, 0x00, 0x00,
  0x08, 0x14, 0x22, 0x41, 0x00, 0x14, 0x14, 0x14, 0x14, 0x14, 0x00, 0x41, 0x22, 0x14, 0x08, 0x02, 0x01, 0x51, 0x09, 0x06,
  0x32, 0x49, 0x79, 0x41, 0x3e, 0x7e, 0x11, 0x11, 0x11, 0x7e, 0x7f, 0x49, 0x49, 0x49, 0x36, 0x3e, 0x41, 0x41, 0x41, 0x22,
  0x7f, 0x41, 0x41, 0x22, 0x1c, 0x7f, 0x49, 0x49, 0x49, 0x41, 0x7f, 0x09, 0x09, 0x09, 0x01, 0x3e, 0x41, 0x49, 0x49, 0x7a,
  0x7f, 0x08, 0x08, 0x08, 0x7f, 0x00, 0x41, 0x7f, 0x41, 0x00, 0x20, 0x40, 0x41, 0x3f, 0x01, 0x7f, 0x08, 0x14, 0x22, 0x41,
  0x7f, 0x40, 0x40, 0x40, 0x40, 0x7f, 0x02, 0x0c, 0x02, 0x7f, 0x7f, 0x04, 0x08, 0x10, 0x7f, 0x3e, 0x41, 0x41, 0x41, 0x3e,
  0x7f, 0x09, 0x09, 0x09, 0x06, 0x3e, 0x41, 0x51, 0x21, 0x5e, 0x7f, 0x09, 0x19, 0x29, 0x46, 0x46, 0x49, 0x49, 0x49, 0x31,
  0x01, 0x01, 0x7f, 0x01, 0x01, 0x3f, 0x40, 0x40, 0x40, 0x3f, 0x1f, 0x20, 0x40, 0x20, 0x1f, 0x3f, 0x40, 0x38, 0x40, 0x3f,
  0x63, 0x14, 0x08, 0x14, 0x63, 0x07, 0x08, 0x70, 0x08, 0x07, 0x61, 0x51, 0x49, 0x45, 0x43, 0x00, 0x7f, 0x41, 0x41, 0x00,
  0x02, 0x04, 0x08, 0x10, 0x20, 0x00, 0x41, 0x41, 0x7f, 0x00, 0x04, 0x02, 0x01, 0x02, 0x04, 0x40, 0x40, 0x40, 0x40, 0x40,
  0x00, 0x01, 0x02, 0x04, 0x00, 0x20, 0x54, 0x54, 0x54, 0x78, 0x7f, 0x48, 0x44, 0x44, 0x38, 0x38, 0x44, 0x44, 0x44, 0x20,
  0x38, 0x44, 0x44, 0x48, 0x7f, 0x38, 0x54, 0x54, 0x54, 0x18, 0x08, 0x7e, 0x09, 0x01, 0x02, 0x0c, 0x52, 0x52, 0x52, 0x3e,
  0x7f, 0x08, 0x04, 0x04, 0x78, 0x00, 0x44, 0x7d, 0x40, 0x00, 0x20, 0x40, 0x44, 0x3d, 0x00, 0x7f, 0x10, 0x28, 0x44, 0x00,
  0x00, 0x41, 0x7f, 0x40, 0x00, 0x7c, 0x04, 0x18, 0x04, 0x78, 0x7c, 0x08, 0x04, 0x04, 0x78, 0x38, 0x44, 0x44, 0x44, 0x38,
  0x7c, 0x14, 0x14, 0x14, 0x08, 0x08, 0x14, 0x14, 0x18, 0x7c, 0x7c, 0x08, 0x04, 0x04, 0x08, 0x48, 0x54, 0x54, 0x54, 0x20,
  0x04, 0x3f, 0x44, 0x40, 0x20, 0x3c, 0x40, 0x40, 0x20, 0x7c, 0x1c, 0x20, 0x40, 0x20, 0x1c, 0x3c, 0x40, 0x30, 0x40, 0x3c,
  0x44, 0x28, 0x10, 0x28, 0x44, 0x0c, 0x50, 0x50, 0x50, 0x3c, 0x44, 0x64, 0x54, 0x4c, 0x44, 0x00, 0x08, 0x36, 0x41, 0x00,
  0x00, 0x00, 0x7f, 0x00, 0x00, 0x00, 0x41, 0x36, 0x08, 0x00, 0x08, 0x04, 0x08, 0x10, 0x08,
};
static const uint8_t CHIFFRES_MATRICE[33] PROGMEM = {
  0x7f, 0x41, 0x7f, 0x42, 0x7f, 0x40, 0x79, 0x49, 0x4f, 0x49, 0x49, 0x7f, 0x0f, 0x08, 0x7f, 0x4f, 0x49, 0x79, 0x7f, 0x49,
  0x79, 0x01, 0x01, 0x7f, 0x7f, 0x49, 0x7f, 0x4f, 0x49, 0x7f, 0x08, 0x08, 0x08,
};
static uint8_t matrice[16];          // ce que montre l'afficheur
static uint8_t dessinRecu[16];       // dessin en cours de réception (commandes 10 et 11)
static uint8_t lettresRecues[40];    // texte en cours de réception (commandes 14 et 15)
static uint8_t nbRecues = 0;
static uint8_t lettresMatrice[40];   // texte affiché (ou qui défile)
static uint8_t nbLettres = 0;
static int16_t colonnesDefile = 0;   // largeur du texte qui défile (0 : rien ne défile)
static uint32_t debutDefile = 0;
static int16_t decalageAffiche = -32767;
static bool matriceUtilisee = false; // l'afficheur ne s'éteint que s'il a servi (le port 4 peut rester libre)

static void matriceOctet(uint8_t o) {
  for (uint8_t i = 0; i < 8; i++) {
    digitalWrite(MATRICE_SCK, LOW);
    digitalWrite(MATRICE_DIN, o & 1);
    digitalWrite(MATRICE_SCK, HIGH);
    o >>= 1;
  }
}
// Début d'un ordre : DIN descend pendant que l'horloge est haute ; fin : DIN remonte pendant que l'horloge est haute.
static void matriceDebut() {
  digitalWrite(MATRICE_SCK, HIGH);
  digitalWrite(MATRICE_DIN, LOW);
}
static void matriceFin() {
  digitalWrite(MATRICE_SCK, LOW);
  digitalWrite(MATRICE_DIN, LOW);
  digitalWrite(MATRICE_SCK, HIGH);
  digitalWrite(MATRICE_DIN, HIGH);
}
static uint8_t retourner(uint8_t o) {
  uint8_t r = 0;
  for (uint8_t i = 0; i < 8; i++) r |= ((o >> i) & 1) << (7 - i);
  return r;
}
static void envoyerMatrice() {
  matriceUtilisee = true;
  pinMode(MATRICE_SCK, OUTPUT);
  pinMode(MATRICE_DIN, OUTPUT);
  digitalWrite(MATRICE_SCK, HIGH);
  digitalWrite(MATRICE_DIN, HIGH);
  matriceDebut();
  matriceOctet(0x40); // les adresses avancent toutes seules
  matriceFin();
  matriceDebut();
  matriceOctet(0xC0); // à partir de la colonne 0
  for (uint8_t i = 0; i < 16; i++) {
    uint8_t o = matrice[MATRICE_GAUCHE_DROITE ? 15 - i : i];
    matriceOctet(MATRICE_HAUT_BAS ? retourner(o) : o);
  }
  matriceFin();
  matriceDebut();
  matriceOctet(0x8C); // affichage allumé, luminosité moyenne (0 à 7 : 4)
  matriceFin();
}
static void viderMatrice() {
  memset(matrice, 0, sizeof matrice);
}
// Colonne i d'un texte : 5 colonnes par lettre, puis une colonne vide.
static uint8_t colonneTexte(int16_t i) {
  if (i < 0 || i >= colonnesDefile) return 0;
  uint8_t x = i % 6, code = lettresMatrice[i / 6];
  if (x == 5) return 0;
  if (code < 32 || code > 126) code = '?';
  return pgm_read_byte(&POLICE_MATRICE[(code - 32) * 5 + x]);
}
static void avancerMatrice();
// Un texte qui tient (2 lettres au plus) reste immobile et centré ; sinon il entre par la droite et sort par la
// gauche, une fois, une colonne toutes les 100 ms (avancerMatrice, à chaque tour de loop). Le même texte redonné
// pendant qu'il défile continue de défiler (comme dans le simulateur).
static void afficherTexte(const uint8_t *lettres, uint8_t n) {
  if (colonnesDefile && n == nbLettres && !memcmp(lettres, lettresMatrice, n)) return;
  memcpy(lettresMatrice, lettres, n);
  nbLettres = n;
  colonnesDefile = n ? n * 6 - 1 : 0;
  viderMatrice();
  if (colonnesDefile <= 16) {
    int16_t debut = (16 - colonnesDefile) / 2;
    for (int16_t i = 0; i < colonnesDefile; i++) matrice[debut + i] = colonneTexte(i);
    colonnesDefile = 0;
    envoyerMatrice();
    return;
  }
  debutDefile = millis();
  decalageAffiche = -32767;
  avancerMatrice();
}
static void avancerMatrice() {
  if (!colonnesDefile) return;
  int16_t decalage = (int16_t)((millis() - debutDefile) / 100) - 16;
  if (decalage == decalageAffiche) return;
  decalageAffiche = decalage;
  for (uint8_t x = 0; x < 16; x++) matrice[x] = colonneTexte(decalage + x);
  envoyerMatrice();
  if (decalage >= colonnesDefile) colonnesDefile = 0; // sorti par la gauche : l'afficheur reste vide
}
static void afficherColonnes() {
  colonnesDefile = 0;
  envoyerMatrice();
}
static void poserChiffre(uint8_t k, uint8_t x) {
  for (uint8_t i = 0; i < 3; i++)
    if (x + i < 16) matrice[x + i] = pgm_read_byte(&CHIFFRES_MATRICE[k * 3 + i]);
}
static long diviserArrondi(long n, long d) { return n < 0 ? -((-n + d / 2) / d) : (n + d / 2) / d; }
// Nombre donné en centièmes : 2, 1 ou 0 chiffres après la virgule (zéros de fin enlevés), le plus précis qui tient
// en chiffres étroits ; sinon le nombre entier défile (comme texteNombre dans noyau/cartes.js).
static void afficherNombre(long c) {
  char s[16];
  uint8_t n = 0;
  for (uint8_t d = 3; d-- > 0;) {
    long p = d == 2 ? 100 : d == 1 ? 10 : 1;
    long q = diviserArrondi(c, d == 2 ? 1 : d == 1 ? 10 : 100);
    unsigned long a = q < 0 ? -q : q;
    n = 0;
    if (q < 0) s[n++] = '-';
    char chiffres[12];
    uint8_t k = 0;
    unsigned long e = a / p;
    do chiffres[k++] = '0' + e % 10, e /= 10;
    while (e && k < 11);
    while (k) s[n++] = chiffres[--k];
    if (d) {
      unsigned long f = a % p;
      if (f) {
        s[n++] = '.';
        if (d == 2) {
          s[n++] = '0' + f / 10;
          if (f % 10) s[n++] = '0' + f % 10;
        } else s[n++] = '0' + f;
      }
    }
    uint8_t largeur = 0;
    for (uint8_t i = 0; i < n; i++) largeur += (i ? 1 : 0) + (s[i] == '.' ? 1 : 3);
    if (largeur > 16) continue;
    viderMatrice();
    uint8_t x = (16 - largeur) / 2;
    for (uint8_t i = 0; i < n; i++) {
      if (s[i] == '.') matrice[x] = 0x40, x += 2;
      else poserChiffre(s[i] == '-' ? 10 : s[i] - '0', x), x += 4;
    }
    afficherColonnes();
    return;
  }
  afficherTexte((const uint8_t *)s, n);
}
static void afficherHeure(long h, long m) {
  h = constrain(h, 0, 99);
  m = constrain(m, 0, 99);
  viderMatrice();
  poserChiffre(h / 10, 0);
  poserChiffre(h % 10, 4);
  matrice[7] = 0x14;
  poserChiffre(m / 10, 9);
  poserChiffre(m % 10, 13);
  afficherColonnes();
}
static void eteindreMatrice() {
  colonnesDefile = 0;
  nbLettres = 0;
  nbRecues = 0;
  if (!matriceUtilisee) return;
  viderMatrice();
  envoyerMatrice();
}
static void deuxColonnes(uint8_t *dest, const float *a) {
  for (uint8_t i = 0; i < 4; i++) {
    long v = constrain(lround(a[i]), 0, 65535);
    dest[i * 2] = v & 255;
    dest[i * 2 + 1] = v >> 8;
  }
}
#endif

// Extension 1 = mBot. Commandes : 1 moteurs(gauche, droite) · 2 ultrason(port) → cm · 3 ligne(port) → 0..3
// · 4 bouton de la carte → 0/1 · 5 lumière → 0..1023 · 6 LED(1|2|0 les deux, rouge, vert, bleu)
// · 9 un moteur seul (1 gauche | 2 droite, vitesse -100..100)
// · afficheur (port 4) : 10 dessin, colonnes 0 à 7 (4 valeurs : colonne paire + impaire × 256) · 11 dessin, colonnes 8
//   à 15, puis affichage · 12 nombre (centièmes) · 13 heure (h, min) · 14 lettres à suivre · 15 dernières lettres
float lb_ext(uint8_t extension, uint8_t commande, uint8_t n, const float *a) {
#if defined(CARTE_MCORE)
  if (extension == 1) {
    switch (commande) {
      case 1: moteurs(a[0], a[1]); return 0;
      case 2: return ultrason((int)a[0]);
      case 3: return ligne((int)a[0]);
      case 4: return analogRead(A7) < 100 ? 1 : 0;
      case 5: return analogRead(A6);
      case 6: ledRgb((int)a[0], (int)a[1], (int)a[2], (int)a[3]); return 0;
      case 7: { // diagnostic (jalon 0) : mesure ultrasons sur une broche donnée des ports (9 à 12, A0 à A3)
        int b = (int)a[0];
        return (b >= 9 && b <= 12) || (b >= 14 && b <= 17) ? ultrasonBroche(b) : -1;
      }
      case 8: return analogRead((int)a[0] - 14 >= 0 && (int)a[0] <= 21 ? (int)a[0] - 14 : 0); // diagnostic : niveau analogique
      case 9: moteurSeul((int)a[0], a[1]); return 0;
      case 10: deuxColonnes(dessinRecu, a); return 0;
      case 11:
        deuxColonnes(dessinRecu + 8, a);
        memcpy(matrice, dessinRecu, 16);
        afficherColonnes();
        return 0;
      case 12: afficherNombre(lround(a[0])); return 0;
      case 13: afficherHeure(lround(a[0]), lround(a[1])); return 0;
      case 14:
      case 15:
        for (uint8_t i = 0; i < n && nbRecues < 40; i++) lettresRecues[nbRecues++] = constrain(lround(a[i]), 0, 255);
        if (commande == 15) afficherTexte(lettresRecues, nbRecues), nbRecues = 0;
        return 0;
    }
  }
#else
  (void)extension, (void)commande, (void)n, (void)a;
#endif
  return 0;
}

// ---------- Ce que l'interpréteur demande à la carte ----------
uint8_t lb_lire_octet(uint16_t a) { return a < CAPACITE ? EEPROM.read(a) : 0; }
void lb_configurer(uint8_t b, uint8_t type) {
  if (!brocheAutorisee(b) || b >= 20) return;
  switch (type) {
    case LB_BROCHE_SORTIE:
    case LB_BROCHE_SON:
    case LB_BROCHE_PWM: pinMode(b, OUTPUT); digitalWrite(b, LOW); break;
    case LB_BROCHE_BOUTON_MASSE: pinMode(b, INPUT_PULLUP); break;
    case LB_BROCHE_BOUTON_HAUT: pinMode(b, INPUT); break;
    default: break;
  }
}
void lb_ecrire_num(uint8_t b, uint8_t v) {
  if (brocheAutorisee(b)) digitalWrite(b, v ? HIGH : LOW);
}
void lb_ecrire_ana(uint8_t b, uint8_t v) {
  if (brocheAutorisee(b)) analogWrite(b, v);
}
void lb_servo(uint8_t b, uint8_t angle) {
  if (brocheAutorisee(b)) ecrireServo(b, angle);
}
void lb_son(uint8_t b, uint16_t f, uint32_t ms) {
  if (brocheAutorisee(b)) tone(b, f, ms);
}
void lb_silence(uint8_t b) {
  if (brocheAutorisee(b)) noTone(b);
}
// Bouton vers GND (résistance interne) : appuyé = niveau BAS, mais 1 pour le programme.
uint8_t lb_lire_num(uint8_t b, uint8_t type) {
  if (!brocheAutorisee(b)) return 0;
  int niveau = lireNiveau(b);
  return type == LB_BROCHE_BOUTON_MASSE ? niveau == LOW : niveau == HIGH;
}
uint16_t lb_lire_ana(uint8_t b) { return b >= 14 && b <= 21 ? analogRead(b - 14) : 0; }
long lb_hasard(long min, long max) { return random(min, max + 1); }

// ---------- État ----------
static bool direct = false;        // mode direct en cours (le navigateur pilote)
static uint32_t dernierMessage = 0;
static uint16_t octetsProgramme = 0; // taille du programme gardé (0 : carte vide)
static int32_t attenduOctets = -1; // envoi d'un programme : octets annoncés par PROG (-1 : pas d'envoi)
static uint16_t recus = 0;
static uint8_t surveillees[8];
static uint8_t etatsSurveilles[8];
static uint32_t changementSurveille[8];
static uint8_t nbSurveillees = 0;

static void toutEteindre() {
  lb_arreter();
#if defined(CARTE_MCORE)
  eteindreMatrice(); // avant de lâcher les broches A0 et A1 (port 4)
#endif
  for (int b = 2; b <= 19; b++) {
    if (b == 13) continue; // LED de la carte / LED RGB du mCore : réglée à part
    digitalWrite(b, LOW);  // d'abord BAS : sinon la résistance interne resterait branchée et une LED luirait encore
    pinMode(b, INPUT);     // plus rien n'est alimenté
  }
  noTone(8);
  lacherServos();
  nbSurveillees = 0;
#if defined(CARTE_MCORE)
  moteurs(0, 0);
  ledRgb(0, 0, 0, 0);
#else
  pinMode(13, OUTPUT);
  digitalWrite(13, LOW);
#endif
}

static void lancerProgramme() {
  toutEteindre();
  octetsProgramme = 0;
  if (lb_charger(CAPACITE) == LB_OK) {
    octetsProgramme = lb_longueur();
    randomSeed(analogRead(A5) ^ micros());
    lb_demarrer(millis());
  }
}

// ---------- Lecture des commandes ----------
static char ligneRecue[80];
static uint8_t longueurLigne = 0;
static bool ligneTropLongue = false;

static bool entier(char *&p, long &v) {
  while (*p == ' ') p++;
  if (!*p) return false;
  char *fin;
  v = strtol(p, &fin, 10);
  if (fin == p) return false;
  p = fin;
  return true;
}
static int hexa(char c) {
  if (c >= '0' && c <= '9') return c - '0';
  if (c >= 'A' && c <= 'F') return c - 'A' + 10;
  if (c >= 'a' && c <= 'f') return c - 'a' + 10;
  return -1;
}

// Première commande du mode direct : le programme gardé s'arrête et tout s'éteint (rien ne reste allumé de lui).
static void passerEnDirect() {
  if (!direct) {
    toutEteindre();
    direct = true;
  }
}

static void executer(char *l) {
  char *p = l;
  while (*p && *p != ' ') p++;
  if (*p) *p++ = 0;
  long a, b, c;
  if (!strcmp(l, "PING")) {
    Serial.print(F("PONG v2 " VERSION_FIRMWARE " " NOM_CARTE " "));
    Serial.print(octetsProgramme);
    Serial.print(' ');
    Serial.println(CAPACITE);
    return;
  }
  if (!strcmp(l, "OFF")) {
    toutEteindre();
    Serial.println(F("OK"));
    return;
  }
  if (!strcmp(l, "D") || !strcmp(l, "A") || !strcmp(l, "S")) {
    if (!entier(p, a) || !entier(p, b)) return (void)Serial.println(F("ERR CMD"));
    if (!brocheAutorisee(a) || a >= 20 || (l[0] == 'A' && !brochePwm(a))) return (void)Serial.println(F("ERR PIN"));
    passerEnDirect();
    if (l[0] == 'D') pinMode(a, OUTPUT), digitalWrite(a, b ? HIGH : LOW);
    else if (l[0] == 'A') pinMode(a, OUTPUT), analogWrite(a, constrain(b, 0, 255));
    else ecrireServo(a, constrain(b, 0, 180));
    Serial.println(F("OK"));
    return;
  }
  if (!strcmp(l, "T")) {
    if (!entier(p, a) || !entier(p, b) || !entier(p, c)) return (void)Serial.println(F("ERR CMD"));
    if (!brocheAutorisee(a) || a >= 20) return (void)Serial.println(F("ERR PIN"));
    passerEnDirect();
    tone(a, constrain(b, 31, 20000), constrain(c, 1, 10000));
    Serial.println(F("OK"));
    return;
  }
  if (!strcmp(l, "M")) {
    if (!entier(p, a)) return (void)Serial.println(F("ERR CMD"));
    while (*p == ' ') p++;
    if (!brocheAutorisee(a)) return (void)Serial.println(F("ERR PIN"));
    passerEnDirect();
    if (a < 20) {
      if (*p == 'I') pinMode(a, INPUT);
      else if (*p == 'P') pinMode(a, INPUT_PULLUP);
      else if (*p == 'O') pinMode(a, OUTPUT);
      else return (void)Serial.println(F("ERR CMD"));
    }
    Serial.println(F("OK"));
    return;
  }
  if (!strcmp(l, "R") || !strcmp(l, "RA")) {
    if (!entier(p, a)) return (void)Serial.println(F("ERR CMD"));
    if (!brocheAutorisee(a) || (l[1] == 'A' && a < 14)) return (void)Serial.println(F("ERR PIN"));
    passerEnDirect();
    Serial.print(F("V "));
    Serial.print(a);
    Serial.print(' ');
    Serial.println(l[1] == 'A' ? analogRead(a - 14) : lireNiveau(a));
    return;
  }
  if (!strcmp(l, "W")) {
    passerEnDirect();
    nbSurveillees = 0;
    while (nbSurveillees < 8 && entier(p, a)) {
      if (!brocheAutorisee(a)) return (void)Serial.println(F("ERR PIN"));
      surveillees[nbSurveillees] = a;
      etatsSurveilles[nbSurveillees] = lireNiveau(a);
      changementSurveille[nbSurveillees] = 0;
      nbSurveillees++;
    }
    Serial.println(F("OK"));
    return;
  }
  if (!strcmp(l, "X")) {
    float args[4] = {0, 0, 0, 0};
    uint8_t n = 0;
    if (!entier(p, a) || !entier(p, b)) return (void)Serial.println(F("ERR CMD"));
    while (n < 4 && entier(p, c)) args[n++] = c;
    passerEnDirect();
    Serial.print(F("V "));
    Serial.println(lb_ext(a, b, n, args));
    return;
  }
  if (!strcmp(l, "PROG")) {
    if (!entier(p, a)) return (void)Serial.println(F("ERR CMD"));
    if (a < 11 || a > (long)CAPACITE) return (void)Serial.println(F("ERR TAILLE"));
    toutEteindre();
    direct = false;
    // Marque effacée d'abord : un envoi interrompu laisse la carte vide, jamais un programme à moitié écrit.
    EEPROM.update(0, 0xFF);
    EEPROM.update(1, 0xFF);
    octetsProgramme = 0;
    attenduOctets = a;
    recus = 0;
    Serial.println(F("OK"));
    return;
  }
  if (!strcmp(l, "H")) {
    if (attenduOctets < 0) return (void)Serial.println(F("ERR CMD"));
    while (*p == ' ') p++;
    for (; p[0] && p[1]; p += 2) {
      int h = hexa(p[0]), b2 = hexa(p[1]);
      if (h < 0 || b2 < 0) return (void)Serial.println(F("ERR CMD"));
      if (recus >= attenduOctets) return (void)Serial.println(F("ERR TAILLE"));
      uint8_t o = h * 16 + b2;
      if (recus >= 2) EEPROM.update(recus, o); // la marque « LB » est écrite par FIN
      recus++;
    }
    Serial.println(F("OK"));
    return;
  }
  if (!strcmp(l, "FIN")) {
    if (attenduOctets < 0 || recus != attenduOctets) return (void)Serial.println(F("ERR TAILLE"));
    attenduOctets = -1;
    EEPROM.update(0, 'L');
    EEPROM.update(1, 'B');
    uint8_t e = lb_charger(CAPACITE);
    if (e != LB_OK) {
      EEPROM.update(0, 0xFF);
      return (void)Serial.println(e == LB_ERR_FORMAT ? F("ERR FORMAT") : F("ERR CRC"));
    }
    Serial.print(F("OK "));
    Serial.println(lb_longueur());
    lancerProgramme();
    return;
  }
  if (!strcmp(l, "RUN")) {
    direct = false;
    lancerProgramme();
    Serial.println(lb_en_marche() ? F("OK") : F("ERR CRC"));
    return;
  }
  if (!strcmp(l, "STOP")) {
    toutEteindre();
    Serial.println(F("OK"));
    return;
  }
  if (!strcmp(l, "EFFACE")) {
    toutEteindre();
    direct = false;
    EEPROM.update(0, 0xFF);
    EEPROM.update(1, 0xFF);
    octetsProgramme = 0;
    Serial.println(F("OK"));
    return;
  }
  Serial.println(F("ERR CMD"));
}

static void lireSerie() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\r') continue;
    if (c == '\n') {
      ligneRecue[longueurLigne] = 0;
      dernierMessage = millis();
      if (ligneTropLongue) Serial.println(F("ERR CMD"));
      else if (longueurLigne) executer(ligneRecue);
      longueurLigne = 0;
      ligneTropLongue = false;
    } else if (longueurLigne < sizeof ligneRecue - 1) {
      ligneRecue[longueurLigne++] = c;
    } else {
      ligneTropLongue = true;
    }
  }
}

static void surveiller() {
  uint32_t t = millis();
  for (uint8_t i = 0; i < nbSurveillees; i++) {
    uint8_t v = lireNiveau(surveillees[i]);
    if (v == etatsSurveilles[i]) {
      changementSurveille[i] = 0;
      continue;
    }
    // Anti-rebond : le nouvel état doit tenir 20 ms.
    if (!changementSurveille[i]) changementSurveille[i] = t | 1;
    else if (t - changementSurveille[i] >= 20) {
      etatsSurveilles[i] = v;
      changementSurveille[i] = 0;
      Serial.print(F("E "));
      Serial.print(surveillees[i]);
      Serial.print(' ');
      Serial.println(v);
    }
  }
}

void setup() {
  Serial.begin(115200);
  toutEteindre();
  lancerProgramme(); // programme gardé en EEPROM : il démarre tout seul
}

void loop() {
  lireSerie();
#if defined(CARTE_MCORE)
  avancerMatrice(); // texte qui défile sur l'afficheur
#endif
  if (direct) {
    surveiller();
    if (millis() - dernierMessage > SILENCE_MAX) {
      toutEteindre();
      direct = false;
    }
  } else if (lb_en_marche()) {
    // Appelé à chaque tour : les fils dont l'heure est venue reprennent, les appuis sont détectés tout de suite.
    lb_avancer(millis());
  }
}
