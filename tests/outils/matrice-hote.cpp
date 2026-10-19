// Banc d'essai de l'afficheur LED Matrix 8×16 du mBot, sur l'ordinateur (g++) : la partie mBot du programme de la
// carte (cartes/arduino/labo_blocs/labo_blocs.ino, collée à la place de la ligne MBOT par tests/cartes.test.js), avec
// des broches simulées. Les fils de l'afficheur (horloge A0, données A1) sont décodés comme le ferait sa puce : début
// (données qui descendent, horloge haute), 8 bits par octet (le bit 0 d'abord, lu quand l'horloge monte), fin (données
// qui remontent, horloge haute) ; 0xC0 + adresse puis les colonnes ; 0x88 à 0x8F : affichage allumé.
// Entrée : « X <ms> <commande> <valeurs…> » (commande d'extension 1) ou « L <ms> » (lire l'afficheur).
// Sortie de « L » : « <allumé 0|1> <16 colonnes en hexadécimal> ».
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CARTE_MCORE 1
#define PROGMEM
#define pgm_read_byte(p) (*(const uint8_t *)(p))
#define constrain(x, a, b) ((x) < (a) ? (a) : ((x) > (b) ? (b) : (x)))
#define HIGH 1
#define LOW 0
#define INPUT 0
#define OUTPUT 1
#define A0 14
#define A1 15
#define A2 16
#define A3 17
#define A6 20
#define A7 21
#define _BV(b) (1 << (b))
static volatile uint8_t PORTB;
static uint8_t SREG;
static void cli() {}
static unsigned long maintenant = 0;
static unsigned long millis() { return maintenant; }
static void delayMicroseconds(unsigned int) {}
static void pinMode(int, int) {}
static void analogWrite(int, int) {}
static int digitalRead(int) { return 0; }
static int analogRead(int) { return 1023; }
static unsigned long pulseIn(int, int, unsigned long) { return 0; }

// Puce de l'afficheur.
static int sck = 0, din = 0, bits = 0, octet = 0, nRecus = 0;
static bool dansOrdre = false, allume = false;
static uint8_t recus[64], ram[16];
static void finOrdre() {
  if (!nRecus) return;
  uint8_t c = recus[0];
  if ((c & 0xC0) == 0xC0)
    for (int i = 1; i < nRecus; i++) ram[((c & 15) + i - 1) & 15] = recus[i];
  else if ((c & 0xF0) == 0x80) allume = c & 8;
}
static void digitalWrite(int b, int v) {
  v = v ? 1 : 0;
  if (b == A0) {
    if (!sck && v && dansOrdre) {
      octet |= din << bits;
      if (++bits == 8) {
        if (nRecus < 64) recus[nRecus++] = octet;
        bits = 0;
        octet = 0;
      }
    }
    sck = v;
  } else if (b == A1) {
    if (sck && din && !v) dansOrdre = true, nRecus = 0, bits = 0, octet = 0;
    else if (sck && !din && v && dansOrdre) finOrdre(), dansOrdre = false;
    din = v;
  }
}

/* MBOT */

int main() {
  char ligne[256];
  while (fgets(ligne, sizeof ligne, stdin)) {
    char *p = ligne;
    char quoi = *p++;
    maintenant = strtoul(p, &p, 10);
    avancerMatrice();
    if (quoi == 'X') {
      int c = (int)strtol(p, &p, 10);
      float a[4] = {0, 0, 0, 0};
      uint8_t n = 0;
      char *fin;
      for (double v = strtod(p, &fin); fin != p && n < 4; v = strtod(p, &fin)) a[n++] = (float)v, p = fin;
      lb_ext(1, c, n, a);
    } else if (quoi == 'L') {
      printf("%d", allume ? 1 : 0);
      for (int i = 0; i < 16; i++) printf(" %02x", ram[i]);
      printf("\n");
    }
  }
  return 0;
}
