// Copie Blockly et les polices dans site/vendor/ : le site n'utilise AUCUNE ressource en ligne.
// À lancer après « npm install » (ou une mise à jour) : npm run vendor
const { cpSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { join, dirname } = require('node:path');

const RACINE = join(__dirname, '..');
const NM = join(RACINE, 'node_modules');
const OUT = join(RACINE, 'site', 'vendor');

const copies = [
  ['blockly/blockly_compressed.js', 'blockly/blockly_compressed.js'],
  ['blockly/msg/fr.js', 'blockly/fr.js'],
  ['blockly/media', 'blockly/media'],
  ['blockly/LICENSE', 'LICENCES/blockly.txt'],
  ['@fontsource/lexend/files/lexend-latin-500-normal.woff2', 'polices/lexend-500.woff2'],
  ['@fontsource/lexend/files/lexend-latin-700-normal.woff2', 'polices/lexend-700.woff2'],
  ['@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2', 'polices/atkinson-400.woff2'],
  ['@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2', 'polices/atkinson-700.woff2'],
  ['@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2', 'polices/jetbrains-mono-500.woff2'],
  ['@fontsource/lexend/LICENSE', 'LICENCES/lexend.txt'],
  ['@fontsource/atkinson-hyperlegible/LICENSE', 'LICENCES/atkinson-hyperlegible.txt'],
  ['@fontsource/jetbrains-mono/LICENSE', 'LICENCES/jetbrains-mono.txt'],
];

for (const [de, vers] of copies) {
  mkdirSync(dirname(join(OUT, vers)), { recursive: true });
  cpSync(join(NM, de), join(OUT, vers), { recursive: true });
  console.log('copié  ', vers);
}
