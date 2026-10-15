// Convertit les exercices de l'atelier du distributeur en paquet de parcours Labo Blocs (à lancer une fois) :
//   node tools/convertir-distributeur.js ../atelier-cereales   → parcours/distributeur/parcours.js
// Les identifiants d'exercice sont fixés ici, une fois pour toutes (« dist-01 » … « dist-13b ») : ils ne
// dépendent pas de la place de l'exercice dans le parcours et ne seront jamais réutilisés.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const atelier = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'atelier-cereales'));
const SITE = path.join(atelier, 'site');
const ORDRE = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13A', '13B'];
const ID = (n) => 'dist-' + (n.length === 1 ? '0' + n : n).toLowerCase();

const lu = {};
const contexte = {
  definirExercice: (e) => (lu[e.id] = e),
  definirParametres: (p) => (lu.parametres = p),
  definirFiches: (f) => (lu.fiches = f),
  definirLexique: (l) => (lu.lexique = l),
};
for (const f of fs.readdirSync(path.join(SITE, 'exercices'))) vm.runInNewContext(fs.readFileSync(path.join(SITE, 'exercices', f), 'utf8'), contexte);
vm.runInNewContext(fs.readFileSync(path.join(SITE, 'donnees', 'fiches.js'), 'utf8'), contexte);
vm.runInNewContext(fs.readFileSync(path.join(SITE, 'donnees', 'lexique.js'), 'utf8'), contexte);

const { aideLedJusquAExercice, boutonsVersMasse, ...parametres } = lu.parametres;
const exercices = ORDRE.map((n, rang) => {
  const e = lu[n];
  const x = {
    id: ID(n),
    numero: n,
    titre: e.titre,
    defi: e.version === 'défi',
    consigne: e.consigne,
    composants: e.composants,
    blocsAutorises: e.blocsAutorises,
    blocsDepart: e.blocsDepart || null,
    scenarios: e.scenarios,
    indices: e.indices,
    aSavoir: e.aSavoir,
    solutionReference: e.solutionReference,
  };
  if (rang < aideLedJusquAExercice) x.aideLed = true; // menu de la LED : « HAUT (1) : allumée »
  if (e.distributeur) x.illustration = 'distributeur';
  if (e.silhouette) x.silhouette = e.silhouette;
  return x;
});

const paquet = {
  format: 'labo-blocs/parcours',
  version: 1,
  id: 'distributeur',
  titre: 'Distributeur de céréales',
  versionParcours: '1.0.0',
  date: '2026-10-15',
  moteurMinimum: '0.1.0',
  carte: 'uno',
  modes: ['simulateur'],
  boutonsVersMasse,
  parametres,
  exercices,
  fiches: lu.fiches,
  lexique: lu.lexique,
};
const sortie = path.join(__dirname, '..', 'parcours', 'distributeur', 'parcours.js');
fs.writeFileSync(
  sortie,
  '// Parcours de programmation du distributeur de céréales (5e) : paquet de parcours Labo Blocs.\n' +
    '// Converti depuis l\'atelier du distributeur par tools/convertir-distributeur.js, puis modifiable à la main.\n' +
    '// Garder les « id » des exercices : ils relient le travail des élèves à l\'exercice.\n' +
    'definirParcours(' + JSON.stringify(paquet, null, 1) + ');\n',
);
console.log(`${exercices.length} exercices → ${path.relative(process.cwd(), sortie)}`);
