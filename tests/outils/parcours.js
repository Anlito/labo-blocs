// Lecture d'un paquet de parcours écrit en script (definirParcours({...})), sous Node.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function lireParcours(id) {
  let paquet = null;
  const fichier = path.join(__dirname, '..', '..', 'parcours', id, 'parcours.js');
  vm.runInNewContext(fs.readFileSync(fichier, 'utf8'), { definirParcours: (p) => (paquet = p) });
  return JSON.parse(JSON.stringify(paquet));
}

module.exports = { lireParcours };
