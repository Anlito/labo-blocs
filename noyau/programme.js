// Conversion entre la sauvegarde Blockly (JSON) et le programme de Labo Blocs (format v1, docs/PLAN.md §3).
// Aucun besoin de Blockly ici : on lit et on écrit le JSON de Blockly.serialization.workspaces.
// Les types et les noms de champs des blocs de l'atelier du distributeur sont gardés : ses sauvegardes se relisent.
//
// Programme v1 :
//   { format: 'labo-blocs/programme', version: 1,
//     fils: [ { quand: 'demarrage' | 'boucle' | 'appui' | 'relache', broche?, corps: [instruction…] }
//             { quand: 'camera', etiquette: n° (0 = rien), front: 'voit' | 'plus', corps }  (caméra : jalon 6)
//             { quand: 'touche', touche: 'haut' | 'espace' | 'a' | '0'…, front: 'appui' | 'relache', corps }
//             { quand: 'joystick', direction: 'haut' | 'bas' | 'gauche' | 'droite' | 'centre', corps } ],
//     notes?: [ { texte, x, y, largeur?, hauteur? } ] }  (clavier ; notes : commentaires posés dans l'espace des blocs)
// Tout bloc (instruction, expression, fil) peut porter « commentaire » : le texte de son commentaire Blockly.
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
    reetalonner: { VALEUR: 0, DE_MIN: 0, DE_MAX: 1023, VERS_MIN: 0, VERS_MAX: 180 },
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
    const v1 = {
      format: FORMAT,
      version: VERSION,
      fils: [
        { quand: 'demarrage', corps: (p && p.demarrage) || [] },
        { quand: 'boucle', corps: (p && p.boucle) || [] },
      ],
    };
    if (p && Array.isArray(p.notes) && p.notes.length) v1.notes = p.notes;
    return v1;
  }

  // v1 → programme simplifié de l'atelier { demarrage, boucle } (outils des projets qui lisent encore ce format).
  // Les autres fils (« quand on appuie… ») sont gardés à part dans « fils ».
  function versSimplifie(p) {
    if (!p || !Array.isArray(p.fils)) return p;
    const corps = (quand) => p.fils.filter((f) => f.quand === quand).flatMap((f) => f.corps || []);
    const autres = p.fils.filter((f) => f.quand !== 'demarrage' && f.quand !== 'boucle');
    const r = { demarrage: corps('demarrage'), boucle: corps('boucle') };
    if (autres.length) r.fils = autres;
    if (Array.isArray(p.notes) && p.notes.length) r.notes = p.notes;
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

    // Commentaire Blockly d'un bloc (clic droit › « Ajouter un commentaire ») : gardé dans « commentaire ».
    function commenter(n, b) {
      const texte = b && b.icons && b.icons.comment && b.icons.comment.text;
      if (n && typeof texte === 'string' && texte.trim()) n.commentaire = texte;
      return n;
    }

    function pile(bloc) {
      const liste = [];
      for (let b = bloc; b; b = b.next && b.next.block) {
        const i = commenter(instruction(b), b);
        if (i) liste.push(i);
      }
      return liste;
    }

    const expression = (bloc, parent) => commenter(expressionSeule(bloc, parent), bloc);
    function expressionSeule(bloc, parent) {
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
        case 'reetalonner':
          return Object.assign(e, {
            bloc: 'reetalonner',
            valeur: expression(entree(bloc, 'VALEUR'), bloc),
            de1: expression(entree(bloc, 'DE_MIN'), bloc),
            de2: expression(entree(bloc, 'DE_MAX'), bloc),
            vers1: expression(entree(bloc, 'VERS_MIN'), bloc),
            vers2: expression(entree(bloc, 'VERS_MAX'), bloc),
          });
        case 'joystick_position':
          return Object.assign(e, { bloc: 'joystick_position', axe: champ(bloc, 'AXE') === 'y' ? 'y' : 'x' });
        case 'joystick_valeur':
          return Object.assign(e, { bloc: 'joystick_valeur', axe: champ(bloc, 'AXE') === 'y' ? 'y' : 'x' });
        case 'joystick_direction':
          return Object.assign(e, { bloc: 'joystick_direction', direction: champ(bloc, 'DIRECTION') || 'haut' });
        case 'joystick_bouton':
          return Object.assign(e, { bloc: 'joystick_bouton' });
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
      } else if (b.type === 'quand_joystick') {
        fils.push({ quand: 'joystick', direction: champ(b, 'DIRECTION') || 'haut', id: b.id, corps: pile(entree(b, 'DO')) });
      } else if (b.type === 'quand_touche') {
        fils.push({ quand: 'touche', touche: champ(b, 'TOUCHE') || 'espace', front: champ(b, 'FRONT') === 'relache' ? 'relache' : 'appui', id: b.id, corps: pile(entree(b, 'DO')) });
      } else if (b.type === 'quand_camera') {
        fils.push({ quand: 'camera', etiquette: Number(champ(b, 'ETIQUETTE')) || 0, front: champ(b, 'FRONT') === 'plus' ? 'plus' : 'voit', id: b.id, corps: pile(entree(b, 'DO')) });
      } else {
        horsProgramme.push(b.id);
        continue;
      }
      commenter(fils[fils.length - 1], b);
    }
    // « Au démarrage » d'abord, comme sur la carte.
    fils.sort((a, b) => (a.quand === 'demarrage' ? -1 : b.quand === 'demarrage' ? 1 : 0));
    const programme = { format: FORMAT, version: VERSION, fils };
    // Notes posées dans l'espace des blocs (clic droit dans le vide › « Ajouter un commentaire », ou le bouton).
    const notes = ((sauvegarde && sauvegarde.workspaceComments) || [])
      .filter((c) => typeof c.text === 'string' && c.text.trim())
      .map((c) => ({ texte: c.text, x: Math.round(Number(c.x) || 0), y: Math.round(Number(c.y) || 0), largeur: Math.round(Number(c.width) || 200), hauteur: Math.round(Number(c.height) || 100) }));
    if (notes.length) programme.notes = notes;
    return { programme, horsProgramme, incomplets };
  }

  // Écrit un programme (v1 ou atelier) en sauvegarde Blockly (blocs de départ, solution de référence, indice 3).
  function versBlockly(programme, options) {
    const opts = options || {};
    let compteur = 0;
    const nouvelId = () => (opts.prefixe || 'b') + ++compteur;

    function nombreBloc(valeur) {
      return { type: 'nombre', id: nouvelId(), fields: { NUM: Number(valeur) || 0 } };
    }

    // Commentaire d'un nœud → commentaire Blockly, ouvert (le professeur s'en sert pour donner une information).
    function commenter(b, n) {
      if (b && n && typeof n.commentaire === 'string' && n.commentaire.trim()) b.icons = { comment: { text: n.commentaire, pinned: true, height: 80, width: 200 } };
      return b;
    }
    const expression = (e) => commenter(expressionSeule(e), e);
    function expressionSeule(e) {
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
        case 'joystick_position':
          return { type: 'joystick_position', id, fields: { AXE: e.axe === 'y' ? 'y' : 'x' } };
        case 'joystick_valeur':
          return { type: 'joystick_valeur', id, fields: { AXE: e.axe === 'y' ? 'y' : 'x' } };
        case 'joystick_direction':
          return { type: 'joystick_direction', id, fields: { DIRECTION: e.direction || 'haut' } };
        case 'joystick_bouton':
          return { type: 'joystick_bouton', id };
        case 'hasard': {
          const bloc = { type: 'hasard', id, inputs: {} };
          entreeNombre(bloc, 'MIN', e.min);
          entreeNombre(bloc, 'MAX', e.max);
          return bloc;
        }
        case 'reetalonner': {
          const bloc = { type: 'reetalonner', id, inputs: {} };
          entreeNombre(bloc, 'VALEUR', e.valeur);
          entreeNombre(bloc, 'DE_MIN', e.de1);
          entreeNombre(bloc, 'DE_MAX', e.de2);
          entreeNombre(bloc, 'VERS_MIN', e.vers1);
          entreeNombre(bloc, 'VERS_MAX', e.vers2);
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
        bloc.inputs[nom] = { shadow: expressionSeule(e) }; // un bloc fantôme ne porte pas de commentaire
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
        const b = commenter(instruction(i), i);
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
    const ordre = [trouver('demarrage') || { quand: 'demarrage', corps: [] }, trouver('boucle') || { quand: 'boucle', corps: [] }, ...v1.fils.filter((f) => f.quand === 'appui' || f.quand === 'relache' || f.quand === 'camera' || f.quand === 'touche' || f.quand === 'joystick')];
    for (const f of ordre) {
      const evenement = f.quand === 'appui' || f.quand === 'relache';
      const b = f.quand === 'joystick'
        ? { type: 'quand_joystick', id: f.id || nouvelId(), x: 24, y, fields: { DIRECTION: f.direction || 'haut' } }
        : f.quand === 'touche'
        ? { type: 'quand_touche', id: f.id || nouvelId(), x: 24, y, fields: { TOUCHE: f.touche || 'espace', FRONT: f.front === 'relache' ? 'relache' : 'appui' } }
        : f.quand === 'camera'
        ? { type: 'quand_camera', id: f.id || nouvelId(), x: 24, y, fields: { ETIQUETTE: String(f.etiquette || 0), FRONT: f.front === 'plus' ? 'plus' : 'voit' } }
        : evenement
          ? { type: 'quand_bouton', id: f.id || nouvelId(), x: 24, y, fields: { BROCHE: f.broche, FRONT: f.quand } }
          : { type: f.quand, id: f.quand, x: 24, y, deletable: false };
      const p = pile(f.corps);
      if (p) b.inputs = { DO: { block: p } };
      commenter(b, f);
      blocs.push(b);
      y += 76 + Math.max(1, compterBlocs(f.corps)) * 44 + 28;
    }
    const sauvegarde = { blocks: { languageVersion: 0, blocks: blocs } };
    if (Array.isArray(v1.notes) && v1.notes.length) {
      sauvegarde.workspaceComments = v1.notes.map((n) => ({ id: nouvelId(), text: String(n.texte || ''), x: Number(n.x) || 0, y: Number(n.y) || 0, width: Number(n.largeur) || 200, height: Number(n.hauteur) || 100 }));
    }
    return sauvegarde;
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
      if (x.quand) types.push(x.quand === 'appui' || x.quand === 'relache' ? 'quand_bouton' : x.quand === 'camera' ? 'quand_camera' : x.quand === 'touche' ? 'quand_touche' : x.quand === 'joystick' ? 'quand_joystick' : x.quand);
      for (const v of Object.values(x)) if (v && typeof v === 'object') voir(v);
    };
    voir(versV1(programme).fils);
    return types;
  }

  // Exercice libre (Arduino Uno) : les composants que le programme utilise, dans l'ordre où ils apparaissent.
  //   → { composants: [{ type, broche, conflit? }], conflits: [{ broche, types: ['led', 'bouton'] }] }
  // Une broche employée pour deux sortes de composants est un conflit : les deux composants restent (l'élève les voit
  // dans le simulateur), marqués « conflit », et le conflit est signalé.
  const SORTE_DU_BLOC = { led_etat: 'led', servo_angle: 'servo', son: 'buzzer', bouton_etat: 'bouton' };
  // carte : celle de l'exercice (le joystick se branche sur A0, A1, D2 sur l'Uno ; P0, P1, P2 sur la micro:bit).
  function composantsDuProgramme(programme, carte) {
    const composants = [];
    let joystick = false;
    const voir = (type, broche) => {
      if (!broche || composants.some((c) => c.type === type && c.broche === broche)) return;
      composants.push({ type, broche });
    };
    (function parcourir(x) {
      if (Array.isArray(x)) return x.forEach(parcourir);
      if (!x || typeof x !== 'object') return;
      if (x.quand === 'appui' || x.quand === 'relache') voir('bouton', x.broche);
      if (SORTE_DU_BLOC[x.bloc]) voir(SORTE_DU_BLOC[x.bloc], x.broche);
      if (x.quand === 'joystick' || CARTES().BLOCS_JOYSTICK.includes(x.bloc)) joystick = true;
      for (const k of Object.keys(x)) if (x[k] && typeof x[k] === 'object') parcourir(x[k]);
    })(programme ? versV1(programme).fils : []);
    if (joystick) composants.push(CARTES().nouveauJoystick(carte));
    const conflits = [];
    for (const c of composants) {
      const memes = composants.filter((x) => x.broche === c.broche);
      if (memes.length < 2) continue;
      c.conflit = true;
      if (!conflits.some((x) => x.broche === c.broche)) conflits.push({ broche: c.broche, types: memes.map((x) => x.type) });
    }
    return { composants, conflits };
  }

  // Nom d'une variable créée par un élève (« ma vitesse » → « ma_vitesse ») : lettres sans accent, chiffres et « _ »,
  // une lettre au début, 16 caractères au plus, pas un mot du langage Arduino, pas déjà pris (majuscules comprises).
  //   → { ok, nom } ou { ok: false, message }
  const MOTS_RESERVES = new Set(
    'if else for while do switch case break continue return int float long char bool boolean byte void true false const static setup loop delay millis digitalWrite digitalRead analogRead analogWrite pinMode tone noTone random HIGH LOW INPUT OUTPUT Serial Servo'
      .toLowerCase()
      .split(' '),
  );
  function nomDeVariable(texte, existantes) {
    const nom = String(texte || '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s'’-]+/g, '_')
      .replace(/[^A-Za-z0-9_]/g, '');
    if (!nom) return { ok: false, message: 'Écris un nom pour ta variable (par exemple : vitesse).' };
    if (!/^[A-Za-z]/.test(nom)) return { ok: false, message: 'Le nom d’une variable commence par une lettre.' };
    if (nom.length > 16) return { ok: false, message: 'Ce nom est trop long : 16 lettres au plus.' };
    if (MOTS_RESERVES.has(nom.toLowerCase())) return { ok: false, message: `« ${nom} » est déjà un mot du langage de la carte : choisis un autre nom.` };
    if ((existantes || []).some((v) => v.toLowerCase() === nom.toLowerCase())) return { ok: false, message: `La variable « ${nom} » existe déjà.` };
    return { ok: true, nom };
  }

  // Noms des variables d'une sauvegarde Blockly (champs VAR), pour que les menus les connaissent avant le chargement.
  function variablesDeSauvegarde(sauvegarde) {
    const noms = new Set();
    (function parcourir(x) {
      if (Array.isArray(x)) return x.forEach(parcourir);
      if (!x || typeof x !== 'object') return;
      if (x.fields && typeof x.fields.VAR === 'string' && x.fields.VAR) noms.add(x.fields.VAR);
      for (const k of Object.keys(x)) if (x[k] && typeof x[k] === 'object') parcourir(x[k]);
    })(sauvegarde);
    return [...noms];
  }

  // Le programme utilise-t-il la caméra (événement « quand la caméra… » ou bloc de la caméra) ?
  function utiliseCamera(programme) {
    let oui = false;
    (function parcourir(x) {
      if (oui || !x || typeof x !== 'object') return;
      if (Array.isArray(x)) return x.forEach(parcourir);
      if (x.quand === 'camera' || (typeof x.bloc === 'string' && x.bloc.indexOf('camera_') === 0) || (x.bloc === 'ext' && x.extension === 3)) oui = true;
      for (const k of Object.keys(x)) if (x[k] && typeof x[k] === 'object') parcourir(x[k]);
    })(programme ? versV1(programme).fils : []);
    return oui;
  }

  // Le programme utilise-t-il le clavier de l'ordinateur (« quand la touche … » ou « la touche … est appuyée ») ?
  function utiliseClavier(programme) {
    let oui = false;
    (function parcourir(x) {
      if (oui || !x || typeof x !== 'object') return;
      if (Array.isArray(x)) return x.forEach(parcourir);
      if (x.quand === 'touche' || x.bloc === 'touche_appuyee' || (x.bloc === 'ext' && x.extension === 4)) oui = true;
      for (const k of Object.keys(x)) if (x[k] && typeof x[k] === 'object') parcourir(x[k]);
    })(programme ? versV1(programme).fils : []);
    return oui;
  }

  const api = { utiliseCamera, utiliseClavier, nomDeVariable, variablesDeSauvegarde, composantsDuProgramme, depuisBlockly, versBlockly, versV1, versSimplifie, appliquerParametres, typesDeBlocs, FORMAT_PROGRAMME: FORMAT };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign((global.LaboBlocs = global.LaboBlocs || {}), api);
})(this);
