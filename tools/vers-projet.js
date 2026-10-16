// Copie le module construit dans un projet : <projet>/site/vendor/labo-blocs/ (remplacé en entier).
// Avec --parcours <id> : écrit aussi <projet>/site/parcours/<id>.js (première installation, ou mise à jour du
// dépôt du projet ; en classe, le professeur passe par « Mettre à jour les exercices »).
//
// Usage : npm run vers-projet -- ../atelier-cereales [--parcours distributeur]
const { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { construire, lireParcours } = require('./construire-module.js');
const { scriptParcours } = require('../noyau/parcours.js');

const args = process.argv.slice(2);
const projet = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--parcours');
const iParcours = args.indexOf('--parcours');
const idParcours = iParcours >= 0 ? args[iParcours + 1] : null;
if (!projet || !existsSync(join(resolve(projet), 'site'))) {
  console.error('Usage : npm run vers-projet -- <dossier du projet> [--parcours <id>]  (le projet doit avoir un dossier site/)');
  process.exit(1);
}

const r = construire();
const cible = join(resolve(projet), 'site', 'vendor', 'labo-blocs');
rmSync(cible, { recursive: true, force: true });
mkdirSync(cible, { recursive: true });
cpSync(r.dossier, cible, { recursive: true });
console.log(`Module ${r.nom} copié dans ${cible}`);

if (idParcours) {
  const source = join(__dirname, '..', 'parcours', idParcours, 'parcours.js');
  const paquet = lireParcours(readFileSync(source, 'utf8'));
  const dossier = join(resolve(projet), 'site', 'parcours');
  mkdirSync(dossier, { recursive: true });
  writeFileSync(join(dossier, `${paquet.id}.js`), scriptParcours(paquet));
  console.log(`Parcours ${paquet.id} ${paquet.versionParcours} écrit dans ${join(dossier, paquet.id + '.js')}`);
}
