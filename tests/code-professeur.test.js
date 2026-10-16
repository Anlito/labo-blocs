// Code professeur : seule l'empreinte est écrite, elle reconnaît le bon code et seulement lui.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { regler } = require('../tools/code-professeur.js');
const { empreinteCode } = require('../interface/porte-professeur.js');

const lire = (fichier) => {
  let r = null;
  vm.runInNewContext(fs.readFileSync(fichier, 'utf8'), { definirCodeProfesseur: (x) => (r = JSON.parse(JSON.stringify(x))) });
  return r;
};

test('npm run code-professeur : empreinte sans le code, sel neuf à chaque fois', async () => {
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'labo-blocs-code-'));
  try {
    const f = path.join(dossier, 'code-professeur.js');
    await regler('Essai-Prof 42', f);
    const texte = fs.readFileSync(f, 'utf8');
    assert.doesNotMatch(texte, /Essai-Prof/);
    const r = lire(f);
    assert.strictEqual(await empreinteCode('Essai-Prof 42', r.sel, r.iterations, webcrypto.subtle), r.empreinte);
    assert.strictEqual(await empreinteCode('  Essai-Prof 42 ', r.sel, r.iterations, webcrypto.subtle), r.empreinte); // espaces autour ignorés
    assert.notStrictEqual(await empreinteCode('essai-prof 42', r.sel, r.iterations, webcrypto.subtle), r.empreinte);
    await regler('Essai-Prof 42', f);
    assert.notStrictEqual(lire(f).sel, r.sel);
    await assert.rejects(regler('  ', f), /vide/);
  } finally {
    fs.rmSync(dossier, { recursive: true, force: true });
  }
});

test('le site a un code professeur réglé', () => {
  const r = lire(path.join(__dirname, '..', 'site', 'code-professeur.js'));
  assert.match(r.empreinte, /^[0-9a-f]{64}$/);
  assert.ok(r.sel.length >= 16 && r.iterations >= 100000);
});
