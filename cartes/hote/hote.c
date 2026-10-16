// Interpréteur de Labo Blocs sur l'ordinateur, en temps virtuel : sert aux tests (même code C que la carte).
//   hote <programme.bin> <durée en ms> [graine]   < entrées
// Entrées (stdin) : une ligne « t broche valeur [apres] » par changement (t en ms, triées ; bouton : 1 = appuyé).
// « apres » = 1 : l'entrée change juste après que les fils prévus à l'instant t ont tourné (sinon juste avant).
// Sortie : une ligne « t broche valeur type » par changement d'une sortie (type : led, pwm, servo, son, ext),
// puis « fin t » ou « erreur code t ».
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "../arduino/labo_blocs/vm.h"

static uint8_t programme[4096];
static long taille;
static uint32_t maintenant;
static float sorties[64];
static uint8_t entrees[64];
static unsigned long graine = 12345;

uint8_t lb_lire_octet(uint16_t a) { return a < taille ? programme[a] : 0; }
void lb_configurer(uint8_t broche, uint8_t type) { (void)broche; (void)type; }
static void changer(uint8_t broche, float v, const char *type) {
  if (broche < 64 && sorties[broche] != v) {
    sorties[broche] = v;
    printf("%u %u %g %s\n", maintenant, broche, v, type);
  }
}
void lb_ecrire_num(uint8_t broche, uint8_t v) { changer(broche, v, "led"); }
void lb_ecrire_ana(uint8_t broche, uint8_t v) { changer(broche, v, "pwm"); }
void lb_servo(uint8_t broche, uint8_t angle) { changer(broche, angle, "servo"); }
void lb_son(uint8_t broche, uint16_t f, uint32_t ms) { printf("%u %u %u son %u\n", maintenant, broche, f, ms); }
void lb_silence(uint8_t broche) { printf("%u %u 0 son 0\n", maintenant, broche); }
uint8_t lb_lire_num(uint8_t broche, uint8_t type) { (void)type; return broche < 64 ? entrees[broche] : 0; }
uint16_t lb_lire_ana(uint8_t broche) { return broche < 64 ? entrees[broche] : 0; }
long lb_hasard(long min, long max) {
  graine = graine * 1103515245UL + 12345UL;
  return min + (long)((graine >> 8) % (unsigned long)(max - min + 1));
}
float lb_ext(uint8_t e, uint8_t c, uint8_t n, const float *a) {
  printf("%u ext %u %u", maintenant, e, c);
  for (uint8_t i = 0; i < n; i++) printf(" %g", a[i]);
  printf("\n");
  return 0;
}

int main(int argc, char **argv) {
  if (argc < 3) {
    fprintf(stderr, "usage : hote programme.bin durée_ms [graine] < entrées\n");
    return 2;
  }
  FILE *f = fopen(argv[1], "rb");
  if (!f) return 2;
  taille = (long)fread(programme, 1, sizeof programme, f);
  fclose(f);
  uint32_t fin = (uint32_t)strtoul(argv[2], 0, 10);
  if (argc > 3) graine = strtoul(argv[3], 0, 10);

  enum { MAX_E = 4096 };
  static uint32_t et[MAX_E];
  static uint8_t eb[MAX_E], ev[MAX_E], ea[MAX_E];
  int ne = 0, ie = 0;
  unsigned t0, b0, v0, a0;
  char ligne[64];
  while (ne < MAX_E && fgets(ligne, sizeof ligne, stdin)) {
    a0 = 0;
    if (sscanf(ligne, "%u %u %u %u", &t0, &b0, &v0, &a0) < 3) continue;
    et[ne] = t0, eb[ne] = (uint8_t)b0, ev[ne] = (uint8_t)v0, ea[ne] = (uint8_t)a0, ne++;
  }

  uint8_t e = lb_charger((uint16_t)taille);
  if (e != LB_OK) {
    printf("erreur %u 0\n", e);
    return 0;
  }
  lb_demarrer(0);
  for (;;) {
    while (ie < ne && et[ie] <= maintenant && !(et[ie] == maintenant && ea[ie])) entrees[eb[ie]] = ev[ie], ie++;
    uint32_t prochain = lb_avancer(maintenant);
    while (ie < ne && et[ie] <= maintenant) entrees[eb[ie]] = ev[ie], ie++;
    if (lb_erreur() != LB_OK) {
      printf("erreur %u %u\n", lb_erreur(), maintenant);
      return 0;
    }
    if (maintenant >= fin) break;
    uint32_t suivant = prochain;
    if (ie < ne && et[ie] < suivant) suivant = et[ie];
    if (fin < suivant) suivant = fin;
    if (suivant <= maintenant) suivant = maintenant + 1;
    maintenant = suivant;
  }
  printf("fin %u\n", maintenant);
  return 0;
}
