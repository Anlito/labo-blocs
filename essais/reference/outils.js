// Outils communs aux tests : chargement des exercices et petits constructeurs de programmes.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { creerCatalogue } = require('./moteur/catalogue.js');

const DOSSIER = path.join(__dirname, 'exercices');

function chargerExercices() {
  const catalogue = creerCatalogue();
  const contexte = { definirParametres: catalogue.definirParametres, definirExercice: catalogue.definirExercice };
  const fichiers = fs.readdirSync(DOSSIER).filter((f) => f.endsWith('.js'));
  // Les paramètres d'abord, comme dans index.html.
  fichiers.sort((a, b) => (a === 'parametres.js' ? -1 : b === 'parametres.js' ? 1 : a.localeCompare(b)));
  for (const f of fichiers) vm.runInNewContext(fs.readFileSync(path.join(DOSSIER, f), 'utf8'), contexte, { filename: f });
  return catalogue.exercices();
}

// Constructeurs d'instructions et d'expressions.
const led = (broche, etat) => ({ bloc: 'led_etat', broche, etat });
const att = (duree) => ({ bloc: 'attendre', duree });
const servo = (broche, angle) => ({ bloc: 'servo_angle', broche, angle });
const choix = (valeur) => ({ bloc: 'affecter', variable: 'CHOIX', valeur });
const CHOIX = { bloc: 'variable', variable: 'CHOIX' };
const egal = (a, b) => ({ bloc: 'comparaison', op: '=', a, b });
const different = (a, b) => ({ bloc: 'comparaison', op: '≠', a, b });
const bouton = (broche) => ({ bloc: 'bouton_etat', broche });
const HAUT = { bloc: 'valeur_haut_bas', valeur: 1 };
const BAS = { bloc: 'valeur_haut_bas', valeur: 0 };
const appuye = (broche) => egal(bouton(broche), HAUT);
const si = (condition, alors) => ({ bloc: 'si_alors', condition, alors });
const siSinon = (condition, alors, sinon) => ({ bloc: 'si_sinon', condition, alors, sinon });
const prog = (demarrage, boucle) => ({ demarrage: demarrage || [], boucle: boucle || [] });

// Réglages de exercices/parametres.js.
function chargerParametres() {
  let p = {};
  vm.runInNewContext(fs.readFileSync(path.join(DOSSIER, 'parametres.js'), 'utf8'), { definirParametres: (x) => (p = x) });
  return JSON.parse(JSON.stringify(p));
}

module.exports = {
  chargerExercices,
  chargerParametres,
  led,
  att,
  servo,
  choix,
  CHOIX,
  egal,
  different,
  bouton,
  HAUT,
  BAS,
  appuye,
  si,
  siSinon,
  prog,
};
