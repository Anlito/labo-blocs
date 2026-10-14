// Jalon 0 : le vrai firmware (essais/firmware/labo_blocs_uno.hex) dans une Uno émulée par simavr.
// Protocole v2, envoi d'un programme, coupure de courant, « Vider la carte », mode direct.
const test = require('node:test');
const assert = require('node:assert');
const { disponible, creerCarte, scriptEnvoi } = require('../essais/outils/carte-emulee.js');
const { compiler } = require('../essais/code-octet/compilateur.js');
const { chargerExercices } = require('../essais/reference/outils.js');

const sauter = disponible() ? false : 'simavr absent (apt install libsimavr-dev libelf-dev)';
const recu = (lignes) => lignes.filter((l) => l.quoi === 'recu').map((l) => l.texte);
const sorties = (lignes, n) => lignes.filter((l) => l.quoi === 'sortie' && l.broche === n).map((l) => l.valeur);

const ex5 = chargerExercices().find((e) => e.id === '5'); // bouton D3 appuyé → LED D9 allumée
const prog5 = compiler(ex5.solutionReference, { composants: ex5.composants }).octets;

test('carte neuve : PONG v2 avec la carte, la version et la place libre', { skip: sauter }, () => {
  const l = creerCarte().allumer(['attendre 50', 'envoyer PING', 'attendre 20']);
  assert.deepStrictEqual(recu(l), ['PONG v2 0.1 uno 0 1024']);
});

test('programme envoyé : gardé, exécuté, et il redémarre seul après une coupure de courant', { skip: sauter }, () => {
  const carte = creerCarte();
  // Bouton poussoir vers GND : relâché = niveau HAUT (résistance interne), appuyé = BAS.
  let l = carte.allumer(['broche 3 1', 'attendre 50', ...scriptEnvoi(prog5), 'attendre 100', 'broche 3 0', 'attendre 100', 'broche 3 1', 'attendre 100']);
  assert.deepStrictEqual(recu(l).slice(-1), [`OK ${prog5.length}`]);
  assert.deepStrictEqual(sorties(l, 9), ['1', '0']);
  // Coupure : nouvelle mise sous tension, sans rien envoyer.
  l = carte.allumer(['broche 3 1', 'attendre 100', 'broche 3 0', 'attendre 100', 'envoyer PING', 'attendre 20']);
  assert.deepStrictEqual(sorties(l, 9), ['1']);
  assert.deepStrictEqual(recu(l), [`PONG v2 0.1 uno ${prog5.length} 1024`]);
});

test('« Vider la carte » : le programme est effacé, plus rien ne démarre', { skip: sauter }, () => {
  const carte = creerCarte();
  carte.allumer(['broche 3 1', ...scriptEnvoi(prog5), 'envoyer EFFACE', 'attendre 20']);
  const l = carte.allumer(['broche 3 1', 'attendre 50', 'broche 3 0', 'attendre 100', 'envoyer PING', 'attendre 20']);
  assert.deepStrictEqual(sorties(l, 9), []);
  assert.deepStrictEqual(recu(l), ['PONG v2 0.1 uno 0 1024']);
});

test('envoi interrompu (câble débranché) : la carte reste vide, jamais un programme à moitié écrit', { skip: sauter }, () => {
  const carte = creerCarte();
  carte.allumer(['broche 3 1', ...scriptEnvoi(prog5)]);
  carte.allumer(scriptEnvoi(prog5).slice(0, 4)); // PROG + un seul morceau, puis coupure
  const l = carte.allumer(['attendre 50', 'envoyer PING', 'attendre 20']);
  assert.deepStrictEqual(recu(l), ['PONG v2 0.1 uno 0 1024']);
});

test('programme abîmé ou trop grand : refusé', { skip: sauter }, () => {
  const abime = Uint8Array.from(prog5);
  abime[abime.length - 1] ^= 0x55;
  const l = creerCarte().allumer([...scriptEnvoi(abime), 'envoyer PROG 2000', 'attendre 10', 'envoyer H 00', 'attendre 10']);
  const r = recu(l);
  assert.deepStrictEqual(r.slice(-3), ['ERR CRC', 'ERR TAILLE', 'ERR CMD']);
  assert.ok(r.slice(0, -3).every((x) => x === 'OK'));
});

test('mode direct : sorties, lecture, surveillance avec anti-rebond, broches refusées', { skip: sauter }, () => {
  const l = creerCarte().allumer([
    'broche 7 1', 'attendre 50',
    'envoyer D 4 1', 'attendre 10',
    'envoyer M 7 P', 'attendre 10',
    'envoyer R 7', 'attendre 10',
    'envoyer W 7', 'attendre 10',
    'broche 7 0', 'attendre 50', // appui franc : signalé
    'broche 7 1', 'attendre 5', 'broche 7 0', 'attendre 5', // rebond de 5 ms : ignoré
    'broche 7 1', 'attendre 50',
    'envoyer D 1 1', 'attendre 10', // broche du câble USB
    'envoyer A 4 10', 'attendre 10', // pas de PWM sur D4
    'envoyer BONJOUR', 'attendre 10',
    'envoyer OFF', 'attendre 10',
  ]);
  assert.deepStrictEqual(recu(l), ['OK', 'OK', 'V 7 1', 'OK', 'E 7 0', 'E 7 1', 'ERR PIN', 'ERR PIN', 'ERR CMD', 'OK']);
  assert.deepStrictEqual(sorties(l, 4), ['1', '0']); // OFF : éteinte franchement (pas « faible »)
});

test('mode direct : sans message pendant 3 s, la carte éteint tout', { skip: sauter }, () => {
  const l = creerCarte().allumer(['attendre 50', 'envoyer D 4 1', 'attendre 2500', 'envoyer PING', 'attendre 2500', 'attendre 1000']);
  const extinction = l.find((x) => x.quoi === 'sortie' && x.broche === 4 && x.valeur === '0');
  const dernier = l.filter((x) => x.quoi === 'recu').pop();
  assert.ok(extinction, 'la LED doit s’éteindre');
  assert.ok(extinction.t - dernier.t >= 2950 && extinction.t - dernier.t < 3100, `éteinte ${extinction.t - dernier.t} ms après le dernier message`);
});

test('commande directe pendant qu’un programme tourne : le programme s’arrête et tout s’éteint', { skip: sauter }, () => {
  const clignote = compiler({ fils: [{ quand: 'boucle', corps: [{ bloc: 'led_etat', broche: 'D9', etat: 1 }, { bloc: 'attendre', duree: 0.1 }, { bloc: 'led_etat', broche: 'D9', etat: 0 }, { bloc: 'attendre', duree: 0.1 }] }] }).octets;
  const carte = creerCarte();
  carte.allumer(scriptEnvoi(clignote));
  const l = carte.allumer(['attendre 450', 'envoyer D 4 1', 'attendre 500']);
  const led9 = l.filter((x) => x.quoi === 'sortie' && x.broche === 9);
  assert.strictEqual(led9[led9.length - 1].valeur, '0'); // éteinte en passant en direct
  assert.ok(led9.every((x) => x.t < 470), 'le programme ne doit plus faire clignoter la LED');
});

test('servo : l’angle demandé arrive en largeur d’impulsion (0° ≈ 544 µs, 180° ≈ 2400 µs)', { skip: sauter }, () => {
  const l = creerCarte().allumer(['attendre 50', 'envoyer S 6 0', 'attendre 100', 'envoyer S 6 180', 'attendre 100', 'envoyer S 6 90', 'attendre 100']);
  const us = l.filter((x) => x.quoi === 'servo').map((x) => Number(x.valeur));
  assert.strictEqual(us.length, 3);
  assert.ok(Math.abs(us[0] - 544) < 20 && Math.abs(us[1] - 2400) < 20 && Math.abs(us[2] - 1472) < 20, String(us));
});
