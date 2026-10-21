// Listes et fonctions (jalon Simon) : blocs ⇄ programme v1, compilation, simulateur, contrôles.
// Aucun nouvel ordre pour les cartes : le code octet est celui que la Uno exécute déjà (vm.c, tests/vm.test.js).
const test = require('node:test');
const assert = require('node:assert');
const { depuisBlockly, versBlockly, typesDeBlocs, nomsDeSauvegarde, lireNombres, composantsDuProgramme } = require('../noyau/programme.js');
const { compiler } = require('../noyau/code-octet.js');
const { creerSimulation } = require('../noyau/simulation.js');
const { solutionDepuisProgramme } = require('../noyau/edition.js');

const n = (valeur) => ({ bloc: 'nombre', valeur });
const v = (variable) => ({ bloc: 'variable', variable });
const aff = (variable, valeur) => ({ bloc: 'affecter', variable, valeur });
const att = (s) => ({ bloc: 'attendre', duree: s });
const cmp = (op, a, b) => ({ bloc: 'comparaison', op, a, b });
const si = (condition, alors, sinon) => (sinon ? { bloc: 'si_sinon', condition, alors, sinon } : { bloc: 'si_alors', condition, alors });
const bouton = (broche) => ({ bloc: 'bouton_etat', broche });
const elt = (liste, position) => ({ bloc: 'liste_element', liste, position });
const appeler = (fonction, ...args) => ({ bloc: 'appeler', fonction, arguments: args });

// Le Simon du parcours : séquence écrite par l'élève, couleurs 1 à 4 (bleu, vert, jaune, rouge).
const LED = ['D3', 'D5', 'D7', 'D9'];
const BOUTONS = ['D2', 'D4', 'D6', 'D8'];
const NOTES = [262, 330, 392, 523];
const SIMON = {
  format: 'labo-blocs/programme',
  version: 1,
  fils: [
    { quand: 'demarrage', corps: [{ bloc: 'liste_remplir', liste: 'sequence', valeurs: [1, 3, 2, 4] }, aff('etape', 1)] },
    {
      quand: 'boucle',
      corps: [
        aff('i', 1),
        { bloc: 'repeter_n', fois: v('etape'), corps: [appeler('allumer', elt('sequence', v('i'))), { bloc: 'ajouter_a', variable: 'i', valeur: 1 }] },
        aff('i', 1),
        aff('erreur', 0),
        {
          bloc: 'repeter_jusqua',
          condition: { bloc: 'logique', op: 'ou', a: cmp('>', v('i'), v('etape')), b: cmp('=', v('erreur'), 1) },
          corps: [
            appeler('lire_bouton'),
            si(cmp('≠', v('appui'), elt('sequence', v('i'))), [aff('erreur', 1)], [{ bloc: 'ajouter_a', variable: 'i', valeur: 1 }]),
          ],
        },
        si(
          cmp('=', v('erreur'), 1),
          [{ bloc: 'son', broche: 'D10', frequence: 110, duree: 1 }, att(1.5), aff('etape', 1)],
          [
            si(
              cmp('=', v('etape'), { bloc: 'liste_taille', liste: 'sequence' }),
              [{ bloc: 'son', broche: 'D10', frequence: 1047, duree: 1 }, att(1.5), aff('etape', 1)],
              [{ bloc: 'ajouter_a', variable: 'etape', valeur: 1 }, att(0.5)],
            ),
          ],
        ),
      ],
    },
  ],
  fonctions: [
    {
      nom: 'allumer',
      parametres: ['couleur'],
      corps: [
        ...LED.map((l, k) =>
          si(cmp('=', { bloc: 'parametre', parametre: 'couleur' }, k + 1), [{ bloc: 'led_etat', broche: l, etat: 1 }, { bloc: 'son', broche: 'D10', frequence: NOTES[k], duree: 0.3 }]),
        ),
        att(0.3),
        ...LED.map((l) => ({ bloc: 'led_etat', broche: l, etat: 0 })),
        att(0.2),
      ],
    },
    {
      nom: 'lire_bouton',
      parametres: [],
      corps: [
        aff('appui', 0),
        {
          bloc: 'repeter_jusqua',
          condition: cmp('≠', v('appui'), 0),
          corps: [...BOUTONS.map((b, k) => si(bouton(b), [aff('appui', k + 1)])), att(0.01)],
        },
        appeler('allumer', v('appui')),
      ],
    },
  ],
};
const COMPOSANTS = [...LED.map((broche) => ({ type: 'led', broche })), ...BOUTONS.map((broche) => ({ type: 'bouton', broche })), { type: 'buzzer', broche: 'D10' }];

// Joue au Simon comme un élève : attend que le programme écoute (aucune LED depuis 0,7 s), appuie, recommence.
function jouer(sim, touches) {
  for (const k of touches) {
    let calme = 0;
    while (calme < 700 && sim.t < 60000) {
      const avant = sim.journal.length;
      sim.avancer(50);
      const bouge = sim.journal.slice(avant).some((e) => e.type === 'led' || e.type === 'son');
      calme = bouge ? 0 : calme + 50;
    }
    sim.planifierEntree(sim.t, BOUTONS[k - 1], 1);
    sim.planifierEntree(sim.t + 150, BOUTONS[k - 1], 0);
  }
  sim.avancer(3000);
}
const sons = (sim) => sim.journal.filter((e) => e.type === 'son' && e.valeur).map((e) => e.valeur);

test('blocs liste et fonction : sauvegarde Blockly → programme v1 → sauvegarde Blockly, sans perte', () => {
  const blockly = versBlockly(SIMON);
  const types = blockly.blocks.blocks.map((b) => b.type);
  assert.deepStrictEqual(types, ['demarrage', 'boucle', 'fonction_definir_param', 'fonction_definir']);
  const relu = depuisBlockly(blockly);
  assert.deepStrictEqual(relu.incomplets, []);
  assert.deepStrictEqual(relu.horsProgramme, []);
  const sansIds = (p) => JSON.parse(JSON.stringify(p, (k, x) => (k === 'id' ? undefined : x)));
  // Les nombres posés dans les entrées reviennent en blocs « nombre » : on compare après une seconde lecture.
  const deuxFois = depuisBlockly(versBlockly(relu.programme)).programme;
  assert.deepStrictEqual(sansIds(deuxFois), sansIds(relu.programme));
  assert.deepStrictEqual(relu.programme.fonctions.map((f) => [f.nom, f.parametres]), [['allumer', ['couleur']], ['lire_bouton', []]]);
  assert.deepStrictEqual(relu.programme.fils[0].corps[0], { bloc: 'liste_remplir', id: relu.programme.fils[0].corps[0].id, liste: 'sequence', valeurs: [1, 3, 2, 4] });
  for (const t of ['liste_remplir', 'liste_element', 'liste_taille', 'fonction_definir', 'fonction_definir_param', 'fonction_appeler', 'fonction_appeler_param', 'parametre']) {
    assert.ok(typesDeBlocs(SIMON).includes(t), t);
  }
  const noms = nomsDeSauvegarde(blockly);
  assert.deepStrictEqual(noms.listes, ['sequence']);
  assert.deepStrictEqual(noms.fonctions.sort(), ['allumer', 'lire_bouton']);
  assert.deepStrictEqual(noms.parametres, ['couleur']);
});

test('« remplir la liste » : virgules, espaces, points-virgules ; nombres à virgule avec un point', () => {
  assert.deepStrictEqual(lireNombres('1, 3,2 ;4  0.5'), [1, 3, 2, 4, 0.5]);
  assert.deepStrictEqual(lireNombres(' , abc, 7'), [7]);
});

test('les composants d’un exercice libre se trouvent aussi dans les fonctions', () => {
  const { composants } = composantsDuProgramme(SIMON);
  for (const b of [...LED, ...BOUTONS, 'D10']) assert.ok(composants.some((c) => c.broche === b), b);
});

test('une solution avec des fonctions reste au format v1 (le format simplifié les perdrait)', () => {
  assert.ok(Array.isArray(solutionDepuisProgramme(SIMON).fonctions));
  assert.ok(Array.isArray(solutionDepuisProgramme(SIMON).fils));
});

test('Simon complet : il tient dans la carte, montre la séquence, félicite ou signale l’erreur', () => {
  const c = compiler(SIMON, { composants: COMPOSANTS, boutonsVersMasse: true });
  assert.deepStrictEqual(c.erreurs, []);
  assert.ok(c.octets.length < 1024, `${c.octets.length} octets`);

  // La bonne séquence, tour par tour : 1 · 1 3 · 1 3 2 · 1 3 2 4, puis la fanfare (1047 Hz).
  let sim = creerSimulation(SIMON, { composants: COMPOSANTS, boutonsVersMasse: true });
  sim.avancer(10);
  assert.deepStrictEqual(sim.listes.sequence, [1, 3, 2, 4]);
  jouer(sim, [1, 1, 3, 1, 3, 2, 1, 3, 2, 4]);
  assert.ok(sons(sim).includes(1047), 'fanfare de victoire');
  assert.ok(!sons(sim).includes(110), 'pas de son d’erreur');
  assert.deepStrictEqual(sim.erreurs, []);

  // Une erreur au deuxième tour : son d'erreur, puis on recommence au premier tour.
  sim = creerSimulation(SIMON, { composants: COMPOSANTS, boutonsVersMasse: true });
  jouer(sim, [1, 1, 4]);
  assert.ok(sons(sim).includes(110), 'son d’erreur');
  assert.ok(!sons(sim).includes(1047));
  // La liste est dans le journal (la vérification d'un Simon personnalisé la relit).
  const notee = sim.journal.filter((e) => e.type === 'liste' && e.broche === 'sequence').pop();
  assert.deepStrictEqual(notee.valeur, [1, 3, 2, 4]);
});

test('listes : n° 1 = premier élément, hors de la liste = 0, la liste pleine ne grossit plus', () => {
  const p = {
    fils: [
      {
        quand: 'demarrage',
        corps: [
          { bloc: 'liste_remplir', liste: 'a', valeurs: [5, 6] },
          { bloc: 'liste_ajouter', liste: 'a', valeur: n(7) },
          { bloc: 'liste_remplacer', liste: 'a', position: n(1), valeur: n(9) },
          aff('premier', elt('a', n(1))),
          aff('hors', elt('a', n(4))),
          aff('taille', { bloc: 'liste_taille', liste: 'a' }),
          { bloc: 'repeter_n', fois: 60, corps: [{ bloc: 'liste_ajouter', liste: 'b', valeur: n(1) }] },
          aff('tailleB', { bloc: 'liste_taille', liste: 'b' }),
          { bloc: 'liste_vider', liste: 'a' },
          aff('vide', { bloc: 'liste_taille', liste: 'a' }),
        ],
      },
    ],
  };
  const sim = creerSimulation(p);
  sim.avancer(10);
  assert.deepStrictEqual(sim.erreurs, []);
  // Deux listes : 24 places chacune.
  assert.deepStrictEqual({ ...sim.variables }, { premier: 9, hors: 0, taille: 3, tailleB: 24, vide: 0 });
});

test('contrôles : des phrases qui disent quoi faire', () => {
  const erreurs = (p) => compiler(p).erreurs;
  const fil = (corps) => [{ quand: 'demarrage', corps }];
  assert.match(erreurs({ fils: fil([appeler('saluer')]) })[0], /La fonction « saluer » n’existe pas/);
  assert.match(
    erreurs({ fils: fil([appeler('f')]), fonctions: [{ nom: 'f', parametres: ['x'], corps: [] }] })[0],
    /attend une valeur : utilise le bloc « appeler … avec … »/,
  );
  assert.match(
    erreurs({ fils: fil([]), fonctions: [{ nom: 'f', parametres: [], corps: [] }, { nom: 'f', parametres: [], corps: [] }] })[0],
    /Deux fonctions s’appellent « f »/,
  );
  assert.match(
    erreurs({ fils: fil([]), fonctions: [{ nom: 'a', parametres: [], corps: [appeler('b')] }, { nom: 'b', parametres: [], corps: [appeler('a')] }] })[0],
    /s’appelle elle-même/,
  );
  assert.match(erreurs({ fils: fil([aff('x', { bloc: 'parametre', parametre: 'couleur' })]) })[0], /se place seulement dans la fonction/);
  assert.match(erreurs({ fils: fil([{ bloc: 'liste_remplir', liste: 's', valeurs: new Array(49).fill(1) }]) })[0], /garde 48 nombres au plus/);
  assert.match(erreurs({ fils: fil(['a', 'b', 'c', 'd', 'e'].map((l) => ({ bloc: 'liste_vider', liste: l }))) })[0], /Trop de listes : 4 au plus/);
});

test('une ancienne sauvegarde (sans liste ni fonction) se relit à l’identique', () => {
  const ancien = { demarrage: [{ bloc: 'led_etat', broche: 'D3', etat: 1 }], boucle: [] };
  const relu = depuisBlockly(versBlockly(ancien)).programme;
  assert.strictEqual(relu.fonctions, undefined);
  assert.strictEqual(relu.fils[0].corps[0].bloc, 'led_etat');
});

test('panneau C++ : la liste, ses « - 1 », les fonctions annoncées puis écrites, chaque bloc à sa ligne', () => {
  const { versArduino } = require('../noyau/arduino.js');
  const p = depuisBlockly(versBlockly(SIMON)).programme;
  const { code, lignes } = versArduino(p, { composants: COMPOSANTS });
  for (const attendu of ['struct Liste {', 'float elements[48];', 'Liste sequence = { {}, 0 };', 'return l.elements[i - 1];', 'void allumer(float couleur);', 'void lire_bouton();', 'vider(sequence);', 'ajouter(sequence, 4);', 'allumer(element(sequence, i));', 'if ((couleur == 1)) {', 'void allumer(float couleur) {', '  lire_bouton();', 'if ((etape == sequence.taille)) {', 'for (int j = 0; j < etape; j++) {']) {
    assert.ok(code.includes(attendu), attendu);
  }
  const allumer = p.fonctions[0];
  const [debut, fin] = lignes[allumer.id];
  const texte = code.split('\n').slice(debut - 1, fin).join('\n');
  assert.match(texte, /^void allumer\(float couleur\) \{/);
  assert.match(texte, /\}$/);
});

test('vérification d’un Simon : on lit la séquence de l’élève, on la joue, on écoute, on regarde le retour au début', () => {
  const { valider } = require('../noyau/validation.js');
  const exercice = {
    composants: COMPOSANTS,
    scenarios: [
      {
        nom: 'toute la séquence',
        etapes: [
          { liste: 'sequence', tailleMin: 4, entre: [1, 4] },
          { jouerListe: 'sequence', boutons: BOUTONS },
          { entendre: 'D10', delai: 1, frequence: 1047, contexte: 'Quand le joueur a refait toute la séquence' },
        ],
      },
      {
        nom: 'une erreur',
        etapes: [
          { jouerListe: 'sequence', boutons: BOUTONS, tours: 2, faute: true },
          { entendre: 'D10', delai: 1, frequence: 110, contexte: 'Quand le joueur se trompe' },
          { allumage: { liste: 'sequence', numero: 1 }, leds: LED, delai: 4, contexte: 'Après l’erreur' },
        ],
      },
    ],
  };
  assert.deepStrictEqual(valider(exercice, SIMON), { reussi: true });

  // Une séquence trop courte : on le dit, avec ce que contient la liste.
  const court = JSON.parse(JSON.stringify(SIMON));
  court.fils[0].corps[0].valeurs = [2, 3];
  const r1 = valider(exercice, court);
  assert.strictEqual(r1.reussi, false);
  assert.match(r1.message, /la liste « sequence » devrait contenir au moins 4 nombres \(des nombres de 1 à 4\)\. Dans ton programme, elle en contient 2 : 2, 3\./);

  // Pas de son d'erreur : le programme recommence en silence.
  const muet = JSON.parse(JSON.stringify(SIMON));
  muet.fils[1].corps[5].alors[0].frequence = 0;
  const r2 = valider(exercice, muet);
  assert.strictEqual(r2.reussi, false);
  assert.strictEqual(r2.nomScenario, 'une erreur');
  assert.match(r2.message, /^Quand le joueur se trompe, le buzzer D10 devrait jouer la note 110 Hz dans les 1 s\. Dans ton programme, il reste silencieux\./);

  // Un programme qui ne s'arrête jamais de clignoter : le joueur ne peut pas répondre.
  const bavard = { fils: [{ quand: 'boucle', corps: [{ bloc: 'liste_remplir', liste: 'sequence', valeurs: [1] }, { bloc: 'led_etat', broche: 'D3', etat: 1 }, att(0.2), { bloc: 'led_etat', broche: 'D3', etat: 0 }, att(0.2)] }] };
  const r3 = valider({ composants: COMPOSANTS, scenarios: [{ etapes: [{ jouerListe: 'sequence', boutons: BOUTONS, attente: 3 }] }] }, bavard);
  assert.match(r3.message, /au début du jeu, les LED ou le buzzer changent encore au bout de 3 s/);
});
