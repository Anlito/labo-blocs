// Construit les deux parcours « Simon Rétro Game » et vérifie chaque exercice : la solution passe tous les scénarios ;
// le programme de départ (ou un programme incomplet) ne passe pas.
//   parcours/simon/parcours.js (4e)   et   parcours/simon-5e/parcours.js (5e, très guidé)
// Le site Simon choisit le parcours d'après la classe de l'équipe. Mêmes exercices 1 à 4, même chemin ensuite : seuls le
// programme de départ, la consigne, la palette et les indices changent (décision de Thomas, 16/11/2026).
//   node tools/construire-simon.js [dossier du dépôt] [--ecrire]   (sans --ecrire : vérifie seulement)
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

// ---------- Exercices 5 à 12 : même chemin, même vérification, deux niveaux de guidage ----------
// 5e : le programme de départ est presque écrit et commenté ; l'élève ajoute un ou deux blocs, avec une petite palette.
// 4e : le départ donne la structure (fonction commencée, boucle vide, « si » posé) ; l'élève écrit le cœur de l'étape.
// Un exercice guidé repart de son programme de départ (pas de reprise du précédent, qui le remplacerait).
const com = (bloc, commentaire) => Object.assign(copie(bloc), { commentaire });
const fil = (quand, corps, commentaire) => Object.assign({ quand, corps }, commentaire ? { commentaire } : {});
const prog = (demarrage, boucle, fonctions) => ({ format: 'labo-blocs/programme', version: 1, fils: [demarrage, boucle], fonctions });
// Une seule bulle par exercice, courte (elle s'ouvre à 200 × 80 px), posée sur ce qu'il faut compléter.
const ALLUMER_FAITE = ALLUMER;
const LIRE_FAITE = LIRE_BOUTON;
const NOTES = '\nNotes : bleu 262 Hz (do), vert 330 Hz (mi), jaune 392 Hz (sol), rouge 523 Hz (do aigu).';

function exercicesGuides(niveau) {
  const n5 = niveau === 5;
  const PALETTE = tout(BLOCS_BASE, BLOCS_SON, BLOCS_FONCTION, BLOCS_LISTE, BLOCS_JEU);
  const L = [];

  // 5 · Fonction « allumer »
  L.push({
    numero: '5',
    titre: n5 ? 'Appeler la fonction « allumer »' : 'Une fonction « allumer » pour chaque couleur',
    consigne: n5
      ? 'La fonction « allumer » est déjà écrite (en bas) : on lui donne un numéro de couleur (1 bleu, 2 vert, 3 jaune, 4 rouge), elle allume cette couleur, joue sa note, puis éteint tout.\nDans « Au démarrage », appelle-la 4 fois : avec 1, puis 2, puis 3, puis 4. Les 4 couleurs doivent s’allumer l’une après l’autre.'
      : 'La fonction « allumer » est commencée : si couleur = 1, elle allume la LED bleue et joue sa note. Complète-la pour 2 (vert), 3 (jaune) et 4 (rouge).\n« Au démarrage » appelle déjà la fonction pour 1, 2, 3 et 4 : les 4 couleurs doivent s’allumer l’une après l’autre.' + NOTES,
    blocsAutorises: n5 ? ['fonction_appeler_param', 'nombre'] : tout(['led_etat', 'si_alors', 'comparaison'], BLOCS_SON, BLOCS_FONCTION),
    blocsDepart: n5
      ? prog(fil('demarrage', [], 'Ici : 4 blocs « appeler allumer avec … » (1, 2, 3, 4).'), fil('boucle', []), [ALLUMER_FAITE])
      : prog(fil('demarrage', [1, 2, 3, 4].map((k) => appeler('allumer', k))), fil('boucle', []), [
          com(Object.assign(copie(ALLUMER), { corps: [ALLUMER.corps[0], ...ALLUMER.corps.slice(4)] }), 'Le bleu (1) est fait. Ajoute un « si » pour 2, 3 et 4.'),
        ]),
    indices: n5
      ? ['Catégorie Fonctions : le bloc « appeler allumer avec … ». Pose-le 4 fois dans « Au démarrage », l’un sous l’autre.', 'Change le nombre de chaque appel : 1, 2, 3, 4.']
      : ['Copie le « si couleur = 1 » (clic droit › Dupliquer) et change le numéro, la broche de la LED et la note.', 'Vert : couleur = 2, LED D5, 330 Hz. Jaune : 3, D7, 392 Hz. Rouge : 4, D9, 523 Hz.'],
  });

  // 6 · La séquence dans une liste
  L.push({
    numero: '6',
    titre: 'Ma séquence dans une liste',
    consigne: n5
      ? 'Ta séquence est rangée dans la liste « sequence ». Écris-y tes couleurs : au moins 4 (1 bleu, 2 vert, 3 jaune, 4 rouge).\nLa boucle montre chaque couleur de la liste, mais il manque un bloc : « ajouter 1 à i », pour passer à la couleur suivante.'
      : 'Invente ta séquence dans la liste « sequence » : au moins 4 couleurs (1 bleu, 2 vert, 3 jaune, 4 rouge).\nComplète la boucle pour montrer chaque élément de la liste avec la fonction « allumer » : élément n° i, puis ajouter 1 à i.',
    listes: ['sequence'],
    variables: ['i'],
    blocsAutorises: n5 ? ['ajouter_a', 'variable', 'nombre'] : tout(['led_etat', 'si_alors', 'comparaison'], BLOCS_SON, BLOCS_FONCTION, BLOCS_LISTE),
    blocsDepart: n5
      ? prog(
          fil('demarrage', [
            REMPLIR([1]),
            aff('i', 1),
            { bloc: 'repeter_n', fois: taille, corps: [com(appeler('allumer', elt(v('i'))), 'Il manque un bloc dessous : « ajouter à i la valeur 1 ».')] },
          ]),
          fil('boucle', []),
          [ALLUMER_FAITE],
        )
      : prog(
          fil('demarrage', [
            REMPLIR([1, 3, 2, 4]),
            aff('i', 1),
            com({ bloc: 'repeter_n', fois: taille, corps: [] }, 'Ici : allumer l’élément n° i, puis ajouter 1 à i.'),
          ]),
          fil('boucle', []),
          [ALLUMER],
        ),
    indices: n5
      ? ['« i » vaut 1, puis 2, puis 3… : c’est le numéro de la couleur montrée. Sans « ajouter 1 à i », on montre toujours la n° 1.', 'Bloc « ajouter à i la valeur 1 » (catégorie Variables), sous « appeler allumer », dans la boucle.']
      : ['Dans « répéter … fois » : « appeler allumer avec élément n° i de la liste sequence », puis « ajouter à i la valeur 1 ».', 'Le bloc « élément n° … de la liste » est dans la catégorie Listes ; mets-y la variable i.'],
  });

  // 7 · Lire le bouton appuyé
  L.push({
    numero: '7',
    titre: 'Quel bouton le joueur appuie-t-il ?',
    consigne: n5
      ? 'Après avoir montré la séquence, le programme écoute le joueur. La fonction « lire_bouton » est déjà écrite : elle attend qu’un bouton soit appuyé, range son numéro dans « appui » (1 à 4), puis allume cette couleur.\nDans « Répéter indéfiniment », appelle « lire_bouton » : chaque appui allume la couleur du bouton.'
      : 'Après avoir montré la séquence, le programme écoute le joueur. La fonction « lire_bouton » est commencée : bouton bleu → appui = 1. Ajoute vert → 2, jaune → 3, rouge → 4.\nPuis, dans « Répéter indéfiniment », appelle « lire_bouton ».',
    listes: ['sequence'],
    variables: ['i', 'appui'],
    blocsAutorises: n5 ? ['fonction_appeler'] : PALETTE,
    blocsDepart: n5
      ? prog(fil('demarrage', S[6].fils[0].corps), fil('boucle', [], 'Ici : « appeler lire_bouton ».'), [ALLUMER_FAITE, LIRE_FAITE])
      : prog(fil('demarrage', S[6].fils[0].corps), fil('boucle', []), [
          ALLUMER,
          Object.assign(copie(LIRE_BOUTON), {
            corps: [LIRE_BOUTON.corps[0], com(Object.assign(copie(LIRE_BOUTON.corps[1]), { corps: [LIRE_BOUTON.corps[1].corps[0], att(0.01)] }), 'Le bleu (1) est fait. Ajoute vert 2, jaune 3, rouge 4.'), LIRE_BOUTON.corps[2]],
          }),
        ]),
    indices: n5
      ? ['Catégorie Fonctions : le bloc « appeler lire_bouton ».', 'Pose-le dans « Répéter indéfiniment » : le programme attend un appui, encore et encore.']
      : ['Copie le « si bouton D2 » et change la broche du bouton et le nombre rangé dans appui.', 'Vert : D4 → 2. Jaune : D6 → 3. Rouge : D8 → 4. Puis « appeler lire_bouton » dans « Répéter indéfiniment ».'],
  });

  // 8 · Refaire la séquence, son d'erreur
  const ERREUR_VIDE = (texte) => com(si(cmp('=', v('erreur'), 1), []), texte);
  L.push({
    numero: '8',
    titre: 'Se tromper : son d’erreur',
    consigne: n5
      ? 'Le jeu montre la séquence, puis le joueur la refait. Le programme compare déjà chaque appui à la séquence : s’il y a une différence, « erreur » vaut 1.\nDans le « si erreur = 1 », joue un son d’erreur (une note différente de celles des couleurs, par exemple 110 Hz pendant 1 s), puis attends 1 s.'
      : 'Le jeu montre la séquence, puis le joueur la refait. Dans la boucle d’écoute, après chaque appui : si « appui » n’est pas l’élément n° i, erreur = 1 ; sinon, ajouter 1 à i.\nEn cas d’erreur : un son d’erreur (une note différente de celles des couleurs, par exemple 110 Hz pendant 1 s).',
    listes: ['sequence'],
    variables: ['i', 'appui', 'erreur'],
    blocsAutorises: n5 ? ['son', 'attendre', 'nombre'] : PALETTE,
    blocsDepart: n5
      ? prog(
          fil('demarrage', [REMPLIR([1, 3, 2, 4])]),
          fil('boucle', [...MONTRER_TOUT, ...ECOUTER(taille), ERREUR_VIDE('Ici : le son d’erreur, puis « attendre 1 ».'), att(1)]),
          [ALLUMER_FAITE, LIRE_FAITE],
        )
      : prog(
          fil('demarrage', [REMPLIR([1, 3, 2, 4])]),
          fil('boucle', [
            ...MONTRER_TOUT,
            aff('i', 1),
            aff('erreur', 0),
            com(Object.assign(copie(ECOUTER(taille)[2]), { corps: [appeler('lire_bouton')] }), 'Ici : si appui ≠ élément n° i alors erreur = 1, sinon ajouter 1 à i.'),
            si(cmp('=', v('erreur'), 1), []),
            att(1),
          ]),
          [ALLUMER, LIRE_BOUTON],
        ),
    indices: n5
      ? ['Catégorie Son : « jouer la note … Hz pendant … s ». Choisis une note grave, différente des 4 couleurs (110 Hz par exemple).', 'Dans le « si erreur = 1 » : « jouer la note 110 Hz pendant 1 s », puis « attendre 1 ».']
      : ['Un « si … alors … sinon » sous « appeler lire_bouton », avec la comparaison « appui ≠ élément n° i de la liste ».', 'Alors : affecter à erreur la valeur 1. Sinon : ajouter à i la valeur 1. Dans le « si erreur = 1 » : jouer 110 Hz pendant 1 s, attendre 1.'],
  });

  // 9 · Une couleur de plus à chaque tour
  L.push({
    numero: '9',
    titre: 'Une couleur de plus à chaque tour',
    consigne: n5
      ? 'Comme le vrai Simon : au tour 1, le jeu montre 1 couleur ; au tour 2, 2 couleurs… La variable « etape » compte les couleurs du tour.\nTout est prêt, sauf un bloc : quand le joueur a réussi le tour, ajoute 1 à « etape », à l’endroit indiqué par le commentaire.'
      : 'Comme le vrai Simon : au tour 1, le jeu montre 1 couleur ; au tour 2, 2 couleurs… La variable « etape » compte les couleurs du tour ; montrer et écouter s’arrêtent déjà à « etape ».\nÀ la fin du tour : réussi, ajouter 1 à etape (s’il reste des couleurs, sinon etape revient à 1) ; erreur, son d’erreur et etape revient à 1.',
    listes: ['sequence'],
    variables: ['i', 'appui', 'erreur', 'etape'],
    blocsAutorises: n5 ? ['ajouter_a', 'variable', 'nombre'] : PALETTE,
    blocsDepart: n5
      ? prog(
          fil('demarrage', [REMPLIR([1, 3, 2, 4]), aff('etape', 1)]),
          fil('boucle', [
            ...MONTRER_ETAPE,
            ...ECOUTER(v('etape')),
            si(
              cmp('=', v('erreur'), 1),
              [...SON_ERREUR, aff('etape', 1)],
              [com(si(cmp('<', v('etape'), taille), [], [aff('etape', 1)]), 'Tour réussi : ajoute dans « alors » 1 à etape.')],
            ),
            att(1),
          ]),
          [ALLUMER_FAITE, LIRE_FAITE],
        )
      : prog(
          fil('demarrage', [REMPLIR([1, 3, 2, 4]), aff('etape', 1)]),
          fil('boucle', [...MONTRER_ETAPE, ...ECOUTER(v('etape')), com(si(cmp('=', v('erreur'), 1), [...SON_ERREUR], []), 'Ici : la fin du tour (voir la consigne).'), att(1)]),
          [ALLUMER, LIRE_BOUTON],
        ),
    indices: n5
      ? ['« ajouter à etape la valeur 1 » : au prochain tour, le jeu montre une couleur de plus.', 'Pose « ajouter à etape la valeur 1 » dans le « alors » du « si etape < nombre d’éléments ».']
      : ['Dans « sinon » : « si etape < nombre d’éléments de la liste alors ajouter 1 à etape sinon affecter à etape la valeur 1 ».', 'Dans « alors », sous le son d’erreur : « affecter à etape la valeur 1 ».'],
  });

  // 10 · Victoire
  const S9_COMMENTE = copie(L[4].blocsDepart);
  if (n5) {
    const fin = S9_COMMENTE.fils[1].corps.find((b) => b.bloc === 'si_sinon');
    fin.sinon[0] = si(cmp('<', v('etape'), taille), [plus1('etape')], [com(aff('etape', 1), 'Tout est réussi : ta musique de victoire au-dessus de ce bloc.')]);
  }
  L.push({
    numero: '10',
    titre: 'Toute la séquence : victoire !',
    consigne: n5
      ? 'Quand le joueur a refait toute la séquence, joue une petite musique de victoire : au moins 2 notes, avec « attendre » entre elles. Le commentaire montre où la mettre.\nEnsuite, le jeu recommence au tour 1 (c’est déjà fait).'
      : 'Quand le joueur a refait toute la séquence (etape = nombre d’éléments de la liste), joue une petite musique de victoire (au moins 2 notes), puis le jeu recommence au tour 1.',
    listes: ['sequence'],
    variables: ['i', 'appui', 'erreur', 'etape'],
    blocsAutorises: n5 ? ['son', 'attendre', 'nombre'] : PALETTE,
    blocsDepart: n5 ? S9_COMMENTE : S[9],
    reprendreProgramme: n5 ? undefined : 'simon-09',
    indices: n5
      ? ['La musique se place juste avant « affecter à etape la valeur 1 », là où toute la liste est réussie.', 'Exemple : do 523 Hz, mi 659 Hz, sol 784 Hz, do 1047 Hz, chacun pendant 0,15 s, avec « attendre 0.15 » entre les notes.']
      : ['La victoire se joue au même endroit que « etape revient à 1 » quand toute la liste est réussie.', 'Exemple de musique : do 523 Hz, mi 659 Hz, sol 784 Hz, do 1047 Hz, avec « attendre » entre les notes.'],
  });

  // 11 · Mon Simon
  const S10_COMMENTE = copie(S[10]);
  if (n5) {
    S10_COMMENTE.fils[0].corps[0] = com(S10_COMMENTE.fils[0].corps[0], 'Ta séquence : au moins 6 couleurs.');
  }
  L.push({
    numero: '11',
    titre: 'Mon Simon',
    consigne: n5
      ? 'Personnalise ton Simon : ta séquence (au moins 6 couleurs), tes notes, ta musique de victoire et ton son d’erreur. Ta séquence est dans « remplir la liste », tes notes dans la fonction « allumer », la musique de victoire et le son d’erreur à la fin de « Répéter indéfiniment ».\nC’est ce programme qui sera envoyé dans la Console Officielle pour le Grand Tournoi. Quand il est réussi, appelle le professeur.'
      : 'Personnalise ton Simon : ta séquence (au moins 6 couleurs), tes notes, ton rythme (pauses d’1 s au plus), ta musique de victoire et ton son d’erreur (différent des notes des couleurs).\nC’est ce programme qui sera envoyé dans la Console Officielle pour le Grand Tournoi. Quand il est réussi, appelle le professeur.',
    listes: ['sequence'],
    variables: ['i', 'appui', 'erreur', 'etape'],
    blocsAutorises: n5 ? ['son', 'attendre', 'nombre'] : tout(PALETTE, ['operation']),
    blocsDepart: S10_COMMENTE,
    reprendreProgramme: n5 ? undefined : 'simon-10',
    indices: [
      'Change les nombres de « remplir la liste », les notes de la fonction « allumer », la musique de victoire et le son d’erreur.',
      n5 ? 'Ta liste doit contenir au moins 6 nombres entre 1 et 4, séparés par des virgules.' : 'Vérifie que chaque pause dure 1 s au plus : sinon le joueur ne sait pas quand répondre.',
    ],
  });

  // 12 · Défi : le Simon au hasard (le même pour les deux niveaux)
  L.push({
    numero: '12',
    titre: 'Défi : le Simon au hasard',
    defi: true,
    consigne:
      'Le vrai Simon invente sa séquence : au début de chaque tour, ajoute une couleur au hasard (1 à 4) à la fin de la liste, puis montre toute la liste et écoute le joueur.\nErreur : son d’erreur, la liste est vidée et on recommence. Bonus : garde le score (nombre de couleurs réussies) dans une variable.',
    listes: ['sequence'],
    variables: ['i', 'appui', 'erreur', 'score'],
    blocsAutorises: tout(PALETTE, ['hasard', 'liste_ajouter', 'liste_vider', 'operation']),
    blocsDepart: S[11],
    reprendreProgramme: n5 ? undefined : 'simon-11',
    indices: ['« Au démarrage » : vider la liste. Au début de « Répéter indéfiniment » : ajouter un nombre au hasard entre 1 et 4 à la fin de la liste.', 'Plus besoin de « etape » : on montre et on écoute toute la liste. En cas d’erreur, « vider la liste ».'],
  });

  // Ce qui ne change pas d'un niveau à l'autre : composants, scénarios, fiche, compétence.
  const SCENARIOS = {
    5: [
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
    6: [
      {
        nom: 'La séquence est montrée dans l’ordre',
        etapes: [listeOk(4), ...[1, 2, 3, 4].map((n) => ({ allumage: { liste: 'sequence', numero: n }, leds: LEDS, delai: 1.5, contexte: n === 1 ? 'au démarrage' : `après la couleur n° ${n - 1}` }))],
      },
    ],
    7: [
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
    8: [
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
    9: [
      {
        nom: 'Après deux tours réussis, le jeu montre 3 couleurs',
        etapes: [listeOk(4), jouer({ tours: 2 }), { entendre: 'D10', notes: 3, exactement: true, delai: 5, contexte: 'Après deux tours réussis', attendu: 'le jeu devrait montrer 3 couleurs (3 notes), puis attendre le joueur' }],
      },
      SCENARIO_ERREUR(2, 3),
    ],
    10: [
      {
        nom: 'Le joueur réussit toute la séquence',
        etapes: [listeOk(4), jouer({}), { entendre: 'D10', notes: 2, delai: 2.5, memeDepart: true, contexte: 'Quand le joueur a refait toute la séquence', attendu: 'le buzzer devrait jouer une musique de victoire (au moins 2 notes)' }, ...premiereCouleur(8, 'Après la victoire')],
      },
      SCENARIO_ERREUR(2, 3),
    ],
    11: [
      {
        nom: 'Le joueur réussit toute ma séquence',
        etapes: [listeOk(6), jouer({ attente: 30 }), { entendre: 'D10', notes: 2, delai: 3, memeDepart: true, contexte: 'Quand le joueur a refait toute la séquence', attendu: 'le buzzer devrait jouer ta musique de victoire (au moins 2 notes)' }, ...premiereCouleur(10, 'Après la victoire')],
      },
      SCENARIO_ERREUR(3, 4),
    ],
    12: [
      {
        nom: 'La séquence s’allonge à chaque tour',
        etapes: [jouer({ grandit: true, tours: 4 }), { liste: 'sequence', tailleMin: 5, delai: 3, contexte: 'Après 4 tours réussis', attendu: 'la liste devrait avoir une couleur de plus à chaque tour (5 couleurs au moins)' }],
      },
      {
        nom: 'Le joueur se trompe',
        etapes: [jouer({ grandit: true, tours: 3, faute: true }), sonErreur(3), { liste: 'sequence', tailleMax: 1, delai: 3, contexte: 'Après l’erreur', attendu: 'la liste devrait repartir de zéro (une seule couleur au nouveau tour)' }],
      },
    ],
  };
  const A_SAVOIR = { 5: 'fonction', 6: 'liste', 7: 'fonction', 8: 'jeu', 9: 'jeu', 10: 'son', 11: 'jeu', 12: 'jeu' };
  return L.map((e) => {
    const k = Number(e.numero);
    const x = Object.assign({ numero: e.numero, titre: e.titre }, e.defi ? { defi: true } : {}, { consigne: e.consigne, composants: TOUS, illustration: 'simon' }, e);
    x.scenarios = SCENARIOS[k];
    x.aSavoir = A_SAVOIR[k];
    x.competence = 'C9';
    if (x.reprendreProgramme === undefined) delete x.reprendreProgramme;
    if (k <= (niveau === 5 ? 11 : 9)) x.sansReprise = true;
    return x;
  });
}

// ---------- Les deux parcours ----------
const NIVEAUX = {
  4: { id: 'simon', titre: 'Simon Rétro Game · 4e', versionParcours: '2.0.0' },
  5: { id: 'simon-5e', titre: 'Simon Rétro Game · 5e', versionParcours: '1.0.0' },
};
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

function construire(niveau) {
  const exercices = [...copie(E), ...exercicesGuides(niveau)];
  exercices.forEach((e, k) => {
    e.id = 'simon-' + String(k + 1).padStart(2, '0');
    e.defi = !!e.defi;
    e.solutionReference = S[k + 1];
    if (e.blocsDepart === undefined) e.blocsDepart = null;
  });
  return {
    format: 'labo-blocs/parcours',
    version: 1,
    id: NIVEAUX[niveau].id,
    titre: NIVEAUX[niveau].titre,
    versionParcours: NIVEAUX[niveau].versionParcours,
    date: '2026-11-16',
    moteurMinimum: PA.VERSION_MOTEUR,
    carte: 'uno',
    modes: ['simulateur', 'carte'],
    boutonsVersMasse: true,
    parametres: {},
    exercices,
    fiches,
    lexique,
  };
}

// ---------- Vérifications ----------
let echecs = 0;
const vides = v1([], []);
for (const niveau of [5, 4]) {
  const paquet = construire(niveau);
  console.log(`\n${paquet.titre} (${paquet.id} ${paquet.versionParcours})`);
  const pb = PA.controler(paquet);
  if (pb.length) {
    console.log('Contrôle du parcours :', pb);
    echecs++;
  }
  const prep = PA.preparer(paquet);
  for (const e of prep.exercices) {
    const c = C.compiler(e.solutionReference, { composants: e.composants, boutonsVersMasse: true });
    const r = V.valider(e, e.solutionReference);
    const depart = V.valider(e, e.blocsDepart || vides);
    const cd = e.blocsDepart ? C.compiler(e.blocsDepart, { composants: e.composants, boutonsVersMasse: true }) : { erreurs: [] };
    const ok = c.erreurs.length === 0 && cd.erreurs.length === 0 && r.reussi && !depart.reussi && c.octets.length < 1024;
    if (!ok) echecs++;
    console.log(`${ok ? '✔' : '✖'} ${e.numero.padStart(2)} ${e.titre} — ${c.octets.length} octets${c.erreurs.length ? ' ; ' + c.erreurs.join(' ; ') : ''}${cd.erreurs.length ? ' ; départ : ' + cd.erreurs.join(' ; ') : ''}`);
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
    const dossier = path.join(R, 'parcours', paquet.id);
    fs.mkdirSync(dossier, { recursive: true });
    fs.writeFileSync(path.join(dossier, 'parcours.js'), PA.scriptParcours(paquet));
    console.log('Écrit :', path.join(dossier, 'parcours.js'));
  }
}
process.exit(echecs ? 1 : 0);
