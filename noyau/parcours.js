// Paquet de parcours (cahier des charges §4.10) : un parcours d'exercices versionné, partagé entre Labo Blocs et
// les projets. Le même objet sert de script (definirParcours({...}), lisible en file://) et de fichier d'échange
// (.json) pour l'import, l'export et la mise à jour.
//
//   { format: 'labo-blocs/parcours', version: 1, id, titre, versionParcours, date, moteurMinimum, carte, modes,
//     boutonsVersMasse, parametres, exercices: [ { id (stable, jamais réutilisé), numero, titre, defi, consigne,
//     composants, blocsAutorises, blocsDepart, scenarios, indices (2 écrits), aSavoir, solutionReference, libre
//     (exercice libre : composants déduits du programme de l'élève, pas de solution, « J'ai terminé »), variables
//     (noms donnés aux élèves ; absent : ['CHOIX']), variablesLibres (bouton « Créer une variable »), listes (noms des
//     listes données aux élèves ; « Créer une liste » dès qu'un bloc de liste est proposé), … } ],
//     fiches, lexique, classes (facultatif : classes proposées aux élèves), cheminSauvegarde (facultatif : dossier de
//     l'équipe, ex. ['{classe}', 'COMMUN', 'TECHNOLOGIE', 'ROBOT', '{equipe}']) }
//
// L'« empreinte » d'un exercice résume ce qui décide de sa réussite (consigne, composants, blocs, scénarios,
// solution, paramètres) : si elle change, un exercice déjà réussi passe « à revérifier ».

(function (global) {
  'use strict';

  const P = typeof module === 'object' && module.exports ? require('./programme.js') : global.LaboBlocs;

  const FORMAT = 'labo-blocs/parcours';
  const VERSION_MOTEUR = '0.5.0';

  // JSON aux clés triées : deux objets égaux donnent toujours le même texte.
  function canonique(x) {
    if (Array.isArray(x)) return '[' + x.map(canonique).join(',') + ']';
    if (x && typeof x === 'object') {
      return '{' + Object.keys(x).filter((k) => x[k] !== undefined).sort().map((k) => JSON.stringify(k) + ':' + canonique(x[k])).join(',') + '}';
    }
    return JSON.stringify(x === undefined ? null : x);
  }

  // Empreinte courte et stable (FNV-1a sur 2 × 32 bits), en hexadécimal.
  function hacher(texte) {
    let a = 0x811c9dc5;
    let b = 0x01000193 ^ 0x5bd1e995;
    for (let i = 0; i < texte.length; i++) {
      const c = texte.charCodeAt(i);
      a = Math.imul(a ^ c, 0x01000193) >>> 0;
      b = Math.imul(b ^ c, 0x5bd1e995) >>> 0;
    }
    return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
  }

  function empreinte(exercice) {
    const { consigne, composants, blocsAutorises, scenarios, solutionReference, apprentissage, camera } = exercice;
    return hacher(canonique({ consigne, composants, blocsAutorises, scenarios, solutionReference, ...(apprentissage ? {apprentissage,camera} : {}) }));
  }

  function comparerVersions(a, b) {
    const pa = String(a || '0').split('.').map(Number);
    const pb = String(b || '0').split('.').map(Number);
    for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) < (pb[i] || 0) ? -1 : 1;
    return 0;
  }

  // Problèmes d'un paquet (liste vide : il est utilisable). Phrases pour le professeur.
  const MODES = ['simulateur', 'direct', 'carte'];
  function controler(paquet, versionMoteur) {
    const pb = [];
    if (!paquet || paquet.format !== FORMAT) return ['Ce fichier n’est pas un parcours Labo Blocs.'];
    if (paquet.version > 1) pb.push('Ce parcours a été fait avec une version plus récente de Labo Blocs.');
    if (comparerVersions(versionMoteur || VERSION_MOTEUR, paquet.moteurMinimum) < 0) {
      pb.push(`Ce parcours demande Labo Blocs ${paquet.moteurMinimum} ou plus récent (version installée : ${versionMoteur || VERSION_MOTEUR}).`);
    }
    if (!paquet.id) pb.push('Le parcours n’a pas d’identifiant.');
    const vus = new Set();
    for (const [i, e] of (paquet.exercices || []).entries()) {
      const nom = `Exercice ${e.numero || i + 1}`;
      if (!e.id) pb.push(`${nom} : pas d’identifiant.`);
      else if (vus.has(e.id)) pb.push(`${nom} : l’identifiant « ${e.id} » est déjà utilisé.`);
      vus.add(e.id);
      if (!e.titre) pb.push(`${nom} : pas de titre.`);
      // Exercice libre : ni solution ni scénario (l'élève fait ce qu'il veut avec les blocs proposés).
      if (!e.libre && !e.solutionReference) pb.push(`${nom} : pas de solution de référence.`);
      if (!e.libre && !(e.scenarios || []).length) pb.push(`${nom} : pas de scénario de test.`);
    }
    if (!(paquet.exercices || []).length) pb.push('Le parcours n’a aucun exercice.');
    // Modes proposés (parcours, ou exercice qui en choisit d'autres) : le simulateur reste toujours (« Vérifier »).
    const modesValides = (m) => Array.isArray(m) && m.includes('simulateur') && m.every((x) => MODES.includes(x));
    if (paquet.modes && !modesValides(paquet.modes)) pb.push('Modes du parcours inconnus (simulateur, direct, carte ; le simulateur est obligatoire).');
    for (const [i, e] of (paquet.exercices || []).entries()) {
      if (e.modes && !modesValides(e.modes)) pb.push(`Exercice ${e.numero || i + 1} : modes inconnus (simulateur, direct, carte ; le simulateur est obligatoire).`);
      if (e.variables !== undefined && !(Array.isArray(e.variables) && e.variables.every((v) => typeof v === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,15}$/.test(v)))) {
        pb.push(`Exercice ${e.numero || i + 1} : noms de variables invalides (lettres sans accent, chiffres, « _ »).`);
      }
      if (e.listes !== undefined && !(Array.isArray(e.listes) && e.listes.every((v) => typeof v === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,15}$/.test(v)))) {
        pb.push(`Exercice ${e.numero || i + 1} : noms de listes invalides (lettres sans accent, chiffres, « _ »).`);
      }
    }
    // Classes et dossier de l'équipe (réglages facultatifs du parcours, pour le site de Labo Blocs).
    if (paquet.classes !== undefined && !(Array.isArray(paquet.classes) && paquet.classes.length && paquet.classes.every((c) => typeof c === 'string' && c.trim()))) {
      pb.push('Classes du parcours : une liste de noms de classes (ex. 4A, 4B).');
    }
    if (paquet.cheminSauvegarde !== undefined && !(Array.isArray(paquet.cheminSauvegarde) && paquet.cheminSauvegarde.includes('{equipe}'))) {
      pb.push('Dossier de l’équipe du parcours : il doit contenir {equipe}.');
    }
    return pb;
  }

  // Paquet prêt à l'emploi : paramètres remplacés, rang et empreinte de chaque exercice.
  function preparer(paquet) {
    const parametres = paquet.parametres || {};
    const exercices = (paquet.exercices || []).map((e, rang) => {
      const x = P.appliquerParametres(e, parametres);
      x.rang = rang;
      x.numero = x.numero || String(rang + 1);
      x.empreinte = empreinte(x);
      if (x.boutonsVersMasse === undefined) x.boutonsVersMasse = paquet.boutonsVersMasse !== false;
      // Carte du parcours (après l'empreinte : les exercices existants gardent la leur).
      if (!x.carte) x.carte = paquet.carte || 'uno';
      return x;
    });
    return Object.assign({}, paquet, { exercices, parametres });
  }

  // Différences entre deux versions d'un parcours (écran « Mettre à jour les exercices »).
  function comparer(ancien, nouveau) {
    const a = preparer(ancien).exercices;
    const n = preparer(nouveau).exercices;
    const parId = (liste) => new Map(liste.map((e) => [e.id, e]));
    const ia = parId(a);
    const inn = parId(n);
    const ajoutes = n.filter((e) => !ia.has(e.id)).map((e) => e.id);
    const supprimes = a.filter((e) => !inn.has(e.id)).map((e) => e.id);
    const modifies = n.filter((e) => ia.has(e.id) && ia.get(e.id).empreinte !== e.empreinte).map((e) => e.id);
    // Déplacé : l'ordre relatif des exercices communs a changé.
    const communsA = a.filter((e) => inn.has(e.id)).map((e) => e.id);
    const communsN = n.filter((e) => ia.has(e.id)).map((e) => e.id);
    const deplaces = communsN.filter((id, i) => communsA[i] !== id);
    const sansRang = (e) => canonique(Object.assign({}, e, { rang: undefined }));
    const textes = n.filter((e) => ia.has(e.id) && ia.get(e.id).empreinte === e.empreinte && sansRang(ia.get(e.id)) !== sansRang(e)).map((e) => e.id);
    return { ajoutes, supprimes, modifies, deplaces, textes };
  }

  // Indice 3 : la silhouette du programme (forme de la solution, sans les broches ni les valeurs).
  function silhouette(exercice) {
    return exercice.silhouette || P.versV1(exercice.solutionReference);
  }

  // Texte du fichier parcours d'un projet (site/parcours/<id>.js) : un script, pour rester lisible en file://.
  function scriptParcours(paquet) {
    return (
      `// Parcours « ${paquet.titre} », version ${paquet.versionParcours} (Labo Blocs).\n` +
      '// Ce fichier est écrit par « Mettre à jour les exercices » (outil du professeur) : ne pas le modifier à la main.\n' +
      `definirParcours(${JSON.stringify(paquet, null, 2)});\n`
    );
  }

  const parcoursDefinis = [];
  const api = { FORMAT_PARCOURS: FORMAT, VERSION_MOTEUR, scriptParcours, controler, preparer, comparer, empreinte, comparerVersions, silhouette, canonique, parcoursDefinis };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    Object.assign((global.LaboBlocs = global.LaboBlocs || {}), api);
    global.definirParcours = (p) => parcoursDefinis.push(p);
  }
})(this);
