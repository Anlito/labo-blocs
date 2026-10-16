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
#define VERSION_FIRMWARE "0.2"
#if defined(CARTE_MCORE)
#define NOM_CARTE "mcore"
#else
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
#endif

// Extension 1 = mBot. Commandes : 1 moteurs(gauche, droite) · 2 ultrason(port) → cm · 3 ligne(port) → 0..3
// · 4 bouton de la carte → 0/1 · 5 lumière → 0..1023 · 6 LED(1|2|0 les deux, rouge, vert, bleu)
// · 9 un moteur seul (1 gauche | 2 droite, vitesse -100..100)
float lb_ext(uint8_t extension, uint8_t commande, uint8_t n, const float *a) {
  (void)n;
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
    }
  }
#else
  (void)extension, (void)commande, (void)a;
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
