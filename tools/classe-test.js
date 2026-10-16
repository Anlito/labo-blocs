// Classe test de 8 équipes (données fictives) pour la recette du jalon 5 : un dossier par équipe, comme au collège.
//   node tools/classe-test.js [dossier]   (par défaut : dist/classe-test/5A)
// Les dates sont calculées à partir de maintenant : bloquées, au travail, absentes… sont réalistes à l'ouverture.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const S = require('../noyau/sauvegarde.js');
const { preparer } = require('../noyau/parcours.js');
const { versBlockly } = require('../noyau/programme.js');

function lireParcours(id) {
  let p = null;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'parcours', id, 'parcours.js'), 'utf8'), { definirParcours: (x) => (p = JSON.parse(JSON.stringify(x))) });
  return preparer(p);
}

const deux = (n) => String(n).padStart(2, '0');
const local = (d) => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}T${deux(d.getHours())}:${deux(d.getMinutes())}:${deux(d.getSeconds())}`;

// Une équipe : prénoms, exercices réussis, et ce qui se passe sur l'exercice en cours.
//   { eleves, reussis (nombre d'exercices obligatoires), indices: { numero: n }, echecs: { numero: n },
//     enCours: { echecs, depuis (min) }, derniere (min), envoi (min, exercice), defi }
const EQUIPES = [
  { eleves: ['Léa', 'Hugo'], reussis: 3, indices: { 2: 1 }, enCours: { echecs: 1, depuis: 4 }, derniere: 2 },
  { eleves: ['Inès', 'Noah'], reussis: 7, echecs: { 5: 2 }, enCours: { echecs: 0, depuis: 2 }, derniere: 1 },
  { eleves: ['Sacha', 'Maël'], reussis: 4, indices: { 3: 2, 4: 3 }, enCours: { echecs: 5, depuis: 18 }, derniere: 3 },
  { eleves: ['Camille', 'Jade'], reussis: 13, defi: true, envoi: { min: 8, numero: '13A' }, derniere: 4 },
  { eleves: ['Lucas', 'Ethan'], reussis: 2, indices: { 1: 3, 2: 3 }, echecs: { 1: 4, 2: 6 }, enCours: { echecs: 4, depuis: 14 }, derniere: 5 },
  { eleves: ['Manon', 'Zoé'], reussis: 6, indices: { 6: 1 }, enCours: { echecs: 1, depuis: 3 }, derniere: 3 },
  { eleves: ['Théo', 'Rayan'], reussis: 5, enCours: { echecs: 2, depuis: 60 * 26 }, derniere: 60 * 26 },
  { eleves: ['Emma', 'Lina', 'Léa'], reussis: 9, echecs: { 8: 3 }, envoi: { min: 20, numero: '9' }, enCours: { echecs: 0, depuis: 5 }, derniere: 5 },
];

function creerClasse(dossier, options) {
  const o = options || {};
  const paquet = lireParcours(o.parcours || 'distributeur');
  const maintenant = o.maintenant || new Date();
  const avant = (min) => local(new Date(maintenant - min * 60000));
  fs.rmSync(dossier, { recursive: true, force: true });
  const fichiers = [];
  for (const eq of EQUIPES) {
    const d = S.creerSauvegarde({ eleves: eq.eleves, classe: o.classe || '5A' }, { parcours: paquet, projet: paquet.id });
    S.relierParcours(d, paquet);
    const obligatoires = paquet.exercices.filter((e) => !e.defi);
    let t = 120 + (eq.derniere || 0); // les réussites s'étalent sur les 2 heures précédentes
    const pas = (n) => (t -= n);
    for (const e of obligatoires.slice(0, eq.reussis)) {
      const ex = S.progressionExercice(d, e.id);
      ex.statut = 'en_cours';
      for (let i = 1; i <= ((eq.indices || {})[e.numero] || 0); i++) ex.historique.push({ date: avant(pas(1)), type: 'indice', niveau: i }), (ex.indicesOuverts = i);
      for (let i = 0; i < ((eq.echecs || {})[e.numero] || 0); i++) ex.historique.push({ date: avant(pas(1)), type: 'verification', reussi: false, message: 'Écart (classe test).' }), ex.tentatives++;
      ex.historique.push({ date: avant(pas(2)), type: 'verification', reussi: true });
      ex.tentatives++;
      ex.statut = 'reussi';
      ex.programme = versBlockly(e.solutionReference); // le programme de l'équipe (ici : la solution)
      ex.premiereReussite = avant(t);
      ex.empreinte = e.empreinte;
    }
    if (eq.defi) {
      const e = paquet.exercices.find((x) => x.defi);
      const ex = S.progressionExercice(d, e.id);
      Object.assign(ex, { statut: 'reussi', tentatives: 1, premiereReussite: avant(10), empreinte: e.empreinte });
      ex.historique.push({ date: avant(10), type: 'verification', reussi: true });
    }
    const suivant = obligatoires[eq.reussis];
    if (suivant && eq.enCours) {
      const ex = S.progressionExercice(d, suivant.id);
      ex.statut = 'en_cours';
      for (let i = 0; i < eq.enCours.echecs; i++) {
        const min = eq.enCours.depuis - i; // une vérification par minute, la première il y a « depuis » min
        ex.historique.push({ date: avant(min), type: 'verification', reussi: false, message: 'Écart (classe test).' });
        ex.tentatives++;
      }
      d.programmation.exerciceCourant = suivant.id;
    }
    if (eq.envoi) {
      const e = paquet.exercices.find((x) => x.numero === eq.envoi.numero);
      S.progressionExercice(d, e.id).historique.push({ date: avant(eq.envoi.min), type: 'envoi', carte: 'uno', reussi: true, octets: 118 });
    }
    d.modifieLe = avant(eq.derniere || 0);
    const nom = S.nomEquipe(eq.eleves);
    fs.mkdirSync(path.join(dossier, nom), { recursive: true });
    const f = path.join(dossier, nom, nom + '.json');
    fs.writeFileSync(f, JSON.stringify(d, null, 2));
    fichiers.push(f);
  }
  return fichiers;
}

if (require.main === module) {
  const dossier = process.argv[2] || path.join(__dirname, '..', 'dist', 'classe-test', '5A');
  const f = creerClasse(dossier);
  console.log(`${f.length} équipes fictives écrites dans ${dossier}`);
}

module.exports = { creerClasse, EQUIPES };
