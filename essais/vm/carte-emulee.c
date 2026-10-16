// Carte Uno émulée (simavr) qui fait tourner le VRAI firmware compilé : sert à tester le protocole v2, l'envoi
// d'un programme et sa survie à une « coupure de courant » (EEPROM gardée dans un fichier), sans carte branchée.
//   carte-emulee <firmware.hex | .elf> <eeprom.bin>  < script
// Script (une commande par ligne) :
//   envoyer <texte>        envoie la ligne au port série (avec \n)
//   attendre <ms>          laisse tourner la carte
//   broche <n> <0|1>       niveau électrique imposé sur une entrée (bouton)
// Sortie : « t recu <ligne> » pour chaque ligne reçue de la carte, « t sortie <n> <0|1|faible> » pour chaque changement
// d'une sortie (relevé chaque ms ; « faible » : entrée avec résistance interne, une LED luirait encore), « t servo <n> <µs> » pour chaque changement de largeur d'impulsion d'un servo.
// L'EEPROM est lue au début et réécrite à la fin dans eeprom.bin.
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <simavr/sim_avr.h>
#include <simavr/sim_elf.h>
#include <simavr/sim_hex.h>
#include <simavr/avr_uart.h>
#include <simavr/avr_ioport.h>
#include <simavr/avr_eeprom.h>

static avr_t *avr;
static char recu[256];
static int nrecu;
static const char PORTS[3] = {'D', 'B', 'C'};

static double ms(void) { return avr->cycle / 16000.0; }

static void octet_recu(struct avr_irq_t *irq, uint32_t valeur, void *p) {
  (void)irq, (void)p;
  if (valeur == '\r') return;
  if (valeur == '\n' || nrecu >= 255) {
    recu[nrecu] = 0;
    printf("%.0f recu %s\n", ms(), recu);
    nrecu = 0;
  } else recu[nrecu++] = (char)valeur;
}

// Broche Arduino : D0–D7 = port D, D8–D13 = port B, A0–A5 (14–19) = port C.
static int numero(int port, int bit) { return port == 0 ? bit : port == 1 ? 8 + bit : 14 + bit; }
static int etat[20];
static uint64_t montee[20];
static int largeur[20];

// Impulsions des servo-moteurs : mesurées sur les fronts.
static void broche_changee(struct avr_irq_t *irq, uint32_t valeur, void *p) {
  int port = (int)(intptr_t)p;
  int n = numero(port, irq->irq);
  if (n < 2 || n > 19) return;
  int v = valeur ? 1 : 0;
  if (v) montee[n] = avr->cycle;
  else if (montee[n]) {
    int us = (int)((avr->cycle - montee[n]) / 16);
    montee[n] = 0;
    if (us >= 400 && us <= 2700 && n != 3 && n != 5 && n != 11) { // 3, 5, 11 : PWM à 490/980 Hz, pas un servo
      if (abs(us - largeur[n]) > 15) printf("%.0f servo %d %d\n", ms(), n, us);
      largeur[n] = us;
    }
  }
}

// État vu par une LED, relevé chaque milliseconde : 1 (sortie HAUT), 0, ou 2 = « faible »
// (entrée avec résistance interne : une LED luirait encore un peu).
static void relever(void) {
  for (int n = 2; n <= 19; n++) {
    if (largeur[n]) continue;
    int port = n < 8 ? 0 : n < 14 ? 1 : 2, bit = n < 8 ? n : n < 14 ? n - 8 : n - 14;
    uint8_t ddr = avr->data[port == 0 ? 0x2A : port == 1 ? 0x24 : 0x27];
    uint8_t reg = avr->data[port == 0 ? 0x2B : port == 1 ? 0x25 : 0x28];
    int v = (reg >> bit) & 1 ? ((ddr >> bit) & 1 ? 1 : 2) : 0;
    if (v != etat[n]) {
      etat[n] = v;
      if (v == 2) printf("%.0f sortie %d faible\n", ms(), n);
      else printf("%.0f sortie %d %d\n", ms(), n, v);
    }
  }
}

static void tourner(double jusqua) {
  uint64_t fin = (uint64_t)(jusqua * 16000.0);
  static uint64_t prochain_releve;
  while (avr->cycle < fin) {
    if (avr->cycle >= prochain_releve) {
      relever();
      prochain_releve = avr->cycle + 16000;
    }
    int s = avr_run(avr);
    if (s == cpu_Done || s == cpu_Crashed) {
      printf("%.0f plantage\n", ms());
      exit(1);
    }
  }
}

int main(int argc, char **argv) {
  if (argc < 3) return 2;
  avr = avr_make_mcu_by_name("atmega328p");
  avr_init(avr);
  avr->frequency = 16000000;
  size_t l = strlen(argv[1]);
  if (l > 4 && !strcmp(argv[1] + l - 4, ".hex")) {
    ihex_chunk_p morceaux;
    int n = read_ihex_chunks(argv[1], &morceaux);
    if (n <= 0) return 2;
    for (int i = 0; i < n; i++) avr_loadcode(avr, morceaux[i].data, morceaux[i].size, morceaux[i].baseaddr);
  } else {
    elf_firmware_t f;
    memset(&f, 0, sizeof f);
    if (elf_read_firmware(argv[1], &f)) return 2;
    avr_load_firmware(avr, &f);
  }

  uint8_t eeprom[1024];
  memset(eeprom, 0xFF, sizeof eeprom);
  FILE *e = fopen(argv[2], "rb");
  if (e) {
    if (fread(eeprom, 1, sizeof eeprom, e) != sizeof eeprom) memset(eeprom, 0xFF, sizeof eeprom);
    fclose(e);
  }
  avr_eeprom_desc_t d = {.ee = eeprom, .offset = 0, .size = sizeof eeprom};
  avr_ioctl(avr, AVR_IOCTL_EEPROM_SET, &d);

  uint32_t flags = 0;
  avr_ioctl(avr, AVR_IOCTL_UART_GET_FLAGS('0'), &flags);
  flags &= ~AVR_UART_FLAG_STDIO;
  avr_ioctl(avr, AVR_IOCTL_UART_SET_FLAGS('0'), &flags);
  avr_irq_register_notify(avr_io_getirq(avr, AVR_IOCTL_UART_GETIRQ('0'), UART_IRQ_OUTPUT), octet_recu, 0);
  avr_irq_t *entree = avr_io_getirq(avr, AVR_IOCTL_UART_GETIRQ('0'), UART_IRQ_INPUT);
  for (int p = 0; p < 3; p++)
    for (int b = 0; b < 8; b++) avr_irq_register_notify(avr_io_getirq(avr, AVR_IOCTL_IOPORT_GETIRQ(PORTS[p]), b), broche_changee, (void *)(intptr_t)p);

  char ligne[300];
  while (fgets(ligne, sizeof ligne, stdin)) {
    ligne[strcspn(ligne, "\r\n")] = 0;
    if (!strncmp(ligne, "envoyer ", 8)) {
      strcat(ligne, "\n");
      // Un octet toutes les 100 µs (≈ 115200 bauds).
      for (char *c = ligne + 8; *c; c++) {
        avr_raise_irq(entree, (uint8_t)*c);
        tourner(ms() + 0.1);
      }
    } else if (!strncmp(ligne, "attendre ", 9)) {
      tourner(ms() + atof(ligne + 9));
    } else if (!strncmp(ligne, "broche ", 7)) {
      int n, v;
      if (sscanf(ligne + 7, "%d %d", &n, &v) == 2 && n >= 0 && n <= 19) {
        int port = n < 8 ? 0 : n < 14 ? 1 : 2, bit = n < 8 ? n : n < 14 ? n - 8 : n - 14;
        avr_raise_irq(avr_io_getirq(avr, AVR_IOCTL_IOPORT_GETIRQ(PORTS[port]), bit), v);
      }
    }
  }
  avr_ioctl(avr, AVR_IOCTL_EEPROM_GET, &d);
  e = fopen(argv[2], "wb");
  if (e) {
    fwrite(d.ee, 1, sizeof eeprom, e);
    fclose(e);
  }
  return 0;
}
