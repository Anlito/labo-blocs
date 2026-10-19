// Afficheur LED Matrix 8×16 du mBot (port 4, programme de la carte 0.3) : blocs, simulateur, mode « En direct » et
// programme de la carte. La partie mBot du .ino tourne sur l'ordinateur (tests/outils/matrice-hote.cpp, g++) : ce
// qu'elle envoie sur les fils de l'afficheur doit être ce que montre le simulateur, aux mêmes instants.
const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const K = require('../noyau/cartes.js');
const { compiler } = require('../noyau/code-octet.js');
const { creerSimulation } = require('../noyau/simulation.js');
const { versBlockly, depuisBlockly } = require('../noyau/programme.js');
const { creerDirect } = require('../noyau/direct.js');

const INO = path.join(__dirname, '..', 'cartes', 'arduino', 'labo_blocs', 'labo_blocs.ino');
const ino = fs.readFileSync(INO, 'utf8');
const enTexte = (colonnes) => colonnes.map((c) => c.toString(16).padStart(2, '0')).join(' ');
// Les 8 lignes de l'afficheur, « # » pour un point allumé (pour lire un échec).
const dessiner = (colonnes) => Array.from({ length: 8 }, (_, y) => colonnes.map((c) => ((c >> y) & 1 ? '#' : '.')).join('')).join('\n');

const PROGRAMME = {
  demarrage: [
    { bloc: 'mbot_matrice_dessin', dessin: K.DESSIN_DEPART },
    { bloc: 'attendre', duree: 1 },
    { bloc: 'mbot_matrice_nombre', valeur: 3.14 },
    { bloc: 'attendre', duree: 1 },
    { bloc: 'mbot_matrice_heure', heures: 9, minutes: 5 },
    { bloc: 'attendre', duree: 1 },
    { bloc: 'mbot_matrice_texte', texte: 'Bonjour à tous' },
  ],
  boucle: [],
};

test('blocs de l’afficheur : catégorie « Afficheur » du mBot, compilés, relus par Blockly à l’identique', () => {
  const cat = K.CATEGORIES_CARTES.find((c) => c.cle === 'mbot_afficheur');
  assert.deepEqual(cat.blocs, ['mbot_matrice_dessin', 'mbot_matrice_texte', 'mbot_matrice_nombre', 'mbot_matrice_heure']);
  assert.equal(cat.carte, 'mbot');
  assert.equal(K.PROFILS.mbot.ports.matrice, 4);
  const r = compiler(PROGRAMME);
  assert.deepEqual(r.erreurs, []);
  const relu = depuisBlockly(versBlockly(PROGRAMME));
  assert.deepEqual(compiler(relu.programme).octets, r.octets);
  // Le dessin : deux commandes de 4 valeurs (2 colonnes par valeur).
  const [a, b] = K.deroulerBlocCarte({ bloc: 'mbot_matrice_dessin', dessin: K.DESSIN_DEPART });
  assert.deepEqual([a.commande, b.commande], [10, 11]);
  assert.deepEqual(a.arguments.concat(b.arguments).flatMap((v) => [v & 255, v >> 8]), K.lireDessinMatrice(K.DESSIN_DEPART));
  // Un dessin abîmé (sauvegarde modifiée à la main) s'affiche vide.
  assert.deepEqual(K.lireDessinMatrice('zz'), new Array(16).fill(0));
});

test('nombres : 2, 1 ou 0 chiffres après la virgule selon la place ; trop grand, il défile', () => {
  const cas = { 0: '0', 314: '3.14', 1250: '12.5', 1234: '12.3', '-125': '-1.3', 123456: '1235', '-99900': '-999', 5: '0.05', '-4': '0', 2: '0.02' };
  for (const [c, attendu] of Object.entries(cas)) assert.deepEqual(K.texteNombre(Number(c)), { texte: attendu, etroit: true }, c);
  assert.deepEqual(K.texteNombre(1000000), { texte: '10000', etroit: false });
});

test('simulateur : dessin, nombre, heure, puis un texte qui entre par la droite, défile et disparaît', () => {
  const sim = creerSimulation(PROGRAMME, { carte: 'mbot' });
  sim.avancerJusqua(10);
  assert.deepEqual(K.matriceA(sim.carte, sim.t), K.lireDessinMatrice(K.DESSIN_DEPART));
  sim.avancerJusqua(1010);
  assert.equal(dessiner(K.matriceA(sim.carte, sim.t)).split('\n')[0], '.###....#..#.#..', '« 3.14 » centré (13 colonnes)');
  sim.avancerJusqua(2010);
  assert.equal(dessiner(K.matriceA(sim.carte, sim.t)).split('\n')[2], '#.#.#.##.#.#.#..', '« 09:05 », deux points à la colonne 7');
  sim.avancerJusqua(3000);
  assert.deepEqual(K.matriceA(sim.carte, 3000), new Array(16).fill(0), 'le texte part de la droite');
  assert.equal(K.matriceA(sim.carte, 3100)[15], K.POLICE_MATRICE[('B'.charCodeAt(0) - 32) * 5]);
  // « Bonjour a tous » : 14 lettres = 83 colonnes ; tout est sorti après (83 + 16) × 100 ms.
  assert.ok(K.matriceA(sim.carte, 3000 + 98 * 100).some(Boolean));
  assert.deepEqual(K.matriceA(sim.carte, 3000 + 99 * 100), new Array(16).fill(0));
  // Deux lettres tiennent : immobiles et centrées.
  const court = creerSimulation({ demarrage: [{ bloc: 'mbot_matrice_texte', texte: 'Hi' }], boucle: [] }, { carte: 'mbot' });
  court.avancerJusqua(10);
  assert.deepEqual(K.matriceA(court.carte, 10), K.matriceA(court.carte, 5000));
  assert.equal(K.matriceA(court.carte, 10)[2], 0x7f);
});

test('mêmes tables de lettres et de chiffres dans le simulateur et dans le programme de la carte', () => {
  const table = (nom) => {
    const m = new RegExp(`${nom}\\[\\d+\\] PROGMEM = \\{([^}]*)\\}`).exec(ino);
    return m[1].match(/0x[0-9a-f]{2}/gi).map((x) => parseInt(x, 16));
  };
  assert.deepEqual(table('POLICE_MATRICE'), K.POLICE_MATRICE);
  assert.deepEqual(table('CHIFFRES_MATRICE'), K.CHIFFRES_MATRICE);
});

// La partie mBot du .ino, collée dans le banc d'essai et compilée avec g++.
function banc() {
  const debut = ino.indexOf('// ---------- mBot (mCore) ----------');
  const fin = ino.indexOf('// ---------- Ce que l’interpréteur demande à la carte ----------'.replace('’', "'"));
  const source = fs.readFileSync(path.join(__dirname, 'outils', 'matrice-hote.cpp'), 'utf8').replace('/* MBOT */', ino.slice(debut, fin));
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'labo-blocs-matrice-'));
  fs.writeFileSync(path.join(dossier, 'banc.cpp'), source);
  const exe = path.join(dossier, 'banc');
  execFileSync('g++', ['-O1', '-w', '-o', exe, path.join(dossier, 'banc.cpp')], { stdio: 'pipe' });
  return (lignes) => execFileSync(exe, { input: lignes.join('\n') + '\n' }).toString().trim().split('\n');
}
let lancer = null;
try {
  lancer = banc();
} catch {
  lancer = null;
}

test('programme de la carte : ce qu’il envoie à l’afficheur est ce que montre le simulateur', { skip: !lancer && 'g++ absent' }, () => {
  // Les commandes du simulateur (avec leurs instants), rejouées dans le programme de la carte.
  const programme = {
    demarrage: PROGRAMME.demarrage.concat([
      { bloc: 'attendre', duree: 2 },
      { bloc: 'mbot_matrice_nombre', valeur: 1000000 },
      { bloc: 'attendre', duree: 3 },
      { bloc: 'mbot_matrice_dessin', dessin: '01' + '0'.repeat(28) + '80' },
      { bloc: 'attendre', duree: 1 },
      { bloc: 'mbot_matrice_nombre', valeur: -1.25 },
      { bloc: 'attendre', duree: 1 },
      { bloc: 'mbot_matrice_heure', heures: 23, minutes: 59 },
      { bloc: 'attendre', duree: 1 },
      { bloc: 'mbot_matrice_texte', texte: 'Hi' },
      { bloc: 'attendre', duree: 1 },
    ]),
    // Le même texte redonné pendant qu'il défile continue de défiler, sur la carte comme dans le simulateur.
    boucle: [{ bloc: 'mbot_matrice_texte', texte: 'Salut' }, { bloc: 'attendre', duree: 0.7 }],
  };
  const commandes = [];
  let sim = null;
  const carte = K.creerCarteSimulee('mbot', { get t() { return sim ? sim.t : 0; }, entrees: {}, capteurs: {}, ecrire() {}, son() {} });
  sim = creerSimulation(programme, { extension: (e, c, a) => (commandes.push(`X ${sim ? sim.t : 0} ${c} ${a.join(' ')}`), carte.ext(e, c, a)) });
  const lectures = [];
  const vus = [];
  for (let t = 0; t <= 22000; t += 50) {
    sim.avancerJusqua(t);
    lectures.push({ t, colonnes: K.matriceA(carte.etat, t) });
  }
  // Lignes du banc dans l'ordre du temps : commandes, puis lecture de l'afficheur à chaque instant.
  const lignes = [];
  let i = 0;
  for (const l of lectures) {
    while (i < commandes.length && Number(commandes[i].split(' ')[1]) <= l.t) lignes.push(commandes[i++]);
    lignes.push(`L ${l.t}`);
  }
  const sorties = lancer(lignes);
  assert.equal(sorties.length, lectures.length);
  lectures.forEach((l, k) => {
    const [allume, ...colonnes] = sorties[k].split(' ');
    const attendu = enTexte(l.colonnes);
    if (colonnes.join(' ') !== attendu) assert.fail(`à ${l.t} ms :\ncarte :\n${dessiner(colonnes.map((x) => parseInt(x, 16)))}\nsimulateur :\n${dessiner(l.colonnes)}`);
    if (l.colonnes.some(Boolean)) assert.equal(allume, '1', `afficheur allumé à ${l.t} ms`);
    vus.push(attendu);
  });
  assert.ok(new Set(vus).size > 50, 'le texte a défilé');
});

test('En direct : un dessin part en entier, un ordre répété ne repart pas, un texte repart quand il a fini de défiler', () => {
  const dessin = creerDirect({ demarrage: [], boucle: [{ bloc: 'mbot_matrice_dessin', dessin: K.DESSIN_DEPART }] }, { carte: 'mbot', composants: [] });
  assert.deepEqual(dessin.lectures, []);
  assert.deepEqual(dessin.avancer(0), ['X 1 10 0 0 17958 16448', 'X 1 11 16448 9798 0 0']);
  assert.deepEqual(dessin.avancer(1000), [], 'boucle sans attente : le même dessin ne repart pas');
  const prog = { demarrage: [], boucle: [{ bloc: 'mbot_matrice_texte', texte: 'Salut' }, { bloc: 'attendre', duree: 0.5 }] };
  const d = creerDirect(prog, { carte: 'mbot', composants: [] });
  assert.deepEqual(d.avancer(0), ['X 1 14 83 97 108 117', 'X 1 15 116']);
  // « Salut » : 29 colonnes, (29 + 16) × 100 = 4,5 s de défilement ; le simulateur le laisse défiler lui aussi.
  assert.deepEqual(d.avancer(4000), []);
  assert.ok(K.matriceA(d.sim.carte, 4000).some(Boolean));
  assert.deepEqual(d.avancer(4500), ['X 1 14 83 97 108 117', 'X 1 15 116']);
  // Nombre : en centièmes (le mode direct n'envoie que des entiers) ; l'heure.
  const n = creerDirect({ demarrage: [{ bloc: 'mbot_matrice_nombre', valeur: 2.5 }, { bloc: 'mbot_matrice_heure', heures: 8, minutes: 15 }], boucle: [] }, { carte: 'mbot', composants: [] });
  assert.deepEqual(n.avancer(0), ['X 1 12 250', 'X 1 13 8 15']);
});

test('micro:bit en direct : un texte répété ne laisse plus de lettres en trop sur la carte', () => {
  const prog = { demarrage: [], boucle: [{ bloc: 'mb_texte', texte: 'Salut' }, { bloc: 'attendre', duree: 0.1 }] };
  const d = creerDirect(prog, { carte: 'microbit', composants: [] });
  assert.deepEqual(d.avancer(0), ['X 2 14 83 97 108 117', 'X 2 11 116']);
  // Les lettres (14) attendent avec le reste du texte : rien ne part tant que le texte défile encore.
  assert.deepEqual(d.avancer(1000), []);
});
