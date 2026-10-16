// Jalon 0 : l'interpréteur C de la carte doit se comporter exactement comme le simulateur de l'atelier.
// Pour chaque exercice 01 à 13B, sur la solution de référence et sur les programmes faux de l'atelier,
// on rejoue les scénarios dans le simulateur, puis les mêmes appuis dans l'interpréteur C, et on compare
// les changements des sorties (LED, servo) à la milliseconde près.
const test = require('node:test');
const assert = require('node:assert');
const { chargerExercices } = require('../essais/reference/outils.js');
const simulation = require('../essais/reference/moteur/simulation.js');
const { jouerScenario } = require('../essais/reference/moteur/validation.js');
const faux = require('../essais/reference/programmes-faux.js');
const { compiler, numeroBroche } = require('../essais/code-octet/compilateur.js');
const { executer, disponible } = require('../essais/outils/hote.js');
const sauter = disponible() ? false : 'gcc absent : interpréteur C non compilé';

const exercices = chargerExercices();

// Simulateur de l'atelier, en gardant la dernière simulation créée (heure de fin) et les entrées planifiées.
// Une entrée planifiée à l'instant même de la simulation arrive après les blocs déjà exécutés à cet instant
// (« apres ») : l'interpréteur C la rejoue dans le même ordre.
const creer = simulation.creerSimulation;
let derniere = null;
let entrees = [];
simulation.creerSimulation = (...a) => {
  derniere = creer(...a);
  entrees = [];
  const planifier = derniere.planifierEntree;
  derniere.planifierEntree = (t, broche, valeur) => {
    entrees.push({ t: Math.max(t, derniere.t), broche: numeroBroche(broche), valeur, apres: t <= derniere.t });
    planifier(t, broche, valeur);
  };
  return derniere;
};

// Garde seulement les vrais changements (le simulateur note aussi « 0 » écrit sur une sortie non déclarée, déjà à 0).
function changements(liste) {
  const etat = {};
  return liste.filter((e) => {
    const avant = etat[e.broche] || 0;
    etat[e.broche] = e.valeur;
    return e.valeur !== avant;
  });
}

function comparer(exercice, programme, scenario, nom) {
  jouerScenario(exercice, programme, scenario);
  const fin = derniere.t;
  const attendu = changements(derniere.journal.filter((e) => e.type === 'led' || e.type === 'servo'))
    .map((e) => `${e.t} ${numeroBroche(e.broche)} ${e.valeur} ${e.type}`);
  const { octets, erreurs } = compiler(programme, { composants: exercice.composants });
  assert.deepStrictEqual(erreurs, [], nom);
  const c = executer(octets, fin, entrees);
  assert.strictEqual(c.erreur, null, nom + ' : erreur de l’interpréteur');
  const obtenu = c.journal.map((e) => `${e.t} ${e.broche} ${e.valeur} ${e.type}`);
  assert.deepStrictEqual(obtenu, attendu, nom);
  return octets.length;
}

for (const ex of exercices) {
  test(`exercice ${ex.id} : solution de référence identique dans la carte et le simulateur`, { skip: sauter }, () => {
    for (const [i, s] of (ex.scenarios || []).entries()) comparer(ex, ex.solutionReference, s, `solution, scénario ${i + 1}`);
  });
  const liste = faux[ex.id] || [];
  if (liste.length) {
    test(`exercice ${ex.id} : programmes faux identiques dans la carte et le simulateur`, { skip: sauter }, () => {
      for (const f of liste) for (const [i, s] of (ex.scenarios || []).entries()) comparer(ex, f.programme, s, `${f.nom}, scénario ${i + 1}`);
    });
  }
}
