// Parcours du dépôt : dossiers parcours/<id>/ et fichiers .labo-parcours.json déposés (version la plus récente),
// publication (liste et scripts écrits), classes et dossier de l'équipe réglés dans le parcours.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { lireTousLesParcours, lireTexteParcours, scriptIndex } = require('../tools/parcours-depot.js');
const { scriptParcours, controler } = require('../noyau/parcours.js');
const { lireReglagesEleves } = require('../noyau/edition.js');

const RACINE = path.join(__dirname, '..');
const mbot = lireTexteParcours(fs.readFileSync(path.join(RACINE, 'parcours', 'decouverte-mbot', 'parcours.js'), 'utf8'));
const variante = (id, version, plus) => Object.assign(JSON.parse(JSON.stringify(mbot)), { id, versionParcours: version }, plus || {});

test('dossiers et fichiers déposés ; la version la plus récente l’emporte ; fichier abîmé refusé', () => {
  const racine = fs.mkdtempSync(path.join(os.tmpdir(), 'labo-blocs-depot-'));
  try {
    const dossier = path.join(racine, 'parcours');
    fs.mkdirSync(path.join(dossier, 'robot'), { recursive: true });
    fs.writeFileSync(path.join(dossier, 'robot', 'parcours.js'), scriptParcours(variante('robot', '1.0.0')));
    fs.writeFileSync(path.join(dossier, 'robot-1.2.0.labo-parcours.json'), JSON.stringify(variante('robot', '1.2.0')));
    fs.writeFileSync(path.join(dossier, 'robot-1.1.0.labo-parcours.json'), JSON.stringify(variante('robot', '1.1.0')));
    fs.writeFileSync(path.join(dossier, 'serre-1.0.0.labo-parcours.json'), JSON.stringify(variante('serre', '1.0.0')));
    fs.writeFileSync(path.join(dossier, 'abime.labo-parcours.json'), '{ pas du json');
    fs.writeFileSync(path.join(dossier, 'index.js'), scriptIndex(['serre']));
    const r = lireTousLesParcours(racine);
    assert.deepStrictEqual(r.parcours.map((p) => `${p.id} ${p.versionParcours}`), ['serre 1.0.0', 'robot 1.2.0']);
    assert.deepStrictEqual(r.refuses.map((x) => x.fichier), ['abime.labo-parcours.json']);
  } finally {
    fs.rmSync(racine, { recursive: true, force: true });
  }
});

test('publication : chaque parcours a son script et la liste les contient tous', () => {
  const { publier } = require('../tools/publier.js');
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'labo-blocs-publie-'));
  try {
    const r = publier(out);
    let ids = null;
    vm.runInNewContext(fs.readFileSync(path.join(out, 'parcours', 'index.js'), 'utf8'), { definirIndexParcours: (l) => (ids = JSON.parse(JSON.stringify(l))) });
    assert.deepStrictEqual(ids, ['distributeur', 'decouverte-mbot', 'decouverte-microbit']);
    for (const id of ids) assert.ok(fs.existsSync(path.join(out, 'parcours', id, 'parcours.js')), id);
    assert.match(fs.readFileSync(path.join(out, 'index.html'), 'utf8'), /site\/accueil\.html/);
    // Les pages ne listent plus les parcours à la main.
    assert.doesNotMatch(fs.readFileSync(path.join(out, 'site', 'index.html'), 'utf8'), /parcours\/distributeur\/parcours\.js/);
    assert.strictEqual(r.refuses.length, 0);
    // Scripts et styles demandés avec le numéro de la publication (pas d'ancienne copie gardée par le navigateur).
    const editeur = fs.readFileSync(path.join(out, 'site', 'editeur.html'), 'utf8');
    assert.match(editeur, /src="\.\.\/interface\/editeur-parcours\.js\?v=\w+"/);
    assert.match(editeur, /href="\.\.\/interface\/css\/editeur-parcours\.css\?v=\w+"/);
    assert.doesNotMatch(editeur, /\.js"/);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test('numéro de publication : seulement les fichiers du site', () => {
  const { versionner } = require('../tools/publier.js');
  assert.strictEqual(
    versionner('<script src="../noyau/vm.js"></script><link href="x.css"><a href="https://a.fr/b.js">', '42'),
    '<script src="../noyau/vm.js?v=42"></script><link href="x.css?v=42"><a href="https://a.fr/b.js">',
  );
});

test('classes et dossier de l’équipe du parcours : lus dans l’éditeur, contrôlés', () => {
  assert.deepStrictEqual(lireReglagesEleves('4A, 4B ; 4C, 4A', '{classe} › COMMUN / ROBOT'), {
    classes: ['4A', '4B', '4C'],
    cheminSauvegarde: ['{classe}', 'COMMUN', 'ROBOT', '{equipe}'],
    equipeAjoutee: true,
  });
  assert.deepStrictEqual(lireReglagesEleves('  ', ''), {});
  assert.deepStrictEqual(controler(variante('robot', '1.0.0', { classes: ['4A'], cheminSauvegarde: ['{classe}', '{equipe}'] })), []);
  assert.match(controler(variante('robot', '1.0.0', { classes: [] })).join(), /Classes du parcours/);
  assert.match(controler(variante('robot', '1.0.0', { cheminSauvegarde: ['{classe}', 'ROBOT'] })).join(), /\{equipe\}/);
});
