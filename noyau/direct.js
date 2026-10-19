// Mode « En direct » (jalon 4) : le programme tourne dans le navigateur — le même simulateur, au rythme de l'horloge —
// et la vraie carte obéit : chaque changement d'une sortie part en commande du protocole v2, les boutons de la carte
// reviennent en événements (« E <broche> <niveau> ») et ses capteurs sont relus régulièrement.
// Ici, rien n'est envoyé : on calcule seulement les lignes à envoyer (testable sans carte). L'envoi, l'attente des
// réponses et le signe de vie sont dans interface/carte.js.
//
//   const d = creerDirect(programme, { composants, boutonsVersMasse, carte, capteurs });
//   d.depart            lignes à envoyer avant de lancer (OFF, modes des boutons, surveillance W)
//   d.avancer(t)        fait tourner le programme jusqu'à t (ms) → lignes à envoyer (sorties changées)
//   d.evenement(ligne)  « E 3 0 » reçu de la carte → le bouton change dans le programme
//   d.lectures          capteurs à relire : [{ ligne: 'X 1 2 3', appliquer(valeur) }]
//   d.fin               lignes à envoyer à l'arrêt (plus de surveillance, tout éteindre)
(function (global) {
  'use strict';

  const enNode = typeof module === 'object' && module.exports;
  const S = enNode ? require('./simulation.js') : global.LaboBlocs;
  const N = enNode ? require('./code-octet.js') : global.LaboBlocs.codeOctet;
  const K = () => (enNode ? require('./cartes.js') : global.LaboBlocs);

  // Commandes d'extension qui lisent un capteur (les autres agissent : moteurs, LED, écran, son).
  const LECTURES = { 1: [2, 3, 4, 5], 2: [5, 6, 7, 8, 9, 10, 13] };
  const estLecture = (e, c) => (LECTURES[e] || []).includes(c);

  // La carte ne lit que des entiers (« X 1 1 50 50 ») : les valeurs sont arrondies. Une note de la micro:bit dure
  // au moins 1 s en direct (sa durée est en secondes dans la commande) ; la suivante la remplace à son heure.
  function ligneExtension(e, c, args) {
    let a = args.map((x) => Math.round(Number(x) || 0));
    if (e === 2 && c === 12) a = [a[0], Math.max(1, Math.round(Number(args[1]) || 0))];
    return ['X', e, c, ...a].join(' ');
  }

  // Lectures que fait le programme : on cherche les commandes d'extension de lecture dans ses blocs (blocs de carte
  // déroulés). Seuls ces capteurs sont relus pendant le mode direct.
  function lecturesDuProgramme(programme) {
    const vues = new Map();
    const voir = (x) => {
      if (!x || typeof x !== 'object') return;
      if (Array.isArray(x)) return x.forEach(voir);
      if (x.bloc === 'ext' && estLecture(x.extension, x.commande)) {
        const args = (x.arguments || []).map((v) => (typeof v === 'number' ? v : v && v.bloc === 'nombre' ? Number(v.valeur) : 0));
        vues.set(`${x.extension} ${x.commande} ${args.join(' ')}`.trim(), { e: x.extension, c: x.commande, args });
      }
      if (x.bloc && K().BLOCS_CARTES && K().BLOCS_CARTES[x.bloc]) voir(K().deroulerBlocCarte(x));
      for (const v of Object.values(x)) if (v && typeof v === 'object') voir(v);
    };
    voir(programme);
    return [...vues.values()];
  }

  function creerDirect(programme, options) {
    const o = options || {};
    const carte = o.carte || 'uno';
    const versMasse = o.boutonsVersMasse !== false;
    const envoisExt = [];
    // Une commande qui redonne le même ordre (boucle sans attente : « avancer à 50 % » mille fois par seconde)
    // ne repart pas. Ordres liés : les deux moteurs ensemble ou chacun seul ; les deux LED ensemble ou chacune ;
    // l'écran de la micro:bit (une image, un point, un texte) ; l'afficheur du mBot. Un texte qui défile repart
    // quand il a fini de défiler (comme dans le simulateur).
    const derniers = new Map();
    // Ordres en plusieurs morceaux (texte, dessin de l'afficheur) : les morceaux attendent la dernière commande et
    // partent avec elle, ou pas du tout si l'ordre entier redonne le précédent.
    const MORCEAUX = { 1: [10, 14], 2: [14] };
    let morceaux = [];
    function groupe(e, c, a) {
      if (e === 1 && (c === 1 || c === 9)) return { cle: c === 1 ? 'moteurs' : 'moteur' + a[0], efface: c === 1 ? ['moteur1', 'moteur2'] : ['moteurs'] };
      if (e === 1 && c === 6) return { cle: 'led' + a[0], efface: Number(a[0]) === 0 ? ['led1', 'led2'] : ['led0'] };
      if (e === 2 && [1, 2, 3, 4, 11].includes(c)) return { cle: 'ecran', efface: [] };
      if (e === 1 && [11, 12, 13, 15].includes(c)) return { cle: 'matrice', efface: [] };
      return null;
    }
    // Durée d'un texte qui défile (ms) ; un ordre qui ne défile pas reste valable tant qu'un autre ne le remplace pas.
    function dureeDefilement(e, c, ordre) {
      const lettres = ordre.reduce((n, l) => n + l.split(' ').length - 3, 0);
      if (e === 2 && c === 11) return (lettres * 6 + 5) * 150;
      let colonnes = e === 1 && c === 15 ? lettres * 6 - 1 : 0;
      if (e === 1 && c === 12) {
        const n = K().texteNombre(Number(ordre[ordre.length - 1].split(' ')[3]));
        if (!n.etroit) colonnes = n.texte.length * 6 - 1;
      }
      return colonnes > 16 ? (colonnes + 16) * K().DUREE_COLONNE_MATRICE : Infinity;
    }
    function envoyerExtension(e, c, args) {
      if (e === 3 || e === 4) return; // caméra, clavier : dans l'ordinateur, jamais vers la carte
      const ligne = ligneExtension(e, c, args);
      if ((MORCEAUX[e] || []).includes(c)) return morceaux.push(ligne);
      const ordre = morceaux.concat(ligne);
      morceaux = [];
      const g = groupe(e, c, args.map((x) => Math.round(Number(x) || 0)));
      if (g) {
        const avant = derniers.get(g.cle);
        if (avant && avant.ordre === ordre.join('\n') && sim.t < avant.jusqua) return;
        derniers.set(g.cle, { ordre: ordre.join('\n'), jusqua: sim.t + dureeDefilement(e, c, ordre) });
        for (const k of g.efface) derniers.delete(k);
      }
      envoisExt.push(...ordre);
    }
    const sim = S.creerSimulation(programme, {
      composants: o.composants,
      boutonsVersMasse: o.boutonsVersMasse,
      carte,
      capteurs: o.capteurs,
      surExtension: (e, c, args) => {
        if (!estLecture(e, c)) envoyerExtension(e, c, args);
      },
    });
    const numero = (b) => N.numeroBroche(b);
    const boutons = (o.composants || []).filter((c) => c.type === 'bouton');

    // Au départ : tout éteint, boutons en entrée (avec la résistance interne s'ils vont à la masse), surveillés.
    const depart = ['OFF'];
    for (const b of boutons) depart.push(`M ${numero(b.broche)} ${versMasse ? 'P' : 'I'}`);
    if (boutons.length) depart.push('W ' + boutons.map((b) => numero(b.broche)).join(' '));

    let lu = 0; // entrées du journal déjà traduites en commandes
    function avancer(t) {
      envoisExt.length = 0;
      sim.avancerJusqua(Math.max(t, sim.t));
      const parBroche = new Map(); // une broche changée plusieurs fois : seul son dernier état part
      const lignes = [];
      for (; lu < sim.journal.length; lu++) {
        const j = sim.journal[lu];
        if (!/^[DP]\d+$/.test(j.broche)) continue; // moteurs, LED du mBot, haut-parleur : par les commandes X
        const n = numero(j.broche);
        if (j.type === 'led') parBroche.set(n, `D ${n} ${j.valeur ? 1 : 0}`);
        else if (j.type === 'pwm') parBroche.set(n, `A ${n} ${Math.round(j.valeur)}`);
        else if (j.type === 'servo') parBroche.set(n, `S ${n} ${Math.max(0, Math.min(180, Math.round(j.valeur)))}`);
        else if (j.type === 'son' && j.valeur > 0) lignes.push(`T ${n} ${Math.round(j.valeur)} ${Math.max(1, Math.round(j.duree))}`);
      }
      // Les sorties d'abord, puis les commandes de carte, dans l'ordre où le programme les a données.
      return [...parBroche.values(), ...lignes, ...envoisExt.splice(0)];
    }

    // « E 3 0 » : niveau électrique de la broche 3. Bouton vers la masse : appuyé = niveau 0.
    function evenement(ligne) {
      const m = /^E (\d+) ([01])/.exec(ligne || '');
      if (!m) return false;
      const b = boutons.find((x) => numero(x.broche) === Number(m[1]));
      if (!b) return false;
      const niveau = Number(m[2]);
      sim.changerEntree(b.broche, versMasse ? (niveau ? 0 : 1) : niveau);
      return true;
    }

    // Capteurs relus pendant le mode direct, rangés là où le programme les lit (sim.capteurs, sim.entrees).
    const lectures = lecturesDuProgramme(programme).map(({ e, c, args }) => {
      const ligne = ['X', e, c, ...args].join(' ');
      let appliquer = () => {};
      const entree = (nom) => (v) => {
        if ((sim.entrees[nom] || 0) !== (v ? 1 : 0)) sim.changerEntree(nom, v ? 1 : 0);
      };
      const capteur = (nom) => (v) => {
        if (sim.capteurs) sim.capteurs[nom] = v;
      };
      if (e === 1) appliquer = { 2: capteur('distance'), 3: capteur('ligne'), 4: entree('bouton'), 5: capteur('lumiere') }[c];
      else if (e === 2) {
        if (c === 5) appliquer = entree('A');
        else if (c === 6) appliquer = entree('B');
        else if (c === 9) appliquer = entree('logo');
        else if (c === 7) appliquer = capteur(['x', 'y', 'z'][(args[0] || 1) - 1] || 'x');
        else if (c === 8) appliquer = capteur('temperature');
        else if (c === 10) appliquer = capteur('lumiere');
        else if (c === 13) {
          // Geste : la carte dit seulement « oui » pour le geste demandé.
          appliquer = (v) => {
            if (!sim.capteurs) return;
            if (v) sim.capteurs.geste = args[0];
            else if (Number(sim.capteurs.geste) === Number(args[0])) sim.capteurs.geste = 0;
          };
        }
      }
      return { ligne, appliquer };
    });

    // Réponse « V 12 » à une lecture.
    function lire(lecture, reponse) {
      const m = /^V (-?[\d.]+)/.exec(reponse || '');
      if (!m) return false;
      lecture.appliquer(Number(m[1]));
      return true;
    }

    return { sim, depart, avancer, evenement, lectures, lire, fin: boutons.length ? ['W', 'OFF'] : ['OFF'] };
  }

  const api = { creerDirect, lecturesDuProgramme, ligneExtension };
  if (enNode) module.exports = api;
  else Object.assign((global.LaboBlocs = global.LaboBlocs || {}), api);
})(this);
