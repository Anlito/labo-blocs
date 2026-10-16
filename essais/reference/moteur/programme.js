// Conversion entre la sauvegarde Blockly (JSON) et le « programme » simplifié exécuté par le moteur.
// Aucun besoin de Blockly ici : on lit et on écrit le JSON de Blockly.serialization.workspaces.
//
// Programme simplifié :
//   { demarrage: [instruction…], boucle: [instruction…] }
// Instructions :
//   { bloc: 'led_etat',    broche: 'D3', etat: 1 }
//   { bloc: 'attendre',    duree: expression }           (en secondes)
//   { bloc: 'servo_angle', broche: 'D6', angle: expression }
//   { bloc: 'affecter',    variable: 'CHOIX', valeur: expression }
//   { bloc: 'si_alors',    condition: expression, alors: [...] }
//   { bloc: 'si_sinon',    condition: expression, alors: [...], sinon: [...] }
// Expressions :
//   un nombre (raccourci de { bloc: 'nombre', valeur: n }), { bloc: 'variable', variable: 'CHOIX' },
//   { bloc: 'bouton_etat', broche: 'D8' }, { bloc: 'valeur_haut_bas', valeur: 1 },
//   { bloc: 'comparaison', op: '=' | '≠', a: expression, b: expression }
// Chaque nœud venu de Blockly porte aussi son « id », pour surligner le bloc en cours.

(function (global) {
  'use strict';

  const INSTRUCTIONS = ['led_etat', 'attendre', 'servo_angle', 'affecter', 'si_alors', 'si_sinon'];

  // Entrées « nombre » des blocs et valeur par défaut de leur bloc fantôme.
  const ENTREES_NOMBRE = {
    attendre: { DUREE: 1 },
    servo_angle: { ANGLE: 90 },
    affecter: { VALEUR: 0 },
  };

  function entree(bloc, nom) {
    const e = bloc.inputs && bloc.inputs[nom];
    return e ? e.block || e.shadow || null : null;
  }

  function champ(bloc, nom) {
    return bloc.fields ? bloc.fields[nom] : undefined;
  }

  // Lit une sauvegarde Blockly. Renvoie le programme, les blocs restés seuls hors du programme
  // et les blocs incomplets (une entrée vide).
  function depuisBlockly(sauvegarde) {
    const hauts = (sauvegarde && sauvegarde.blocks && sauvegarde.blocks.blocks) || [];
    const programme = { demarrage: [], boucle: [] };
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
      switch (bloc.type) {
        case 'nombre':
          return { bloc: 'nombre', id: bloc.id, valeur: Number(champ(bloc, 'NUM')) || 0 };
        case 'variable':
          return { bloc: 'variable', id: bloc.id, variable: champ(bloc, 'VAR') || 'CHOIX' };
        case 'bouton_etat':
          return { bloc: 'bouton_etat', id: bloc.id, broche: champ(bloc, 'BROCHE') };
        case 'valeur_haut_bas':
          return { bloc: 'valeur_haut_bas', id: bloc.id, valeur: Number(champ(bloc, 'VALEUR')) ? 1 : 0 };
        case 'comparaison':
          return {
            bloc: 'comparaison',
            id: bloc.id,
            op: champ(bloc, 'OP') === 'NEQ' ? '≠' : '=',
            a: expression(entree(bloc, 'A'), bloc),
            b: expression(entree(bloc, 'B'), bloc),
          };
        default:
          return null;
      }
    }

    function instruction(b) {
      switch (b.type) {
        case 'led_etat':
          return { bloc: b.type, id: b.id, broche: champ(b, 'BROCHE'), etat: Number(champ(b, 'ETAT')) ? 1 : 0 };
        case 'attendre':
          return { bloc: b.type, id: b.id, duree: expression(entree(b, 'DUREE'), b) };
        case 'servo_angle':
          return { bloc: b.type, id: b.id, broche: champ(b, 'BROCHE'), angle: expression(entree(b, 'ANGLE'), b) };
        case 'affecter':
          return { bloc: b.type, id: b.id, variable: champ(b, 'VAR') || 'CHOIX', valeur: expression(entree(b, 'VALEUR'), b) };
        case 'si_alors':
          return { bloc: b.type, id: b.id, condition: expression(entree(b, 'CONDITION'), b), alors: pile(entree(b, 'ALORS')) };
        case 'si_sinon':
          return {
            bloc: b.type,
            id: b.id,
            condition: expression(entree(b, 'CONDITION'), b),
            alors: pile(entree(b, 'ALORS')),
            sinon: pile(entree(b, 'SINON')),
          };
        default:
          return null;
      }
    }

    for (const b of hauts) {
      if (b.type === 'demarrage' && !demarrage) {
        demarrage = true;
        programme.demarrage = pile(entree(b, 'DO'));
      } else if (b.type === 'boucle' && !boucle) {
        boucle = true;
        programme.boucle = pile(entree(b, 'DO'));
      } else {
        horsProgramme.push(b.id);
      }
    }
    return { programme, horsProgramme, incomplets };
  }

  // Écrit un programme simplifié en sauvegarde Blockly (blocs de départ, solution de référence).
  function versBlockly(programme, options) {
    const opts = options || {};
    let compteur = 0;
    const nouvelId = () => (opts.prefixe || 'b') + ++compteur;

    function nombreFantome(valeur) {
      return { type: 'nombre', id: nouvelId(), fields: { NUM: valeur } };
    }

    function expression(e) {
      if (e === null || e === undefined) return null;
      if (typeof e === 'number') return { type: 'nombre', id: nouvelId(), fields: { NUM: e } };
      switch (e.bloc) {
        case 'nombre':
          return { type: 'nombre', id: e.id || nouvelId(), fields: { NUM: Number(e.valeur) || 0 } };
        case 'variable':
          return { type: 'variable', id: e.id || nouvelId(), fields: { VAR: e.variable || 'CHOIX' } };
        case 'bouton_etat':
          return { type: 'bouton_etat', id: e.id || nouvelId(), fields: { BROCHE: e.broche } };
        case 'valeur_haut_bas':
          return { type: 'valeur_haut_bas', id: e.id || nouvelId(), fields: { VALEUR: e.valeur ? '1' : '0' } };
        case 'comparaison': {
          const b = { type: 'comparaison', id: e.id || nouvelId(), fields: { OP: e.op === '≠' ? 'NEQ' : 'EQ' }, inputs: {} };
          const a = expression(e.a);
          const c = expression(e.b);
          if (a) b.inputs.A = { block: a };
          if (c) b.inputs.B = { block: c };
          return b;
        }
        default:
          return null;
      }
    }

    // Entrée « nombre » : un nombre devient le bloc fantôme, une autre expression se pose dessus.
    function entreeNombre(bloc, nom, e) {
      const defaut = ENTREES_NOMBRE[bloc.type][nom];
      if (typeof e === 'number' || (e && e.bloc === 'nombre')) {
        bloc.inputs[nom] = { shadow: expression(e) };
      } else {
        bloc.inputs[nom] = { shadow: nombreFantome(defaut) };
        const b = expression(e);
        if (b) bloc.inputs[nom].block = b;
      }
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
          b.fields = { VAR: i.variable || 'CHOIX' };
          entreeNombre(b, 'VALEUR', i.valeur);
          break;
        case 'si_alors':
        case 'si_sinon': {
          const c = expression(i.condition);
          if (c) b.inputs.CONDITION = { block: c };
          const alors = pile(i.alors);
          if (alors) b.inputs.ALORS = { block: alors };
          if (i.bloc === 'si_sinon') {
            const sinon = pile(i.sinon);
            if (sinon) b.inputs.SINON = { block: sinon };
          }
          break;
        }
        default:
          return null;
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

    function chapeau(type, liste, y) {
      const b = { type, id: type, x: 24, y, deletable: false };
      const p = pile(liste);
      if (p) b.inputs = { DO: { block: p } };
      return b;
    }

    const demarrage = (programme && programme.demarrage) || [];
    const boucle = (programme && programme.boucle) || [];
    const hauteur = 76 + Math.max(1, compterBlocs(demarrage)) * 44;
    return {
      blocks: {
        languageVersion: 0,
        blocks: [chapeau('demarrage', demarrage, 24), chapeau('boucle', boucle, 24 + hauteur + 28)],
      },
    };
  }

  function compterBlocs(liste) {
    let n = 0;
    for (const i of liste || []) {
      n += 1;
      if (i.alors) n += 1 + compterBlocs(i.alors);
      if (i.sinon) n += 1 + compterBlocs(i.sinon);
    }
    return n;
  }

  // Remplace les chaînes « $nom » par la valeur du paramètre (ex. « $dureeGrandeDose »).
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

  const api = { depuisBlockly, versBlockly, appliquerParametres, INSTRUCTIONS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign((global.Atelier = global.Atelier || {}), api);
})(this);
