// Mise en ligne directe d'un parcours : fichier envoyé dans parcours/ du dépôt, réponses de GitHub en français.
const test = require('node:test');
const assert = require('node:assert');
const G = require('../interface/github-depot.js');

const paquet = { format: 'labo-blocs/parcours', id: 'robot', titre: 'Robot « couloir » été', versionParcours: '1.2.0', exercices: [] };

test('le fichier envoyé : parcours/<id>-<version>.labo-parcours.json, en UTF-8', () => {
  const e = G.envoiParcours(paquet);
  assert.strictEqual(e.chemin, 'parcours/robot-1.2.0.labo-parcours.json');
  assert.match(e.message, /Robot « couloir » été.*1\.2\.0/);
  assert.deepStrictEqual(JSON.parse(Buffer.from(e.contenu, 'base64').toString('utf8')), paquet);
});

// Faux GitHub : chaque appel est noté, les réponses sont données à l'avance.
function fauxGithub(reponses) {
  const appels = [];
  globalThis.fetch = async (url, o) => {
    appels.push({ url, methode: (o && o.method) || 'GET', corps: o && o.body ? JSON.parse(o.body) : null, auth: o.headers.Authorization });
    const r = reponses.shift();
    return { ok: r.statut < 300, status: r.statut, json: async () => r.donnees || {} };
  };
  return appels;
}

test('nouveau fichier : un seul PUT, sur la branche main, avec la clé', async () => {
  const appels = fauxGithub([{ statut: 404 }, { statut: 201 }]);
  const r = await G.mettreEnLigne(paquet, 'github_pat_essai');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(appels[1].methode, 'PUT');
  assert.match(appels[1].url, /\/repos\/Anlito\/labo-blocs\/contents\/parcours\/robot-1\.2\.0\.labo-parcours\.json$/);
  assert.strictEqual(appels[1].corps.branch, 'main');
  assert.strictEqual(appels[1].corps.sha, undefined);
  assert.strictEqual(appels[1].auth, 'Bearer github_pat_essai');
});

test('fichier déjà là (même version republiée) : remplacé avec son sha', async () => {
  const appels = fauxGithub([{ statut: 200, donnees: { sha: 'abc123' } }, { statut: 200 }]);
  assert.strictEqual((await G.mettreEnLigne(paquet, 'k')).ok, true);
  assert.strictEqual(appels[1].corps.sha, 'abc123');
});

test('clé refusée ou sans droit d’écriture : phrase en français avec la prochaine action', async () => {
  fauxGithub([{ statut: 404 }, { statut: 403 }]);
  assert.match((await G.mettreEnLigne(paquet, 'k')).message, /Read and write/);
  fauxGithub([{ statut: 401 }]);
  assert.match((await G.verifierCleGithub('k')).message, /ne reconnaît pas cette clé/);
  fauxGithub([{ statut: 200 }]);
  assert.strictEqual((await G.verifierCleGithub('k')).ok, true);
  assert.match((await G.verifierCleGithub('  ')).message, /Colle/);
  globalThis.fetch = async () => {
    throw new Error('hors ligne');
  };
  assert.match((await G.verifierCleGithub('k')).message, /internet/);
});
