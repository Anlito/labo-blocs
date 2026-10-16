// Parcours du dépôt de Labo Blocs : chaque dossier parcours/<id>/parcours.js, et chaque fichier exporté par l'éditeur
// (<id>-<version>.labo-parcours.json) déposé directement dans parcours/ (par exemple avec « Add file › Upload files »
// sur GitHub). Pour un même identifiant, la version la plus récente l'emporte.
const { readdirSync, readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const { comparerVersions, controler } = require('../noyau/parcours.js');

const RACINE = join(__dirname, '..');

// Script « definirParcours({...}) » ou fichier d'échange .json → objet (sans l'exécuter dans Node).
function lireTexteParcours(texte) {
  const t = String(texte).replace(/^﻿/, '');
  if (/^\s*\{/.test(t)) return JSON.parse(t);
  let paquet = null;
  vm.runInNewContext(t, { definirParcours: (p) => (paquet = JSON.parse(JSON.stringify(p))) }); // objets de ce contexte
  if (!paquet) throw new Error('Ce fichier n’appelle pas definirParcours({...}).');
  return paquet;
}

// Ordre de parcours/index.js, puis les autres par identifiant.
function ordreIndex(dossier) {
  const f = join(dossier, 'index.js');
  if (!existsSync(f)) return [];
  let ids = [];
  vm.runInNewContext(readFileSync(f, 'utf8'), { definirIndexParcours: (l) => (ids = JSON.parse(JSON.stringify(l))) });
  return ids;
}

// → { parcours: [paquet…] (ordre de l'index, puis nouveaux), refuses: [{ fichier, raison }] }
function lireTousLesParcours(racine) {
  const dossier = join(racine || RACINE, 'parcours');
  const parId = new Map();
  const refuses = [];
  const garder = (paquet, fichier) => {
    const pb = controler(paquet);
    if (pb.length) return refuses.push({ fichier, raison: pb.join(' ') });
    const deja = parId.get(paquet.id);
    if (!deja || comparerVersions(paquet.versionParcours || '0', deja.versionParcours || '0') > 0) parId.set(paquet.id, paquet);
  };
  for (const nom of readdirSync(dossier, { withFileTypes: true })) {
    try {
      if (nom.isDirectory() && existsSync(join(dossier, nom.name, 'parcours.js'))) {
        garder(lireTexteParcours(readFileSync(join(dossier, nom.name, 'parcours.js'), 'utf8')), `${nom.name}/parcours.js`);
      } else if (nom.isFile() && /\.labo-parcours\.json$/i.test(nom.name)) {
        garder(lireTexteParcours(readFileSync(join(dossier, nom.name), 'utf8')), nom.name);
      }
    } catch (e) {
      refuses.push({ fichier: nom.name, raison: e.message });
    }
  }
  const ordre = ordreIndex(dossier);
  const ids = [...parId.keys()].sort((a, b) => {
    const ia = ordre.indexOf(a);
    const ib = ordre.indexOf(b);
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0 || ib >= 0) return ia >= 0 ? -1 : 1;
    return a.localeCompare(b);
  });
  return { parcours: ids.map((id) => parId.get(id)), refuses };
}

const scriptIndex = (ids) =>
  '// Parcours de Labo Blocs (liste lue par le site, l’éditeur et le suivi de classe). Un parcours déposé dans ce dossier\n' +
  '// (dossier <id>/parcours.js ou fichier .labo-parcours.json) y est ajouté à la publication.\n' +
  `definirIndexParcours(${JSON.stringify(ids)});\n`;

module.exports = { lireTousLesParcours, lireTexteParcours, scriptIndex };
