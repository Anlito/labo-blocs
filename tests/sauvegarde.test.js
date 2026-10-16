// Sauvegarde : rubrique « programmation », sauvegardes de l'atelier relues, exercice modifié « à revérifier »
// sans perdre les blocs ni la réussite, déblocage avec un défi facultatif.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const S = require('../noyau/sauvegarde.js');
const { preparer } = require('../noyau/parcours.js');
const { lireParcours } = require('./outils/parcours.js');

const paquet = preparer(lireParcours('distributeur'));
const fixture = (nom) => fs.readFileSync(path.join(__dirname, 'fixtures', nom), 'utf8');
const reussir = (d, id) => S.noterVerification(d, paquet.exercices.find((e) => e.id === id), { reussi: true, programme: { fils: [] } });

test('nouvelle équipe : fichier Labo Blocs relié au parcours', () => {
  const d = S.creerSauvegarde({ eleves: ['léa', ' hugo ', ''], classe: '5A' }, { parcours: paquet, projet: 'distributeur' });
  assert.deepStrictEqual(d.equipe, { eleves: ['Léa', 'Hugo'], classe: '5A' });
  assert.strictEqual(S.nomEquipe(d.equipe.eleves), 'Léa_Hugo');
  assert.deepStrictEqual(d.programmation.parcours, { id: 'distributeur', version: paquet.versionParcours });
  const relu = S.lireSauvegarde(JSON.stringify(d));
  assert.ok(relu.ok);
  assert.deepStrictEqual(S.relierParcours(relu.donnees, paquet), []);
});

test('sauvegardes de l’atelier : relues, travail recopié sous les identifiants du parcours, rien effacé', () => {
  for (const nom of ['atelier-Noah_Jade.json', 'atelier-Léa_Hugo.json', 'atelier-Inès_Tom_Sacha.json', 'atelier-Maël.json']) {
    const texte = fixture(nom);
    const r = S.lireSauvegarde(texte);
    assert.ok(r.ok, nom);
    const d = r.donnees;
    const ancien = JSON.parse(texte);
    assert.deepStrictEqual(S.relierParcours(d, paquet), []);
    // L'ancien contenu est toujours là.
    assert.deepStrictEqual(d.exercices, ancien.exercices);
    assert.deepStrictEqual(d.carnet, ancien.carnet);
    for (const [num, e] of Object.entries(ancien.exercices)) {
      const id = paquet.exercices.find((x) => x.numero === num).id;
      assert.strictEqual(d.programmation.exercices[id].statut, e.statut, `${nom} ${num}`);
      assert.strictEqual(d.programmation.exercices[id].indicesOuverts, e.indicesOuverts);
    }
    assert.strictEqual(d.programmation.exerciceCourant, paquet.exercices.find((x) => x.numero === ancien.exerciceCourant).id);
  }
  // Noah et Jade : 4 réussis, le 5 en cours.
  const d = S.lireSauvegarde(fixture('atelier-Noah_Jade.json')).donnees;
  S.relierParcours(d, paquet);
  assert.strictEqual(S.etat(d, paquet, 'dist-04'), 'reussi');
  assert.strictEqual(S.etat(d, paquet, 'dist-05'), 'en_cours');
  assert.strictEqual(S.etat(d, paquet, 'dist-06'), 'verrouille');
  assert.strictEqual(S.exerciceAReprendre(d, paquet), 'dist-05');
  assert.deepStrictEqual(S.avancement(d, paquet), { reussis: 4, total: 13, defisReussis: 0, defis: 1, aReverifier: 0 });
});

test('exercice modifié par le professeur : « à revérifier », blocs et réussite gardés, puis revérifié', () => {
  const d = S.creerSauvegarde({ eleves: ['Léa'], classe: '5A' }, { parcours: paquet });
  S.relierParcours(d, paquet);
  reussir(d, 'dist-01');
  S.noterProgramme(d, 'dist-02', { blocks: { blocks: [{ type: 'boucle', id: 'boucle' }] } });
  reussir(d, 'dist-02');
  const v2 = lireParcours('distributeur');
  v2.versionParcours = '1.3.0';
  v2.exercices[1].consigne += ' Change de rythme.';
  const p2 = preparer(v2);
  assert.deepStrictEqual(S.relierParcours(d, p2), ['dist-02']);
  assert.strictEqual(S.etat(d, p2, 'dist-02'), 'a_reverifier');
  assert.strictEqual(S.estDebloque(d, p2, 'dist-03'), true, 'la réussite n’est pas effacée');
  assert.ok(d.programmation.exercices['dist-02'].programme, 'les blocs sont gardés');
  assert.deepStrictEqual(d.programmation.parcours, { id: 'distributeur', version: '1.3.0' });
  assert.strictEqual(S.avancement(d, p2).aReverifier, 1);
  // Revérifié : l'exercice redevient « réussi » ; relier à nouveau ne change plus rien.
  S.noterVerification(d, p2.exercices[1], { reussi: true });
  assert.strictEqual(S.etat(d, p2, 'dist-02'), 'reussi');
  assert.deepStrictEqual(S.relierParcours(d, p2), []);
});

test('exercice supprimé du parcours : gardé dans la sauvegarde, en lecture seule', () => {
  const d = S.creerSauvegarde({ eleves: ['Léa'], classe: '5A' }, { parcours: paquet });
  S.relierParcours(d, paquet);
  reussir(d, 'dist-01');
  const v2 = lireParcours('distributeur');
  v2.exercices = v2.exercices.filter((e) => e.id !== 'dist-01');
  S.relierParcours(d, preparer(v2));
  assert.strictEqual(d.programmation.exercices['dist-01'].supprime, true);
  assert.strictEqual(d.programmation.exercices['dist-01'].statut, 'reussi');
});

test('défi facultatif : 13B s’ouvre après 13A ; un exercice après un défi ne dépend pas du défi', () => {
  const d = S.creerSauvegarde({ eleves: ['Léa'], classe: '5A' }, { parcours: paquet });
  S.relierParcours(d, paquet);
  for (const e of paquet.exercices.slice(0, 12)) reussir(d, e.id);
  assert.strictEqual(S.etat(d, paquet, 'dist-13a'), 'a_faire');
  assert.strictEqual(S.etat(d, paquet, 'dist-13b'), 'verrouille');
  reussir(d, 'dist-13a');
  assert.strictEqual(S.etat(d, paquet, 'dist-13b'), 'a_faire');
  // Un exercice ajouté après le défi s'ouvre dès que 13A est réussi.
  const v2 = lireParcours('distributeur');
  v2.exercices.push({ ...v2.exercices[0], id: 'dist-14', numero: '14' });
  assert.strictEqual(S.estDebloque(d, preparer(v2), 'dist-14'), true);
  assert.strictEqual(S.estDebloque(d, paquet, 'dist-13b', { toutDebloquer: true }), true);
});

test('fichiers refusés : illisible, autre application, version plus récente', () => {
  assert.strictEqual(S.lireSauvegarde('{').ok, false);
  assert.strictEqual(S.lireSauvegarde('{"application":"autre"}').ok, false);
  assert.strictEqual(S.lireSauvegarde('{"application":"labo-blocs","formatVersion":9,"equipe":{"eleves":[]}}').ok, false);
  assert.strictEqual(S.lireSauvegarde('{"application":"labo-blocs","formatVersion":1,"equipe":{"eleves":[]},"programmation":{"version":2}}').ok, false);
});

test('« Dans la carte » : chaque envoi et chaque « Vider la carte » sont gardés dans l’historique de l’exercice', () => {
  const d = S.creerSauvegarde({ eleves: ['Léa'], classe: '5A' }, { parcours: paquet });
  S.noterEnvoi(d, 'dist-03', { carte: 'uno', reussi: true, octets: 42, programme: { demarrage: [{ bloc: 'attendre', id: 'b1', duree: 1 }], boucle: [] } });
  S.noterEnvoi(d, 'dist-03', { carte: 'uno', reussi: false, message: 'La carte ne répond plus.' });
  S.noterVidage(d, 'dist-03', { carte: 'uno', reussi: true });
  const h = d.programmation.exercices['dist-03'].historique;
  assert.deepStrictEqual(h.map((x) => [x.type, x.reussi]), [['envoi', true], ['envoi', false], ['vider', true]]);
  assert.strictEqual(h[0].octets, 42);
  assert.ok(!JSON.stringify(h[0].programme).includes('"id"'));
  assert.strictEqual(h[1].message, 'La carte ne répond plus.');
  assert.strictEqual(d.programmation.exercices['dist-03'].statut, 'non_commence', 'un envoi ne change pas le statut');
});
