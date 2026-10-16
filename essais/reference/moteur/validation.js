// Validation d'un exercice : rejoue ses scénarios dans le moteur, en temps virtuel, et observe
// le comportement (jamais la forme du programme). Seul le premier écart est signalé, avec une
// phrase observable et bienveillante, par exemple :
// « Quand le bouton D8 est appuyé, la LED D3 devrait être allumée. Dans ton programme, elle reste éteinte. »
//
// Étapes d'un scénario (durées en secondes) :
//   { attendre: 1 }
//   { appuyer: 'D8' }                 appui de 0,2 s, puis le bouton est relâché tout seul
//   { maintenir: 'D8' } / { relacher: 'D8' }
//   { verifier: { D3: 1, D4: 0 }, delai: 0.3 }               l'état doit être atteint dans le délai
//   { sequence: 'D3', valeurs: [1, 0], intervalle: 2, duree: 10, changements: 4 }
//   { opposees: ['D3', 'D4'], duree: 10 }
//   { impulsion: { D5: 1 }, duree: 5, tolerance: 0.5, delai: 0.3 }   allumé 5 s ±0,5 puis éteint
//   { stable: { D6: 90 }, duree: 2 }
// Toute vérification accepte « contexte » et « attendu » pour remplacer le début de la phrase.

(function (global) {
  'use strict';

  const M = typeof module === 'object' && module.exports ? require('./simulation.js') : global.Atelier;

  const SEUIL = 5; // ms : deux changements plus proches sont simultanés
  const TOLERANCE = 300; // ms sur les durées
  const DUREE_APPUI = 200; // ms

  const ms = (s) => Math.round(Number(s) * 1000);

  function nombreFr(x) {
    const r = Math.round(x * 10) / 10;
    return String(r).replace('.', ',');
  }
  const secondes = (d) => nombreFr(d / 1000) + ' s';

  function majuscule(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ---------- Noms des composants dans les phrases ----------

  function composant(exercice, broche) {
    return (exercice.composants || []).find((c) => c.broche === broche) || { type: deviner(broche), broche };
  }

  function deviner(broche) {
    return broche === 'D5' || broche === 'D6' ? 'servo' : 'led';
  }

  function nomComposant(c) {
    const mot = { led: 'la LED', bouton: 'le bouton', servo: 'le moteur' }[c.type] || 'la broche';
    return c.nom ? `${mot} ${c.nom} (${c.broche})` : `${mot} ${c.broche}`;
  }

  const pronom = (c) => (c.type === 'led' ? 'elle' : 'il');

  function etatLed(v) {
    return v ? 'allumée' : 'éteinte';
  }

  // « être allumée », « être à 90° »
  function etreA(c, v) {
    return c.type === 'servo' ? `être à ${nombreFr(v)}°` : `être ${etatLed(v)}`;
  }
  // « reste éteinte », « reste à 0° », « est allumée »
  function constat(c, v, reste) {
    const verbe = reste ? 'reste' : 'est';
    return c.type === 'servo' ? `${pronom(c)} ${verbe} à ${nombreFr(v)}°` : `${pronom(c)} ${verbe} ${etatLed(v)}`;
  }

  function phrase(contexte, attendu, observe, indice) {
    const debut = contexte ? `${contexte}, ${attendu}` : majuscule(attendu);
    return `${majuscule(debut)}. Dans ton programme, ${observe}.${indice ? ' ' + indice : ''}`;
  }

  // ---------- Scénario ----------

  function jouerScenario(exercice, programme, scenario) {
    const sim = M.creerSimulation(programme, { composants: exercice.composants });
    const boutons = (exercice.composants || []).filter((c) => c.type === 'bouton');
    const maintenus = [];
    let appuis = [];
    let relache = null;
    let curseur = 0;
    const entrees = []; // pour rejouer le test à l'écran : { t, broche, valeur }

    const initiale = (b) => sim.initiales[b] || 0;
    const segments = (b, t0, t1) => M.chronologie(sim.journal, b, initiale(b), t0, t1, SEUIL);
    function valeurA(b, t) {
      const segs = segments(b, 0, Math.max(t, sim.t));
      for (const s of segs) if (s.debut <= t && t < s.fin) return s.valeur;
      return segs[segs.length - 1].valeur;
    }
    function aChange(b, t0, t1) {
      return segments(b, t0, t1).length > 1;
    }
    function planifier(t, broche, valeur) {
      sim.planifierEntree(t, broche, valeur);
      entrees.push({ t: Math.max(t, sim.t), broche, valeur });
    }

    function contexte(etape) {
      if (etape.contexte) return etape.contexte;
      const nom = (b) => nomComposant(composant(exercice, b));
      if (maintenus.length === 1) return `quand ${nom(maintenus[0])} est appuyé`;
      if (maintenus.length > 1) return `quand ${maintenus.map(nom).join(' et ')} sont appuyés`;
      if (relache) return `quand ${nom(relache)} est relâché`;
      if (appuis.length) {
        const derniers = appuis.slice(-2).map(nom);
        return derniers.length === 2
          ? `après un appui sur ${derniers[0]} puis sur ${derniers[1]}`
          : `après un appui sur ${derniers[0]}`;
      }
      if (boutons.length) return 'quand aucun bouton n’est appuyé';
      // Sans bouton, seule une vérification d'état à un instant donné a besoin d'un repère de temps.
      return 'verifier' in etape ? `au bout de ${secondes(curseur)}` : '';
    }

    // Une sortie attendue jamais écrite, mais une autre broche du même genre l'a été : on le dit.
    const declarees = new Set((exercice.composants || []).map((x) => x.broche));
    function indiceSortie(broche) {
      if (sim.journal.some((e) => e.broche === broche && e.type !== 'entree')) return '';
      const c = composant(exercice, broche);
      // Une sortie du même genre sur une broche où l'exercice n'a pas de composant de ce genre.
      const memeGenre = new Set((exercice.composants || []).filter((x) => x.type === c.type).map((x) => x.broche));
      const autre = sim.journal.find((e) => e.type === c.type && !memeGenre.has(e.broche));
      return autre ? `Ton programme agit sur la broche ${autre.broche} : vérifie la broche choisie dans le bloc.` : '';
    }
    // Le programme lit un bouton sur une broche où il n'y a pas de bouton (ex. D9 au lieu de D8).
    const boutonsLus = (() => {
      const lus = new Set();
      const voir = (x) => {
        if (!x || typeof x !== 'object') return;
        if (Array.isArray(x)) return x.forEach(voir);
        if (x.bloc === 'bouton_etat' && x.broche) lus.add(x.broche);
        for (const v of Object.values(x)) if (v && typeof v === 'object') voir(v);
      };
      voir(programme);
      return [...lus].filter((b) => !declarees.has(b));
    })();
    function indiceBroche(broche) {
      const sortie = indiceSortie(broche);
      if (sortie || !boutons.length || !boutonsLus.length) return sortie;
      return `Ton programme lit un bouton sur la broche ${boutonsLus[0]} : vérifie la broche choisie dans le bloc « état sur la broche ».`;
    }

    const ecart = (message) => ({ reussi: false, message, temps: curseur, entrees, journal: sim.journal });

    // ----- Vérifications -----

    function verifier(etape) {
      const attendus = etape.verifier;
      const delai = ms(etape.delai === undefined ? 0.3 : etape.delai);
      // L'état est lu à la fin du délai : avant, le programme n'a peut-être pas encore réagi.
      const debut = curseur;
      const fin = debut + delai;
      sim.avancerJusqua(fin + SEUIL);
      curseur = fin;
      const b = Object.keys(attendus).find((x) => !M.egales(valeurA(x, fin), attendus[x]));
      if (!b) return null;
      const c = composant(exercice, b);
      const v = valeurA(b, fin);
      const reste = !aChange(b, Math.max(0, debut - 500), fin + SEUIL);
      return ecart(
        phrase(
          contexte(etape),
          etape.attendu || `${nomComposant(c)} devrait ${etreA(c, attendus[b])}`,
          constat(c, v, reste),
          indiceBroche(b),
        ),
      );
    }

    function sequence(etape) {
      const b = etape.sequence;
      const c = composant(exercice, b);
      const valeurs = etape.valeurs;
      const intervalle = ms(etape.intervalle);
      const t0 = curseur;
      const t1 = curseur + ms(etape.duree);
      sim.avancerJusqua(t1 + SEUIL);
      curseur = t1;
      const segs = segments(b, t0, t1);
      const acceptes = (v) => {
        const autres = etape.intervalles && etape.intervalles[String(v)];
        return (autres || [etape.intervalle]).map(ms);
      };
      const attendu =
        etape.attendu ||
        (c.type === 'servo'
          ? `${nomComposant(c)} devrait passer par ${valeurs.map((v) => nombreFr(v) + '°').join(', ')}, ` +
            `puis recommencer, en changeant toutes les ${secondes(intervalle)}`
          : `${nomComposant(c)} devrait s’allumer et s’éteindre en changeant toutes les ${secondes(intervalle)}`);
      const dire = (observe) => ecart(phrase(etape.contexte || '', attendu, observe, indiceBroche(b)));

      if (segs.length === 1) return dire(constat(c, segs[0].valeur, true));

      // Ordre des valeurs : la suite doit suivre le motif, en commençant n'importe où.
      const n = valeurs.length;
      let meilleur = -1;
      let rupture = 0;
      for (let k = 0; k < n; k++) {
        let i = 0;
        while (i < segs.length && M.egales(segs[i].valeur, valeurs[(k + i) % n])) i++;
        if (i === segs.length) {
          meilleur = k;
          break;
        }
        if (i > rupture) rupture = i;
      }
      if (meilleur < 0) {
        const a = segs[Math.max(0, rupture - 1)].valeur;
        const z = segs[Math.max(1, rupture)].valeur;
        const val = (v) => (c.type === 'servo' ? nombreFr(v) + '°' : etatLed(v));
        return dire(
          rupture === 0
            ? `${pronom(c)} commence ${c.type === 'servo' ? 'à ' : ''}${val(segs[0].valeur)}`
            : `${pronom(c)} passe ${c.type === 'servo' ? 'de ' + val(a) + ' à ' + val(z) : 'de ' + val(a) + ' à ' + val(z)}`,
        );
      }

      // Durée de chaque état (le premier et le dernier sont coupés par la fenêtre d'observation).
      for (let i = 1; i < segs.length - 1; i++) {
        const d = segs[i].fin - segs[i].debut;
        if (!acceptes(segs[i].valeur).some((a) => Math.abs(d - a) <= TOLERANCE)) {
          return dire(
            c.type === 'servo'
              ? `${pronom(c)} reste ${secondes(d)} à ${nombreFr(segs[i].valeur)}°`
              : `${pronom(c)} reste ${etatLed(segs[i].valeur)} pendant ${secondes(d)}`,
          );
        }
      }
      const der = segs[segs.length - 1];
      const maxi = Math.max(...acceptes(der.valeur));
      if (der.fin - der.debut > maxi + TOLERANCE) return dire(`${pronom(c)} change, puis ${constat(c, der.valeur, true)}`);

      const changements = segs.length - 1;
      if (changements < etape.changements) {
        return dire(`${pronom(c)} ne change que ${changements} fois en ${secondes(t1 - t0)}`);
      }
      return null;
    }

    function opposees(etape) {
      const [a, b] = etape.opposees;
      const ca = composant(exercice, a);
      const cb = composant(exercice, b);
      const t0 = curseur;
      const t1 = curseur + ms(etape.duree);
      sim.avancerJusqua(t1 + SEUIL);
      curseur = t1;
      const sa = segments(a, t0, t1);
      const sb = segments(b, t0, t1);
      const bornes = [...new Set([t0, t1, ...sa.map((s) => s.debut), ...sb.map((s) => s.debut)])].sort((x, y) => x - y);
      for (let i = 0; i + 1 < bornes.length; i++) {
        if (bornes[i + 1] - bornes[i] < SEUIL) continue;
        const m = (bornes[i] + bornes[i + 1]) / 2;
        const va = sa.find((s) => s.debut <= m && m < s.fin).valeur;
        const vb = sb.find((s) => s.debut <= m && m < s.fin).valeur;
        if (va === vb) {
          const attendu =
            etape.attendu ||
            `${nomComposant(ca)} et ${nomComposant(cb)} devraient toujours faire l’inverse : ` +
              'quand l’une est allumée, l’autre est éteinte';
          return ecart(
            phrase(
              etape.contexte || '',
              attendu,
              `elles sont toutes les deux ${va ? 'allumées' : 'éteintes'} en même temps`,
              indiceBroche(va ? a : b) || indiceBroche(a) || indiceBroche(b),
            ),
          );
        }
      }
      return null;
    }

    function impulsion(etape) {
      const attendus = etape.impulsion;
      const duree = ms(etape.duree);
      const tol = ms(etape.tolerance === undefined ? 0.5 : etape.tolerance);
      const delai = ms(etape.delai === undefined ? 0.3 : etape.delai);
      const t0 = curseur;
      const tmax = t0 + delai + 2 * duree + tol + 1000;
      const broches = Object.keys(attendus);
      // L'état attendu, s'il a commencé dans le délai et s'il est déjà terminé (suivi d'un autre état visible).
      const etatAttendu = (b) =>
        segments(b, t0, sim.t).find((s) => M.egales(s.valeur, attendus[b]) && s.debut <= t0 + delai && s.fin > t0);
      const termine = (b) => {
        const s = etatAttendu(b);
        return !s || sim.t - s.fin >= SEUIL;
      };
      // On avance par petits pas jusqu'à la fin de l'impulsion, pour ne pas décaler la suite du scénario.
      sim.avancerJusqua(t0 + delai + SEUIL);
      while (sim.t < tmax && !broches.every(termine)) sim.avancerJusqua(Math.min(tmax, sim.t + 50));
      let fin = t0;
      for (const b of broches) {
        const c = composant(exercice, b);
        const v = attendus[b];
        const attendu =
          etape.attendu ||
          (c.type === 'servo'
            ? `${nomComposant(c)} devrait rester à ${nombreFr(v)}° pendant ${secondes(duree)}`
            : `${nomComposant(c)} devrait rester ${etatLed(v)} ${secondes(duree)}, puis ${v ? 's’éteindre' : 's’allumer'}`);
        const dire = (observe) => ecart(phrase(contexte(etape), attendu, observe, indiceBroche(b)));
        const seg = etatAttendu(b);
        if (!seg) {
          const action = c.type === 'servo' ? `ne va pas à ${nombreFr(v)}°` : `ne s’${v ? 'allume' : 'éteint'} pas`;
          return dire(`${pronom(c)} ${action}`);
        }
        // Début réel de l'état (il a pu commencer avant t0, pendant la vérification précédente).
        const debut = segments(b, 0, sim.t).find((s) => s.debut <= seg.debut && seg.debut < s.fin).debut;
        const d = seg.fin - debut;
        const dit = c.type === 'servo' ? `${pronom(c)} reste à ${nombreFr(v)}°` : `${pronom(c)} reste ${etatLed(v)}`;
        if (sim.t - seg.fin < SEUIL) return dire(`${dit} et ne ${c.type === 'servo' ? 'revient' : v ? 's’éteint' : 's’allume'} plus`);
        if (Math.abs(d - duree) > tol) return dire(`${dit} pendant ${secondes(d)}`);
        fin = Math.max(fin, seg.fin);
      }
      curseur = fin;
      return null;
    }

    function stable(etape) {
      const attendus = etape.stable;
      const t0 = curseur;
      const t1 = curseur + ms(etape.duree);
      sim.avancerJusqua(t1 + SEUIL);
      for (const b of Object.keys(attendus)) {
        const c = composant(exercice, b);
        const v = attendus[b];
        const autre = segments(b, t0, t1).find((s) => !M.egales(s.valeur, v));
        if (!autre) continue;
        const attendu =
          etape.attendu ||
          (c.type === 'servo' ? `${nomComposant(c)} devrait rester à ${nombreFr(v)}°` : `${nomComposant(c)} devrait rester ${etatLed(v)}`);
        // Avec une phrase « attendu » personnalisée, le pronom ne renverrait à rien : on nomme le composant.
        const qui = etape.attendu ? nomComposant(c) : pronom(c);
        const observe =
          c.type === 'servo'
            ? `${qui} va à ${nombreFr(autre.valeur)}°`
            : `${qui} ${autre.valeur ? 's’allume' : 's’éteint'}`;
        return ecart(phrase(contexte(etape), attendu, observe, ''));
      }
      curseur = t1;
      return null;
    }

    for (const etape of scenario.etapes) {
      let r = null;
      if ('attendre' in etape) {
        curseur += ms(etape.attendre);
        sim.avancerJusqua(curseur);
      } else if ('appuyer' in etape) {
        const t = (curseur = Math.max(curseur, sim.t));
        planifier(t, etape.appuyer, 1);
        planifier(t + DUREE_APPUI, etape.appuyer, 0);
        appuis.push(etape.appuyer);
        relache = null;
      } else if ('maintenir' in etape) {
        planifier((curseur = Math.max(curseur, sim.t)), etape.maintenir, 1);
        if (!maintenus.includes(etape.maintenir)) maintenus.push(etape.maintenir);
        appuis = [];
        relache = null;
      } else if ('relacher' in etape) {
        planifier((curseur = Math.max(curseur, sim.t)), etape.relacher, 0);
        maintenus.splice(maintenus.indexOf(etape.relacher), 1);
        appuis = [];
        relache = etape.relacher;
      } else if ('verifier' in etape) r = verifier(etape);
      else if ('sequence' in etape) r = sequence(etape);
      else if ('opposees' in etape) r = opposees(etape);
      else if ('impulsion' in etape) r = impulsion(etape);
      else if ('stable' in etape) r = stable(etape);
      else throw new Error('Étape de scénario inconnue : ' + JSON.stringify(etape));
      if (r) return r;
    }
    return { reussi: true, temps: curseur, entrees, journal: sim.journal };
  }

  // Lance tous les scénarios d'un exercice. Renvoie { reussi } ou le premier écart :
  // { reussi: false, message, scenario (indice), temps, entrees (à rejouer), journal }.
  function valider(exercice, programme) {
    const scenarios = exercice.scenarios || [];
    for (let i = 0; i < scenarios.length; i++) {
      const r = jouerScenario(exercice, programme, scenarios[i]);
      if (!r.reussi) return Object.assign(r, { scenario: i, nomScenario: scenarios[i].nom || '' });
    }
    return { reussi: true };
  }

  const api = { valider, jouerScenario, nomComposant };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign((global.Atelier = global.Atelier || {}), api);
})(this);
