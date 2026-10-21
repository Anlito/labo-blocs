// Construit parcours/simon/parcours.js (parcours « Simon Rétro Game ») et vérifie chaque exercice :
// la solution passe tous les scénarios ; le programme de départ (ou un programme incomplet) ne passe pas.
//   node tools/construire-simon.js [dossier du dépôt] [--ecrire]   (sans --ecrire : vérifie seulement)
// Le parcours se modifie ensuite dans l’éditeur de Labo Blocs ; ce script garde la trace de la première version.
const path = require('node:path');
const fs = require('node:fs');
const R = path.resolve(process.argv[2] || '.');
const PA = require(path.join(R, 'noyau/parcours.js'));
const V = require(path.join(R, 'noyau/validation.js'));
const C = require(path.join(R, 'noyau/code-octet.js'));
const P = require(path.join(R, 'noyau/programme.js'));

// ---------- Matériel : le standard D2 à D10 ----------
const COULEURS = [
  { nom: 'bleu', fem: 'bleue', bouton: 'D2', led: 'D3', note: 262, hex: '#3B82F6' },
  { nom: 'vert', fem: 'verte', bouton: 'D4', led: 'D5', note: 330, hex: '#23C17A' },
  { nom: 'jaune', fem: 'jaune', bouton: 'D6', led: 'D7', note: 392, hex: '#FFCF3F' },
  { nom: 'rouge', fem: 'rouge', bouton: 'D8', led: 'D9', note: 523, hex: '#FF5566' },
];
const LEDS = COULEURS.map((c) => c.led);
const BOUTONS = COULEURS.map((c) => c.bouton);
const led = (c) => ({ type: 'led', nom: c.fem, couleur: c.hex, broche: c.led });
const bouton = (c) => ({ type: 'bouton', nom: c.nom, broche: c.bouton });
const BUZZER = { type: 'buzzer', broche: 'D10' };
const TOUS = [...COULEURS.map(led), ...COULEURS.map(bouton), BUZZER];

// ---------- Petits constructeurs de blocs ----------
const v = (variable) => ({ bloc: 'variable', variable });
const aff = (variable, valeur) => ({ bloc: 'affecter', variable, valeur });
const plus1 = (variable) => ({ bloc: 'ajouter_a', variable, valeur: 1 });
const att = (s) => ({ bloc: 'attendre', duree: s });
const cmp = (op, a, b) => ({ bloc: 'comparaison', op, a, b });
const ou = (a, b) => ({ bloc: 'logique', op: 'ou', a, b });
const si = (condition, alors, sinon) => (sinon ? { bloc: 'si_sinon', condition, alors, sinon } : { bloc: 'si_alors', condition, alors });
const ledE = (broche, etat) => ({ bloc: 'led_etat', broche, etat });
const son = (frequence, duree) => ({ bloc: 'son', broche: 'D10', frequence, duree });
const appuye = (broche) => ({ bloc: 'bouton_etat', broche });
const elt = (position) => ({ bloc: 'liste_element', liste: 'sequence', position });
const taille = { bloc: 'liste_taille', liste: 'sequence' };
const appeler = (fonction, ...args) => ({ bloc: 'appeler', fonction, arguments: args });
const param = { bloc: 'parametre', parametre: 'couleur' };
const v1 = (demarrage, boucle, fonctions) => {
  const p = { format: 'labo-blocs/programme', version: 1, fils: [{ quand: 'demarrage', corps: demarrage }, { quand: 'boucle', corps: boucle }] };
  if (fonctions && fonctions.length) p.fonctions = fonctions;
  return p;
};
const copie = (x) => JSON.parse(JSON.stringify(x));

// Fonctions communes à partir de l'exercice 5.
const ALLUMER = {
  nom: 'allumer',
  parametres: ['couleur'],
  corps: [...COULEURS.map((c, k) => si(cmp('=', param, k + 1), [ledE(c.led, 1), son(c.note, 0.3)])), att(0.3), ...LEDS.map((l) => ledE(l, 0)), att(0.2)],
};
const LIRE_BOUTON = {
  nom: 'lire_bouton',
  parametres: [],
  corps: [
    aff('appui', 0),
    { bloc: 'repeter_jusqua', condition: cmp('≠', v('appui'), 0), corps: [...COULEURS.map((c, k) => si(appuye(c.bouton), [aff('appui', k + 1)])), att(0.01)] },
    appeler('allumer', v('appui')),
  ],
};
const MONTRER_TOUT = [aff('i', 1), { bloc: 'repeter_n', fois: taille, corps: [appeler('allumer', elt(v('i'))), plus1('i')] }];
const MONTRER_ETAPE = [aff('i', 1), { bloc: 'repeter_n', fois: v('etape'), corps: [appeler('allumer', elt(v('i'))), plus1('i')] }];
const ECOUTER = (jusqua) => [
  aff('i', 1),
  aff('erreur', 0),
  {
    bloc: 'repeter_jusqua',
    condition: ou(cmp('>', v('i'), jusqua), cmp('=', v('erreur'), 1)),
    corps: [appeler('lire_bouton'), si(cmp('≠', v('appui'), elt(v('i'))), [aff('erreur', 1)], [plus1('i')])],
  },
];
const SON_ERREUR = [son(110, 1), att(1)];
const FANFARE = [son(523, 0.15), att(0.15), son(659, 0.15), att(0.15), son(784, 0.15), att(0.15), son(1047, 0.4), att(0.6)];
const REMPLIR = (valeurs) => ({ bloc: 'liste_remplir', liste: 'sequence', valeurs });

// ---------- Solutions ----------
const S = {};
S[1] = v1([ledE('D3', 1)], []);
S[2] = v1([], [si(cmp('=', appuye('D2'), { bloc: 'valeur_haut_bas', valeur: 1 }), [ledE('D3', 1)], [ledE('D3', 0)])]);
S[3] = v1([], COULEURS.map((c) => si(appuye(c.bouton), [ledE(c.led, 1)], [ledE(c.led, 0)])));
S[4] = v1([], COULEURS.map((c) => si(appuye(c.bouton), [ledE(c.led, 1), son(c.note, 0.3), att(0.3), ledE(c.led, 0)])));
S[5] = v1([1, 2, 3, 4].map((k) => appeler('allumer', k)), [], [ALLUMER]);
S[6] = v1([REMPLIR([1, 3, 2, 4]), ...MONTRER_TOUT], [], [ALLUMER]);
S[7] = v1([REMPLIR([1, 3, 2, 4]), ...MONTRER_TOUT], [appeler('lire_bouton')], [ALLUMER, LIRE_BOUTON]);
S[8] = v1([REMPLIR([1, 3, 2, 4])], [...MONTRER_TOUT, ...ECOUTER(taille), si(cmp('=', v('erreur'), 1), SON_ERREUR), att(1)], [ALLUMER, LIRE_BOUTON]);
const FIN_DE_TOUR = (victoire) =>
  si(
    cmp('=', v('erreur'), 1),
    [...SON_ERREUR, aff('etape', 1)],
    [si(cmp('<', v('etape'), taille), [plus1('etape')], [...(victoire ? FANFARE : []), aff('etape', 1)])],
  );
S[9] = v1([REMPLIR([1, 3, 2, 4]), aff('etape', 1)], [...MONTRER_ETAPE, ...ECOUTER(v('etape')), FIN_DE_TOUR(false), att(1)], [ALLUMER, LIRE_BOUTON]);
S[10] = v1([REMPLIR([1, 3, 2, 4]), aff('etape', 1)], [...MONTRER_ETAPE, ...ECOUTER(v('etape')), FIN_DE_TOUR(true), att(1)], [ALLUMER, LIRE_BOUTON]);
// Mon Simon : une séquence plus longue, d'autres notes, un autre son d'erreur (exemple de personnalisation).
const ALLUMER_PERSO = copie(ALLUMER);
[294, 349, 440, 587].forEach((f, k) => (ALLUMER_PERSO.corps[k].alors[1].frequence = f));
S[11] = v1([REMPLIR([4, 2, 2, 1, 3, 4, 1]), aff('etape', 1)], [...MONTRER_ETAPE, ...ECOUTER(v('etape')), FIN_DE_TOUR(true), att(1)], [ALLUMER_PERSO, LIRE_BOUTON]);
S[11].fils[1].corps[S[11].fils[1].corps.length - 2].alors[0].frequence = 147; // son d'erreur grave
S[12] = v1(
  [{ bloc: 'liste_vider', liste: 'sequence' }],
  [
    { bloc: 'liste_ajouter', liste: 'sequence', valeur: { bloc: 'hasard', min: 1, max: 4 } },
    ...MONTRER_TOUT,
    ...ECOUTER(taille),
    si(cmp('=', v('erreur'), 1), [...SON_ERREUR, aff('score', { bloc: 'liste_taille', liste: 'sequence' }), { bloc: 'liste_vider', liste: 'sequence' }]),
    att(1),
  ],
  [ALLUMER, LIRE_BOUTON],
);

// ---------- Étapes de scénario ----------
const jouer = (o) => Object.assign({ jouerListe: 'sequence', boutons: BOUTONS, calme: 1.5 }, o);
const listeOk = (min) => ({ liste: 'sequence', tailleMin: min, entre: [1, 4], delai: 0.1, contexte: 'au démarrage' });
// Retour au début : la 1re couleur remontrée, après la fin de la couleur appuyée par le joueur (0,6 s).
const premiereCouleur = (delai, contexte) => [{ attendre: 0.6 }, { allumage: { liste: 'sequence', numero: 1 }, leds: LEDS, delai, contexte, attendu: 'le programme devrait recommencer en montrant la première couleur de la séquence' }];
const sonErreur = (delai) => ({ entendre: 'D10', sauf: 'couleurs', delai, memeDepart: true, contexte: 'Quand le joueur se trompe', attendu: 'le buzzer devrait jouer un son d’erreur, différent des notes des couleurs' });
const SCENARIO_ERREUR = (tours, delai) => ({
  nom: 'Le joueur se trompe',
  etapes: [jouer({ tours, faute: true }), sonErreur(delai), ...premiereCouleur(8, 'Après l’erreur')],
});

// ---------- Exercices ----------
const BLOCS_BASE = ['led_etat', 'bouton_etat', 'valeur_haut_bas', 'comparaison', 'si_alors', 'si_sinon'];
const BLOCS_SON = ['son', 'attendre', 'nombre'];
const BLOCS_FONCTION = ['fonction_definir_param', 'fonction_appeler_param', 'parametre'];
const BLOCS_LISTE = ['liste_remplir', 'liste_element', 'liste_taille', 'repeter_n', 'affecter', 'ajouter_a', 'variable'];
const BLOCS_JEU = ['fonction_definir', 'fonction_appeler', 'repeter_jusqua', 'logique', 'non'];
const tout = (...listes) => [...new Set(listes.flat())];

const E = [];
E.push({
  numero: '1',
  titre: 'Allumer la LED bleue',
  consigne: 'Ta console Simon suit le standard de câblage de la classe (fiche « À savoir »).\nAu démarrage, allume la LED bleue. Elle reste allumée.',
  composants: [led(COULEURS[0])],
  blocsAutorises: ['led_etat'],
  aideLed: true,
  scenarios: [{ nom: 'La LED bleue s’allume au démarrage', etapes: [{ attendre: 0.5 }, { verifier: { D3: 1 }, delai: 0, contexte: 'au démarrage' }, { stable: { D3: 1 }, duree: 2 }] }],
  indices: ['Un seul bloc suffit. Regarde dans la fiche « À savoir » sur quelle broche est branchée la LED bleue.', 'Bloc : « contrôler la LED à l’état HAUT », dans « Au démarrage », avec la broche de la LED bleue.'],
  aSavoir: 'standard',
  competence: 'C9',
});
E.push({
  numero: '2',
  titre: 'Le bouton bleu allume la LED bleue',
  consigne: 'Tant qu’on appuie sur le bouton bleu, la LED bleue est allumée. Quand on le lâche, elle s’éteint.\nLe programme doit surveiller le bouton sans arrêt.',
  composants: [bouton(COULEURS[0]), led(COULEURS[0])],
  blocsAutorises: BLOCS_BASE,
  aideLed: true,
  scenarios: [
    {
      nom: 'Appuyer, puis lâcher le bouton bleu',
      etapes: [{ attendre: 0.3 }, { verifier: { D3: 0 } }, { maintenir: 'D2' }, { verifier: { D3: 1 } }, { relacher: 'D2' }, { verifier: { D3: 0 } }, { maintenir: 'D2' }, { verifier: { D3: 1 } }, { relacher: 'D2' }],
    },
  ],
  indices: ['Le bouton est un capteur, la LED un actionneur. « Si le bouton est appuyé, alors allumer, sinon éteindre », et ça recommence sans fin.', 'Blocs : « si … alors … sinon » dans « Répéter indéfiniment », avec « état sur la broche » (bouton) et deux « contrôler la LED ».'],
  aSavoir: 'chaine',
  competence: 'C9',
});
E.push({
  numero: '3',
  titre: 'Quatre boutons, quatre LED',
  consigne: 'Chaque bouton allume la LED de sa couleur, tant qu’on appuie dessus.\nRegarde le standard de câblage pour trouver les 8 broches. Tu peux tester avec la console, à droite.',
  composants: TOUS.filter((c) => c.type !== 'buzzer'),
  illustration: 'simon',
  blocsAutorises: BLOCS_BASE,
  aideLed: true,
  scenarios: COULEURS.map((c) => ({
    nom: `Le bouton ${c.nom}`,
    etapes: [
      { attendre: 0.3 },
      { maintenir: c.bouton },
      { verifier: Object.fromEntries(LEDS.map((l) => [l, l === c.led ? 1 : 0])) },
      { relacher: c.bouton },
      { verifier: Object.fromEntries(LEDS.map((l) => [l, 0])) },
    ],
  })),
  indices: ['Fais la même chose qu’à l’exercice 2, une fois pour chaque couleur.', 'Quatre « si … alors … sinon » l’un sous l’autre dans « Répéter indéfiniment » : bouton D2 → LED D3, D4 → D5, D6 → D7, D8 → D9.'],
  aSavoir: 'standard',
  competence: 'C9',
});
E.push({
  numero: '4',
  titre: 'Une note par couleur',
  consigne:
    'Un appui sur un bouton allume la LED de sa couleur et joue sa note sur le buzzer (broche D10), pendant 0,3 s, puis la LED s’éteint.\nNotes : bleu 262 Hz (do), vert 330 Hz (mi), jaune 392 Hz (sol), rouge 523 Hz (do aigu).',
  composants: TOUS,
  illustration: 'simon',
  blocsAutorises: tout(BLOCS_BASE, BLOCS_SON),
  scenarios: COULEURS.map((c) => ({
    nom: `Le bouton ${c.nom} joue sa note`,
    etapes: [
      { attendre: 0.3 },
      { appuyer: c.bouton },
      { allumage: c.led, delai: 0.5 },
      { entendre: 'D10', frequence: c.note, delai: 0.5, contexte: `après un appui sur le bouton ${c.nom} (${c.bouton})` },
      { attendre: 0.5 },
      { verifier: { [c.led]: 0 } },
    ],
  })),
  indices: ['Pour chaque couleur : si le bouton est appuyé, alors allumer la LED, jouer la note, attendre 0,3 s, éteindre la LED.', 'Bloc « jouer la note … Hz pendant … s sur la broche D10 » (catégorie Son). Le programme n’attend pas la fin de la note : ajoute « attendre 0.3 ».'],
  aSavoir: 'son',
  competence: 'C9',
});
E.push({
  numero: '5',
  titre: 'Une fonction « allumer » pour chaque couleur',
  consigne:
    'Le bloc « fonction allumer avec couleur » est posé, mais il est vide. Complète-le : si couleur = 1, la LED bleue s’allume avec sa note ; si couleur = 2, la verte… Puis attendre 0,3 s, éteindre les 4 LED et attendre 0,2 s.\n« Au démarrage » appelle déjà la fonction pour 1, 2, 3 et 4 : les 4 couleurs doivent s’allumer l’une après l’autre.',
  composants: TOUS,
  illustration: 'simon',
  blocsAutorises: tout(['led_etat', 'si_alors', 'comparaison'], BLOCS_SON, BLOCS_FONCTION),
  blocsDepart: v1([1, 2, 3, 4].map((k) => appeler('allumer', k)), [], [{ nom: 'allumer', parametres: ['couleur'], corps: [] }]),
  scenarios: [
    {
      nom: 'Les 4 couleurs dans l’ordre',
      etapes: [
        { allumage: 'D3', delai: 1, contexte: 'au démarrage' },
        { entendre: 'D10', frequence: 262, delai: 0.3, contexte: 'quand la LED bleue s’allume' },
        { allumage: 'D5', delai: 1.5, contexte: 'après la couleur bleue' },
        { entendre: 'D10', frequence: 330, delai: 0.3, contexte: 'quand la LED verte s’allume' },
        { allumage: 'D7', delai: 1.5, contexte: 'après la couleur verte' },
        { entendre: 'D10', frequence: 392, delai: 0.3, contexte: 'quand la LED jaune s’allume' },
        { allumage: 'D9', delai: 1.5, contexte: 'après la couleur jaune' },
        { entendre: 'D10', frequence: 523, delai: 0.3, contexte: 'quand la LED rouge s’allume' },
        { attendre: 1 },
        { stable: Object.fromEntries(LEDS.map((l) => [l, 0])), duree: 1, contexte: 'à la fin', attendu: 'les 4 LED devraient être éteintes' },
      ],
    },
  ],
  indices: ['Dans la fonction, « couleur » vaut 1, 2, 3 ou 4 selon l’appel. Quatre « si couleur = … » choisissent la LED et la note.', 'Bloc « couleur » (catégorie Fonctions) dans une comparaison « couleur = 1 ». Après les 4 « si » : attendre 0.3, 4 LED à BAS, attendre 0.2.'],
  aSavoir: 'fonction',
  competence: 'C9',
});
E.push({
  numero: '6',
  titre: 'Montrer ma séquence',
  consigne:
    'Invente la séquence de ton Simon : au moins 4 couleurs (1 bleu, 2 vert, 3 jaune, 4 rouge), rangées dans la liste « sequence ».\nAu démarrage, remplace les 4 appels par : remplir la liste, puis montrer chaque élément de la liste avec ta fonction « allumer » (une variable i compte : élément n° 1, n° 2…).',
  composants: TOUS,
  illustration: 'simon',
  listes: ['sequence'],
  variables: ['i'],
  blocsAutorises: tout(['led_etat', 'si_alors', 'comparaison'], BLOCS_SON, BLOCS_FONCTION, BLOCS_LISTE),
  blocsDepart: S[5],
  reprendreProgramme: 'simon-05',
  scenarios: [
    {
      nom: 'La séquence est montrée dans l’ordre',
      etapes: [listeOk(4), ...[1, 2, 3, 4].map((n) => ({ allumage: { liste: 'sequence', numero: n }, leds: LEDS, delai: 1.5, contexte: n === 1 ? 'au démarrage' : `après la couleur n° ${n - 1}` }))],
    },
  ],
  indices: ['« répéter (nombre d’éléments de la liste) fois » : appeler allumer avec l’élément n° i, puis ajouter 1 à i. Avant la boucle, i vaut 1.', 'Blocs : « remplir la liste sequence avec 1, 3, 2, 4 », « affecter à i la valeur 1 », « répéter … fois », « appeler allumer avec élément n° i de la liste », « ajouter à i la valeur 1 ».'],
  aSavoir: 'liste',
  competence: 'C9',
});
E.push({
  numero: '7',
  titre: 'Quel bouton le joueur appuie-t-il ?',
  consigne:
    'Après avoir montré la séquence, le programme écoute le joueur.\nCrée une fonction « lire_bouton » : elle met 0 dans « appui », puis répète jusqu’à ce que « appui » ne soit plus 0 : si le bouton bleu est appuyé, appui = 1 ; vert, 2 ; jaune, 3 ; rouge, 4. À la fin, elle allume la couleur appuyée.\nDans « Répéter indéfiniment », appelle « lire_bouton ».',
  composants: TOUS,
  illustration: 'simon',
  listes: ['sequence'],
  variables: ['i', 'appui'],
  blocsAutorises: tout(BLOCS_BASE, BLOCS_SON, BLOCS_FONCTION, BLOCS_LISTE, BLOCS_JEU),
  blocsDepart: S[6],
  reprendreProgramme: 'simon-06',
  scenarios: [
    {
      nom: 'Le joueur appuie sur le jaune puis sur le bleu',
      etapes: [
        listeOk(4),
        { attendre: 26 },
        { appuyer: 'D6' },
        { allumage: 'D7', delai: 1 },
        { entendre: 'D10', frequence: 392, delai: 0.3, contexte: 'après un appui sur le bouton jaune (D6)' },
        { attendre: 1 },
        { appuyer: 'D2' },
        { allumage: 'D3', delai: 1 },
        { entendre: 'D10', frequence: 262, delai: 0.3, contexte: 'après un appui sur le bouton bleu (D2)' },
      ],
    },
  ],
  indices: ['« répéter jusqu’à appui ≠ 0 » : le programme reste là tant qu’aucun bouton n’est appuyé. Ajoute « attendre 0.01 » dans la boucle.', 'Blocs : « fonction lire_bouton », « affecter à appui la valeur 0 », « répéter jusqu’à », 4 « si état sur la broche … alors affecter à appui … », puis « appeler allumer avec appui ».'],
  aSavoir: 'fonction',
  competence: 'C9',
});
E.push({
  numero: '8',
  titre: 'Se tromper : son d’erreur',
  consigne:
    'Le jeu montre toute la séquence, puis le joueur la refait. Pour chaque appui (i de 1 à la taille de la liste) : si « appui » n’est pas l’élément n° i, c’est une erreur.\nEn cas d’erreur : un son d’erreur (une note différente de celles des couleurs, par exemple 110 Hz pendant 1 s), puis tout recommence.\nDéplace « montrer la séquence » dans « Répéter indéfiniment » ; « remplir la liste » reste « Au démarrage ».',
  composants: TOUS,
  illustration: 'simon',
  listes: ['sequence'],
  variables: ['i', 'appui', 'erreur'],
  blocsAutorises: tout(BLOCS_BASE, BLOCS_SON, BLOCS_FONCTION, BLOCS_LISTE, BLOCS_JEU),
  blocsDepart: S[7],
  reprendreProgramme: 'simon-07',
  scenarios: [
    SCENARIO_ERREUR('complet', 3),
    {
      nom: 'Le joueur refait la séquence sans se tromper',
      etapes: [
        listeOk(4),
        jouer({ tours: 'complet' }),
        { entendre: 'D10', sauf: 'couleurs', aucune: true, delai: 2, memeDepart: true, contexte: 'Quand le joueur refait toute la séquence sans se tromper', attendu: 'le buzzer ne devrait pas jouer le son d’erreur' },
        ...premiereCouleur(6, 'Ensuite'),
      ],
    },
  ],
  indices: ['Une variable « erreur » vaut 0 au début. On écoute jusqu’à « i > nombre d’éléments » ou « erreur = 1 ». Après : si erreur = 1, le son d’erreur.', 'Blocs : « répéter jusqu’à (i > nombre d’éléments) ou (erreur = 1) » ; dedans : « appeler lire_bouton », « si appui ≠ élément n° i alors erreur = 1 sinon ajouter 1 à i ».'],
  aSavoir: 'jeu',
  competence: 'C9',
});
E.push({
  numero: '9',
  titre: 'Une couleur de plus à chaque tour',
  consigne:
    'Comme le vrai Simon : au tour 1, le jeu montre 1 couleur ; au tour 2, 2 couleurs… Une variable « etape » compte les couleurs du tour (1 au démarrage).\nLe joueur refait les « etape » premières couleurs. Réussi : ajouter 1 à etape (s’il reste des couleurs dans la liste, sinon etape revient à 1). Erreur : son d’erreur et etape revient à 1.',
  composants: TOUS,
  illustration: 'simon',
  listes: ['sequence'],
  variables: ['i', 'appui', 'erreur', 'etape'],
  blocsAutorises: tout(BLOCS_BASE, BLOCS_SON, BLOCS_FONCTION, BLOCS_LISTE, BLOCS_JEU),
  blocsDepart: S[8],
  reprendreProgramme: 'simon-08',
  scenarios: [
    {
      nom: 'Après deux tours réussis, le jeu montre 3 couleurs',
      etapes: [
        listeOk(4),
        jouer({ tours: 2 }),
        { entendre: 'D10', notes: 3, exactement: true, delai: 5, contexte: 'Après deux tours réussis', attendu: 'le jeu devrait montrer 3 couleurs (3 notes), puis attendre le joueur' },
      ],
    },
    SCENARIO_ERREUR(2, 3),
  ],
  indices: ['Dans « montrer » et « écouter », remplace « nombre d’éléments de la liste » par « etape ».', 'Après l’écoute : « si erreur = 1 alors son d’erreur, etape = 1 sinon (si etape < nombre d’éléments alors ajouter 1 à etape sinon etape = 1) ».'],
  aSavoir: 'jeu',
  competence: 'C9',
});
E.push({
  numero: '10',
  titre: 'Toute la séquence : victoire !',
  consigne: 'Quand le joueur a refait toute la séquence (etape = nombre d’éléments de la liste), joue une petite musique de victoire (au moins 2 notes), puis le jeu recommence au tour 1.',
  composants: TOUS,
  illustration: 'simon',
  listes: ['sequence'],
  variables: ['i', 'appui', 'erreur', 'etape'],
  blocsAutorises: tout(BLOCS_BASE, BLOCS_SON, BLOCS_FONCTION, BLOCS_LISTE, BLOCS_JEU),
  blocsDepart: S[9],
  reprendreProgramme: 'simon-09',
  scenarios: [
    {
      nom: 'Le joueur réussit toute la séquence',
      etapes: [
        listeOk(4),
        jouer({}),
        { entendre: 'D10', notes: 2, delai: 2.5, memeDepart: true, contexte: 'Quand le joueur a refait toute la séquence', attendu: 'le buzzer devrait jouer une musique de victoire (au moins 2 notes)' },
        ...premiereCouleur(8, 'Après la victoire'),
      ],
    },
    SCENARIO_ERREUR(2, 3),
  ],
  indices: ['La victoire se joue au même endroit que « etape revient à 1 » quand toute la liste est réussie.', 'Exemple de musique : do 523 Hz, mi 659 Hz, sol 784 Hz, do 1047 Hz, avec « attendre » entre les notes.'],
  aSavoir: 'son',
  competence: 'C9',
});
E.push({
  numero: '11',
  titre: 'Mon Simon',
  consigne:
    'Personnalise ton Simon : ta séquence (au moins 6 couleurs), tes notes, ton rythme (pauses d’1 s au plus), ta musique de victoire et ton son d’erreur (différent des notes des couleurs).\nC’est ce programme qui sera envoyé dans la Console Officielle pour le Grand Tournoi. Quand il est réussi, appelle le professeur.',
  composants: TOUS,
  illustration: 'simon',
  listes: ['sequence'],
  variables: ['i', 'appui', 'erreur', 'etape'],
  blocsAutorises: tout(BLOCS_BASE, BLOCS_SON, BLOCS_FONCTION, BLOCS_LISTE, BLOCS_JEU, ['operation']),
  blocsDepart: S[10],
  reprendreProgramme: 'simon-10',
  scenarios: [
    {
      nom: 'Le joueur réussit toute ma séquence',
      etapes: [listeOk(6), jouer({ attente: 30 }), { entendre: 'D10', notes: 2, delai: 3, memeDepart: true, contexte: 'Quand le joueur a refait toute la séquence', attendu: 'le buzzer devrait jouer ta musique de victoire (au moins 2 notes)' }, ...premiereCouleur(10, 'Après la victoire')],
    },
    SCENARIO_ERREUR(3, 4),
  ],
  indices: ['Change les nombres de « remplir la liste », les notes et les « attendre » de la fonction « allumer », la musique de victoire et le son d’erreur.', 'Vérifie que chaque pause dure 1 s au plus : sinon le joueur ne sait pas quand répondre.'],
  aSavoir: 'jeu',
  competence: 'C9',
});
E.push({
  numero: '12',
  titre: 'Défi : le Simon au hasard',
  defi: true,
  consigne:
    'Le vrai Simon invente sa séquence : au début de chaque tour, ajoute une couleur au hasard (1 à 4) à la fin de la liste, puis montre toute la liste et écoute le joueur.\nErreur : son d’erreur, la liste est vidée et on recommence. Bonus : garde le score (nombre de couleurs réussies) dans une variable.',
  composants: TOUS,
  illustration: 'simon',
  listes: ['sequence'],
  variables: ['i', 'appui', 'erreur', 'score'],
  blocsAutorises: tout(BLOCS_BASE, BLOCS_SON, BLOCS_FONCTION, BLOCS_LISTE, BLOCS_JEU, ['hasard', 'liste_ajouter', 'liste_vider', 'operation']),
  blocsDepart: S[11],
  reprendreProgramme: 'simon-11',
  scenarios: [
    {
      nom: 'La séquence s’allonge à chaque tour',
      etapes: [
        jouer({ grandit: true, tours: 4 }),
        { liste: 'sequence', tailleMin: 5, delai: 3, contexte: 'Après 4 tours réussis', attendu: 'la liste devrait avoir une couleur de plus à chaque tour (5 couleurs au moins)' },
      ],
    },
    {
      nom: 'Le joueur se trompe',
      etapes: [jouer({ grandit: true, tours: 3, faute: true }), sonErreur(3), { liste: 'sequence', tailleMax: 1, delai: 3, contexte: 'Après l’erreur', attendu: 'la liste devrait repartir de zéro (une seule couleur au nouveau tour)' }],
    },
  ],
  indices: ['« Au démarrage » : vider la liste. Au début de « Répéter indéfiniment » : ajouter un nombre au hasard entre 1 et 4 à la fin de la liste.', 'Plus besoin de « etape » : on montre et on écoute toute la liste. En cas d’erreur, « vider la liste ».'],
  aSavoir: 'jeu',
  competence: 'C9',
});
E.forEach((e, k) => {
  e.id = 'simon-' + String(k + 1).padStart(2, '0');
  e.defi = !!e.defi;
  e.solutionReference = S[k + 1];
  if (e.blocsDepart === undefined) e.blocsDepart = null;
});

// ---------- Fiches et lexique ----------
const fiches = {
  standard: {
    titre: 'Le standard de câblage de la console',
    lignes: [
      'Toutes les consoles sont câblées pareil : ton programme marche sur n’importe laquelle.',
      '- Bleu (couleur 1) : bouton D2, LED D3',
      '- Vert (couleur 2) : bouton D4, LED D5',
      '- Jaune (couleur 3) : bouton D6, LED D7',
      '- Rouge (couleur 4) : bouton D8, LED D9',
      '- Buzzer : D10',
      'Les boutons relient la broche à la masse : appuyé, le bouton donne HAUT (1).',
    ],
  },
  chaine: {
    titre: 'La chaîne d’information',
    lignes: [
      'Une information entre, une action sort : capteurs → carte Arduino → actionneurs.',
      'Les boutons sont des capteurs : ils disent à la carte si on appuie.',
      'La carte Arduino traite l’information avec ton programme.',
      'Les LED et le buzzer sont des actionneurs : ils agissent (lumière, son).',
    ],
  },
  son: {
    titre: 'Jouer une note',
    lignes: [
      'Une note a une fréquence, en hertz (Hz) : plus elle est grande, plus le son est aigu.',
      'do 262 · ré 294 · mi 330 · fa 349 · sol 392 · la 440 · si 494 · do aigu 523 (et 659, 784, 1047 encore plus aigu).',
      'Le programme n’attend pas la fin de la note : ajoute « attendre » si la suite doit venir après.',
    ],
  },
  fonction: {
    titre: 'Les fonctions',
    lignes: [
      'Une fonction est un groupe de blocs qui porte un nom. « appeler » exécute tous ses blocs, puis le programme continue.',
      'On l’écrit une fois, on l’appelle autant de fois qu’on veut : le programme est plus court et plus clair.',
      'Le paramètre (ici « couleur ») est la valeur donnée à chaque appel : « appeler allumer avec 3 » → couleur vaut 3.',
    ],
  },
  liste: {
    titre: 'Les listes',
    lignes: [
      'Une liste range plusieurs nombres dans l’ordre, comme les cases d’un tableau.',
      'Le premier élément est le n° 1 : « élément n° 1 de la liste sequence ».',
      '« nombre d’éléments de la liste » : combien de nombres sont rangés.',
      'Pour parcourir la liste : une variable i vaut 1, puis 2, puis 3… (ajouter 1 à i à chaque tour).',
    ],
  },
  jeu: {
    titre: 'L’algorithme du Simon',
    lignes: [
      '1. Montrer les couleurs du tour.',
      '2. Écouter le joueur : un appui, puis le suivant…',
      '3. Comparer chaque appui à la couleur attendue.',
      '- si c’est faux alors : son d’erreur, on recommence au tour 1',
      '- sinon, si toute la séquence est réussie : victoire, on recommence',
      '- sinon : un tour de plus (une couleur de plus)',
    ],
  },
};
const lexique = [
  { mot: 'Broche', icone: 'lumiere', formes: ['broche', 'broches'], definition: 'Un petit trou de la carte où l’on branche un composant. Chaque broche a un nom, comme D2 ou D10.' },
  { mot: 'Capteur', icone: 'info', formes: ['capteur', 'capteurs'], definition: 'Un composant qui donne une information à la carte, comme un bouton.' },
  { mot: 'Actionneur', icone: 'info', formes: ['actionneur', 'actionneurs'], definition: 'Un composant qui agit : une LED éclaire, un buzzer fait du son.' },
  { mot: 'Fréquence', icone: 'info', formes: ['fréquence', 'fréquences', 'Hz'], definition: 'Le nombre de vibrations par seconde d’un son, en hertz (Hz). Plus il est grand, plus le son est aigu.' },
  { mot: 'Fonction', icone: 'info', formes: ['fonction', 'fonctions'], definition: 'Un groupe de blocs qui porte un nom et qu’on appelle quand on en a besoin.' },
  { mot: 'Paramètre', icone: 'info', formes: ['paramètre', 'paramètres'], definition: 'La valeur donnée à une fonction quand on l’appelle (par exemple la couleur à allumer).' },
  { mot: 'Liste', icone: 'info', formes: ['liste', 'listes'], definition: 'Plusieurs nombres rangés dans l’ordre. Le premier est le n° 1.' },
  { mot: 'Variable', icone: 'info', formes: ['variable', 'variables'], definition: 'Une boîte qui garde un nombre, qui peut changer pendant le programme (comme i, appui ou etape).' },
  { mot: 'Algorithme', icone: 'info', formes: ['algorithme', 'algorithmes'], definition: 'La suite des étapes pour résoudre un problème, écrite avant de programmer.' },
];

const paquet = {
  format: 'labo-blocs/parcours',
  version: 1,
  id: 'simon',
  titre: 'Simon Rétro Game',
  versionParcours: '1.0.0',
  date: '2026-10-21',
  moteurMinimum: PA.VERSION_MOTEUR,
  carte: 'uno',
  modes: ['simulateur', 'carte'],
  boutonsVersMasse: true,
  parametres: {},
  exercices: E,
  fiches,
  lexique,
};

// ---------- Vérifications ----------
let echecs = 0;
const pb = PA.controler(paquet);
if (pb.length) {
  console.log('Contrôle du parcours :', pb);
  echecs++;
}
const prep = PA.preparer(paquet);
const vides = v1([], []);
for (const e of prep.exercices) {
  const c = C.compiler(e.solutionReference, { composants: e.composants, boutonsVersMasse: true });
  const r = V.valider(e, e.solutionReference);
  const depart = V.valider(e, e.blocsDepart || vides);
  const ok = c.erreurs.length === 0 && r.reussi && !depart.reussi && c.octets.length < 1024;
  if (!ok) echecs++;
  console.log(`${ok ? '✔' : '✖'} ${e.numero.padStart(2)} ${e.titre} — ${c.octets.length} octets${c.erreurs.length ? ' ; ' + c.erreurs.join(' ; ') : ''}`);
  if (!r.reussi) console.log('   solution :', r.nomScenario, '—', r.message);
  if (depart.reussi) console.log('   le programme de départ réussit déjà !');
  else console.log('   départ :', depart.message);
  // Le programme de l'exercice précédent ne doit pas suffire.
  const k = Number(e.numero);
  if (k > 1 && S[k - 1]) {
    const avant = V.valider(e, S[k - 1]);
    console.log(`   solution ${k - 1} : ${avant.reussi ? '!! réussit aussi' : avant.message}`);
  }
}
if (process.argv.includes('--ecrire')) {
  const dossier = path.join(R, 'parcours', 'simon');
  fs.mkdirSync(dossier, { recursive: true });
  fs.writeFileSync(path.join(dossier, 'parcours.js'), PA.scriptParcours(paquet));
  console.log('Écrit :', path.join(dossier, 'parcours.js'));
}
process.exit(echecs ? 1 : 0);
