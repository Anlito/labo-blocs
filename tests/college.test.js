// Réglages du collège : une liste de classes et un chemin communs à tous les outils ; chaque projet garde ses niveaux
// et la fin de son chemin.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const C = require('../interface/college.js');

const college = { classes: ['5A', '5B', '4A', '4B', '3A', 'SEGPA'], cheminClasse: ['Bureau', 'Classe', '{classe}', 'COMMUN', 'TECHNOLOGIE'] };

test('classes d’un projet : celles de ses niveaux (toutes s’il n’en dit rien)', () => {
  assert.deepStrictEqual(C.classesDuCollege(college, ['4']), ['4A', '4B']);
  assert.deepStrictEqual(C.classesDuCollege(college, ['5e', '3']), ['5A', '5B', '3A']);
  assert.deepStrictEqual(C.classesDuCollege(college, null), college.classes);
});

test('projet complété : chemin du collège + dossier du projet ; ses propres réglages restent prioritaires', () => {
  const p = C.projetAvecCollege({ id: 'd', niveaux: ['5'], cheminProjet: ['DISTRIBUTEUR DE CEREALES'] }, college);
  assert.deepStrictEqual(p.classes, ['5A', '5B']);
  assert.deepStrictEqual(p.cheminSauvegarde, ['Bureau', 'Classe', '{classe}', 'COMMUN', 'TECHNOLOGIE', 'DISTRIBUTEUR DE CEREALES', '{equipe}']);
  const propre = C.projetAvecCollege({ classes: ['6A'], cheminSauvegarde: ['{classe}', '{equipe}'], cheminProjet: ['X'] }, college);
  assert.deepStrictEqual(propre.classes, ['6A']);
  assert.deepStrictEqual(propre.cheminSauvegarde, ['{classe}', '{equipe}']);
  assert.strictEqual(C.projetAvecCollege({ id: 'x' }, null).id, 'x');
});

test('saisie du professeur : liste et chemin lus et contrôlés', () => {
  assert.deepStrictEqual(C.lireListeClasses('5A, 5B\n4A ; 5a\n\n'), ['5A', '5B', '4A']);
  assert.deepStrictEqual(C.lireCheminClasse('Bureau › Classe › {classe} / COMMUN').chemin, ['Bureau', 'Classe', '{classe}', 'COMMUN']);
  assert.match(C.lireCheminClasse('Bureau › COMMUN').message, /\{classe\}/);
  assert.match(C.lireCheminClasse('{classe} › {equipe}').message, /sans \{equipe\}/);
});

test('le fichier du site se relit, et le fichier écrit par la page de réglages aussi', () => {
  const lire = (texte) => {
    let c = null;
    vm.runInNewContext(texte, { definirCollege: (x) => (c = JSON.parse(JSON.stringify(x))) });
    return c;
  };
  const site = lire(fs.readFileSync(path.join(__dirname, '..', 'site', 'college.js'), 'utf8'));
  assert.strictEqual(site.format, 'labo-blocs/college');
  assert.ok(site.classes.length > 0 && site.cheminClasse.includes('{classe}'));
  assert.deepStrictEqual(lire(C.scriptCollege(college)).classes, college.classes);
});
