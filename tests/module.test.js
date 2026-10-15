// Module construit pour les projets (npm run module) : styles limités à .labo-blocs, noyau chargeable sous Node,
// fichier parcours d'un projet relu à l'identique.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { construire, prefixer, lireParcours } = require('../tools/construire-module.js');
const { scriptParcours, VERSION_MOTEUR } = require('../noyau/parcours.js');
const { versV1, versSimplifie } = require('../noyau/programme.js');

test('styles : chaque règle est limitée à .labo-blocs, la page entière à .labo-blocs-page', () => {
  const css = prefixer(
    ':root { --a: 1; } html, body { height: 100%; } * { box-sizing: border-box; } .carte, .btn:not(.x, .y) { color: red; } ' +
      '@media (max-width: 10px) { .carte { color: blue; } } @font-face { font-family: X; } .blocklyDropDownDiv { z-index: 9; }',
    '.labo-blocs',
  );
  assert.match(css, /^\.labo-blocs \{ --a: 1; \}/m);
  assert.match(css, /^\.labo-blocs-page \{ height: 100%; \}/m);
  assert.match(css, /^\.labo-blocs, \.labo-blocs \* \{ box-sizing/m);
  assert.match(css, /^\.labo-blocs \.carte, \.labo-blocs \.btn:not\(\.x, \.y\) \{ color: red; \}/m);
  assert.match(css, /@media \(max-width: 10px\) \{\n\.labo-blocs \.carte \{ color: blue; \}/);
  assert.match(css, /@font-face \{ font-family: X; \}/);
  assert.match(css, /^\.blocklyDropDownDiv \{/m, 'menus de Blockly : posés hors de l’écran, non limités');
});

test('module construit : noyau chargeable sous Node et dans un bac à sable, styles et polices', () => {
  const r = construire();
  const fichiers = fs.readdirSync(r.dossier);
  for (const f of ['labo-blocs-noyau.js', 'labo-blocs-interface.js', 'labo-blocs.css', 'VERSION.json', 'polices', 'blockly']) assert.ok(fichiers.includes(f), f);
  const noyau = require(path.join(r.dossier, 'labo-blocs-noyau.js'));
  assert.equal(noyau.VERSION_MOTEUR, VERSION_MOTEUR);
  assert.equal(typeof noyau.valider, 'function');
  const bac = {};
  vm.runInNewContext(fs.readFileSync(path.join(r.dossier, 'labo-blocs-noyau.js'), 'utf8'), bac);
  assert.equal(bac.LaboBlocs.VERSION_MOTEUR, VERSION_MOTEUR);
  const css = fs.readFileSync(path.join(r.dossier, 'labo-blocs.css'), 'utf8');
  assert.ok(!/url\('\.\.\//.test(css), 'polices relatives au dossier du module');
  assert.ok(!/^\.(consigne|carte|editeur)\b/m.test(css), 'aucune règle hors de .labo-blocs');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(r.dossier, 'VERSION.json'), 'utf8')).moteur, VERSION_MOTEUR);
  assert.ok(r.exportes.some((f) => /^distributeur-.*\.labo-parcours\.json$/.test(f)));
});

test('fichier parcours d’un projet : relu à l’identique, lisible en file:// (definirParcours)', () => {
  const brut = lireParcours(fs.readFileSync(path.join(__dirname, '..', 'parcours', 'distributeur', 'parcours.js'), 'utf8'));
  const texte = scriptParcours(brut);
  assert.match(texte, /^\/\/ Parcours « Distributeur de céréales », version /);
  assert.deepEqual(lireParcours(texte), brut);
});

test('programme v1 → format simplifié de l’atelier (outils des projets) et retour', () => {
  const simple = { demarrage: [{ bloc: 'led_etat', broche: 'D9', etat: 1 }], boucle: [{ bloc: 'attendre', duree: 1 }] };
  assert.deepEqual(versSimplifie(versV1(simple)), simple);
  const avecFil = { format: 'labo-blocs/programme', version: 1, fils: [{ quand: 'boucle', corps: [] }, { quand: 'appui', broche: 'D2', corps: [{ bloc: 'attendre', duree: 1 }] }] };
  assert.deepEqual(versSimplifie(avecFil), { demarrage: [], boucle: [], fils: [avecFil.fils[1]] });
  assert.equal(versSimplifie(simple), simple, 'un programme déjà simplifié est rendu tel quel');
});
