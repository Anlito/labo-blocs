// Jalon 0 : taille du code octet des programmes (EEPROM de la Uno et du mCore : 1 024 octets).
//   node essais/outils/mesurer.js
const { compiler } = require('../code-octet/compilateur.js');
const { chargerExercices } = require('../reference/outils.js');

const lignes = [];
for (const ex of chargerExercices()) {
  const { octets } = compiler(ex.solutionReference, { composants: ex.composants });
  lignes.push([`Distributeur ${ex.id} (solution)`, octets.length]);
}

// Simon (jeu de mémoire) écrit en blocs comme le ferait un élève de 3e : 4 LED, 4 boutons, un buzzer,
// une liste pour la suite de couleurs, le hasard et deux fonctions.
const n = (v) => v;
const v = (nom) => ({ bloc: 'variable', variable: nom });
const op = (o, a, b) => ({ bloc: 'operation', op: o, a, b });
const cmp = (o, a, b) => ({ bloc: 'comparaison', op: o, a, b });
const et = (a, b) => ({ bloc: 'logique', op: 'et', a, b });
const ou = (a, b) => ({ bloc: 'logique', op: 'ou', a, b });
const bouton = (b) => ({ bloc: 'bouton_etat', broche: b });
const att = (s) => ({ bloc: 'attendre', duree: s });
const si = (c, alors, sinon) => (sinon ? { bloc: 'si_sinon', condition: c, alors, sinon } : { bloc: 'si_alors', condition: c, alors });
const aff = (nom, val) => ({ bloc: 'affecter', variable: nom, valeur: val });
const LED = ['D2', 'D3', 'D4', 'D5'];
const BOUTONS = ['D6', 'D7', 'D8', 'D9'];
const NOTES = [262, 330, 392, 523];
const simon = {
  listes: [{ nom: 'suite', capacite: 32 }],
  fonctions: [
    {
      nom: 'montrer',
      parametres: ['couleur'],
      corps: LED.map((l, i) => si(cmp('=', v('couleur'), i + 1), [{ bloc: 'led_etat', broche: l, etat: 1 }, { bloc: 'son', broche: 'D10', frequence: NOTES[i], duree: 0.3 }, att(0.3), { bloc: 'led_etat', broche: l, etat: 0 }, att(0.1)])),
    },
    {
      nom: 'lire_bouton',
      parametres: [],
      corps: [
        { bloc: 'tant_que', condition: { bloc: 'non', a: ou(ou(bouton('D6'), bouton('D7')), ou(bouton('D8'), bouton('D9'))) }, corps: [att(0.01)] },
        ...BOUTONS.map((b, i) => si(bouton(b), [{ bloc: 'tant_que', condition: bouton(b), corps: [att(0.01)] }, { bloc: 'retourner', valeur: i + 1 }])),
      ],
    },
  ],
  fils: [
    { quand: 'demarrage', corps: [{ bloc: 'liste_vider', liste: 'suite' }, aff('perdu', 0)] },
    {
      quand: 'boucle',
      corps: [
        { bloc: 'liste_ajouter', liste: 'suite', valeur: { bloc: 'hasard', min: 1, max: 4 } },
        aff('i', 1),
        { bloc: 'repeter_n', fois: { bloc: 'liste_taille', liste: 'suite' }, corps: [{ bloc: 'appeler', fonction: 'montrer', arguments: [{ bloc: 'liste_element', liste: 'suite', position: v('i') }] }, { bloc: 'ajouter_a', variable: 'i', valeur: 1 }] },
        aff('i', 1),
        aff('perdu', 0),
        {
          bloc: 'tant_que',
          condition: et(cmp('≤', v('i'), { bloc: 'liste_taille', liste: 'suite' }), cmp('=', v('perdu'), 0)),
          corps: [
            aff('appui', { bloc: 'appel', fonction: 'lire_bouton', arguments: [] }),
            { bloc: 'appeler', fonction: 'montrer', arguments: [v('appui')] },
            si(cmp('≠', v('appui'), { bloc: 'liste_element', liste: 'suite', position: v('i') }), [aff('perdu', 1)]),
            { bloc: 'ajouter_a', variable: 'i', valeur: 1 },
          ],
        },
        si(cmp('=', v('perdu'), 1), [
          { bloc: 'son', broche: 'D10', frequence: 110, duree: 1 },
          { bloc: 'repeter_n', fois: 3, corps: [...LED.map((l) => ({ bloc: 'led_etat', broche: l, etat: 1 })), att(0.2), ...LED.map((l) => ({ bloc: 'led_etat', broche: l, etat: 0 })), att(0.2)] },
          { bloc: 'liste_vider', liste: 'suite' },
        ], [att(0.8)]),
      ],
    },
  ],
};
const composantsSimon = [...LED.map((b) => ({ type: 'led', broche: b })), ...BOUTONS.map((b) => ({ type: 'bouton', broche: b })), { type: 'buzzer', broche: 'D10' }];
const s = compiler(simon, { composants: composantsSimon });
if (s.erreurs.length) throw new Error(s.erreurs.join(' ; '));
lignes.push(['Simon complet (listes, hasard, 2 fonctions, 4 LED, 4 boutons, buzzer)', s.octets.length]);

const largeur = Math.max(...lignes.map((l) => l[0].length));
console.log('Programme'.padEnd(largeur) + '  Octets  % de 1 024');
for (const [nom, o] of lignes) console.log(nom.padEnd(largeur) + '  ' + String(o).padStart(6) + '  ' + String(Math.round((o / 1024) * 100)).padStart(5) + ' %');
module.exports = { simon, composantsSimon };
