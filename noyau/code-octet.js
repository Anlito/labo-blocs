// Compilateur « programme en blocs → code octet » de Labo Blocs.
// Le même code octet est exécuté par le simulateur (noyau/vm.js), la Uno et le mBot (firmware/labo_blocs/vm.c)
// et le micro:bit (microbit/main.py) : un seul programme, le même comportement partout (jalon 0).
// Le format est décrit dans vm.c.
//
// Entrée : un programme v1 (voir docs/PLAN.md §3) ou un programme simplifié de l'atelier { demarrage, boucle }.
//   { fils: [ { quand: 'demarrage' | 'boucle' | 'appui' | 'relache', broche?, corps: [...] } ],
//     fonctions: [ { nom, parametres: [...], corps: [...] } ], listes: [ { nom, capacite } ] }
// Options : { composants: [{ type, broche }], boutonsVersMasse: true }
// Sortie : { octets: Uint8Array, erreurs: [], carte: [[adresse, idBloc], …] (pour surligner le bloc en cours),
//           noms: { variables: [nom par n°], broches: { n°: nom écrit dans le programme } } }

(function (global) {
  'use strict';

  // Description des blocs des cartes, lue au moment de compiler (l'ordre de chargement des scripts n'importe pas).
  const CARTES = () => (typeof module === 'object' && module.exports ? require('./cartes.js') : global.LaboBlocs);

  const FORMAT = 1;
  const BROCHE = { sortie: 1, boutonMasse: 2, boutonHaut: 3, servo: 4, son: 5, analogique: 6, pwm: 7 };
  const FIL = { demarrage: 0, boucle: 1, appui: 2, relache: 3 };
  const OP = {
    FIN: 0x00, NOMBRE: 0x01, ENTIER: 0x02, LIRE_VAR: 0x03, ECRIRE_VAR: 0x04,
    ADD: 0x05, SUB: 0x06, MUL: 0x07, DIV: 0x08, MOD: 0x09,
    EGAL: 0x0a, DIFF: 0x0b, INF: 0x0c, INF_EGAL: 0x0d, SUP: 0x0e, SUP_EGAL: 0x0f,
    ET: 0x10, OU: 0x11, NON: 0x12, OPPOSE: 0x13, SAUT: 0x14, SAUT_SI_FAUX: 0x15,
    LIRE_NUM: 0x16, LIRE_ANA: 0x17, ECRIRE_NUM: 0x18, ECRIRE_ANA: 0x19, SERVO: 0x1a, SON: 0x1b, SILENCE: 0x1c,
    ATTENDRE: 0x1d, HASARD: 0x1e, APPEL: 0x1f, RETOUR: 0x20,
    LISTE_LIRE: 0x21, LISTE_ECRIRE: 0x22, LISTE_AJOUTER: 0x23, LISTE_TAILLE: 0x24, LISTE_VIDER: 0x25,
    TEMPS: 0x26, DEPILER: 0x27, EXT: 0x28, PASSER: 0x29,
  };
  const COMPARAISONS = { '=': OP.EGAL, '≠': OP.DIFF, '<': OP.INF, '≤': OP.INF_EGAL, '>': OP.SUP, '≥': OP.SUP_EGAL };
  const OPERATIONS = { '+': OP.ADD, '-': OP.SUB, '×': OP.MUL, '÷': OP.DIV, mod: OP.MOD };

  // « ré-étalonner v depuis (a, b) vers (c, d) » → blocs de base, aucun nouvel ordre pour les cartes :
  // c + (v − a) × (d − c) ÷ (b − a), arrondi à l'entier le plus proche (t − (t mod 1) avec t = x + 0,5 : le reste
  // a le signe du diviseur). Si a = b, la division donne 0 (comme dans les cartes) : le résultat vaut c.
  function deroulerReetalonner(e) {
    const op = (o, a, b) => ({ bloc: 'operation', op: o, a, b });
    const x = op('+', e.vers1, op('÷', op('×', op('-', e.valeur, e.de1), op('-', e.vers2, e.vers1)), op('-', e.de2, e.de1)));
    const t = op('+', x, 0.5);
    return op('-', t, op('mod', t, 1));
  }

  // « D3 » → 3, « A0 » → 14 (numérotation Arduino Uno) ; micro:bit : « P0 » → 0 … « P20 » → 20.
  function numeroBroche(b) {
    const s = String(b).trim().toUpperCase();
    const p = /^P(\d+)$/.exec(s);
    if (p && Number(p[1]) <= 20) return Number(p[1]);
    let m = /^D?(\d+)$/.exec(s);
    if (m && Number(m[1]) <= 19) return Number(m[1]);
    m = /^A(\d)$/.exec(s);
    if (m && Number(m[1]) <= 7) return 14 + Number(m[1]);
    throw new Error('Broche inconnue : ' + b);
  }

  // Programme simplifié de l'atelier → programme v1.
  function versV1(p) {
    if (p && Array.isArray(p.fils)) return p;
    return {
      format: 'labo-blocs/programme',
      version: 1,
      fils: [
        { quand: 'demarrage', corps: (p && p.demarrage) || [] },
        { quand: 'boucle', corps: (p && p.boucle) || [] },
      ],
    };
  }

  function compiler(programme, options) {
    const opts = options || {};
    const prog = versV1(programme);
    const erreurs = [];
    const code = [];
    const variables = new Map();
    const listes = new Map();
    const broches = new Map();
    const fonctions = new Map();
    const appelsAResoudre = []; // { position, nom }
    let cachees = 0;

    const typeBouton = opts.boutonsVersMasse === false ? BROCHE.boutonHaut : BROCHE.boutonMasse;
    const TYPES_COMPOSANTS = { led: BROCHE.sortie, bouton: typeBouton, servo: BROCHE.servo, buzzer: BROCHE.son, potentiometre: BROCHE.analogique, capteur: BROCHE.analogique, pwm: BROCHE.pwm };
    for (const c of opts.composants || []) {
      if (TYPES_COMPOSANTS[c.type]) broches.set(numeroBroche(c.broche), TYPES_COMPOSANTS[c.type]);
    }
    const nomsBroches = {};
    for (const c of opts.composants || []) nomsBroches[numeroBroche(c.broche)] = c.broche;
    // Joystick : deux axes analogiques, un bouton vers la masse (toujours, quel que soit le réglage du parcours).
    const joystick = (opts.composants || []).find((c) => c.type === 'joystick');
    if (joystick) {
      for (const [b, type] of [[joystick.broche, BROCHE.analogique], [joystick.y, BROCHE.analogique], [joystick.bouton, BROCHE.boutonMasse]]) {
        broches.set(numeroBroche(b), type);
        nomsBroches[numeroBroche(b)] = b;
      }
    }
    const MANQUE_JOYSTICK = 'Ce programme utilise le joystick : il manque dans les composants de l’exercice.';
    const sansJoystick = () => erreurs.includes(MANQUE_JOYSTICK) || erreurs.push(MANQUE_JOYSTICK);
    const declarer = (b, type) => {
      const n = numeroBroche(b);
      if (!broches.has(n)) broches.set(n, type);
      if (!(n in nomsBroches)) nomsBroches[n] = b;
      return n;
    };
    const carte = []; // [position dans le code, id du bloc] au début de chaque instruction

    let portee = null; // paramètres de la fonction en cours de compilation : nom → n° de variable
    const variable = (nom) => {
      if (portee && portee.has(nom)) return portee.get(nom);
      if (!variables.has(nom)) variables.set(nom, variables.size);
      return variables.get(nom);
    };
    const cachee = (etiquette) => variable(`\u0000${etiquette}${cachees++}`);
    const liste = (nom) => {
      if (!listes.has(nom)) listes.set(nom, { n: listes.size, capacite: 16 });
      return listes.get(nom).n;
    };
    for (const l of prog.listes || []) {
      liste(l.nom || l);
      if (l.capacite) listes.get(l.nom).capacite = l.capacite;
    }
    for (const v of prog.variables || []) variable(v);

    const o8 = (x) => code.push(x & 0xff);
    const o16 = (x) => code.push(x & 0xff, (x >> 8) & 0xff);
    const trou16 = () => {
      const p = code.length;
      o16(0);
      return p;
    };
    const boucher = (p, valeur) => {
      code[p] = valeur & 0xff;
      code[p + 1] = (valeur >> 8) & 0xff;
    };
    // Les adresses sont relatives au début du code ; elles sont décalées de la taille de l'en-tête à la fin.
    const adresses = []; // positions des opérandes d'adresse à décaler

    function nombre(v) {
      const x = Number(v) || 0;
      if (Number.isInteger(x) && x >= -128 && x <= 127) {
        o8(OP.ENTIER);
        o8(x);
      } else {
        o8(OP.NOMBRE);
        const f = new Float32Array([x]);
        code.push(...new Uint8Array(f.buffer));
      }
    }

    function saut(op, cible) {
      o8(op);
      adresses.push(code.length);
      if (cible === undefined) return trou16();
      o16(cible);
      return null;
    }

    function expression(e) {
      if (e === null || e === undefined) return nombre(0);
      if (typeof e === 'number') return nombre(e);
      switch (e.bloc) {
        case 'nombre':
          return nombre(e.valeur);
        case 'valeur_haut_bas':
          return nombre(e.valeur ? 1 : 0);
        case 'variable':
          o8(OP.LIRE_VAR);
          return o8(variable(e.variable || 'CHOIX'));
        case 'bouton_etat':
          o8(OP.LIRE_NUM);
          return o8(declarer(e.broche, typeBouton));
        case 'entree_numerique':
          o8(OP.LIRE_NUM);
          return o8(declarer(e.broche, typeBouton));
        case 'entree_analogique':
          o8(OP.LIRE_ANA);
          return o8(declarer(e.broche, BROCHE.analogique));
        case 'comparaison':
          expression(e.a);
          expression(e.b);
          if (!(e.op in COMPARAISONS)) erreurs.push('Comparaison inconnue : ' + e.op);
          return o8(COMPARAISONS[e.op] || OP.EGAL);
        case 'operation':
          expression(e.a);
          expression(e.b);
          if (!(e.op in OPERATIONS)) erreurs.push('Opération inconnue : ' + e.op);
          return o8(OPERATIONS[e.op] || OP.ADD);
        case 'logique':
          expression(e.a);
          expression(e.b);
          return o8(e.op === 'ou' ? OP.OU : OP.ET);
        case 'non':
          expression(e.a);
          return o8(OP.NON);
        case 'hasard':
          expression(e.min);
          expression(e.max);
          return o8(OP.HASARD);
        case 'temps':
          return o8(OP.TEMPS);
        case 'liste_element':
          expression(e.position);
          o8(OP.LISTE_LIRE);
          return o8(liste(e.liste));
        case 'liste_taille':
          o8(OP.LISTE_TAILLE);
          return o8(liste(e.liste));
        case 'appel':
          return appel(e);
        case 'ext':
          return ext(e);
        case 'reetalonner':
          return expression(deroulerReetalonner(e));
        case 'joystick_position':
        case 'joystick_valeur':
        case 'joystick_direction':
        case 'joystick_bouton': {
          const d = CARTES().deroulerJoystick(e, opts.composants);
          if (d) return expression(d);
          sansJoystick();
          return nombre(0);
        }
        default: {
          // Bloc d'une carte (mBot, micro:bit) : déroulé en blocs de base (noyau/cartes.js).
          const d = CARTES().deroulerBlocCarte(e);
          if (d) return expression(d);
          erreurs.push('Bloc inconnu : ' + e.bloc);
          return nombre(0);
        }
      }
    }

    function appel(e) {
      const f = fonctions.get(e.fonction);
      if (!f) {
        erreurs.push('Fonction inconnue : ' + e.fonction);
        return nombre(0);
      }
      (e.arguments || []).forEach((a, i) => {
        expression(a);
        o8(OP.ECRIRE_VAR);
        o8(f.parametres[i]);
      });
      o8(OP.APPEL);
      adresses.push(code.length);
      appelsAResoudre.push({ position: code.length, nom: e.fonction });
      o16(0);
    }

    function ext(e) {
      // La carte reçoit 4 valeurs au plus par commande (vm.c, main.py).
      if ((e.arguments || []).length > 4) erreurs.push('Une commande de carte reçoit 4 valeurs au plus.');
      for (const a of e.arguments || []) expression(a);
      o8(OP.EXT);
      o8(e.extension);
      o8(e.commande);
      o8((e.arguments || []).length);
    }

    function suite(liste) {
      for (const i of liste || []) instruction(i);
    }

    function instruction(i) {
      if (i.id !== undefined) carte.push([code.length, i.id]);
      switch (i.bloc) {
        case 'led_etat':
          nombre(i.etat ? 1 : 0);
          o8(OP.ECRIRE_NUM);
          return o8(declarer(i.broche, BROCHE.sortie));
        case 'sortie_numerique':
          expression(i.valeur);
          o8(OP.ECRIRE_NUM);
          return o8(declarer(i.broche, BROCHE.sortie));
        case 'sortie_pwm':
          expression(i.valeur);
          o8(OP.ECRIRE_ANA);
          return o8(declarer(i.broche, BROCHE.pwm));
        case 'servo_angle':
          expression(i.angle);
          o8(OP.SERVO);
          return o8(declarer(i.broche, BROCHE.servo));
        case 'son':
          expression(i.frequence);
          expression(i.duree);
          o8(OP.SON);
          return o8(declarer(i.broche, BROCHE.son));
        case 'silence':
          o8(OP.SILENCE);
          return o8(declarer(i.broche, BROCHE.son));
        case 'attendre':
          expression(i.duree);
          return o8(OP.ATTENDRE);
        case 'affecter':
          expression(i.valeur);
          o8(OP.ECRIRE_VAR);
          return o8(variable(i.variable || 'CHOIX'));
        case 'ajouter_a': {
          const v = variable(i.variable);
          o8(OP.LIRE_VAR);
          o8(v);
          expression(i.valeur);
          o8(OP.ADD);
          o8(OP.ECRIRE_VAR);
          return o8(v);
        }
        case 'si_alors':
        case 'si_sinon': {
          expression(i.condition);
          const versSinon = saut(OP.SAUT_SI_FAUX);
          suite(i.alors);
          if (i.bloc === 'si_sinon') {
            const versFin = saut(OP.SAUT);
            boucher(versSinon, code.length);
            suite(i.sinon);
            boucher(versFin, code.length);
          } else boucher(versSinon, code.length);
          return;
        }
        case 'repeter_n': {
          const compteur = cachee('n');
          expression(i.fois);
          o8(OP.ECRIRE_VAR);
          o8(compteur);
          const debut = code.length;
          o8(OP.LIRE_VAR);
          o8(compteur);
          nombre(0);
          o8(OP.SUP);
          const sortie = saut(OP.SAUT_SI_FAUX);
          suite(i.corps);
          o8(OP.LIRE_VAR);
          o8(compteur);
          nombre(1);
          o8(OP.SUB);
          o8(OP.ECRIRE_VAR);
          o8(compteur);
          saut(OP.SAUT, debut);
          return boucher(sortie, code.length);
        }
        case 'tant_que':
        case 'repeter_jusqua': {
          const debut = code.length;
          expression(i.condition);
          if (i.bloc === 'repeter_jusqua') o8(OP.NON);
          const sortie = saut(OP.SAUT_SI_FAUX);
          suite(i.corps);
          saut(OP.SAUT, debut);
          return boucher(sortie, code.length);
        }
        case 'liste_ajouter':
          expression(i.valeur);
          o8(OP.LISTE_AJOUTER);
          return o8(liste(i.liste));
        case 'liste_remplacer':
          expression(i.position);
          expression(i.valeur);
          o8(OP.LISTE_ECRIRE);
          return o8(liste(i.liste));
        case 'liste_vider':
          o8(OP.LISTE_VIDER);
          return o8(liste(i.liste));
        case 'appeler':
          appel({ fonction: i.fonction, arguments: i.arguments });
          return o8(OP.DEPILER);
        case 'retourner':
          expression(i.valeur);
          return o8(OP.RETOUR);
        case 'ext':
          ext(i);
          return o8(OP.DEPILER);
        default: {
          const d = CARTES().deroulerBlocCarte(i);
          if (d) return (Array.isArray(d) ? d : [d]).forEach(instruction);
          erreurs.push('Bloc inconnu : ' + i.bloc);
        }
      }
    }

    // Fonctions : paramètres = variables cachées (pas d'appel récursif).
    for (const f of prog.fonctions || []) {
      fonctions.set(f.nom, { parametres: (f.parametres || []).map((p) => variable(`\u0000${f.nom}:${p}`)), adresse: 0, corps: f.corps });
    }

    const fils = [];
    let cameras = 0;
    for (const f of prog.fils) {
      // « Quand la caméra reconnaît X » (ou « ne reconnaît plus X ») : une boucle qui surveille la caméra et lance le
      // corps une fois à chaque changement (variable cachée « déjà vu »). Rien de nouveau pour la machine virtuelle.
      // « Quand le joystick est poussé vers … » : la même surveillance ; le corps part une fois, quand le joystick
      // arrive dans cette direction.
      if (f.quand === 'joystick') {
        const vu = CARTES().deroulerJoystick({ bloc: 'joystick_direction', direction: f.direction }, opts.composants);
        if (!vu) {
          sansJoystick();
          continue;
        }
        const deja = { bloc: 'variable', variable: `\u0000joystick${cameras++}` };
        const noter = (v) => ({ bloc: 'affecter', variable: deja.variable, valeur: v });
        const garde = { bloc: 'si_sinon', condition: vu, alors: [{ bloc: 'si_alors', condition: { bloc: 'non', a: deja }, alors: [noter(1), ...(f.corps || [])] }], sinon: [noter(0)] };
        if (f.id !== undefined) carte.push([code.length, f.id]);
        fils.push({ type: FIL.boucle, broche: 0, adresse: code.length });
        instruction(garde);
        o8(OP.FIN);
        continue;
      }
      // « Quand la touche X est appuyée (relâchée) » : la même surveillance, avec le clavier de l'ordinateur.
      if (f.quand === 'touche') {
        const deja = { bloc: 'variable', variable: `\u0000touche${cameras++}` };
        const vu = { bloc: 'comparaison', op: '=', a: { bloc: 'ext', extension: 4, commande: 1, arguments: [CARTES().codeTouche(f.touche)] }, b: 1 };
        const noter = (v) => ({ bloc: 'affecter', variable: deja.variable, valeur: v });
        const corps = f.corps || [];
        const garde = f.front === 'relache'
          ? { bloc: 'si_sinon', condition: vu, alors: [noter(1)], sinon: [{ bloc: 'si_alors', condition: deja, alors: [noter(0), ...corps] }] }
          : { bloc: 'si_sinon', condition: vu, alors: [{ bloc: 'si_alors', condition: { bloc: 'non', a: deja }, alors: [noter(1), ...corps] }], sinon: [noter(0)] };
        if (f.id !== undefined) carte.push([code.length, f.id]);
        fils.push({ type: FIL.boucle, broche: 0, adresse: code.length });
        instruction(garde);
        o8(OP.FIN);
        continue;
      }
      if (f.quand === 'camera') {
        const deja = { bloc: 'variable', variable: `\u0000camera${cameras++}` };
        const vu = { bloc: 'comparaison', op: '=', a: { bloc: 'ext', extension: 3, commande: 1, arguments: [Number(f.etiquette) || 0] }, b: 1 };
        const noter = (v) => ({ bloc: 'affecter', variable: deja.variable, valeur: v });
        const corps = f.corps || [];
        const garde = f.front === 'plus'
          ? { bloc: 'si_sinon', condition: vu, alors: [noter(1)], sinon: [{ bloc: 'si_alors', condition: deja, alors: [noter(0), ...corps] }] }
          : { bloc: 'si_sinon', condition: vu, alors: [{ bloc: 'si_alors', condition: { bloc: 'non', a: deja }, alors: [noter(1), ...corps] }], sinon: [noter(0)] };
        if (f.id !== undefined) carte.push([code.length, f.id]);
        fils.push({ type: FIL.boucle, broche: 0, adresse: code.length });
        instruction(garde);
        o8(OP.FIN);
        continue;
      }
      if (!(f.quand in FIL)) {
        erreurs.push('Événement inconnu : ' + f.quand);
        continue;
      }
      const broche = f.broche ? declarer(f.broche, typeBouton) : 0;
      fils.push({ type: FIL[f.quand], broche, adresse: code.length });
      suite(f.corps);
      o8(OP.FIN);
    }
    for (const [nom, f] of fonctions) {
      f.adresse = code.length;
      // Dans le corps, un paramètre se lit par son nom.
      const noms = prog.fonctions.find((x) => x.nom === nom).parametres || [];
      portee = new Map(noms.map((p, i) => [p, f.parametres[i]]));
      suite(f.corps);
      nombre(0);
      o8(OP.RETOUR);
      portee = null;
    }
    for (const a of appelsAResoudre) boucher(a.position, fonctions.get(a.nom).adresse);

    // En-tête.
    const tete = [];
    tete.push(Math.min(variables.size, 255));
    tete.push(listes.size);
    for (const l of listes.values()) tete.push(l.capacite);
    tete.push(broches.size);
    for (const [n, t] of [...broches].sort((a, b) => a[0] - b[0])) tete.push(n, t);
    tete.push(fils.length);
    const posFils = tete.length;
    for (const f of fils) tete.push(f.type, f.broche, 0, 0);
    const decalage = 7 + tete.length;
    fils.forEach((f, i) => {
      const a = f.adresse + decalage;
      tete[posFils + i * 4 + 2] = a & 0xff;
      tete[posFils + i * 4 + 3] = a >> 8;
    });
    for (const c of carte) c[0] += decalage;
    for (const p of adresses) {
      const a = code[p] + code[p + 1] * 256 + decalage;
      code[p] = a & 0xff;
      code[p + 1] = a >> 8;
    }

    const corps = tete.concat(code);
    const longueur = 7 + corps.length;
    let crc = 0xffff;
    for (const o of corps) crc = crc16(crc, o);
    const octets = new Uint8Array(longueur);
    octets.set([0x4c, 0x42, FORMAT, longueur & 0xff, longueur >> 8, crc & 0xff, crc >> 8]);
    octets.set(corps, 7);
    if (variables.size > 24) erreurs.push('Trop de variables (24 au plus).');
    // La carte garde 6 fils au plus. Un programme avec « quand la touche… » ou « quand la caméra… » ne va jamais dans la
    // carte (il tourne dans l'ordinateur) : 16 fils, une touche ou une étiquette par bloc (ex. les 4 flèches, appuyées
    // et relâchées).
    const dansLOrdinateur = prog.fils.some((f) => f.quand === 'touche' || f.quand === 'camera');
    const maxFils = dansLOrdinateur ? 16 : 6;
    if (fils.length > maxFils) erreurs.push(`Trop de blocs « quand… » : ${maxFils} au plus, avec « Au démarrage » et « Répéter indéfiniment ».`);
    const nomsVariables = [];
    for (const [nom, n] of variables) nomsVariables[n] = nom;
    return {
      octets,
      erreurs,
      carte,
      noms: { variables: nomsVariables, broches: nomsBroches },
      variables: variables.size,
      fils: fils.length,
      broches: broches.size,
    };
  }

  function crc16(crc, octet) {
    crc ^= octet << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    return crc;
  }

  const api = { compiler, versV1, numeroBroche, crc16, deroulerReetalonner, OP, FORMAT };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (global.LaboBlocs = global.LaboBlocs || {}).codeOctet = api;
})(this);
