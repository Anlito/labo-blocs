// Compétences et niveaux (jalon 5) : chaque exercice d'un parcours est rattaché à une compétence du programme de
// technologie du cycle 4 (BO n° 9 du 29 février 2024 ; libellés repris mot pour mot du Carnet de classe). Le travail
// d'une équipe donne un niveau par compétence (1 Non atteint · 2 Partiellement atteint · 3 Atteint · 4 Dépassé) et une
// note /20 = moyenne des niveaux × 5 (comme le Carnet de classe).
//
// Score d'un exercice (de 0 à 1), d'après l'historique de la sauvegarde :
//   réussi : 1, moins une retenue par indice ouvert et par vérification ratée AVANT la réussite (plafonnées) ;
//   commencé (au moins une vérification) sans réussite : « participation » ; pas commencé : 0.
// Niveau d'une compétence : moyenne des scores de ses exercices attendus (hors défis) —
//   sous « partiel » : Non atteint ; sous « atteint » : Partiellement atteint ; sinon Atteint ;
//   Dépassé : Atteint, et un défi de la compétence réussi.
// Le professeur peut forcer un niveau (fiche de l'équipe) : le niveau forcé remplace le niveau calculé.
(function (global) {
  'use strict';

  const COMPETENCES = [
    { code: 'C5', n: 5, libelle: 'Identifier un dysfonctionnement d’un objet technique et y remédier' },
    { code: 'C6', n: 6, libelle: 'Comprendre et modifier un programme associé à une fonctionnalité d’un objet ou d’un système technique' },
    { code: 'C8', n: 8, libelle: 'Valider les solutions techniques par des simulations ou par des protocoles de tests' },
    { code: 'C9', n: 9, libelle: 'Concevoir, écrire, tester et mettre au point un programme' },
  ];
  const COMPETENCE_PAR_DEFAUT = 'C9';
  const SOURCE = 'Programme de technologie du cycle 4 · BO n° 9 du 29 février 2024';

  const NIVEAUX = [
    { v: 1, pronote: 'Non atteint' },
    { v: 2, pronote: 'Partiellement atteint' },
    { v: 3, pronote: 'Atteint' },
    { v: 4, pronote: 'Dépassé' },
  ];
  const nomNiveau = (v) => (NIVEAUX[v - 1] || {}).pronote || '';

  const BAREME = {
    participation: 0.2,
    penaliteIndice: 0.1,
    penaliteIndiceMax: 0.3,
    penaliteEchec: 0.05,
    penaliteEchecMax: 0.25,
    partiel: 0.25,
    atteint: 0.6,
    // Exercices attendus à ce moment : les N premiers du parcours (null : tous).
    objectif: null,
  };
  const completerBareme = (b) => Object.assign({}, BAREME, b || {});

  const competenceDe = (ex) => ex.competence || COMPETENCE_PAR_DEFAUT;

  // Indices et vérifications ratées avant la première réussite.
  function avantReussite(e) {
    let indices = 0;
    let echecs = 0;
    for (const h of (e && e.historique) || []) {
      if (h.type === 'verification' && h.reussi) break;
      if (h.type === 'indice') indices = Math.max(indices, h.niveau || indices + 1);
      if (h.type === 'verification') echecs++;
    }
    return { indices, echecs };
  }

  function scoreExercice(e, bareme) {
    const b = completerBareme(bareme);
    if (!e) return { score: 0, etat: 'non_commence' };
    if (e.statut === 'reussi') {
      const { indices, echecs } = avantReussite(e);
      const retenue = Math.min(indices * b.penaliteIndice, b.penaliteIndiceMax) + Math.min(echecs * b.penaliteEchec, b.penaliteEchecMax);
      return { score: Math.round(Math.max(0, 1 - retenue) * 10000) / 10000, etat: 'reussi', indices, echecs };
    }
    const verifs = ((e.historique || []).filter((h) => h.type === 'verification')).length;
    if (verifs) return { score: b.participation, etat: 'commence', echecs: verifs };
    return { score: 0, etat: 'non_commence' };
  }

  // donnees : sauvegarde de l'équipe (rubrique programmation) ; paquet : parcours préparé.
  // options : { bareme, forces: { C9: 4 } }
  function evaluerEquipe(donnees, paquet, options) {
    const o = options || {};
    const b = completerBareme(o.bareme || paquet.bareme);
    const forces = o.forces || {};
    const ex = (donnees && donnees.programmation && donnees.programmation.exercices) || {};
    const liste = paquet.exercices || [];
    const attendus = b.objectif ? liste.slice(0, b.objectif) : liste;
    const codes = COMPETENCES.map((c) => c.code).filter((code) => liste.some((e) => competenceDe(e) === code));
    const competences = codes.map((code) => {
      const c = COMPETENCES.find((x) => x.code === code);
      const siens = attendus.filter((e) => competenceDe(e) === code && !e.defi);
      const scores = siens.map((e) => scoreExercice(ex[e.id], b).score);
      let calcule = null;
      let moyenne = null;
      if (scores.length) {
        moyenne = Math.round((scores.reduce((s, x) => s + x, 0) / scores.length) * 10000) / 10000;
        calcule = moyenne < b.partiel ? 1 : moyenne < b.atteint ? 2 : 3;
        const defis = liste.filter((e) => competenceDe(e) === code && e.defi);
        if (calcule === 3 && defis.some((e) => ex[e.id] && ex[e.id].statut === 'reussi')) calcule = 4;
      }
      const force = forces[code] >= 1 && forces[code] <= 4 ? Number(forces[code]) : null;
      return { code, libelle: c.libelle, n: c.n, niveau: force || calcule, calcule, force, moyenne, exercices: siens.map((e) => e.id) };
    });
    const notes = competences.filter((c) => c.niveau);
    const note = notes.length ? Math.round((notes.reduce((s, c) => s + c.niveau, 0) / notes.length) * 5 * 100) / 100 : null;
    const reussis = liste.filter((e) => ex[e.id] && ex[e.id].statut === 'reussi').length;
    return { competences, note, reussis, total: liste.length, attendus: attendus.length };
  }

  // ---------- Fichier « résultats Labo Blocs » (importé par le Carnet de classe) ----------
  //   { format: 'labo-blocs/resultats', version: 1, date, projet: { id, titre }, parcours: { id, version },
  //     source, competences: [{ code, n, libelle }], niveaux: [{ v, pronote }],
  //     equipes: [{ eleves: ['Léa', 'Hugo'], classe, niveaux: { C9: 3 }, note, commentaire, reussis, total }] }
  const FORMAT_RESULTATS = 'labo-blocs/resultats';

  function creerResultats(options) {
    const o = options || {};
    const codes = new Set();
    const equipes = (o.equipes || []).map((x) => {
      const niveaux = {};
      for (const c of x.evaluation.competences) {
        codes.add(c.code);
        if (c.niveau) niveaux[c.code] = c.niveau;
      }
      return {
        eleves: (x.eleves || []).slice(),
        classe: x.classe || '',
        niveaux,
        note: x.evaluation.note,
        commentaire: x.commentaire || '',
        reussis: x.evaluation.reussis,
        total: x.evaluation.total,
      };
    });
    return {
      format: FORMAT_RESULTATS,
      version: 1,
      date: o.date || new Date().toISOString().slice(0, 10),
      projet: o.projet || null,
      parcours: o.paquet ? { id: o.paquet.id, titre: o.paquet.titre, version: o.paquet.versionParcours } : null,
      source: SOURCE,
      competences: COMPETENCES.filter((c) => codes.has(c.code)).map((c) => ({ code: c.code, n: c.n, libelle: c.libelle })),
      niveaux: NIVEAUX.map((n) => Object.assign({}, n)),
      equipes,
    };
  }

  // CSV pour Excel en français (point-virgule, UTF-8 avec BOM) : une ligne par équipe.
  function csvResultats(r) {
    const cel = (v) => {
      const t = v === null || v === undefined ? '' : String(v);
      return /[;"\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
    };
    const nombre = (x) => (x === null || x === undefined ? '' : String(Math.round(x * 100) / 100).replace('.', ','));
    const entete = ['Classe', 'Élèves', ...r.competences.map((c) => `${c.code} ${c.libelle}`), 'Note /20', 'Exercices réussis', 'Commentaire'];
    const lignes = r.equipes.map((e) => [
      e.classe,
      e.eleves.join(', '),
      ...r.competences.map((c) => (e.niveaux[c.code] ? `${e.niveaux[c.code]} - ${nomNiveau(e.niveaux[c.code])}` : '')),
      nombre(e.note),
      `${e.reussis}/${e.total}`,
      e.commentaire,
    ]);
    return '﻿' + [entete, ...lignes].map((l) => l.map(cel).join(';')).join('\r\n') + '\r\n';
  }

  function lireResultats(texte) {
    let r;
    try {
      r = typeof texte === 'string' ? JSON.parse(texte) : texte;
    } catch {
      return { ok: false, message: 'Ce fichier n’est pas un fichier de résultats Labo Blocs.' };
    }
    if (!r || r.format !== FORMAT_RESULTATS || !Array.isArray(r.equipes)) return { ok: false, message: 'Ce fichier n’est pas un fichier de résultats Labo Blocs.' };
    if (r.version > 1) return { ok: false, message: 'Ce fichier vient d’une version plus récente de Labo Blocs.' };
    return { ok: true, resultats: r };
  }

  const api = {
    COMPETENCES,
    COMPETENCE_PAR_DEFAUT,
    NIVEAUX_COMPETENCE: NIVEAUX,
    nomNiveau,
    BAREME_COMPETENCES: BAREME,
    competenceDe,
    scoreExercice,
    evaluerEquipe,
    FORMAT_RESULTATS,
    creerResultats,
    csvResultats,
    lireResultats,
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign((global.LaboBlocs = global.LaboBlocs || {}), api);
})(this);
