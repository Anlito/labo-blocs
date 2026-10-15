// Simulateur de Labo Blocs : exécute un programme en temps virtuel (millisecondes), sans affichage.
// Il compile le programme en code octet et le fait tourner dans noyau/vm.js : exactement ce que fera la carte.
// L'écran l'avance au rythme de l'horloge (×1, ×2, ×5), la vérification l'avance d'un coup et lit son journal.
// Même interface que le simulateur de l'atelier du distributeur (dont la vérification par scénarios est reprise).
//
// Règles (comme setup et loop sur Arduino, et comme la carte) :
// - « Au démarrage » s'exécute une fois, puis « Répéter indéfiniment » et les blocs « quand… ».
// - Les blocs sont instantanés, sauf « attendre ». Un tour de boucle consomme au moins 1 ms.
// - Un bloc « quand… » qui tourne déjà ignore un nouvel appui.
// - Les angles du servo sont limités à 0–180.

(function (global) {
  'use strict';

  const N = typeof module === 'object' && module.exports ? { ...require('./code-octet.js'), ...require('./vm.js') } : { ...global.LaboBlocs.codeOctet, ...global.LaboBlocs };

  const VITESSE_SERVO = 180 / 300; // degrés par ms : 0° → 180° en 0,3 s

  // options : { composants, boutonsVersMasse, graine (hasard reproductible), surSon(broche, frequence, ms) }
  function creerSimulation(programme, options) {
    const opts = options || {};
    const compile = N.compiler(programme || { demarrage: [], boucle: [] }, { composants: opts.composants, boutonsVersMasse: opts.boutonsVersMasse });
    const debuts = new Map(compile.carte); // adresse du début d'un bloc → id
    const adresses = compile.carte.map((c) => c[0]);
    const nom = (n) => compile.noms.broches[n] || 'D' + n;

    const sim = {
      t: 0,
      journal: [], // { t, broche, valeur, type: 'led' | 'servo' | 'pwm' | 'son' | 'entree' | 'variable' }
      sorties: {}, // broche → valeur (LED 0/1, servo en degrés)
      entrees: {}, // broche → 0/1 (boutons : 1 = appuyé)
      variables: {},
      blocEnCours: null,
      blocsEnCours: [],
      initiales: {},
      erreurs: compile.erreurs,
      octets: compile.octets,
      avancerJusqua,
      avancer: (ms) => avancerJusqua(sim.t + ms),
      pas,
      changerEntree: (broche, valeur) => planifierEntree(sim.t, broche, valeur),
      planifierEntree,
      valeur: (broche) => (broche in sim.sorties ? sim.sorties[broche] : sim.entrees[broche] || 0),
    };

    for (const c of opts.composants || []) {
      if (c.type === 'bouton') sim.entrees[c.broche] = 0;
      else sim.sorties[c.broche] = 0;
      sim.initiales[c.broche] = 0;
    }

    function ecrire(n, valeur, type) {
      const b = nom(n);
      if (sim.sorties[b] !== valeur) {
        sim.sorties[b] = valeur;
        sim.journal.push({ t: sim.t, broche: b, valeur, type });
      }
    }
    let alea = opts.graine === undefined ? null : opts.graine >>> 0;
    const vm = N.creerVM({
      configurer() {},
      ecrireNum: (n, v) => ecrire(n, v, 'led'),
      ecrireAna: (n, v) => ecrire(n, v, 'pwm'),
      servo: (n, a) => ecrire(n, a, 'servo'),
      son(n, frequence, ms) {
        sim.journal.push({ t: sim.t, broche: nom(n), valeur: frequence, duree: ms, type: 'son' });
        if (opts.surSon) opts.surSon(nom(n), frequence, ms);
      },
      silence(n) {
        sim.journal.push({ t: sim.t, broche: nom(n), valeur: 0, duree: 0, type: 'son' });
        if (opts.surSon) opts.surSon(nom(n), 0, 0);
      },
      lireNum: (n) => (sim.entrees[nom(n)] ? 1 : 0),
      lireAna: (n) => sim.entrees[nom(n)] || 0,
      hasard(min, max) {
        if (alea === null) return min + Math.floor(Math.random() * (max - min + 1));
        alea = (Math.imul(alea, 1103515245) + 12345) >>> 0;
        return min + ((alea >>> 8) % (max - min + 1));
      },
      ext: (e, c, args) => (opts.extension ? Number(opts.extension(e, c, args)) || 0 : 0),
    });
    vm.charger(compile.octets);
    vm.demarrer(0);

    const planifiees = []; // entrées à appliquer : { t, broche, valeur }, triées par t
    let reveil = 0;

    function planifierEntree(t, broche, valeur) {
      const e = { t: Math.max(t, sim.t), broche, valeur: valeur ? 1 : 0 };
      let i = planifiees.length;
      while (i > 0 && planifiees[i - 1].t > e.t) i--;
      planifiees.splice(i, 0, e);
      appliquerEntrees();
    }

    function appliquerEntrees() {
      while (planifiees.length && planifiees[0].t <= sim.t) {
        const e = planifiees.shift();
        if (sim.entrees[e.broche] !== e.valeur) {
          sim.entrees[e.broche] = e.valeur;
          sim.journal.push({ t: sim.t, broche: e.broche, valeur: e.valeur, type: 'entree' });
        }
      }
    }

    // Bloc en cours de chaque fil actif : le dernier bloc commencé avant son adresse.
    function blocA(pc) {
      let lo = 0;
      let hi = adresses.length - 1;
      let r = -1;
      while (lo <= hi) {
        const m = (lo + hi) >> 1;
        if (adresses[m] <= pc) {
          r = m;
          lo = m + 1;
        } else hi = m - 1;
      }
      return r < 0 ? null : compile.carte[r][1];
    }
    function noterVariables() {
      compile.noms.variables.forEach((n, i) => {
        if (!n || n.charCodeAt(0) === 0) return;
        const v = vm.variables[i] || 0;
        if (sim.variables[n] !== v) {
          if (n in sim.variables) sim.journal.push({ t: sim.t, broche: n, valeur: v, type: 'variable' });
          sim.variables[n] = v;
        }
      });
    }
    // Un fil qui attend est encore dans le bloc « attendre » : son adresse pointe déjà sur l'instruction suivante.
    function noterBlocs() {
      sim.blocsEnCours = vm.fils
        .filter((f) => f.actif)
        .map((f) => blocA(f.reveil > sim.t ? f.pc - 1 : f.pc))
        .filter((id) => id !== null);
      sim.blocEnCours = sim.blocsEnCours.length ? sim.blocsEnCours[0] : null;
    }
    noterVariables();

    function executer() {
      reveil = vm.avancer(sim.t);
      noterVariables();
    }

    function avancerJusqua(cible) {
      for (;;) {
        appliquerEntrees();
        executer();
        if (sim.t >= cible) break;
        let suivant = Math.min(reveil, cible);
        if (planifiees.length && planifiees[0].t < suivant) suivant = planifiees[0].t;
        if (suivant <= sim.t) suivant = sim.t + 1;
        sim.t = suivant;
      }
      noterBlocs();
    }

    // Pas à pas : exécute le bloc surligné et s'arrête au début du suivant, sans l'exécuter (les attentes sont
    // sautées). Au premier appel, rien n'est exécuté : le premier bloc est seulement surligné.
    let arret = null; // { fil, pc } : bloc surligné par le pas précédent
    function pas() {
      let premier = true;
      for (let n = 0; n < 5000; n++) {
        appliquerEntrees();
        const f = vm.filPret(sim.t);
        if (!f) {
          const r = vm.prochainReveil();
          const prochaine = planifiees.length ? planifiees[0].t : Infinity;
          const t = Math.min(r, prochaine);
          if (t === Infinity) break;
          sim.t = Math.max(t, sim.t);
          continue;
        }
        const dejaSurligne = premier && arret && arret.fil === f && arret.pc === f.pc;
        if (debuts.has(f.pc) && !dejaSurligne) {
          arret = { fil: f, pc: f.pc };
          sim.blocEnCours = debuts.get(f.pc);
          sim.blocsEnCours = [sim.blocEnCours];
          return;
        }
        vm.unPas(sim.t);
        noterVariables();
        premier = false;
      }
      noterBlocs();
    }

    return sim;
  }

  // Position réelle du bras d'un servo à l'instant t (il tourne à vitesse constante vers sa consigne).
  function positionServo(journal, broche, t, initiale) {
    let pos = initiale || 0;
    let cible = pos;
    let depuis = 0;
    for (const e of journal) {
      if (e.t > t) break;
      if (e.broche !== broche || e.type !== 'servo') continue;
      pos = approcher(pos, cible, (e.t - depuis) * VITESSE_SERVO);
      cible = e.valeur;
      depuis = e.t;
    }
    return approcher(pos, cible, (t - depuis) * VITESSE_SERVO);
  }

  function approcher(pos, cible, pasMax) {
    if (Math.abs(cible - pos) <= pasMax) return cible;
    return pos + Math.sign(cible - pos) * pasMax;
  }

  // Chronologie « visible » d'une broche entre t0 et t1 : liste de segments { debut, fin, valeur }.
  // Un état qui dure moins de « seuil » ms (5 ms) est invisible : il est fusionné avec ses voisins.
  function chronologie(journal, broche, initiale, t0, t1, seuil) {
    const s = seuil === undefined ? 5 : seuil;
    const brut = [{ debut: 0, valeur: initiale || 0 }];
    for (const e of journal) {
      if (e.t > t1) break;
      if (e.broche !== broche || e.type === 'variable' || e.type === 'son') continue;
      const dernier = brut[brut.length - 1];
      if (e.t === dernier.debut) dernier.valeur = e.valeur;
      else brut.push({ debut: e.t, valeur: e.valeur });
    }
    for (let i = 0; i < brut.length; i++) brut[i].fin = i + 1 < brut.length ? brut[i + 1].debut : t1;
    // On retire les états trop courts (sauf le dernier, encore en cours), puis on fusionne.
    const visibles = [];
    for (let i = 0; i < brut.length; i++) {
      const seg = brut[i];
      const court = seg.fin - seg.debut < s && i < brut.length - 1;
      if (court && visibles.length) {
        visibles[visibles.length - 1].fin = seg.fin;
        continue;
      }
      if (court && !visibles.length) {
        // Premier état trop court : il est absorbé par le suivant.
        brut[i + 1].debut = seg.debut;
        continue;
      }
      const prec = visibles[visibles.length - 1];
      if (prec && egales(prec.valeur, seg.valeur)) prec.fin = seg.fin;
      else visibles.push({ debut: seg.debut, fin: seg.fin, valeur: seg.valeur });
    }
    // Découpe sur [t0, t1].
    const resultat = [];
    for (const seg of visibles) {
      if (seg.fin <= t0 && !(seg.fin === t0 && t0 === t1)) continue;
      if (seg.debut > t1) break;
      resultat.push({ debut: Math.max(seg.debut, t0), fin: Math.min(seg.fin, t1), valeur: seg.valeur });
    }
    if (!resultat.length) resultat.push({ debut: t0, fin: t1, valeur: visibles[visibles.length - 1].valeur });
    return resultat;
  }

  function egales(a, b) {
    return Math.abs(a - b) < 0.5;
  }

  const api = { creerSimulation, positionServo, chronologie, egales, VITESSE_SERVO };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign((global.LaboBlocs = global.LaboBlocs || {}), api);
})(this);
