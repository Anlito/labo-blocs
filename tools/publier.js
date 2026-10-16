// Prépare le dossier publié sur GitHub Pages (_site/) : l'application (site/ et les modules qu'elle charge par ../)
// et les parcours, que les projets récupèrent avec « Mettre à jour les exercices » (« Chercher en ligne ») :
//   https://anlito.github.io/labo-blocs/parcours/<id>.labo-parcours.json      (dernière version)
//   https://anlito.github.io/labo-blocs/parcours/<id>-<version>.labo-parcours.json
// Un parcours déposé dans parcours/ (fichier .labo-parcours.json publié par l'éditeur) devient un parcours du site :
// parcours/<id>/parcours.js et parcours/index.js sont écrits dans _site/.
// Usage : npm run publier (le workflow .github/workflows/pages.yml le lance à chaque envoi sur main).
const { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const { construire } = require('./construire-module.js');
const { lireTousLesParcours, scriptIndex } = require('./parcours-depot.js');
const { scriptParcours } = require('../noyau/parcours.js');

const RACINE = join(__dirname, '..');

// src="../interface/app.js" → src="../interface/app.js?v=numero" (fichiers du site seulement, pas les adresses en ligne).
const versionner = (html, numero) => html.replace(/\b(src|href)="(?![a-z]+:|#|\/\/)([^"?#]+\.(?:js|css))"/g, (m, att, url) => `${att}="${url}?v=${numero}"`);

function publier(out) {
  const OUT = out || join(RACINE, '_site');
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  for (const d of ['site', 'noyau', 'interface', 'parcours']) cpSync(join(RACINE, d), join(OUT, d), { recursive: true });
  // Programmes des cartes (chargés par interface/carte.js pour les installer) : seulement le fichier construit.
  mkdirSync(join(OUT, 'cartes'), { recursive: true });
  cpSync(join(RACINE, 'cartes', 'firmwares.js'), join(OUT, 'cartes', 'firmwares.js'));

  // Parcours du site : la dernière version de chacun, et la liste complète.
  const { parcours, refuses } = lireTousLesParcours(RACINE);
  for (const p of parcours) {
    mkdirSync(join(OUT, 'parcours', p.id), { recursive: true });
    writeFileSync(join(OUT, 'parcours', p.id, 'parcours.js'), scriptParcours(p));
  }
  writeFileSync(join(OUT, 'parcours', 'index.js'), scriptIndex(parcours.map((p) => p.id)));

  const r = construire();
  for (const f of r.exportes) {
    const texte = readFileSync(join(RACINE, 'dist', 'parcours', f));
    writeFileSync(join(OUT, 'parcours', f), texte);
    writeFileSync(join(OUT, 'parcours', f.replace(/-[\d.]+\.labo-parcours\.json$/, '.labo-parcours.json')), texte);
  }
  // Chaque publication a son numéro : les pages demandent les scripts et les styles avec « ?v=<numéro> », le
  // navigateur ne garde donc pas l'ancienne version après une mise à jour.
  const numero = (process.env.GITHUB_SHA || '').slice(0, 8) || new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  for (const nom of readdirSync(join(OUT, 'site')).filter((n) => n.endsWith('.html'))) {
    const f = join(OUT, 'site', nom);
    writeFileSync(f, versionner(readFileSync(f, 'utf8'), numero));
  }
  writeFileSync(
    join(OUT, 'index.html'),
    '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=site/accueil.html"><title>Labo Blocs</title></head>' +
      '<body><a href="site/accueil.html">Labo Blocs</a></body></html>\n',
  );
  return { dossier: OUT, parcours: parcours.map((p) => `${p.id} ${p.versionParcours}`), refuses, exportes: r.exportes };
}

if (require.main === module) {
  const r = publier();
  console.log(`Prêt à publier : _site/ (parcours : ${r.parcours.join(', ')})`);
  for (const x of r.refuses) console.warn(`Parcours refusé : ${x.fichier} — ${x.raison}`);
}

module.exports = { publier, versionner };
