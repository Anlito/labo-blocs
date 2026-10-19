// Commentaires dans la zone de programmation : sur un bloc (commentaire Blockly) et notes libres dans l'espace des
// blocs. Gardés par le programme v1 (programme de départ et solution écrits par le professeur), par la sauvegarde de
// l'équipe (Blockly), et écrits en « // … » dans le code Arduino. Sans effet sur ce que fait le programme.
const test = require('node:test');
const assert = require('node:assert/strict');
const { versBlockly, depuisBlockly, versSimplifie, versV1 } = require('../noyau/programme.js');
const { compiler } = require('../noyau/code-octet.js');
const { versArduino } = require('../noyau/arduino.js');
const { solutionDepuisProgramme } = require('../noyau/edition.js');

const PROGRAMME = {
  format: 'labo-blocs/programme',
  version: 1,
  fils: [
    { quand: 'demarrage', commentaire: 'On prépare la LED.', corps: [{ bloc: 'led_etat', broche: 'D3', etat: 0, commentaire: 'Éteinte au départ' }] },
    {
      quand: 'boucle',
      corps: [
        { bloc: 'led_etat', broche: 'D3', etat: 1 },
        { bloc: 'attendre', duree: { bloc: 'nombre', valeur: 0.5 }, commentaire: 'Le clignotement :\nallumée puis éteinte' },
        { bloc: 'led_etat', broche: 'D3', etat: 0 },
        { bloc: 'attendre', duree: { bloc: 'nombre', valeur: 0.5 } },
      ],
    },
  ],
  notes: [{ texte: 'Exercice 2 : complète la boucle pour que la LED clignote.', x: 300, y: 20, largeur: 240, hauteur: 90 }],
};
const sansIds = (p) => JSON.parse(JSON.stringify(p, (k, v) => (k === 'id' ? undefined : v)));

test('Blockly : commentaires des blocs ouverts, notes posées dans l’espace des blocs ; relus à l’identique', () => {
  const sauvegarde = versBlockly(PROGRAMME);
  const depart = sauvegarde.blocks.blocks.find((b) => b.type === 'demarrage');
  assert.deepEqual(depart.icons.comment, { text: 'On prépare la LED.', pinned: true, height: 80, width: 200 });
  assert.equal(depart.inputs.DO.block.icons.comment.text, 'Éteinte au départ');
  assert.equal(sauvegarde.workspaceComments.length, 1);
  assert.equal(sauvegarde.workspaceComments[0].text, PROGRAMME.notes[0].texte);
  assert.deepEqual(sansIds(depuisBlockly(sauvegarde).programme), PROGRAMME);
});

test('un commentaire ne change rien à ce que fait le programme', () => {
  const nu = JSON.parse(JSON.stringify(PROGRAMME, (k, v) => (k === 'commentaire' || k === 'notes' ? undefined : v)));
  assert.deepEqual(compiler(PROGRAMME).octets, compiler(nu).octets);
});

test('programme de départ et solution du professeur : les commentaires et les notes restent', () => {
  // Sans commentaire sur « Au démarrage » / « Répéter indéfiniment » : forme simplifiée, notes comprises.
  const simple = JSON.parse(JSON.stringify(PROGRAMME));
  delete simple.fils[0].commentaire;
  const s = solutionDepuisProgramme(simple);
  assert.ok(!s.fils && s.notes.length === 1 && s.demarrage[0].commentaire === 'Éteinte au départ');
  assert.deepEqual(versV1(s).notes, simple.notes);
  assert.deepEqual(versSimplifie(simple).notes, simple.notes);
  // Avec un commentaire sur « Au démarrage » : le programme v1 entier.
  assert.equal(solutionDepuisProgramme(PROGRAMME).fils[0].commentaire, 'On prépare la LED.');
});

test('code Arduino : chaque commentaire devient des lignes « // … » au-dessus de son bloc', () => {
  const code = versArduino(PROGRAMME, { composants: [{ type: 'led', broche: 'D3' }] }).code;
  assert.match(code, /void setup\(\) \{\n(.*\n)*  \/\/ On prépare la LED\.\n  \/\/ Éteinte au départ\n  digitalWrite\(3, LOW\);/);
  assert.match(code, /  \/\/ Le clignotement :\n  \/\/ allumée puis éteinte\n  attendre\(0\.5\);/);
});
