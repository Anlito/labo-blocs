// Cartes de Labo Blocs (jalon 3) : profils (Arduino Uno, mBot, micro:bit V2) et blocs propres à une carte.
//
// Un profil dit ce qu'on branche où (broches proposées dans les menus des blocs), quel programme de la carte installer
// (cartes/firmwares.js) et comment (« serie » : depuis le navigateur ; « fichier » : à copier sur le lecteur de la carte).
//
// Les blocs d'une carte (mBot, micro:bit) sont décrits ici une seule fois : l'éditeur de blocs (interface/blocs.js), le
// programme (noyau/programme.js) et le compilateur (noyau/code-octet.js) lisent cette description. Chaque bloc se
// « déroule » en blocs de base : commande d'extension (ext), attendre, son, calculs. Le même code octet tourne dans
// le simulateur et dans la carte.
//   Extension 1 = mBot : 1 moteurs (gauche, droite) · 2 ultrasons (port) → cm · 3 suiveur de ligne (port) → 0..3 ·
//     4 bouton de la carte · 5 lumière · 6 LED RGB (quelle, rouge, vert, bleu) · 9 un moteur (1 gauche | 2 droite, vitesse)
//   Extension 2 = micro:bit : 1 nombre · 2 image · 3 pixel (x, y, 0..9) · 4 effacer · 5 bouton A · 6 bouton B ·
//     7 accélération (axe) · 8 température · 9 logo touché · 10 lumière · 11 texte (codes des lettres) ·
//     12 note (Hz, s) · 13 geste · 14 lettres du texte à suivre (4 par commande)
(function (global) {
  'use strict';

  // Version du programme de la carte attendue par cet outil (« carte pas à jour » si la carte répond autre chose).
  const VERSION_FIRMWARE = '0.2';

  const serie = (debut, fin, prefixe) => Array.from({ length: fin - debut + 1 }, (_, i) => prefixe + (debut + i));
  const D = serie(2, 13, 'D');
  const P = ['P0', 'P1', 'P2'];

  const PROFILS = {
    uno: {
      id: 'uno',
      nom: 'Arduino Uno',
      firmware: 'uno',
      reponse: 'uno', // nom de la carte dans « PONG v2 <version> <carte> … »
      installation: 'serie',
      broches: { led: D, bouton: D, servo: ['D5', 'D6'], buzzer: D },
      composants: ['led', 'bouton', 'servo', 'buzzer'],
    },
    mbot: {
      id: 'mbot',
      nom: 'mBot (carte mCore)',
      firmware: 'mbot',
      reponse: 'mcore',
      installation: 'serie',
      broches: { led: [], bouton: [], servo: [], buzzer: [] },
      composants: [],
      // Branchements imposés aux élèves (décision du 14/10/2026).
      ports: { ultrasons: 3, ligne: 2 },
    },
    microbit: {
      id: 'microbit',
      nom: 'micro:bit V2',
      firmware: 'microbitV2',
      reponse: 'microbit-v2',
      installation: 'fichier',
      broches: { led: P, bouton: P, servo: P, buzzer: P },
      composants: ['led', 'bouton', 'servo'],
    },
  };

  const profil = (carte) => PROFILS[carte] || PROFILS.uno;

  // ---------- Blocs propres à une carte ----------

  const ext = (extension, commande, args) => ({ bloc: 'ext', extension, commande, arguments: args || [] });
  const oppose = (v) => ({ bloc: 'operation', op: '×', a: v, b: -1 });
  const cmp = (op, a, b) => ({ bloc: 'comparaison', op, a, b });
  const attendre = (duree) => ({ bloc: 'attendre', duree });

  // Notes de la gamme (la fréquence en Hz est la valeur). Libellés sans suffixe commun : Blockly le sortirait du menu.
  const NOTES = [
    ['Do', '262'],
    ['Ré', '294'],
    ['Mi', '330'],
    ['Fa', '349'],
    ['Sol', '392'],
    ['La', '440'],
    ['Si', '494'],
    ['Do aigu', '523'],
  ];
  const COULEURS_LED = {
    rouge: [255, 0, 0],
    vert: [0, 255, 0],
    bleu: [0, 0, 255],
    jaune: [255, 200, 0],
    violet: [200, 0, 255],
    cyan: [0, 200, 255],
    blanc: [255, 255, 255],
    eteinte: [0, 0, 0],
  };
  const IMAGES = [
    ['sourire', '1'],
    ['triste', '2'],
    ['cœur', '3'],
    ['oui ✓', '4'],
    ['non ✗', '5'],
    ['flèche haut', '6'],
    ['flèche droite', '7'],
    ['flèche bas', '8'],
    ['flèche gauche', '9'],
  ];
  const GESTES = [
    ['secouée', '1'],
    ['logo vers le haut', '2'],
    ['logo vers le bas', '3'],
    ['penchée à gauche', '4'],
    ['penchée à droite', '5'],
    ['écran vers le haut', '6'],
    ['écran vers le bas', '7'],
  ];

  // Les lettres que l'écran du micro:bit sait afficher : sans accents, 40 au plus.
  function codesTexte(texte) {
    return String(texte || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^\x20-\x7e]/g, '?')
      .slice(0, 40)
      .split('')
      .map((c) => c.charCodeAt(0));
  }

  // Description d'un bloc :
  //   carte, categorie, sorte ('instruction' | 'valeur' | 'condition'), texte (message Blockly : %CHAMP ou %ENTREE),
  //   champs { NOM: options [[libellé, valeur]] | 'texte' }, entrees { NOM: valeur de départ }, derouler(p) → blocs de base
  //   (p : les champs et entrées du bloc, nommés en minuscules : DIRECTION → p.direction)
  const BLOCS = {
    // ----- mBot : moteurs -----
    mbot_deplacer: {
      carte: 'mbot',
      categorie: 'mbot_moteurs',
      sorte: 'instruction',
      texte: '%DIRECTION à la vitesse %VITESSE %',
      champs: { DIRECTION: [['avancer', 'avancer'], ['reculer', 'reculer'], ['tourner à gauche', 'gauche'], ['tourner à droite', 'droite']] },
      entrees: { VITESSE: 50 },
      derouler: (p) => ext(1, 1, vitesses(p.direction, p.vitesse)),
    },
    mbot_deplacer_pendant: {
      carte: 'mbot',
      categorie: 'mbot_moteurs',
      sorte: 'instruction',
      texte: '%DIRECTION à la vitesse %VITESSE % pendant %DUREE s',
      champs: { DIRECTION: [['avancer', 'avancer'], ['reculer', 'reculer'], ['tourner à gauche', 'gauche'], ['tourner à droite', 'droite']] },
      entrees: { VITESSE: 50, DUREE: 1 },
      derouler: (p) => [ext(1, 1, vitesses(p.direction, p.vitesse)), attendre(p.duree), ext(1, 1, [0, 0])],
    },
    mbot_arreter: { carte: 'mbot', categorie: 'mbot_moteurs', sorte: 'instruction', texte: 'arrêter les moteurs', derouler: () => ext(1, 1, [0, 0]) },
    mbot_moteur: {
      carte: 'mbot',
      categorie: 'mbot_moteurs',
      sorte: 'instruction',
      texte: 'moteur %MOTEUR à la vitesse %VITESSE %',
      champs: { MOTEUR: [['gauche', '1'], ['droit', '2']] },
      entrees: { VITESSE: 50 },
      derouler: (p) => ext(1, 9, [Number(p.moteur) || 1, p.vitesse]),
    },
    // ----- mBot : capteurs (ultrasons sur le port 3, suiveur de ligne sur le port 2 : imposés) -----
    mbot_distance: { carte: 'mbot', categorie: 'mbot_capteurs', sorte: 'valeur', texte: 'distance mesurée par les ultrasons (cm)', derouler: () => ext(1, 2, [3]) },
    mbot_ligne: { carte: 'mbot', categorie: 'mbot_capteurs', sorte: 'valeur', texte: 'valeur du suiveur de ligne (0 à 3)', derouler: () => ext(1, 3, [2]) },
    mbot_ligne_voit: {
      carte: 'mbot',
      categorie: 'mbot_capteurs',
      sorte: 'condition',
      texte: 'le capteur %COTE du suiveur de ligne voit du %COULEUR',
      champs: { COTE: [['gauche', 'gauche'], ['droit', 'droit']], COULEUR: [['noir', 'noir'], ['blanc', 'blanc']] },
      // 0 : noir à gauche et à droite · 1 : noir à gauche · 2 : noir à droite · 3 : blanc des deux côtés (comme mBlock).
      derouler: (p) => {
        const v = ext(1, 3, [2]);
        if (p.cote === 'gauche') return p.couleur === 'noir' ? cmp('<', v, 2) : cmp('≥', v, 2);
        const reste = { bloc: 'operation', op: 'mod', a: v, b: 2 };
        return cmp('=', reste, p.couleur === 'noir' ? 0 : 1);
      },
    },
    mbot_bouton: { carte: 'mbot', categorie: 'mbot_capteurs', sorte: 'condition', texte: 'le bouton de la carte est appuyé', derouler: () => cmp('=', ext(1, 4, []), 1) },
    mbot_lumiere: { carte: 'mbot', categorie: 'mbot_capteurs', sorte: 'valeur', texte: 'lumière (capteur de la carte, 0 à 1023)', derouler: () => ext(1, 5, []) },
    // ----- mBot : LED et son -----
    mbot_led: {
      carte: 'mbot',
      categorie: 'mbot_led_son',
      sorte: 'instruction',
      texte: 'LED %QUELLE en %COULEUR',
      champs: {
        QUELLE: [['les deux', '0'], ['gauche', '2'], ['droite', '1']],
        COULEUR: [['rouge', 'rouge'], ['vert', 'vert'], ['bleu', 'bleu'], ['jaune', 'jaune'], ['violet', 'violet'], ['cyan', 'cyan'], ['blanc', 'blanc'], ['éteinte', 'eteinte']],
      },
      derouler: (p) => ext(1, 6, [Number(p.quelle) || 0, ...(COULEURS_LED[p.couleur] || COULEURS_LED.eteinte)]),
    },
    mbot_note: {
      carte: 'mbot',
      categorie: 'mbot_led_son',
      sorte: 'instruction',
      texte: 'jouer la note %NOTE pendant %DUREE s',
      champs: { NOTE: NOTES },
      entrees: { DUREE: 0.5 },
      // Le buzzer du mCore est sur D8. La note est jouée jusqu'au bout avant le bloc suivant (comme mBlock).
      derouler: (p) => [{ bloc: 'son', broche: 'D8', frequence: Number(p.note) || 440, duree: p.duree }, attendre(p.duree)],
    },

    // ----- micro:bit : écran -----
    mb_nombre: { carte: 'microbit', categorie: 'mb_ecran', sorte: 'instruction', texte: 'afficher le nombre %VALEUR', entrees: { VALEUR: 0 }, derouler: (p) => ext(2, 1, [p.valeur]) },
    mb_image: { carte: 'microbit', categorie: 'mb_ecran', sorte: 'instruction', texte: 'afficher l’image %IMAGE', champs: { IMAGE: IMAGES }, derouler: (p) => ext(2, 2, [Number(p.image) || 1]) },
    mb_texte: {
      carte: 'microbit',
      categorie: 'mb_ecran',
      sorte: 'instruction',
      texte: 'faire défiler le texte %TEXTE',
      champs: { TEXTE: 'texte' },
      defauts: { TEXTE: 'Bonjour' },
      // Une commande porte 4 valeurs au plus : le texte part en morceaux de 4 lettres (14), le dernier le fait défiler (11).
      derouler: (p) => {
        const codes = codesTexte(p.texte);
        const morceaux = [];
        for (let i = 0; i < codes.length; i += 4) morceaux.push(codes.slice(i, i + 4));
        if (!morceaux.length) morceaux.push([]);
        return morceaux.map((m, i) => ext(2, i === morceaux.length - 1 ? 11 : 14, m));
      },
    },
    mb_pixel: {
      carte: 'microbit',
      categorie: 'mb_ecran',
      sorte: 'instruction',
      texte: '%ETAT le point x %X y %Y',
      champs: { ETAT: [['allumer', '9'], ['éteindre', '0']] },
      entrees: { X: 2, Y: 2 },
      derouler: (p) => ext(2, 3, [p.x, p.y, Number(p.etat) || 0]),
    },
    mb_effacer: { carte: 'microbit', categorie: 'mb_ecran', sorte: 'instruction', texte: 'effacer l’écran', derouler: () => ext(2, 4, []) },
    // ----- micro:bit : boutons et gestes -----
    mb_bouton: {
      carte: 'microbit',
      categorie: 'mb_entrees',
      sorte: 'condition',
      texte: 'le bouton %BOUTON est appuyé',
      champs: { BOUTON: [['A', 'A'], ['B', 'B'], ['A et B', 'AB']] },
      derouler: (p) => (p.bouton === 'B' ? cmp('=', ext(2, 6, []), 1) : p.bouton === 'AB' ? { bloc: 'logique', op: 'et', a: cmp('=', ext(2, 5, []), 1), b: cmp('=', ext(2, 6, []), 1) } : cmp('=', ext(2, 5, []), 1)),
    },
    mb_logo: { carte: 'microbit', categorie: 'mb_entrees', sorte: 'condition', texte: 'le logo est touché', derouler: () => cmp('=', ext(2, 9, []), 1) },
    mb_geste: { carte: 'microbit', categorie: 'mb_entrees', sorte: 'condition', texte: 'la carte est %GESTE', champs: { GESTE: GESTES }, derouler: (p) => cmp('=', ext(2, 13, [Number(p.geste) || 1]), 1) },
    // ----- micro:bit : capteurs -----
    mb_acceleration: {
      carte: 'microbit',
      categorie: 'mb_capteurs',
      sorte: 'valeur',
      texte: 'accélération sur l’axe %AXE (mg)',
      champs: { AXE: [['x', '1'], ['y', '2'], ['z', '3']] },
      derouler: (p) => ext(2, 7, [Number(p.axe) || 1]),
    },
    mb_temperature: { carte: 'microbit', categorie: 'mb_capteurs', sorte: 'valeur', texte: 'température (°C)', derouler: () => ext(2, 8, []) },
    mb_lumiere: { carte: 'microbit', categorie: 'mb_capteurs', sorte: 'valeur', texte: 'lumière (0 à 255)', derouler: () => ext(2, 10, []) },
    // ----- micro:bit : son -----
    mb_note: {
      carte: 'microbit',
      categorie: 'mb_son',
      sorte: 'instruction',
      texte: 'jouer la note %NOTE pendant %DUREE s',
      champs: { NOTE: NOTES },
      entrees: { DUREE: 0.5 },
      derouler: (p) => [ext(2, 12, [Number(p.note) || 440, p.duree]), attendre(p.duree)],
    },
  };

  // avancer : les deux roues en avant ; tourner à gauche : la roue gauche recule (comme mBlock).
  function vitesses(direction, v) {
    switch (direction) {
      case 'reculer':
        return [oppose(v), oppose(v)];
      case 'gauche':
        return [oppose(v), v];
      case 'droite':
        return [v, oppose(v)];
      default:
        return [v, v];
    }
  }

  // Catégories de la palette pour ces blocs (famille « extensions » : lilas, pictogramme puzzle).
  const CATEGORIES_CARTES = [
    { nom: 'Moteurs', cle: 'mbot_moteurs', carte: 'mbot' },
    { nom: 'Capteurs', cle: 'mbot_capteurs', carte: 'mbot' },
    { nom: 'LED et son', cle: 'mbot_led_son', carte: 'mbot' },
    { nom: 'Écran', cle: 'mb_ecran', carte: 'microbit' },
    { nom: 'Boutons', cle: 'mb_entrees', carte: 'microbit' },
    { nom: 'Capteurs', cle: 'mb_capteurs', carte: 'microbit' },
    { nom: 'Musique', cle: 'mb_son', carte: 'microbit' },
  ].map((c) => Object.assign(c, { blocs: Object.keys(BLOCS).filter((t) => BLOCS[t].categorie === c.cle) }));

  // Bloc de carte → blocs de base (une instruction ou une liste ; une expression pour les valeurs et conditions).
  function derouler(bloc) {
    const d = BLOCS[bloc.bloc];
    if (!d) return null;
    const r = d.derouler(bloc);
    return r;
  }


  // ---------- Carte simulée (micro:bit : écran, boutons, capteurs ; mBot : moteurs, LED, capteurs) ----------
  //
  // Le simulateur (noyau/simulation.js) fait tourner le même code octet ; les commandes d'extension arrivent ici.
  // Boutons : entrées du simulateur nommées « A », « B », « logo » (micro:bit) et « bouton » (mBot), pour que les
  // scénarios puissent les appuyer comme un bouton branché. Moteurs et LED du mBot : sorties « moteur gauche »,
  // « moteur droit » (vitesse en %), « LED gauche », « LED droite » (couleur 0xRRVVBB).

  // Images de la micro:bit (même dessin que MicroPython), 5 lignes de 5 points (0 à 9).
  const DESSINS = {
    1: '00000:09090:00000:90009:09990',
    2: '00000:09090:00000:09990:90009',
    3: '09090:99999:99999:09990:00900',
    4: '00000:00009:00090:90900:09000',
    5: '90009:09090:00900:09090:90009',
    6: '00900:09990:90909:00900:00900',
    7: '00900:00090:99999:00090:00900',
    8: '00900:00900:90909:09990:00900',
    9: '00900:09000:99999:09000:00900',
  };
  const lireDessin = (d) => d.split(':').join('').split('').map(Number);

  // Petite police 5 × 5 pour l'écran simulé (majuscules, chiffres, quelques signes ; minuscules → majuscules).
  const POLICE = {
    ' ': '00000:00000:00000:00000:00000',
    0: '01100:10010:10010:10010:01100',
    1: '00100:01100:00100:00100:01110',
    2: '11100:00010:01100:10000:11110',
    3: '11110:00010:00100:10010:01100',
    4: '00110:01010:10010:11111:00010',
    5: '11111:10000:11110:00001:11110',
    6: '00010:00100:01110:10001:01110',
    7: '11111:00010:00100:01000:10000',
    8: '01110:10001:01110:10001:01110',
    9: '01110:10001:01110:00100:01000',
    A: '01100:10010:11110:10010:10010',
    B: '11100:10010:11100:10010:11100',
    C: '01110:10000:10000:10000:01110',
    D: '11100:10010:10010:10010:11100',
    E: '11110:10000:11100:10000:11110',
    F: '11110:10000:11100:10000:10000',
    G: '01110:10000:10011:10001:01110',
    H: '10010:10010:11110:10010:10010',
    I: '11100:01000:01000:01000:11100',
    J: '11111:00010:00010:10010:01100',
    K: '10010:10100:11000:10100:10010',
    L: '10000:10000:10000:10000:11110',
    M: '10001:11011:10101:10001:10001',
    N: '10001:11001:10101:10011:10001',
    O: '01100:10010:10010:10010:01100',
    P: '11100:10010:11100:10000:10000',
    Q: '01100:10010:10010:01100:00110',
    R: '11100:10010:11100:10010:10001',
    S: '01110:10000:01100:00010:11100',
    T: '11111:00100:00100:00100:00100',
    U: '10010:10010:10010:10010:01100',
    V: '10001:10001:10001:01010:00100',
    W: '10001:10001:10101:11011:10001',
    X: '10010:10010:01100:10010:10010',
    Y: '10001:01010:00100:00100:00100',
    Z: '11110:00100:01000:10000:11110',
    '!': '10000:10000:10000:00000:10000',
    '?': '11100:00010:01100:00000:01000',
    '.': '00000:00000:00000:00000:10000',
    ',': '00000:00000:00000:01000:10000',
    ':': '00000:01000:00000:01000:00000',
    '-': '00000:00000:11100:00000:00000',
    '+': '00000:01000:11100:01000:00000',
    '=': '00000:11100:00000:11100:00000',
    "'": '10000:10000:00000:00000:00000',
    '(': '01000:10000:10000:10000:01000',
    ')': '10000:01000:01000:01000:10000',
    '/': '00001:00010:00100:01000:10000',
    '*': '00000:01010:00100:01010:00000',
  };
  const glyphe = (c) => lireDessin(POLICE[String(c).toUpperCase()] || POLICE['?']).map((v) => v * 9);
  const DUREE_LETTRE = 400; // display.show(texte) : une lettre toutes les 400 ms
  const DUREE_COLONNE = 150; // display.scroll(texte) : une colonne toutes les 150 ms

  const CAPTEURS = {
    microbit: { temperature: 21, lumiere: 128, x: 0, y: 0, z: -1024, geste: 0 },
    mbot: { distance: 100, ligne: 3, lumiere: 500 },
  };
  const capteursDepart = (carte) => Object.assign({}, CAPTEURS[carte] || {});
  const couleurRgb = (r, v, b) => ((r & 255) << 16) | ((v & 255) << 8) | (b & 255);
  const borner = (v, min, max) => Math.max(min, Math.min(max, Math.round(Number(v) || 0)));

  // sim : le simulateur (t, entrees, capteurs, ecrire(nom, valeur, type), son(nom, frequence, ms)).
  function creerCarteSimulee(carte, sim) {
    const etat = { id: carte, ecran: new Array(25).fill(0), animation: null, lettres: [] };
    // Écran au temps t : l'animation (texte ou nombre de plusieurs chiffres) prend le pas sur les points.
    function poser(points) {
      etat.ecran = points.slice();
      etat.animation = null;
    }
    function ext(e, c, a) {
      if (carte === 'microbit' && e === 2) {
        switch (c) {
          case 1: {
            const v = Number(a[0]) || 0;
            const texte = Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
            if (texte.length === 1) poser(glyphe(texte));
            else etat.animation = { sorte: 'suite', texte, debut: sim.t };
            return 0;
          }
          case 2:
            poser(lireDessin(DESSINS[a[0]] || DESSINS[1]));
            return 0;
          case 3: {
            const ecran = ecranA(etat, sim.t);
            ecran[borner(a[1], 0, 4) * 5 + borner(a[0], 0, 4)] = borner(a[2], 0, 9);
            poser(ecran);
            return 0;
          }
          case 4:
            poser(new Array(25).fill(0));
            return 0;
          case 5:
            return sim.entrees.A ? 1 : 0;
          case 6:
            return sim.entrees.B ? 1 : 0;
          case 7:
            return Number(sim.capteurs[['x', 'y', 'z'][(Number(a[0]) || 1) - 1] || 'x']) || 0;
          case 8:
            return Number(sim.capteurs.temperature) || 0;
          case 9:
            return sim.entrees.logo ? 1 : 0;
          case 10:
            return Number(sim.capteurs.lumiere) || 0;
          case 14:
            etat.lettres.push(...a);
            return 0;
          case 11:
            etat.animation = { sorte: 'defile', texte: etat.lettres.concat(a).map((x) => String.fromCharCode(x)).join(''), debut: sim.t };
            etat.lettres = [];
            return 0;
          case 12:
            sim.son('haut-parleur', Number(a[0]) || 0, Math.round((Number(a[1]) || 0) * 1000));
            return 0;
          case 13:
            return Number(sim.capteurs.geste) === Number(a[0]) ? 1 : 0;
          default:
            return 0;
        }
      }
      if (carte === 'mbot' && e === 1) {
        switch (c) {
          case 1:
            sim.ecrire('moteur gauche', borner(a[0], -100, 100), 'moteur');
            sim.ecrire('moteur droit', borner(a[1], -100, 100), 'moteur');
            return 0;
          case 9:
            if (Number(a[0]) === 1) sim.ecrire('moteur gauche', borner(a[1], -100, 100), 'moteur');
            else if (Number(a[0]) === 2) sim.ecrire('moteur droit', borner(a[1], -100, 100), 'moteur');
            return 0;
          case 2:
            return Number(sim.capteurs.distance) || 0;
          case 3:
            return borner(sim.capteurs.ligne, 0, 3);
          case 4:
            return sim.entrees.bouton ? 1 : 0;
          case 5:
            return Number(sim.capteurs.lumiere) || 0;
          case 6: {
            // 0 : les deux, 1 : droite, 2 : gauche (à vérifier sur le robot).
            const couleur = couleurRgb(a[1], a[2], a[3]);
            const quelle = Number(a[0]) || 0;
            if (quelle !== 1) sim.ecrire('LED gauche', couleur, 'rgb');
            if (quelle !== 2) sim.ecrire('LED droite', couleur, 'rgb');
            return 0;
          }
          default:
            return 0;
        }
      }
      return 0;
    }
    return { etat, ext };
  }

  // Les 25 points de l'écran de la micro:bit au temps t (0 à 9).
  function ecranA(etat, t) {
    const a = etat && etat.animation;
    if (!a) return etat ? etat.ecran.slice() : new Array(25).fill(0);
    const ecoule = Math.max(0, t - a.debut);
    if (a.sorte === 'suite') {
      // Les chiffres l'un après l'autre ; le dernier reste affiché.
      const i = Math.min(a.texte.length - 1, Math.floor(ecoule / DUREE_LETTRE));
      return glyphe(a.texte[i]);
    }
    // Texte qui défile de droite à gauche : chaque lettre fait 5 colonnes, suivies d'une colonne vide.
    const colonnes = [];
    for (const lettre of a.texte) {
      const g = glyphe(lettre);
      for (let x = 0; x < 5; x++) colonnes.push([0, 1, 2, 3, 4].map((y) => g[y * 5 + x]));
      colonnes.push([0, 0, 0, 0, 0]);
    }
    const debut = Math.floor(ecoule / DUREE_COLONNE) - 5; // entre par la droite
    const ecran = new Array(25).fill(0);
    for (let x = 0; x < 5; x++) {
      const col = colonnes[debut + x];
      if (col) for (let y = 0; y < 5; y++) ecran[y * 5 + x] = col[y];
    }
    return ecran;
  }

  // Ce qui est déjà sur la carte (pas à brancher) : les scénarios de test peuvent l'appuyer ou le vérifier comme un
  // composant. libelle : son nom dans les phrases (« Quand le bouton A est appuyé… »).
  const COMPOSANTS_CARTE = {
    microbit: [
      { type: 'bouton', broche: 'A', libelle: 'le bouton A', integre: true },
      { type: 'bouton', broche: 'B', libelle: 'le bouton B', integre: true },
      { type: 'bouton', broche: 'logo', libelle: 'le logo', integre: true },
    ],
    mbot: [
      { type: 'bouton', broche: 'bouton', libelle: 'le bouton de la carte', integre: true },
      { type: 'moteur', broche: 'moteur gauche', libelle: 'le moteur gauche', integre: true },
      { type: 'moteur', broche: 'moteur droit', libelle: 'le moteur droit', integre: true },
    ],
  };
  const composantsCarte = (carte) => (COMPOSANTS_CARTE[carte] || []).map((c) => Object.assign({}, c));

  // Capteurs réglables à la main (simulateur) ou par un scénario de test ({ regler: { distance: 10 } }).
  const LIGNE = [
    ['noir sous les deux capteurs', 0],
    ['noir à gauche seulement', 1],
    ['noir à droite seulement', 2],
    ['blanc sous les deux capteurs', 3],
  ];
  const CAPTEURS_CARTE = {
    microbit: [
      { nom: 'temperature', libelle: 'température', unite: '°C', min: -10, max: 50 },
      { nom: 'lumiere', libelle: 'lumière', unite: '', min: 0, max: 255 },
      { nom: 'x', libelle: 'accélération x', unite: 'mg', min: -1024, max: 1024 },
      { nom: 'y', libelle: 'accélération y', unite: 'mg', min: -1024, max: 1024 },
      { nom: 'z', libelle: 'accélération z', unite: 'mg', min: -1024, max: 1024 },
      { nom: 'geste', libelle: 'geste', options: [['aucun', 0]].concat(GESTES.map(([t, v]) => [t, Number(v)])) },
    ],
    mbot: [
      { nom: 'distance', libelle: 'distance (ultrasons)', unite: 'cm', min: 2, max: 400 },
      { nom: 'ligne', libelle: 'suiveur de ligne', options: LIGNE },
      { nom: 'lumiere', libelle: 'lumière', unite: '', min: 0, max: 1023 },
    ],
  };
  const capteursCarte = (carte) => CAPTEURS_CARTE[carte] || [];

  // « l’obstacle est à 10 cm », « la température est de 30 °C » (phrases des scénarios).
  function decrireCapteur(nom, valeur) {
    const v = String(valeur).replace('.', ',');
    switch (nom) {
      case 'distance':
        return `l’obstacle est à ${v} cm`;
      case 'ligne':
        return `le suiveur de ligne voit ${((LIGNE.find((l) => l[1] === Number(valeur)) || LIGNE[3])[0]).replace('noir', 'du noir').replace('blanc', 'du blanc')}`;
      case 'lumiere':
        return `la lumière vaut ${v}`;
      case 'temperature':
        return `la température est de ${v} °C`;
      case 'geste': {
        const g = GESTES.find((x) => Number(x[1]) === Number(valeur));
        return g ? `la carte est ${g[0]}` : 'la carte est immobile';
      }
      default:
        return `l’accélération sur ${nom} vaut ${v} mg`;
    }
  }

  // Nom d'une couleur de LED du mBot (jamais la couleur seule à l'écran).
  function nomCouleur(rgb) {
    const r = (rgb >> 16) & 255;
    const v = (rgb >> 8) & 255;
    const b = rgb & 255;
    for (const [nom, c] of Object.entries(COULEURS_LED)) if (c[0] === r && c[1] === v && c[2] === b) return nom === 'eteinte' ? 'éteinte' : nom;
    return `rouge ${r}, vert ${v}, bleu ${b}`;
  }

  const api = { VERSION_FIRMWARE, PROFILS, profil, BLOCS_CARTES: BLOCS, CATEGORIES_CARTES, deroulerBlocCarte: derouler, codesTexte, NOTES, IMAGES, GESTES, COULEURS_LED, creerCarteSimulee, ecranA, capteursDepart, nomCouleur, composantsCarte, capteursCarte, decrireCapteur };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign((global.LaboBlocs = global.LaboBlocs || {}), api);
})(this);
