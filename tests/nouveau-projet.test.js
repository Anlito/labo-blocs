// Kit nouveau projet (npm run nouveau-projet) : dossier créé, pages qui ne chargent que des fichiers du projet,
// réglages, parcours lisible, rien d'écrasé.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { creerProjet, lireArguments, identifiant } = require('../tools/nouveau-projet.js');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'labo-blocs-nouveau-'));
test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));

test('arguments et identifiant', () => {
  const o = lireArguments(['../pont', '--titre', 'Pont-levis', '--parcours', 'decouverte-mbot', '--classes', '4A, 4B', '--chemin', '{classe}/COMMUN/PONT/{equipe}']);
  assert.deepStrictEqual(o, { dossier: '../pont', titre: 'Pont-levis', parcours: 'decouverte-mbot', classes: ['4A', '4B'], chemin: ['{classe}', 'COMMUN', 'PONT', '{equipe}'] });
  assert.strictEqual(identifiant('Serre automatique à l’école'), 'serre-automatique-a-l-ecole');
});

test('un projet créé : pages, réglages, parcours, module, consignes', () => {
  const r = creerProjet({ dossier: path.join(tmp, 'serre'), titre: 'Serre automatique', parcours: 'decouverte-microbit', classes: ['3A'] });
  const site = r.site;
  for (const f of ['programmation.html', 'programmation-prof.html', 'projet-labo-blocs.js', 'parcours/decouverte-microbit.js', 'vendor/labo-blocs/labo-blocs-noyau.js', 'vendor/labo-blocs/labo-blocs-interface.js', 'vendor/labo-blocs/labo-blocs-professeur.css', 'vendor/labo-blocs/logo.svg', 'vendor/labo-blocs/cartes/firmwares.js']) {
    assert.ok(fs.existsSync(path.join(site, f)), f);
  }
  assert.ok(fs.existsSync(path.join(r.projet, 'docs', 'BRIEF-LABO-BLOCS.md')));
  assert.match(fs.readFileSync(path.join(r.projet, 'LISEZ-MOI-LABO-BLOCS.md'), 'utf8'), /Serre automatique/);

  // Chaque page ne charge que des fichiers présents dans le projet (aucune ressource en ligne).
  for (const page of ['programmation.html', 'programmation-prof.html']) {
    const html = fs.readFileSync(path.join(site, page), 'utf8');
    assert.doesNotMatch(html, /https?:\/\//, page);
    assert.doesNotMatch(html, /\.\.\//, page);
    const liens = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(liens.length > 5, page);
    for (const l of liens) assert.ok(fs.existsSync(path.join(site, l)), `${page} : ${l} absent`);
  }

  // Réglages : dossier par défaut sans accents, classes données.
  let projet = null;
  vm.runInNewContext(fs.readFileSync(path.join(site, 'projet-labo-blocs.js'), 'utf8'), { definirProjet: (p) => (projet = JSON.parse(JSON.stringify(p))) }); // objets de ce contexte
  assert.strictEqual(projet.parcours, 'decouverte-microbit');
  assert.deepStrictEqual(projet.classes, ['3A']);
  assert.deepStrictEqual(projet.cheminSauvegarde, ['{classe}', 'COMMUN', 'TECHNOLOGIE', 'SERRE AUTOMATIQUE', '{equipe}']);

  // Le noyau copié se charge sous Node et accepte le parcours copié.
  const L = require(path.join(site, 'vendor', 'labo-blocs', 'labo-blocs-noyau.js'));
  let paquet = null;
  vm.runInNewContext(fs.readFileSync(path.join(site, 'parcours', 'decouverte-microbit.js'), 'utf8'), { definirParcours: (p) => (paquet = p) });
  assert.deepStrictEqual(L.controler(paquet), []);
});

test('rien n’est écrasé ; parcours inconnu ou chemin sans équipe refusés', () => {
  const dossier = path.join(tmp, 'pont');
  creerProjet({ dossier, titre: 'Pont-levis', parcours: 'decouverte-mbot' });
  const page = path.join(dossier, 'site', 'programmation.html');
  fs.writeFileSync(page, 'page modifiée par le projet');
  assert.throws(() => creerProjet({ dossier, titre: 'Pont-levis', parcours: 'decouverte-mbot' }), /Rien n'a été écrit/);
  assert.strictEqual(fs.readFileSync(page, 'utf8'), 'page modifiée par le projet');
  assert.throws(() => creerProjet({ dossier: path.join(tmp, 'x'), titre: 'X', parcours: 'inexistant' }), /introuvable/);
  assert.throws(() => creerProjet({ dossier: path.join(tmp, 'y'), titre: 'Y', parcours: 'decouverte-mbot', chemin: ['{classe}', 'Y'] }), /\{equipe\}/);
});

test('parcours donné par un fichier exporté (.labo-parcours.json)', () => {
  const fichier = path.join(__dirname, 'fixtures', 'distributeur-1.0.1-essai.labo-parcours.json');
  const r = creerProjet({ dossier: path.join(tmp, 'essai'), titre: 'Essai', parcours: fichier });
  assert.ok(fs.existsSync(path.join(r.site, 'parcours', `${r.paquet.id}.js`)));
});
