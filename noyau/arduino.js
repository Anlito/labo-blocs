// Traduction d'un programme (v1 ou atelier) en programme Arduino (C++), pour le panneau « code » du niveau 3
// (lecture seule) et l'export de secours vers l'IDE Arduino. Chaque bloc connaît ses lignes : un clic sur un bloc
// surligne son code.
//
// Choix électriques (comme l'atelier du distributeur) :
//   - LED : sortie numérique, HAUT = allumée ;
//   - bouton poussoir à 2 fils (signal + GND) : résistance interne (INPUT_PULLUP), appuyé = broche à la masse ;
//     dans les blocs, « état du bouton = HAUT » veut toujours dire « appuyé » : la fonction bouton() traduit.
//     Option boutonsVersMasse = false : module bouton qui donne HAUT quand on appuie (INPUT) ;
//   - servo-moteur : bibliothèque Servo, angle borné à 0–180.
// Sortie : { code, lignes: { idBloc: [première, dernière] } } (lignes comptées à partir de 1).

(function (global) {
  'use strict';

  const P = typeof module === 'object' && module.exports ? require('./programme.js') : global.LaboBlocs;

  const numero = (broche) => {
    const s = String(broche).toUpperCase();
    const a = /^A(\d)$/.exec(s);
    if (a) return 'A' + a[1];
    const n = Number(s.replace(/^[DP]/, ''));
    if (!Number.isInteger(n) || n < 0 || n > 20) throw new Error('Broche inconnue : ' + broche);
    return String(n);
  };
  const OPS = { '+': '+', '-': '-', '×': '*', '÷': '/' };
  const COMP = { '=': '==', '≠': '!=', '<': '<', '≤': '<=', '>': '>', '≥': '>=' };
  const nomC = (v) => String(v || 'CHOIX').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_]/g, '_').replace(/^(\d)/, '_$1');

  function versArduino(programme, options) {
    const o = options || {};
    const v1 = P.versV1(programme);
    const versMasse = o.boutonsVersMasse !== false;
    const leds = new Set();
    const boutons = new Set();
    const servos = new Set();
    const sons = new Set();
    const variables = new Set();
    let hasard = false;
    let modulo = false;

    (function parcourir(x) {
      if (!x || typeof x !== 'object') return;
      if (Array.isArray(x)) return x.forEach(parcourir);
      if (x.bloc === 'led_etat') leds.add(numero(x.broche));
      if (x.bloc === 'bouton_etat' || x.quand === 'appui' || x.quand === 'relache') boutons.add(numero(x.broche));
      if (x.bloc === 'servo_angle') servos.add(numero(x.broche));
      if (x.bloc === 'son') sons.add(numero(x.broche));
      if (x.bloc === 'variable' || x.bloc === 'affecter' || x.bloc === 'ajouter_a') variables.add(nomC(x.variable));
      if (x.bloc === 'hasard') hasard = true;
      if (x.bloc === 'operation' && x.op === 'mod') modulo = true;
      for (const v of Object.values(x)) if (v && typeof v === 'object') parcourir(v);
    })(v1.fils);

    const lignes = [];
    const carte = {};
    const ajouter = (t) => lignes.push(t);
    const nombre = (n) => String(Number(n) || 0);

    function expression(e) {
      if (e === null || e === undefined) return '0';
      if (typeof e === 'number') return nombre(e);
      switch (e.bloc) {
        case 'nombre':
          return nombre(e.valeur);
        case 'variable':
          return nomC(e.variable);
        case 'bouton_etat':
          return `bouton(${numero(e.broche)})`;
        case 'valeur_haut_bas':
          return e.valeur ? 'HIGH' : 'LOW';
        case 'comparaison':
          return `(${expression(e.a)} ${COMP[e.op] || '=='} ${expression(e.b)})`;
        case 'operation':
          return e.op === 'mod' ? `reste(${expression(e.a)}, ${expression(e.b)})` : `(${expression(e.a)} ${OPS[e.op] || '+'} ${expression(e.b)})`;
        case 'logique':
          return `(${expression(e.a)} ${e.op === 'ou' ? '||' : '&&'} ${expression(e.b)})`;
        case 'non':
          return `!(${expression(e.a)})`;
        case 'hasard':
          return `random(${expression(e.min)}, ${expression(e.max)} + 1)`;
        default:
          return '0';
      }
    }

    let profondeur = 0; // compteurs des boucles « répéter n fois » : i, j, k…
    function instructions(liste, retrait) {
      const r = ' '.repeat(retrait);
      for (const i of liste || []) {
        const debut = lignes.length + 1;
        switch (i.bloc) {
          case 'led_etat':
            ajouter(`${r}digitalWrite(${numero(i.broche)}, ${i.etat ? 'HIGH' : 'LOW'});`);
            break;
          case 'attendre':
            ajouter(`${r}attendre(${expression(i.duree)});`);
            break;
          case 'servo_angle':
            ajouter(`${r}servo${numero(i.broche)}.write(constrain((int)(${expression(i.angle)}), 0, 180));`);
            break;
          case 'son':
            ajouter(`${r}tone(${numero(i.broche)}, ${expression(i.frequence)}, (unsigned long)(${expression(i.duree)} * 1000));`);
            break;
          case 'affecter':
            ajouter(`${r}${nomC(i.variable)} = ${expression(i.valeur)};`);
            break;
          case 'ajouter_a':
            ajouter(`${r}${nomC(i.variable)} = ${nomC(i.variable)} + ${expression(i.valeur)};`);
            break;
          case 'si_alors':
          case 'si_sinon':
            ajouter(`${r}if (${expression(i.condition)}) {`);
            instructions(i.alors, retrait + 2);
            if (i.bloc === 'si_sinon') {
              ajouter(`${r}} else {`);
              instructions(i.sinon, retrait + 2);
            }
            ajouter(`${r}}`);
            break;
          case 'repeter_n': {
            const c = 'ijklmn'[Math.min(profondeur, 5)];
            profondeur++;
            ajouter(`${r}for (int ${c} = 0; ${c} < ${expression(i.fois)}; ${c}++) {`);
            instructions(i.corps, retrait + 2);
            ajouter(`${r}}`);
            profondeur--;
            break;
          }
          case 'tant_que':
          case 'repeter_jusqua':
            ajouter(`${r}while (${i.bloc === 'tant_que' ? expression(i.condition) : `!${expression(i.condition)}`}) {`);
            instructions(i.corps, retrait + 2);
            ajouter(`${r}}`);
            break;
          default:
            continue;
        }
        if (i.id !== undefined) carte[i.id] = [debut, lignes.length];
      }
    }

    const fil = (q) => v1.fils.find((f) => f.quand === q) || { corps: [] };
    const evenements = v1.fils.filter((f) => f.quand === 'appui' || f.quand === 'relache');
    const trier = (e) => [...e].sort((a, b) => String(a).localeCompare(String(b), 'fr', { numeric: true }));

    ajouter(`// ${o.titre || 'Programme'} — écrit par Labo Blocs à partir des blocs.`);
    ajouter(versMasse ? '// LED : HAUT = allumée. Bouton poussoir (signal + GND) : HAUT = appuyé. Servo : 0° à 180°.' : '// LED : HAUT = allumée. Module bouton : HAUT = appuyé. Servo : 0° à 180°.');
    // Caméra et IA : dans l'ordinateur, pas dans la carte (ses blocs valent 0 ici, ses événements ne sont pas écrits).
    if (JSON.stringify(v1.fils).includes('camera')) {
      ajouter('// La caméra et son IA sont dans l’ordinateur : ce programme marche seulement en mode « En direct ».');
      ajouter('// Ici, les blocs de la caméra valent 0 et les « quand la caméra … » ne sont pas écrits.');
    }
    // Clavier de l'ordinateur : même chose que la caméra.
    if (P.utiliseClavier && P.utiliseClavier(v1)) {
      ajouter('// Le clavier est celui de l’ordinateur : ce programme marche seulement en mode « En direct ».');
      ajouter('// Ici, « la touche … est appuyée » vaut 0 et les « quand la touche … » ne sont pas écrits.');
    }
    if (servos.size) ajouter('#include <Servo.h>');
    ajouter('');
    for (const n of trier(servos)) ajouter(`Servo servo${n};`);
    for (const v of trier(variables)) ajouter(`float ${v} = 0;`);
    if (servos.size || variables.size) ajouter('');
    ajouter('// « attendre » en secondes (les nombres à virgule sont acceptés).');
    ajouter('void attendre(float secondes) {');
    ajouter('  if (secondes > 0) delay((unsigned long)(secondes * 1000.0));');
    ajouter('}');
    ajouter('');
    if (boutons.size) {
      ajouter(versMasse ? '// État du bouton : HAUT quand il est appuyé (il relie alors la broche à la masse).' : '// État du bouton : HAUT quand il est appuyé.');
      ajouter('int bouton(int broche) {');
      ajouter(versMasse ? '  return digitalRead(broche) == LOW ? HIGH : LOW;' : '  return digitalRead(broche);');
      ajouter('}');
      ajouter('');
    }
    if (modulo) {
      ajouter('// Reste de la division, du signe du diviseur (comme dans les blocs).');
      ajouter('float reste(float a, float b) {');
      ajouter('  if (b == 0) return 0;');
      ajouter('  float r = fmod(a, b);');
      ajouter('  return (r != 0 && ((r < 0) != (b < 0))) ? r + b : r;');
      ajouter('}');
      ajouter('');
    }
    evenements.forEach((f, k) => {
      ajouter(`// Quand le bouton ${numero(f.broche)} est ${f.quand === 'appui' ? 'appuyé' : 'relâché'}.`);
      ajouter(`// (Dans Labo Blocs, ce bloc tourne en même temps que « Répéter indéfiniment ».)`);
      ajouter(`int avant${k + 1} = LOW;`);
      ajouter(`void quand${k + 1}() {`);
      instructions(f.corps, 2);
      ajouter('}');
      ajouter('');
    });
    ajouter('void setup() {');
    for (const n of trier(leds)) {
      ajouter(`  pinMode(${n}, OUTPUT);`);
      ajouter(`  digitalWrite(${n}, LOW);`);
    }
    for (const n of trier(boutons)) ajouter(`  pinMode(${n}, ${versMasse ? 'INPUT_PULLUP' : 'INPUT'});`);
    for (const n of trier(sons)) ajouter(`  pinMode(${n}, OUTPUT);`);
    if (hasard) ajouter('  randomSeed(analogRead(A5));');
    // Angle de départ : le premier angle fixe donné dans « Au démarrage », réglé AVANT d'activer le servo
    // (sinon le bras saute d'abord à 0°) ; 0° sinon, comme le simulateur.
    for (const n of trier(servos)) {
      const premier = fil('demarrage').corps.find((i) => i.bloc === 'servo_angle' && numero(i.broche) === n);
      const angle = premier && (typeof premier.angle === 'number' || (premier.angle && premier.angle.bloc === 'nombre')) ? expression(premier.angle) : '0';
      ajouter(`  servo${n}.write(${angle});`);
      ajouter(`  servo${n}.attach(${n});`);
    }
    instructions(fil('demarrage').corps, 2);
    ajouter('}');
    ajouter('');
    ajouter('void loop() {');
    evenements.forEach((f, k) => {
      const n = numero(f.broche);
      ajouter(`  if (bouton(${n}) != avant${k + 1}) {`);
      ajouter(`    avant${k + 1} = bouton(${n});`);
      ajouter(`    if (avant${k + 1} == ${f.quand === 'appui' ? 'HIGH' : 'LOW'}) quand${k + 1}();`);
      ajouter('  }');
    });
    instructions(fil('boucle').corps, 2);
    // Un tour de boucle dure au moins 1 ms, comme dans le simulateur.
    ajouter('  delay(1);');
    ajouter('}');
    return { code: lignes.join('\n') + '\n', lignes: carte };
  }

  const api = { versArduino };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign((global.LaboBlocs = global.LaboBlocs || {}), api);
})(this);
