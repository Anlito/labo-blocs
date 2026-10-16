// Interpréteur de code octet de Labo Blocs — voir vm.h.
//
// Règles d'exécution (les mêmes que le simulateur du navigateur) :
// - « Au démarrage » s'exécute en premier ; les autres fils démarrent quand il est fini.
// - Les fils sont coopératifs : un fil garde la main jusqu'à « attendre », la fin d'un tour de
//   « répéter indéfiniment », ou LB_PAS_PAR_TRANCHE instructions (il reprend alors 1 ms plus tard).
// - Un tour de « répéter indéfiniment » dure au moins 1 ms.
// - Un fil « quand le bouton … » démarre sur le changement de l'entrée ; s'il tourne déjà, l'événement est ignoré.

#include "vm.h"
#include <math.h>
#include <string.h>

typedef struct {
  uint8_t actif;
  uint8_t type;
  uint8_t broche;
  uint8_t sp; // pile des valeurs
  uint8_t ap; // pile des appels
  uint8_t dernier; // dernier état lu de l'entrée (fils « quand »)
  uint16_t debut;
  uint16_t pc;
  uint32_t reveil;
  uint32_t tour; // début du tour de boucle en cours
  float pile[LB_MAX_PILE];
  uint16_t appels[LB_MAX_APPELS];
} Fil;

static Fil fils[LB_MAX_FILS];
static uint8_t nb_fils;
static float variables[LB_MAX_VARIABLES];
static uint8_t nb_variables;
static float elements[LB_MAX_ELEMENTS];
static uint8_t liste_debut[LB_MAX_LISTES], liste_capacite[LB_MAX_LISTES], liste_taille[LB_MAX_LISTES];
static uint8_t nb_listes;
static uint8_t broches[LB_MAX_BROCHES], types[LB_MAX_BROCHES];
static uint8_t nb_broches;
static uint16_t longueur;
static uint8_t erreur = LB_ERR_MARQUE;
static uint8_t en_marche;
static uint8_t demarrage_fini;
static uint32_t origine;

uint16_t lb_crc16(uint16_t crc, uint8_t octet) {
  crc ^= (uint16_t)octet << 8;
  for (uint8_t i = 0; i < 8; i++) crc = (crc & 0x8000) ? (uint16_t)((crc << 1) ^ 0x1021) : (uint16_t)(crc << 1);
  return crc;
}

static uint16_t lire16(uint16_t a) { return (uint16_t)lb_lire_octet(a) | ((uint16_t)lb_lire_octet(a + 1) << 8); }

static float lire_float(uint16_t a) {
  uint8_t o[4];
  for (uint8_t i = 0; i < 4; i++) o[i] = lb_lire_octet(a + i);
  float f;
  memcpy(&f, o, 4);
  return f;
}

static uint8_t type_broche(uint8_t b) {
  for (uint8_t i = 0; i < nb_broches; i++)
    if (broches[i] == b) return types[i];
  return LB_BROCHE_SORTIE;
}

uint8_t lb_charger(uint16_t longueur_max) {
  en_marche = 0;
  nb_fils = 0;
  if (lb_lire_octet(0) != 'L' || lb_lire_octet(1) != 'B') return erreur = LB_ERR_MARQUE;
  if (lb_lire_octet(2) != LB_FORMAT) return erreur = LB_ERR_FORMAT;
  longueur = lire16(3);
  if (longueur < 11 || longueur > longueur_max) return erreur = LB_ERR_CRC;
  uint16_t crc = 0xFFFF;
  for (uint16_t a = 7; a < longueur; a++) crc = lb_crc16(crc, lb_lire_octet(a));
  if (crc != lire16(5)) return erreur = LB_ERR_CRC;

  uint16_t a = 7;
  nb_variables = lb_lire_octet(a++);
  nb_listes = lb_lire_octet(a++);
  if (nb_variables > LB_MAX_VARIABLES || nb_listes > LB_MAX_LISTES) return erreur = LB_ERR_TROP_GRAND;
  uint16_t place = 0;
  for (uint8_t i = 0; i < nb_listes; i++) {
    liste_capacite[i] = lb_lire_octet(a++);
    liste_debut[i] = (uint8_t)place;
    place += liste_capacite[i];
  }
  if (place > LB_MAX_ELEMENTS) return erreur = LB_ERR_TROP_GRAND;
  nb_broches = lb_lire_octet(a++);
  if (nb_broches > LB_MAX_BROCHES) return erreur = LB_ERR_TROP_GRAND;
  for (uint8_t i = 0; i < nb_broches; i++) {
    broches[i] = lb_lire_octet(a++);
    types[i] = lb_lire_octet(a++);
  }
  nb_fils = lb_lire_octet(a++);
  if (nb_fils > LB_MAX_FILS) {
    nb_fils = 0;
    return erreur = LB_ERR_TROP_GRAND;
  }
  for (uint8_t i = 0; i < nb_fils; i++) {
    fils[i].type = lb_lire_octet(a++);
    fils[i].broche = lb_lire_octet(a++);
    fils[i].debut = lire16(a);
    a += 2;
  }
  return erreur = LB_OK;
}

static void lancer(Fil *f, uint32_t t) {
  f->actif = 1;
  f->pc = f->debut;
  f->sp = 0;
  f->ap = 0;
  f->reveil = t;
  f->tour = t;
}

void lb_demarrer(uint32_t maintenant) {
  if (erreur != LB_OK) return;
  origine = maintenant;
  memset(variables, 0, sizeof variables);
  memset(liste_taille, 0, sizeof liste_taille);
  for (uint8_t i = 0; i < nb_broches; i++) lb_configurer(broches[i], types[i]);
  demarrage_fini = 0;
  for (uint8_t i = 0; i < nb_fils; i++) {
    fils[i].actif = 0;
    if (fils[i].type == LB_FIL_DEMARRAGE) lancer(&fils[i], maintenant);
  }
  en_marche = 1;
}

void lb_arreter(void) {
  en_marche = 0;
  for (uint8_t i = 0; i < nb_fils; i++) fils[i].actif = 0;
}

uint8_t lb_en_marche(void) { return en_marche; }
uint8_t lb_erreur(void) { return erreur; }
uint16_t lb_longueur(void) { return erreur == LB_OK ? longueur : 0; }

static void apres_demarrage(uint32_t t) {
  demarrage_fini = 1;
  for (uint8_t i = 0; i < nb_fils; i++) {
    Fil *f = &fils[i];
    if (f->type == LB_FIL_BOUCLE) lancer(f, t);
    else if (f->type == LB_FIL_APPUI || f->type == LB_FIL_RELACHE) f->dernier = lb_lire_num(f->broche, type_broche(f->broche));
  }
}

static uint8_t egal(float a, float b) {
  float m = fabsf(a) > fabsf(b) ? fabsf(a) : fabsf(b);
  if (m < 1) m = 1;
  return fabsf(a - b) <= 1e-5f * m;
}

// Exécute un fil jusqu'à ce qu'il rende la main. Renvoie 0 en cas d'erreur.
static uint8_t courir(Fil *f, uint32_t t) {
#define POP() (f->sp ? f->pile[--f->sp] : (erreur = LB_ERR_PILE, 0.0f))
#define PUSH(v)                            \
  do {                                     \
    if (f->sp >= LB_MAX_PILE) {            \
      erreur = LB_ERR_PILE;                \
      return 0;                            \
    }                                      \
    f->pile[f->sp++] = (v);                \
  } while (0)
  for (uint16_t n = 0; n < LB_PAS_PAR_TRANCHE; n++) {
    if (erreur != LB_OK) return 0;
    uint8_t op = lb_lire_octet(f->pc++);
    float a, b;
    uint8_t x;
    switch (op) {
      case LB_FIN:
      case LB_PASSER:
        if (f->type == LB_FIL_BOUCLE || op == LB_PASSER) {
          if (op == LB_FIN) f->pc = f->debut, f->sp = 0, f->ap = 0;
          f->reveil = (t == f->tour) ? t + 1 : t;
          f->tour = f->reveil;
          return 1;
        }
        f->actif = 0;
        return 1;
      case LB_NOMBRE:
        PUSH(lire_float(f->pc));
        f->pc += 4;
        break;
      case LB_ENTIER:
        PUSH((float)(int8_t)lb_lire_octet(f->pc++));
        break;
      case LB_LIRE_VAR:
        x = lb_lire_octet(f->pc++);
        PUSH(x < nb_variables ? variables[x] : 0);
        break;
      case LB_ECRIRE_VAR:
        x = lb_lire_octet(f->pc++);
        a = POP();
        if (x < nb_variables) variables[x] = a;
        break;
      case LB_ADD: b = POP(); a = POP(); PUSH(a + b); break;
      case LB_SUB: b = POP(); a = POP(); PUSH(a - b); break;
      case LB_MUL: b = POP(); a = POP(); PUSH(a * b); break;
      case LB_DIV: b = POP(); a = POP(); PUSH(b == 0 ? 0 : a / b); break;
      case LB_MOD:
        b = POP();
        a = POP();
        if (b == 0) PUSH(0);
        else {
          float r = fmodf(a, b);
          if (r != 0 && ((r < 0) != (b < 0))) r += b; // comme Scratch : le reste a le signe du diviseur
          PUSH(r);
        }
        break;
      case LB_EGAL: b = POP(); a = POP(); PUSH(egal(a, b) ? 1 : 0); break;
      case LB_DIFF: b = POP(); a = POP(); PUSH(egal(a, b) ? 0 : 1); break;
      case LB_INF: b = POP(); a = POP(); PUSH(a < b && !egal(a, b) ? 1 : 0); break;
      case LB_INF_EGAL: b = POP(); a = POP(); PUSH(a < b || egal(a, b) ? 1 : 0); break;
      case LB_SUP: b = POP(); a = POP(); PUSH(a > b && !egal(a, b) ? 1 : 0); break;
      case LB_SUP_EGAL: b = POP(); a = POP(); PUSH(a > b || egal(a, b) ? 1 : 0); break;
      case LB_ET: b = POP(); a = POP(); PUSH(a != 0 && b != 0 ? 1 : 0); break;
      case LB_OU: b = POP(); a = POP(); PUSH(a != 0 || b != 0 ? 1 : 0); break;
      case LB_NON: a = POP(); PUSH(a == 0 ? 1 : 0); break;
      case LB_OPPOSE: a = POP(); PUSH(-a); break;
      case LB_SAUT:
        f->pc = lire16(f->pc);
        break;
      case LB_SAUT_SI_FAUX: {
        uint16_t cible = lire16(f->pc);
        f->pc += 2;
        if (POP() == 0) f->pc = cible;
        break;
      }
      case LB_LIRE_NUM:
        x = lb_lire_octet(f->pc++);
        PUSH(lb_lire_num(x, type_broche(x)) ? 1 : 0);
        break;
      case LB_LIRE_ANA:
        x = lb_lire_octet(f->pc++);
        PUSH((float)lb_lire_ana(x));
        break;
      case LB_ECRIRE_NUM:
        x = lb_lire_octet(f->pc++);
        lb_ecrire_num(x, POP() != 0);
        break;
      case LB_ECRIRE_ANA:
        x = lb_lire_octet(f->pc++);
        a = POP();
        lb_ecrire_ana(x, (uint8_t)(a < 0 ? 0 : a > 255 ? 255 : a + 0.5f));
        break;
      case LB_SERVO:
        x = lb_lire_octet(f->pc++);
        a = POP();
        lb_servo(x, (uint8_t)(a < 0 ? 0 : a > 180 ? 180 : a + 0.5f));
        break;
      case LB_SON:
        x = lb_lire_octet(f->pc++);
        b = POP(); // durée (s)
        a = POP(); // fréquence
        lb_son(x, (uint16_t)(a < 31 ? 31 : a > 20000 ? 20000 : a), (uint32_t)(b < 0 ? 0 : b * 1000 + 0.5f));
        break;
      case LB_SILENCE:
        lb_silence(lb_lire_octet(f->pc++));
        break;
      case LB_ATTENDRE: {
        a = POP();
        uint32_t ms = a > 0 ? (uint32_t)(a * 1000 + 0.5f) : 0;
        if (ms > 0) {
          f->reveil = t + ms;
          return 1;
        }
        break;
      }
      case LB_HASARD: {
        b = POP();
        a = POP();
        long lo = lroundf(a < b ? a : b), hi = lroundf(a < b ? b : a);
        PUSH((float)lb_hasard(lo, hi));
        break;
      }
      case LB_APPEL: {
        uint16_t cible = lire16(f->pc);
        if (f->ap >= LB_MAX_APPELS) {
          erreur = LB_ERR_PILE;
          return 0;
        }
        f->appels[f->ap++] = f->pc + 2;
        f->pc = cible;
        break;
      }
      case LB_RETOUR:
        if (!f->ap) {
          erreur = LB_ERR_PILE;
          return 0;
        }
        f->pc = f->appels[--f->ap];
        break;
      case LB_LISTE_LIRE: {
        x = lb_lire_octet(f->pc++);
        long i = lroundf(POP());
        PUSH(x < nb_listes && i >= 1 && i <= liste_taille[x] ? elements[liste_debut[x] + i - 1] : 0);
        break;
      }
      case LB_LISTE_ECRIRE: {
        x = lb_lire_octet(f->pc++);
        a = POP();
        long i = lroundf(POP());
        if (x < nb_listes && i >= 1 && i <= liste_taille[x]) elements[liste_debut[x] + i - 1] = a;
        break;
      }
      case LB_LISTE_AJOUTER:
        x = lb_lire_octet(f->pc++);
        a = POP();
        if (x < nb_listes && liste_taille[x] < liste_capacite[x]) elements[liste_debut[x] + liste_taille[x]++] = a;
        break;
      case LB_LISTE_TAILLE:
        x = lb_lire_octet(f->pc++);
        PUSH(x < nb_listes ? liste_taille[x] : 0);
        break;
      case LB_LISTE_VIDER:
        x = lb_lire_octet(f->pc++);
        if (x < nb_listes) liste_taille[x] = 0;
        break;
      case LB_TEMPS:
        PUSH((t - origine) / 1000.0f);
        break;
      case LB_DEPILER:
        (void)POP();
        break;
      case LB_EXT: {
        uint8_t ext = lb_lire_octet(f->pc++);
        uint8_t cmd = lb_lire_octet(f->pc++);
        uint8_t k = lb_lire_octet(f->pc++);
        float args[4] = {0, 0, 0, 0};
        if (k > 4 || k > f->sp) {
          erreur = LB_ERR_PILE;
          return 0;
        }
        for (uint8_t i = k; i > 0; i--) args[i - 1] = POP();
        PUSH(lb_ext(ext, cmd, k, args));
        break;
      }
      default:
        erreur = LB_ERR_CODE;
        return 0;
    }
  }
  // Trop longtemps sans attente : on laisse la main, reprise 1 ms plus tard.
  f->reveil = t + 1;
  return 1;
#undef POP
#undef PUSH
}

uint32_t lb_avancer(uint32_t t) {
  if (!en_marche || erreur != LB_OK) return UINT32_MAX;
  for (uint8_t garde = 0; garde < 50; garde++) {
    uint8_t travail = 0;
    if (demarrage_fini) {
      for (uint8_t i = 0; i < nb_fils; i++) {
        Fil *f = &fils[i];
        if (f->type != LB_FIL_APPUI && f->type != LB_FIL_RELACHE) continue;
        uint8_t v = lb_lire_num(f->broche, type_broche(f->broche));
        if (v != f->dernier) {
          f->dernier = v;
          if (!f->actif && v == (f->type == LB_FIL_APPUI)) lancer(f, t);
        }
      }
    }
    for (uint8_t i = 0; i < nb_fils; i++) {
      Fil *f = &fils[i];
      if (!f->actif || f->reveil > t) continue;
      if (!courir(f, t)) {
        lb_arreter();
        return UINT32_MAX;
      }
      travail = 1;
    }
    if (!demarrage_fini) {
      uint8_t fini = 1;
      for (uint8_t i = 0; i < nb_fils; i++)
        if (fils[i].type == LB_FIL_DEMARRAGE && fils[i].actif) fini = 0;
      if (fini) {
        apres_demarrage(t);
        travail = 1;
      }
    }
    if (!travail) break;
  }
  uint32_t prochain = UINT32_MAX;
  for (uint8_t i = 0; i < nb_fils; i++)
    if (fils[i].actif && fils[i].reveil < prochain) prochain = fils[i].reveil;
  return prochain;
}
