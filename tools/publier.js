// Prépare le dossier publié sur GitHub Pages (_site/) : l'application (site/ et les modules qu'elle charge par ../)
// et les parcours exportés, que les projets récupèrent avec « Mettre à jour les exercices » (« Chercher en ligne ») :
//   https://anlito.github.io/labo-blocs/parcours/<id>.labo-parcours.json      (dernière version)
//   https://anlito.github.io/labo-blocs/parcours/<id>-<version>.labo-parcours.json
// Usage : npm run publier (le workflow .github/workflows/pages.yml le lance à chaque envoi sur main).
const { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { construire } = require('./construire-module.js');

const RACINE = join(__dirname, '..');
const OUT = join(RACINE, '_site');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const d of ['site', 'noyau', 'interface', 'parcours']) cpSync(join(RACINE, d), join(OUT, d), { recursive: true });

const r = construire();
for (const f of r.exportes) {
  const texte = readFileSync(join(RACINE, 'dist', 'parcours', f));
  writeFileSync(join(OUT, 'parcours', f), texte);
  writeFileSync(join(OUT, 'parcours', f.replace(/-[\d.]+\.labo-parcours\.json$/, '.labo-parcours.json')), texte);
}
writeFileSync(
  join(OUT, 'index.html'),
  '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=site/index.html"><title>Labo Blocs</title></head>' +
    '<body><a href="site/index.html">Labo Blocs</a></body></html>\n',
);
console.log(`Prêt à publier : _site/ (parcours : ${r.exportes.join(', ')})`);
