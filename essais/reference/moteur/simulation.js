// Moteur de simulation : exécute un programme simplifié en temps virtuel (millisecondes).
// Il ne dépend d'aucun affichage : l'écran l'avance au rythme de l'horloge réelle (×1, ×2, ×5),
// la validation l'avance d'un coup et lit son journal d'événements.
//
// Règles (comme setup et loop sur Arduino) :
// - « Au démarrage » s'exécute une fois, puis « Répéter indéfiniment » boucle sans fin.
// - Les blocs sont instantanés, sauf « attendre ».
// - Un tour de boucle consomme au moins 1 ms, pour qu'une boucle sans « attendre » ne fige rien.
// - Les angles du servo sont limités à 0–180.

(function (global) {
  'use strict';

  const VITESSE_SERVO = 180 / 300; // degrés par ms : 0° → 180° en 0,3 s

  function creerSimulation(programme, options) {
    const opts = options || {};
    const prog = programme || { demarrage: [], boucle: [] };
    const sim = {
      t: 0,
      journal: [], // { t, broche, valeur, type: 'led' | 'servo' | 'entree' | 'variable' }
      sorties: {}, // broche → valeur (LED 0/1, servo en degrés)
      entrees: {}, // broche → 0/1 (boutons)
      variables: { CHOIX: 0 },
      blocEnCours: null,
      initiales: {},
      avancerJusqua,
      avancer: (ms) => avancerJusqua(sim.t + ms),
      pas,
      changerEntree: (broche, valeur) => planifierEntree(sim.t, broche, valeur),
      planifierEntree,
      valeur: (broche) => (broche in sim.sorties ? sim.sorties[broche] : sim.entrees[broche] || 0),
    };

    // État initial : LED éteintes, boutons relâchés, servo affiché à 0°.
    for (const c of opts.composants || []) {
      if (c.type === 'bouton') sim.entrees[c.broche] = 0;
      else sim.sorties[c.broche] = 0;
      sim.initiales[c.broche] = 0;
    }

    const planifiees = []; // entrées à appliquer : { t, broche, valeur }, triées par t
    let reveil = 0; // instant où le programme reprend
    const execution = executer();

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

    function ecrire(broche, valeur, type) {
      if (sim.sorties[broche] !== valeur) {
        sim.sorties[broche] = valeur;
        sim.journal.push({ t: sim.t, broche, valeur, type });
      }
    }

    function evaluer(e) {
      if (e === null || e === undefined) return 0;
      if (typeof e === 'number') return e;
      switch (e.bloc) {
        case 'nombre':
          return Number(e.valeur) || 0;
        case 'variable':
          return Number(sim.variables[e.variable || 'CHOIX']) || 0;
        case 'bouton_etat':
          return sim.entrees[e.broche] ? 1 : 0;
        case 'valeur_haut_bas':
          return e.valeur ? 1 : 0;
        case 'comparaison': {
          const egal = Math.abs(evaluer(e.a) - evaluer(e.b)) < 1e-9;
          return (e.op === '≠' ? !egal : egal) ? 1 : 0;
        }
        default:
          return 0;
      }
    }

    function* suite(liste) {
      for (const i of liste || []) yield* instruction(i);
    }

    function* instruction(i) {
      yield { bloc: i.id === undefined ? null : i.id };
      switch (i.bloc) {
        case 'led_etat':
          ecrire(i.broche, i.etat ? 1 : 0, 'led');
          break;
        case 'servo_angle':
          ecrire(i.broche, Math.min(180, Math.max(0, evaluer(i.angle))), 'servo');
          break;
        case 'attendre': {
          const ms = Math.round(Math.max(0, evaluer(i.duree)) * 1000);
          if (ms > 0) yield { attendre: ms };
          break;
        }
        case 'affecter': {
          const nom = i.variable || 'CHOIX';
          const v = evaluer(i.valeur);
          if (sim.variables[nom] !== v) {
            sim.variables[nom] = v;
            sim.journal.push({ t: sim.t, broche: nom, valeur: v, type: 'variable' });
          }
          break;
        }
        case 'si_alors':
          if (evaluer(i.condition)) yield* suite(i.alors);
          break;
        case 'si_sinon':
          yield* suite(evaluer(i.condition) ? i.alors : i.sinon);
          break;
        default:
          break;
      }
    }

    function* executer() {
      yield* suite(prog.demarrage);
      for (;;) {
        const debut = sim.t;
        yield* suite(prog.boucle);
        if (sim.t === debut) yield { attendre: 1, interne: true };
      }
    }

    // Exécute les blocs jusqu'au prochain « attendre ».
    function courir() {
      for (;;) {
        const r = execution.next().value;
        if (r.attendre) {
          reveil = sim.t + r.attendre;
          return;
        }
        sim.blocEnCours = r.bloc;
      }
    }

    // Déplace l'horloge sans exécuter le programme (les entrées planifiées s'appliquent en chemin).
    function allerA(cible) {
      while (planifiees.length && planifiees[0].t < cible) {
        sim.t = planifiees[0].t;
        appliquerEntrees();
      }
      sim.t = cible;
      appliquerEntrees();
    }

    function avancerJusqua(cible) {
      for (;;) {
        appliquerEntrees();
        if (reveil <= sim.t) {
          courir();
          continue;
        }
        if (sim.t >= cible) return;
        const prochaine = planifiees.length ? planifiees[0].t : Infinity;
        sim.t = Math.min(reveil, prochaine, cible);
      }
    }

    // Mode pas à pas : exécute le bloc surligné et s'arrête sur le suivant (les attentes sont sautées).
    function pas() {
      for (;;) {
        if (reveil > sim.t) allerA(reveil);
        const r = execution.next().value;
        if (r.attendre) {
          reveil = sim.t + r.attendre;
          continue;
        }
        sim.blocEnCours = r.bloc;
        return;
      }
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
      if (e.broche !== broche || e.type === 'variable') continue;
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
  else Object.assign((global.Atelier = global.Atelier || {}), api);
})(this);
