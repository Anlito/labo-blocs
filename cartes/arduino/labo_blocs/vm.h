// Interpréteur de code octet de Labo Blocs — essai du jalon 0.
// Le même fichier tourne dans la carte (firmware Uno / mCore) et sur l'ordinateur (essais/vm/hote.c),
// pour vérifier que la carte se comporte comme le simulateur.
//
// Le programme n'est jamais copié en mémoire vive (2 Ko seulement sur l'ATmega328P) : l'interpréteur le lit
// octet par octet avec lb_lire_octet() (EEPROM dans la carte, tableau sur l'ordinateur).
//
// Format du programme (petit-boutiste) :
//   0  'L' 'B'                 marque
//   2  version du format        (LB_FORMAT)
//   3  longueur totale (2 o)    en-tête compris
//   5  CRC-16 (2 o)             des octets 7 à la fin
//   7  nombre de variables
//   8  nombre de listes, puis la capacité de chaque liste (1 o)
//   …  nombre de broches, puis pour chacune : numéro (1 o), type (LB_BROCHE_*)
//   …  nombre de fils, puis pour chacun : type (LB_FIL_*), broche (1 o), adresse du début (2 o)
//   …  code
// Les nombres sont des « float » (comme les nombres du simulateur, à la précision près).

#ifndef LB_VM_H
#define LB_VM_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define LB_FORMAT 1

#ifndef LB_MAX_FILS
#define LB_MAX_FILS 6
#endif
#ifndef LB_MAX_PILE
#define LB_MAX_PILE 12
#endif
#ifndef LB_MAX_APPELS
#define LB_MAX_APPELS 6
#endif
#ifndef LB_MAX_VARIABLES
#define LB_MAX_VARIABLES 24
#endif
#ifndef LB_MAX_LISTES
#define LB_MAX_LISTES 4
#endif
#ifndef LB_MAX_ELEMENTS
#define LB_MAX_ELEMENTS 48
#endif
#ifndef LB_MAX_BROCHES
#define LB_MAX_BROCHES 16
#endif
#ifndef LB_PAS_PAR_TRANCHE
#define LB_PAS_PAR_TRANCHE 200 // instructions avant de laisser la main (sécurité si l'élève fait une boucle sans attente)
#endif

// Types de broches déclarées dans l'en-tête.
enum {
  LB_BROCHE_SORTIE = 1,       // LED, sortie numérique
  LB_BROCHE_BOUTON_MASSE = 2, // bouton poussoir signal + GND : INPUT_PULLUP, appuyé = 1 pour le programme
  LB_BROCHE_BOUTON_HAUT = 3,  // module bouton qui donne HAUT quand on appuie
  LB_BROCHE_SERVO = 4,
  LB_BROCHE_SON = 5,          // buzzer
  LB_BROCHE_ANALOGIQUE = 6,   // entrée analogique (0 à 1023)
  LB_BROCHE_PWM = 7,          // sortie à intensité réglable
};

// Types de fils.
enum {
  LB_FIL_DEMARRAGE = 0, // « Au démarrage » : une fois, avant tous les autres
  LB_FIL_BOUCLE = 1,    // « Répéter indéfiniment »
  LB_FIL_APPUI = 2,     // « Quand le bouton … est appuyé »
  LB_FIL_RELACHE = 3,   // « Quand le bouton … est relâché »
};

// Codes des instructions. Un opérande « a16 » est une adresse sur 2 octets.
enum {
  LB_FIN = 0x00,           // fin du fil (la boucle recommence, un fil « quand » s'arrête)
  LB_NOMBRE = 0x01,        // + float (4 o)                 → empile
  LB_ENTIER = 0x02,        // + int8                        → empile
  LB_LIRE_VAR = 0x03,      // + n° de variable
  LB_ECRIRE_VAR = 0x04,    // + n° de variable              dépile
  LB_ADD = 0x05, LB_SUB = 0x06, LB_MUL = 0x07, LB_DIV = 0x08, LB_MOD = 0x09,
  LB_EGAL = 0x0A, LB_DIFF = 0x0B, LB_INF = 0x0C, LB_INF_EGAL = 0x0D, LB_SUP = 0x0E, LB_SUP_EGAL = 0x0F,
  LB_ET = 0x10, LB_OU = 0x11, LB_NON = 0x12, LB_OPPOSE = 0x13,
  LB_SAUT = 0x14,          // + a16
  LB_SAUT_SI_FAUX = 0x15,  // + a16                         dépile la condition
  LB_LIRE_NUM = 0x16,      // + broche                      → empile 0/1 (bouton : 1 = appuyé)
  LB_LIRE_ANA = 0x17,      // + broche                      → empile 0…1023
  LB_ECRIRE_NUM = 0x18,    // + broche                      dépile 0/1
  LB_ECRIRE_ANA = 0x19,    // + broche                      dépile 0…255
  LB_SERVO = 0x1A,         // + broche                      dépile l'angle (borné 0…180)
  LB_SON = 0x1B,           // + broche                      dépile durée (s), puis fréquence (Hz)
  LB_SILENCE = 0x1C,       // + broche
  LB_ATTENDRE = 0x1D,      //                               dépile la durée en secondes
  LB_HASARD = 0x1E,        //                               dépile max puis min → entier au hasard dans [min, max]
  LB_APPEL = 0x1F,         // + a16
  LB_RETOUR = 0x20,
  LB_LISTE_LIRE = 0x21,    // + n° de liste                 dépile la position (1 = premier)
  LB_LISTE_ECRIRE = 0x22,  // + n° de liste                 dépile valeur puis position
  LB_LISTE_AJOUTER = 0x23, // + n° de liste                 dépile la valeur
  LB_LISTE_TAILLE = 0x24,  // + n° de liste
  LB_LISTE_VIDER = 0x25,   // + n° de liste
  LB_TEMPS = 0x26,         //                               → secondes depuis le démarrage
  LB_DEPILER = 0x27,
  LB_EXT = 0x28,           // + n° d'extension, n° de commande, nombre d'arguments : pilote du profil de carte
  LB_PASSER = 0x29,        // laisse la main aux autres fils (fin d'un tour de boucle « répéter »)
};

// Erreurs (lb_erreur()).
enum {
  LB_OK = 0,
  LB_ERR_MARQUE = 1,     // pas de programme
  LB_ERR_FORMAT = 2,     // programme fait pour une autre version
  LB_ERR_CRC = 3,        // programme abîmé
  LB_ERR_TROP_GRAND = 4, // trop de fils, de variables, de listes, de broches
  LB_ERR_PILE = 5,       // pile pleine ou vide (programme mal formé)
  LB_ERR_CODE = 6,       // instruction inconnue
};

// ---------- À fournir par la carte (ou l'ordinateur) ----------
uint8_t lb_lire_octet(uint16_t adresse);
void lb_configurer(uint8_t broche, uint8_t type);
void lb_ecrire_num(uint8_t broche, uint8_t valeur);
void lb_ecrire_ana(uint8_t broche, uint8_t valeur);
void lb_servo(uint8_t broche, uint8_t angle);
void lb_son(uint8_t broche, uint16_t frequence, uint32_t duree_ms);
void lb_silence(uint8_t broche);
uint8_t lb_lire_num(uint8_t broche, uint8_t type); // 1 = HAUT (bouton : appuyé)
uint16_t lb_lire_ana(uint8_t broche);
long lb_hasard(long min, long max_inclus);
float lb_ext(uint8_t extension, uint8_t commande, uint8_t n, const float *arguments);

// ---------- Interpréteur ----------
// Charge le programme (vérifie marque, version, CRC, limites). Renvoie LB_OK ou une erreur.
uint8_t lb_charger(uint16_t longueur_max);
// Démarre le programme chargé à l'instant « maintenant » (ms).
void lb_demarrer(uint32_t maintenant);
// Exécute tout ce qui peut l'être à l'instant « maintenant ». Renvoie l'instant du prochain réveil
// (UINT32_MAX si plus rien n'est prévu). Les fils « quand… » sont déclenchés en lisant les entrées.
uint32_t lb_avancer(uint32_t maintenant);
void lb_arreter(void);
uint8_t lb_en_marche(void);
uint8_t lb_erreur(void);
uint16_t lb_longueur(void);

uint16_t lb_crc16(uint16_t crc, uint8_t octet);

#ifdef __cplusplus
}
#endif

#endif
