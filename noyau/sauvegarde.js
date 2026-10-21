// Sauvegarde d'une équipe et progression dans un parcours (cahier des charges §4.8, exigence R6).
// Un seul fichier .json par équipe, celui du projet : Labo Blocs y écrit seulement sa rubrique « programmation »,
// versionnée, et ne touche pas au reste (carnet de projet, etc.).
//
//   { application, formatVersion, equipe: { eleves, classe }, creeLe, modifieLe, …(rubriques du projet),
//     programmation: { format: 'labo-blocs/sauvegarde', version: 1, parcours: { id, version },
//       exerciceCourant, exercices: { <id stable>: { statut, tentatives, indicesOuverts, tempsPasseSecondes,
//         premiereReussite, empreinte, aReverifier, programme (sauvegarde Blockly), historique } },
//       camera: { modele, exemples: { <nom de l'étiquette>: [{ f: caractéristiques (base64), v: vignette }] },
//                 etiquettes?: [noms créés par l'équipe, dans l'ordre : n° 1, 2…] } } }
//   (« camera » : ce que l'équipe a appris à l'IA de la caméra, jalon 6 ; partagé par les exercices du parcours.)
//
// Les sauvegardes de l'atelier du distributeur (exercices « 1 » … « 13B ») se lisent : leur travail est recopié
// dans la rubrique « programmation » sous les identifiants du parcours (« dist-01 » …), rien n'est effacé.

(function (global) {
  'use strict';

  const FORMAT = 'labo-blocs/sauvegarde';
  const VERSION = 1;
  const APPLICATION = 'labo-blocs';
  const FORMAT_FICHIER = 1;
  const PA = typeof module === 'object' && module.exports ? require('./parcours.js') : global.LaboBlocs;
  // Applications dont Labo Blocs sait lire le fichier (chaque projet garde le sien).
  const APPLICATIONS = { 'labo-blocs': 1, 'atelier-cereales': 2 };

  // Date et heure locales : 2026-10-12T09:03:00
  function maintenant() {
    const d = new Date();
    const deux = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}T${deux(d.getHours())}:${deux(d.getMinutes())}:${deux(d.getSeconds())}`;
  }

  const prenom = (p) => {
    const t = String(p).trim();
    return t.charAt(0).toUpperCase() + t.slice(1);
  };

  // « Léa », « hugo » → « Léa_Hugo » (nom du dossier et du fichier de l'équipe).
  function nomEquipe(eleves) {
    return eleves
      .map((p) => String(p).trim().replace(/[\\/:*?"<>|.]+/g, '').replace(/\s+/g, '-'))
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('_');
  }

  // Pour comparer des noms de dossier sans tenir compte des accents, majuscules et séparateurs.
  function simplifier(nom) {
    return String(nom).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function creerSauvegarde(equipe, options) {
    const o = options || {};
    const date = maintenant();
    return {
      application: o.application || APPLICATION,
      formatVersion: FORMAT_FICHIER,
      projet: o.projet || null,
      equipe: { eleves: equipe.eleves.map(prenom).filter(Boolean), classe: equipe.classe || '' },
      creeLe: date,
      modifieLe: date,
      programmation: rubriqueVide(o.parcours),
    };
  }

  function rubriqueVide(paquet) {
    return { format: FORMAT, version: VERSION, parcours: paquet ? { id: paquet.id, version: paquet.versionParcours } : null, exerciceCourant: null, exercices: {} };
  }

  // Vérifie un fichier ouvert par l'équipe. Rien n'est modifié si le fichier est refusé.
  function lireSauvegarde(texte) {
    let d;
    try {
      d = JSON.parse(String(texte).replace(/^﻿/, ''));
    } catch {
      return { ok: false, raison: 'Ce fichier n’est pas une sauvegarde : il est illisible.' };
    }
    // Fichier d'un autre projet (son application, ses rubriques) : lisible s'il porte une rubrique « programmation » de
    // Labo Blocs ; son propre format reste l'affaire du projet.
    const autreProjet = d && !(d.application in APPLICATIONS) && typeof d.application === 'string' && d.programmation && d.programmation.format === FORMAT;
    if (!d || (!(d.application in APPLICATIONS) && !autreProjet)) return { ok: false, raison: 'Ce fichier vient d’une autre application : ce n’est pas une sauvegarde d’équipe.' };
    if (!autreProjet && (typeof d.formatVersion !== 'number' || d.formatVersion > APPLICATIONS[d.application])) {
      return { ok: false, raison: 'Cette sauvegarde vient d’une version plus récente : demande à ton professeur.' };
    }
    if (d.programmation && d.programmation.version > VERSION) return { ok: false, raison: 'Cette sauvegarde vient d’une version plus récente de Labo Blocs : demande à ton professeur.' };
    if (!d.equipe || !Array.isArray(d.equipe.eleves)) return { ok: false, raison: 'Cette sauvegarde est incomplète : il manque l’équipe.' };
    return { ok: true, donnees: d };
  }

  // Relie la sauvegarde au parcours : crée ou reprend la rubrique « programmation » (en recopiant le travail d'une
  // sauvegarde de l'atelier), note la version du parcours, et marque « à revérifier » les exercices réussis qui ont
  // changé depuis. Renvoie la liste des exercices passés « à revérifier ».
  function relierParcours(d, paquet) {
    if (!d.programmation) {
      d.programmation = rubriqueVide(paquet);
      if (d.application === 'atelier-cereales' && d.exercices) migrerAtelier(d, paquet);
    }
    const p = d.programmation;
    p.exercices = p.exercices || {};
    const parId = new Map(paquet.exercices.map((e) => [e.id, e]));
    const changes = [];
    for (const [id, e] of Object.entries(p.exercices)) {
      e.historique = e.historique || [];
      const ex = parId.get(id);
      if (!ex) {
        e.supprime = true; // gardé en lecture seule
        continue;
      }
      delete e.supprime;
      if (e.statut === 'reussi' && e.empreinte && e.empreinte !== ex.empreinte && !e.aReverifier) {
        e.aReverifier = true;
        e.historique.push({ date: maintenant(), type: 'modifie', versionParcours: paquet.versionParcours });
        changes.push(id);
      }
    }
    p.parcours = { id: paquet.id, version: paquet.versionParcours };
    return changes;
  }

  // Sauvegarde de l'atelier : exercices « 1 » … « 13B » → identifiants du parcours (par leur numéro).
  function migrerAtelier(d, paquet) {
    const parNumero = new Map(paquet.exercices.map((e) => [String(e.numero), e]));
    for (const [num, ancien] of Object.entries(d.exercices)) {
      const ex = parNumero.get(String(num));
      if (!ex) continue;
      const e = JSON.parse(JSON.stringify(ancien));
      // Réussi dans l'atelier : avec l'exercice tel qu'il était, repris à l'identique dans ce parcours.
      if (e.statut === 'reussi') e.empreinte = ex.empreinte;
      e.historique = e.historique || [];
      e.historique.push({ date: maintenant(), type: 'migration', depuis: 'atelier-cereales', exercice: num });
      d.programmation.exercices[ex.id] = e;
    }
    const courant = parNumero.get(String(d.exerciceCourant));
    if (courant) d.programmation.exerciceCourant = courant.id;
  }

  function exercice(d, id) {
    const ex = d.programmation.exercices;
    if (!ex[id]) {
      ex[id] = { statut: 'non_commence', tentatives: 0, indicesOuverts: 0, tempsPasseSecondes: 0, premiereReussite: null, programme: null, historique: [] };
    }
    return ex[id];
  }

  const modifie = (d) => (d.modifieLe = maintenant());

  function noterOuverture(d, id) {
    const e = exercice(d, id);
    if (e.statut === 'non_commence') e.statut = 'en_cours';
    d.programmation.exerciceCourant = id;
    modifie(d);
  }

  function noterProgramme(d, id, programme) {
    exercice(d, id).programme = programme;
    modifie(d);
  }

  const sansIds = (programme) => (programme ? JSON.parse(JSON.stringify(programme, (k, v) => (k === 'id' ? undefined : v))) : null);

  // Chaque clic sur « Vérifier mon programme » est une tentative, gardée dans l'historique.
  //   resultat : { reussi, message, programme (v1) } ; exercice : celui du parcours préparé (pour l'empreinte).
  function noterVerification(d, ex, resultat) {
    const e = exercice(d, ex.id);
    const date = maintenant();
    e.tentatives += 1;
    const trace = { date, type: 'verification', reussi: !!resultat.reussi };
    if (!resultat.reussi) trace.message = resultat.message || '';
    trace.programme = sansIds(resultat.programme);
    e.historique.push(trace);
    if (resultat.reussi) {
      e.statut = 'reussi';
      e.empreinte = ex.empreinte;
      delete e.aReverifier;
      if (!e.premiereReussite) e.premiereReussite = date;
    } else if (e.statut === 'non_commence') e.statut = 'en_cours';
    modifie(d);
  }

  // Exercice libre : l'équipe dit qu'elle a terminé. L'exercice compte comme fait (le suivant s'ouvre), sans niveau.
  function noterTermine(d, ex, programme) {
    const e = exercice(d, ex.id);
    const date = maintenant();
    e.historique.push({ date, type: 'termine', programme: sansIds(programme) });
    e.statut = 'reussi';
    e.empreinte = ex.empreinte;
    delete e.aReverifier;
    if (!e.premiereReussite) e.premiereReussite = date;
    modifie(d);
  }

  // Indices révélés un par un : on garde le plus haut niveau ouvert et chaque ouverture.
  function noterIndice(d, id, niveau) {
    const e = exercice(d, id);
    if (niveau <= e.indicesOuverts) return;
    e.indicesOuverts = niveau;
    e.historique.push({ date: maintenant(), type: 'indice', niveau });
    modifie(d);
  }

  // Mode « Dans la carte » : chaque envoi du programme et chaque « Vider la carte », gardés dans l'historique de
  // l'exercice ouvert (bilan du professeur). envoi : { carte, reussi, octets, message, programme (v1) }
  function noterEnvoi(d, id, envoi) {
    const trace = { date: maintenant(), type: 'envoi', carte: envoi.carte, reussi: !!envoi.reussi };
    if (envoi.octets !== undefined) trace.octets = envoi.octets;
    if (!envoi.reussi && envoi.message) trace.message = envoi.message;
    if (envoi.programme) trace.programme = sansIds(envoi.programme);
    exercice(d, id).historique.push(trace);
    modifie(d);
  }
  function noterVidage(d, id, vidage) {
    exercice(d, id).historique.push({ date: maintenant(), type: 'vider', carte: vidage.carte, reussi: !!vidage.reussi });
    modifie(d);
  }

  function ajouterTemps(d, id, secondes) {
    exercice(d, id).tempsPasseSecondes += secondes;
  }

  const reussi = (d, id) => {
    const e = d.programmation && d.programmation.exercices[id];
    return !!(e && e.statut === 'reussi');
  };

  // Déblocage : un exercice s'ouvre quand le précédent est réussi. Un défi est facultatif : l'exercice qui le suit
  // ne dépend que du dernier exercice qui n'est pas un défi.
  function estDebloque(d, paquet, id, options) {
    if (options && options.toutDebloquer) return true;
    const liste = paquet.exercices;
    const i = liste.findIndex((e) => e.id === id);
    if (i <= 0) return i === 0;
    if (liste[i].defi) return reussi(d, liste[i - 1].id);
    for (let k = i - 1; k >= 0; k--) if (!liste[k].defi) return reussi(d, liste[k].id);
    return true;
  }

  // État d'un exercice pour l'écran du parcours.
  function etat(d, paquet, id, options) {
    const e = d.programmation && d.programmation.exercices[id];
    if (e && e.statut === 'reussi') return e.aReverifier ? 'a_reverifier' : 'reussi';
    if (!estDebloque(d, paquet, id, options)) return 'verrouille';
    return e && e.statut === 'en_cours' ? 'en_cours' : 'a_faire';
  }

  // Exercice à ouvrir en reprenant : celui de la dernière fois s'il est ouvert et pas encore réussi, sinon le
  // premier exercice ouvert (hors défi) non réussi, sinon le dernier.
  function aReprendre(d, paquet, options) {
    const courant = d.programmation && d.programmation.exerciceCourant;
    const ids = paquet.exercices.map((e) => e.id);
    if (courant && ids.includes(courant) && estDebloque(d, paquet, courant, options) && !reussi(d, courant)) return courant;
    const ouvert = paquet.exercices.find((e) => !e.defi && estDebloque(d, paquet, e.id, options) && !reussi(d, e.id));
    return ouvert ? ouvert.id : ids[ids.length - 1];
  }

  // Avancement : exercices obligatoires réussis (les défis sont comptés à part).
  function avancement(d, paquet) {
    const obligatoires = paquet.exercices.filter((e) => !e.defi);
    const defis = paquet.exercices.filter((e) => e.defi);
    const n = (l) => l.filter((e) => reussi(d, e.id)).length;
    const aReverifier = paquet.exercices.filter((e) => etat(d, paquet, e.id) === 'a_reverifier').length;
    return { reussis: n(obligatoires), total: obligatoires.length, defisReussis: n(defis), defis: defis.length, aReverifier };
  }

  // Ce que l'équipe a appris à l'IA de la caméra (par nom d'étiquette : « Loup » sert à tous les exercices).
  function lireCamera(d) {
    const c = d.programmation && d.programmation.camera;
    return c && c.exemples ? c : { modele: null, exemples: {} };
  }
  function noterCamera(d, camera) {
    d.programmation.camera = { modele: camera.modele || null, exemples: camera.exemples || {} };
    if (Array.isArray(camera.etiquettes)) d.programmation.camera.etiquettes = PA.etiquettesPersonnages(camera.etiquettes);
    d.modifieLe = maintenant();
  }

  // Une simulation de caméra ne fournit aucun exemple d'apprentissage.
  function verifierApprentissage(d, exercice) {
    const r = exercice.apprentissage;
    if (!r) return {ok:true};
    const camera = lireCamera(d);
    const noms = PA.etiquettesPersonnages(camera.etiquettes || exercice.camera?.etiquettes || []);
    const minimum = Math.max(0,Number(r.etiquettes)||0);
    if (noms.length < minimum) return {ok:false,message:`Crée au moins ${minimum} étiquettes pour tes personnages dans « Caméra et IA ».`};
    const photos = Math.max(1,Number(r.photos)||10);
    for (const nom of ['Rien', ...noms.slice(0,minimum)]) {
      if ((camera.exemples?.[nom]||[]).filter(e=>e && typeof e.f==='string' && e.f.length>0).length < photos)
        return {ok:false,message:`Ajoute au moins ${photos} photos pour « ${nom} ». Les boutons « Faire comme si » ne remplacent pas l’apprentissage.`};
    }
    return {ok:true};
  }
  const api = {
    verifierApprentissage,
    lireCamera,
    noterCamera,
    noterTermine,
    FORMAT_SAUVEGARDE: FORMAT,
    APPLICATION,
    nomEquipe,
    simplifierNom: simplifier,
    maintenant,
    creerSauvegarde,
    lireSauvegarde,
    relierParcours,
    progressionExercice: exercice,
    noterOuverture,
    noterProgramme,
    noterVerification,
    noterIndice,
    noterEnvoi,
    noterVidage,
    ajouterTemps,
    estDebloque,
    etat,
    exerciceAReprendre: aReprendre,
    avancement,
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign((global.LaboBlocs = global.LaboBlocs || {}), api);
})(this);
