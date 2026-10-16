// Conversion entre la sauvegarde Blockly (JSON) et le programme de Labo Blocs (format v1, docs/PLAN.md §3).
// Aucun besoin de Blockly ici : on lit et on écrit le JSON de Blockly.serialization.workspaces.
// Les types et les noms de champs des blocs de l'atelier du distributeur sont gardés : ses sauvegardes se relisent.
//
// Programme v1 :
//   { format: 'labo-blocs/programme', version: 1,
//     fils: [ { quand: 'demarrage' | 'boucle' | 'appui' | 'relache', broche?, corps: [instruction…] } ] }
// Instructions : led_etat, attendre, servo_angle, affecter, ajouter_a, si_alors, si_sinon, repeter_n, tant_que,
//   repeter_jusqua, son ; expressions : nombre, variable, bouton_etat, valeur_haut_bas, comparaison, operation,
//   logique, non, hasard (détail : noyau/code-octet.js). Chaque nœud venu de Blockly porte son « id ».
// L'ancien « programme simplifié » de l'atelier { demarrage, boucle } se lit aussi (versV1).

(function (global) {
  'use strict';

  const FORMAT = 'labo-blocs/programme';
  const VERSION = 1;

  const COMPARAISONS = { EQ: '=', NEQ: '≠', LT: '<', LTE: '≤', GT: '>', GTE: '≥' };
  const OPERATIONS = { ADD: '+', SUB: '-', MUL: '×', DIV: '÷', MOD: 'mod' };
  const inverse = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));
  const COMPARAISONS_BLOCKLY = inverse(COMPARAISONS);
  const OPERATIONS_BLOCKLY = inverse(OPERATIONS);

  // Entrées « nombre » des blocs et valeur de leur bloc fantôme.
  const ENTREES_NOMBRE = {
    attendre: { DUREE: 1 },
    servo_angle: { ANGLE: 90 },
    affecter: { VALEUR: 0 },
    ajouter_a: { VALEUR: 1 },
    repeter_n: { FOIS: 3 },
    son: { FREQUENCE: 440, DUREE: 0.5 },
    hasard: { MIN: 1, MAX: 6 },
    operation: { A: 0, B: 0 },
  };

  function entree(bloc, nom) {
    const e = bloc.inputs && bloc.inputs[nom];
    return e ? e.block || e.shadow || null : null;
  }
  const champ = (bloc, nom) => (bloc.fields ? bloc.fields[nom] : undefined);

  // Description des blocs des cartes (mBot, micro:bit), lue au moment de l'utiliser.
  const CARTES = () => (typeof module === 'object' && module.exports ? require('./cartes.js') : global.LaboBlocs);

  // Programme simplifié de l'atelier → v1 (un v1 est rendu tel quel).
  function versV1(p) {
    if (p && Array.isArray(p.fils)) return p;
    return {
      format: FORMAT,
      version: VERSION,
      fils: [
        { quand: 'demarrage', corps: (p && p.demarrage) || [] },
        { quand: 'boucle', corps: (p && p.boucle) || [] },
      ],
    };
  }

  // v1 → programme simplifié de l'atelier { demarrage, boucle } (outils des projets qui lisent encore ce format).
  // Les autres fils (« quand on appuie… ») sont gardés à part dans « fils ».
  function versSimplifie(p) {
    if (!p || !Array.isArray(p.fils)) return p;
    const corps = (quand) => p.fils.filter((f) => f.quand === quand).flatMap((f) => f.corps || []);
    const autres = p.fils.filter((f) => f.quand !== 'demarrage' && f.quand !== 'boucle');
    const r = { demarrage: corps('demarrage'), boucle: corps('boucle') };
    if (autres.length) r.fils = autres;
    return r;
  }

  // Lit une sauvegarde Blockly. Renvoie le programme v1, les blocs restés seuls hors du programme et les blocs
  // incomplets (une entrée vide).
  function depuisBlockly(sauvegarde) {
    const hauts = (sauvegarde && sauvegarde.blocks && sauvegarde.blocks.blocks) || [];
    const fils = [];
    const horsProgramme = [];
    const incomplets = [];
    let demarrage = false;
    let boucle = false;

    function pile(bloc) {
      const liste = [];
      for (let b = bloc; b; b = b.next && b.next.block) {
        const i = instruction(b);
        if (i) liste.push(i);
      }
      return liste;
    }

    function expression(bloc, parent) {
      if (!bloc) {
        incomplets.push(parent.id);
        return null;
      }
      const e = { id: bloc.id };
      switch (bloc.type) {
        case 'nombre':
          return Object.assign(e, { bloc: 'nombre', valeur: Number(champ(bloc, 'NUM')) || 0 });
        case 'variable':
          return Object.assign(e, { bloc: 'variable', variable: champ(bloc, 'VAR') || 'CHOIX' });
        case 'bouton_etat':
          return Object.assign(e, { bloc: 'bouton_etat', broche: champ(bloc, 'BROCHE') });
        case 'valeur_haut_bas':
          return Object.assign(e, { bloc: 'valeur_haut_bas', valeur: Number(champ(bloc, 'VALEUR')) ? 1 : 0 });
        case 'comparaison':
          return Object.assign(e, {
            bloc: 'comparaison',
            op: COMPARAISONS[champ(bloc, 'OP')] || '=',
            a: expression(entree(bloc, 'A'), bloc),
            b: expression(entree(bloc, 'B'), bloc),
          });
        case 'operation':
          return Object.assign(e, {
            bloc: 'operation',
            op: OPERATIONS[champ(bloc, 'OP')] || '+',
            a: expression(entree(bloc, 'A'), bloc),
            b: expression(entree(bloc, 'B'), bloc),
          });
        case 'logique':
          return Object.assign(e, { bloc: 'logique', op: champ(bloc, 'OP') === 'OU' ? 'ou' : 'et', a: expression(entree(bloc, 'A'), bloc), b: expression(entree(bloc, 'B'), bloc) });
        case 'non':
          return Object.assign(e, { bloc: 'non', a: expression(entree(bloc, 'A'), bloc) });
        case 'hasard':
          return Object.assign(e, { bloc: 'hasard', min: expression(entree(bloc, 'MIN'), bloc), max: expression(entree(bloc, 'MAX'), bloc) });
        default:
          return blocCarte(bloc, e, ['valeur', 'condition']);
      }
    }

    // Bloc d'une carte (noyau/cartes.js) : ses champs et ses entrées, nommés en minuscules (DIRECTION → direction).
    function blocCarte(bloc, e, sortes) {
      const d = CARTES().BLOCS_CARTES[bloc.type];
      if (!d || !sortes.includes(d.sorte)) return null;
      e.bloc = bloc.type;
      for (const nom of Object.keys(d.champs || {})) e[nom.toLowerCase()] = champ(bloc, nom);
      for (const nom of Object.keys(d.entrees || {})) e[nom.toLowerCase()] = expression(entree(bloc, nom), bloc);
      return e;
    }

    function instruction(b) {
      const i = { bloc: b.type, id: b.id };
      switch (b.type) {
        case 'led_etat':
          return Object.assign(i, { broche: champ(b, 'BROCHE'), etat: Number(champ(b, 'ETAT')) ? 1 : 0 });
        case 'attendre':
          return Object.assign(i, { duree: expression(entree(b, 'DUREE'), b) });
        case 'servo_angle':
          return Object.assign(i, { broche: champ(b, 'BROCHE'), angle: expression(entree(b, 'ANGLE'), b) });
        case 'affecter':
        case 'ajouter_a':
          return Object.assign(i, { variable: champ(b, 'VAR') || 'CHOIX', valeur: expression(entree(b, 'VALEUR'), b) });
        case 'si_alors':
          return Object.assign(i, { condition: expression(entree(b, 'CONDITION'), b), alors: pile(entree(b, 'ALORS')) });
        case 'si_sinon':
          return Object.assign(i, {
            condition: expression(entree(b, 'CONDITION'), b),
            alors: pile(entree(b, 'ALORS')),
            sinon: pile(entree(b, 'SINON')),
          });
        case 'repeter_n':
          return Object.assign(i, { fois: expression(entree(b, 'FOIS'), b), corps: pile(entree(b, 'DO')) });
        case 'tant_que':
        case 'repeter_jusqua':
          return Object.assign(i, { condition: expression(entree(b, 'CONDITION'), b), corps: pile(entree(b, 'DO')) });
        case 'son':
          return Object.assign(i, { broche: champ(b, 'BROCHE'), frequence: expression(entree(b, 'FREQUENCE'), b), duree: expression(entree(b, 'DUREE'), b) });
        default:
          return blocCarte(b, i, ['instruction']);
      }
    }

    for (const b of hauts) {
      if (b.type === 'demarrage' && !demarrage) {
        demarrage = true;
        fils.push({ quand: 'demarrage', id: b.id, corps: pile(entree(b, 'DO')) });
      } else if (b.type === 'boucle' && !boucle) {
        boucle = true;
        fils.push({ quand: 'boucle', id: b.id, corps: pile(entree(b, 'DO')) });
      } else if (b.type === 'quand_bouton') {
        fils.push({ quand: champ(b, 'FRONT') === 'relache' ? 'relache' : 'appui', broche: champ(b, 'BROCHE'), id: b.id, corps: pile(entree(b, 'DO')) });
      } else {
        horsProgramme.push(b.id);
      }
    }
    // « Au démarrage » d'abord, comme sur la carte.
    fils.sort((a, b) => (a.quand === 'demarrage' ? -1 : b.quand === 'demarrage' ? 1 : 0));
    return { programme: { format: FORMAT, version: VERSION, fils }, horsProgramme, incomplets };
  }

  // Écrit un programme (v1 ou atelier) en sauvegarde Blockly (blocs de départ, solution de référence, indice 3).
  function versBlockly(programme, options) {
    const opts = options || {};
    let compteur = 0;
    const nouvelId = () => (opts.prefixe || 'b') + ++compteur;

    function nombreBloc(valeur) {
      return { type: 'nombre', id: nouvelId(), fields: { NUM: Number(valeur) || 0 } };
    }

    function expression(e) {
      if (e === null || e === undefined) return null;
      if (typeof e === 'number') return nombreBloc(e);
      const id = e.id || nouvelId();
      const deux = (type, op, a, b) => {
        const bloc = { type, id, fields: { OP: op }, inputs: {} };
        entreeValeur(bloc, 'A', a);
        entreeValeur(bloc, 'B', b);
        return bloc;
      };
      switch (e.bloc) {
        case 'nombre':
          return { type: 'nombre', id, fields: { NUM: Number(e.valeur) || 0 } };
        case 'variable':
          return { type: 'variable', id, fields: { VAR: e.variable || 'CHOIX' } };
        case 'bouton_etat':
          return { type: 'bouton_etat', id, fields: { BROCHE: e.broche } };
        case 'valeur_haut_bas':
          return { type: 'valeur_haut_bas', id, fields: { VALEUR: e.valeur ? '1' : '0' } };
        case 'comparaison':
          return deux('comparaison', COMPARAISONS_BLOCKLY[e.op] || 'EQ', e.a, e.b);
        case 'operation':
          return deux('operation', OPERATIONS_BLOCKLY[e.op] || 'ADD', e.a, e.b);
        case 'logique':
          return deux('logique', e.op === 'ou' ? 'OU' : 'ET', e.a, e.b);
        case 'non': {
          const bloc = { type: 'non', id, inputs: {} };
          entreeValeur(bloc, 'A', e.a);
          return bloc;
        }
        case 'hasard': {
          const bloc = { type: 'hasard', id, inputs: {} };
          entreeNombre(bloc, 'MIN', e.min);
          entreeNombre(bloc, 'MAX', e.max);
          return bloc;
        }
        default:
          return versBlocCarte({ type: e.bloc, id, inputs: {} }, e);
      }
    }

    function versBlocCarte(b, p) {
      const d = CARTES().BLOCS_CARTES[b.type];
      if (!d) return null;
      const champs = Object.keys(d.champs || {});
      if (champs.length) b.fields = {};
      for (const nom of champs) {
        const v = p[nom.toLowerCase()];
        const options = d.champs[nom];
        b.fields[nom] = v !== undefined && v !== null ? String(v) : Array.isArray(options) ? options[0][1] : (d.defauts || {})[nom] || '';
      }
      for (const nom of Object.keys(d.entrees || {})) entreeNombre(b, nom, p[nom.toLowerCase()] === undefined ? d.entrees[nom] : p[nom.toLowerCase()]);
      if (!Object.keys(b.inputs).length) delete b.inputs;
      return b;
    }

    function entreeValeur(bloc, nom, e) {
      const b = expression(e);
      if (b) bloc.inputs[nom] = { block: b };
    }

    // Entrée « nombre » : un nombre devient le bloc fantôme, une autre expression se pose dessus.
    function entreeNombre(bloc, nom, e) {
      const defaut = (ENTREES_NOMBRE[bloc.type] || (CARTES().BLOCS_CARTES[bloc.type] || {}).entrees || {})[nom] || 0;
      if (typeof e === 'number' || (e && e.bloc === 'nombre')) {
        bloc.inputs[nom] = { shadow: expression(e) };
      } else {
        bloc.inputs[nom] = { shadow: nombreBloc(defaut) };
        const b = expression(e);
        if (b) bloc.inputs[nom].block = b;
      }
    }

    function corps(bloc, nom, liste) {
      const p = pile(liste);
      if (p) bloc.inputs[nom] = { block: p };
    }

    function instruction(i) {
      const b = { type: i.bloc, id: i.id || nouvelId(), inputs: {} };
      switch (i.bloc) {
        case 'led_etat':
          b.fields = { ETAT: i.etat ? '1' : '0', BROCHE: i.broche };
          break;
        case 'attendre':
          entreeNombre(b, 'DUREE', i.duree);
          break;
        case 'servo_angle':
          b.fields = { BROCHE: i.broche };
          entreeNombre(b, 'ANGLE', i.angle);
          break;
        case 'affecter':
        case 'ajouter_a':
          b.fields = { VAR: i.variable || 'CHOIX' };
          entreeNombre(b, 'VALEUR', i.valeur);
          break;
        case 'si_alors':
        case 'si_sinon':
          entreeValeur(b, 'CONDITION', i.condition);
          corps(b, 'ALORS', i.alors);
          if (i.bloc === 'si_sinon') corps(b, 'SINON', i.sinon);
          break;
        case 'repeter_n':
          entreeNombre(b, 'FOIS', i.fois);
          corps(b, 'DO', i.corps);
          break;
        case 'tant_que':
        case 'repeter_jusqua':
          entreeValeur(b, 'CONDITION', i.condition);
          corps(b, 'DO', i.corps);
          break;
        case 'son':
          b.fields = { BROCHE: i.broche };
          entreeNombre(b, 'FREQUENCE', i.frequence);
          entreeNombre(b, 'DUREE', i.duree);
          break;
        default:
          return versBlocCarte(b, i);
      }
      if (!Object.keys(b.inputs).length) delete b.inputs;
      return b;
    }

    function pile(liste) {
      let premier = null;
      let dernier = null;
      for (const i of liste || []) {
        const b = instruction(i);
        if (!b) continue;
        if (dernier) dernier.next = { block: b };
        else premier = b;
        dernier = b;
      }
      return premier;
    }

    const v1 = versV1(programme);
    const blocs = [];
    let y = 24;
    const trouver = (q) => v1.fils.find((f) => f.quand === q);
    // « Au démarrage » et « Répéter indéfiniment » sont toujours là (on ne peut pas les supprimer).
    const ordre = [trouver('demarrage') || { quand: 'demarrage', corps: [] }, trouver('boucle') || { quand: 'boucle', corps: [] }, ...v1.fils.filter((f) => f.quand === 'appui' || f.quand === 'relache')];
    for (const f of ordre) {
      const evenement = f.quand === 'appui' || f.quand === 'relache';
      const b = evenement
        ? { type: 'quand_bouton', id: f.id || nouvelId(), x: 24, y, fields: { BROCHE: f.broche, FRONT: f.quand } }
        : { type: f.quand, id: f.quand, x: 24, y, deletable: false };
      const p = pile(f.corps);
      if (p) b.inputs = { DO: { block: p } };
      blocs.push(b);
      y += 76 + Math.max(1, compterBlocs(f.corps)) * 44 + 28;
    }
    return { blocks: { languageVersion: 0, blocks: blocs } };
  }

  function compterBlocs(liste) {
    let n = 0;
    for (const i of liste || []) {
      n += 1;
      for (const k of ['alors', 'sinon', 'corps']) if (i[k]) n += 1 + compterBlocs(i[k]);
    }
    return n;
  }

  // Remplace les chaînes « $nom » par la valeur du paramètre du parcours (ex. « $dureeGrandeDose »).
  function appliquerParametres(valeur, parametres) {
    if (typeof valeur === 'string' && valeur[0] === '$') {
      const nom = valeur.slice(1);
      if (!parametres || !(nom in parametres)) throw new Error('Paramètre inconnu : ' + valeur);
      return parametres[nom];
    }
    if (Array.isArray(valeur)) return valeur.map((v) => appliquerParametres(v, parametres));
    if (valeur && typeof valeur === 'object') {
      const copie = {};
      for (const k of Object.keys(valeur)) copie[k] = appliquerParametres(valeur[k], parametres);
      return copie;
    }
    return valeur;
  }

  // Types de blocs utilisés par un programme (indice 3, tableau du professeur).
  function typesDeBlocs(programme) {
    const types = [];
    const voir = (x) => {
      if (!x || typeof x !== 'object') return;
      if (Array.isArray(x)) return x.forEach(voir);
      if (x.bloc) types.push(x.bloc);
      if (x.quand) types.push(x.quand === 'appui' || x.quand === 'relache' ? 'quand_bouton' : x.quand);
      for (const v of Object.values(x)) if (v && typeof v === 'object') voir(v);
    };
    voir(versV1(programme).fils);
    return types;
  }

  // Exercice libre (Arduino Uno) : les composants que le programme utilise, dans l'ordre où ils apparaissent.
  //   → { composants: [{ type, broche }], conflits: [{ broche, types: ['led', 'bouton'] }] }
  // Une broche employée pour deux sortes de composants est un conflit : on garde la première.
  const SORTE_DU_BLOC = { led_etat: 'led', servo_angle: 'servo', son: 'buzzer', bouton_etat: 'bouton' };
  function composantsDuProgramme(programme) {
    const parBroche = new Map();
    const conflits = new Map();
    const voir = (type, broche) => {
      if (!broche) return;
      const deja = parBroche.get(broche);
      if (!deja) parBroche.set(broche, type);
      else if (deja !== type) conflits.set(broche, [...new Set([...(conflits.get(broche) || [deja]), type])]);
    };
    (function parcourir(x) {
      if (Array.isArray(x)) return x.forEach(parcourir);
      if (!x || typeof x !== 'object') return;
      if (x.quand === 'appui' || x.quand === 'relache') voir('bouton', x.broche);
      if (SORTE_DU_BLOC[x.bloc]) voir(SORTE_DU_BLOC[x.bloc], x.broche);
      for (const k of Object.keys(x)) if (x[k] && typeof x[k] === 'object') parcourir(x[k]);
    })(programme ? versV1(programme).fils : []);
    return {
      composants: [...parBroche].map(([broche, type]) => ({ type, broche })),
      conflits: [...conflits].map(([broche, types]) => ({ broche, types })),
    };
  }

  const api = { composantsDuProgramme, depuisBlockly, versBlockly, versV1, versSimplifie, appliquerParametres, typesDeBlocs, FORMAT_PROGRAMME: FORMAT };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign((global.LaboBlocs = global.LaboBlocs || {}), api);
})(this);
