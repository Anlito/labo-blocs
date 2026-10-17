// Convertit le modèle MobileNet (model.json + fichiers .bin de TensorFlow.js) en un script classique
// site/vendor/vision/modele-mobilenet.js : definirModeleVision({ id, topologie, poids, donnees (base64) }).
// Ainsi l'IA se charge aussi quand le site est ouvert depuis un dossier (file://), où le navigateur refuse de lire
// les fichiers .json et .bin à côté de la page.
//   node tools/vision-modele.js <dossier du modèle> (ex. ../theatre-ombre/site/vendor/mobilenet_v2_050)
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const source = process.argv[2];
if (!source) {
  console.error('Indiquer le dossier du modèle (model.json et ses fichiers .bin).');
  process.exit(1);
}
const modele = JSON.parse(fs.readFileSync(path.join(source, 'model.json'), 'utf8'));
const poids = [];
const morceaux = [];
for (const groupe of modele.weightsManifest) {
  poids.push(...groupe.weights);
  for (const p of groupe.paths) morceaux.push(fs.readFileSync(path.join(source, p)));
}
const donnees = Buffer.concat(morceaux);
const sortie = path.join(__dirname, '..', 'site', 'vendor', 'vision', 'modele-mobilenet.js');
const entete =
  '// MobileNet v2 (alpha 0.5, 224) — Google, TensorFlow Hub, licence Apache 2.0 (voir LICENCES.txt).\n' +
  '// Fichier produit par tools/vision-modele.js : ne pas modifier à la main.\n';
const contenu = {
  id: 'mobilenet_v2_050_224',
  format: modele.format,
  topologie: modele.modelTopology,
  poids,
  donnees: donnees.toString('base64'),
};
fs.writeFileSync(sortie, entete + 'definirModeleVision(' + JSON.stringify(contenu) + ');\n');
console.log(`${path.relative(process.cwd(), sortie)} : ${(fs.statSync(sortie).size / 1e6).toFixed(1)} Mo`);
