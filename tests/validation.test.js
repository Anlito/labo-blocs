// La vérification de Labo Blocs (simulateur = code octet + noyau/vm.js) donne exactement les mêmes résultats que
// celle de l'atelier du distributeur : réussite pour chaque solution, même premier écart (même phrase) pour
// chacun des 47 programmes faux.
const test = require('node:test');
const assert = require('node:assert');
const { chargerExercices } = require('../essais/reference/outils.js');
const ref = require('../essais/reference/moteur/validation.js');
const { valider } = require('../noyau/validation.js');
const faux = require('../essais/reference/programmes-faux.js');

const resume = (r) => ({ reussi: r.reussi, message: r.message, scenario: r.scenario, temps: r.temps });

for (const ex of chargerExercices()) {
  test(`exercice ${ex.id} : mêmes résultats que l'atelier`, () => {
    const s = valider(ex, ex.solutionReference);
    assert.strictEqual(s.reussi, true, s.message);
    for (const f of faux[ex.id] || []) {
      const attendu = resume(ref.valider(ex, f.programme));
      const obtenu = resume(valider(ex, f.programme));
      assert.deepStrictEqual(obtenu, attendu, f.nom);
      assert.ok(obtenu.message.includes(f.message), `${f.nom} : ${obtenu.message}`);
      assert.ok(!/faux|erreur/i.test(obtenu.message), 'jamais « faux » ni « erreur »');
    }
  });
}
