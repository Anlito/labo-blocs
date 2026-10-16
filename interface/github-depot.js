// Mise en ligne directe d'un parcours : l'éditeur envoie le fichier <id>-<version>.labo-parcours.json dans le dossier
// parcours/ du dépôt GitHub de Labo Blocs ; la publication (GitHub Pages) en fait un parcours du site en 2 à 3 minutes.
//
// Il faut une clé d'accès GitHub (« fine-grained personal access token ») créée par le professeur : seulement le dépôt
// labo-blocs, droit « Contents : Read and write ». Elle reste dans ce navigateur (localStorage) : jamais dans le dépôt,
// jamais envoyée ailleurs qu'à api.github.com. Rien d'autre ne part : le parcours seulement (aucune donnée d'élève).
(function (global) {
  'use strict';

  const DEPOT = 'Anlito/labo-blocs';
  const BRANCHE = 'main';
  const CLE = 'labo-blocs-cle-github';
  const API = 'https://api.github.com';

  // Texte → base64 (UTF-8 : accents, guillemets français).
  function base64(texte) {
    if (typeof Buffer !== 'undefined') return Buffer.from(texte, 'utf8').toString('base64');
    const octets = new TextEncoder().encode(texte);
    let binaire = '';
    for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode.apply(null, octets.subarray(i, i + 0x8000));
    return global.btoa(binaire);
  }

  // Ce qui part sur GitHub pour un parcours publié.
  function envoiParcours(paquet) {
    const nom = `${paquet.id}-${paquet.versionParcours}.labo-parcours.json`;
    return {
      chemin: `parcours/${nom}`,
      nom,
      message: `Parcours « ${paquet.titre} » version ${paquet.versionParcours} (éditeur de Labo Blocs)`,
      contenu: base64(JSON.stringify(paquet, null, 2) + '\n'),
    };
  }

  const lireCle = () => {
    try {
      return global.localStorage.getItem(CLE) || '';
    } catch {
      return '';
    }
  };
  const ecrireCle = (cle) => {
    try {
      if (cle) global.localStorage.setItem(CLE, cle);
      else global.localStorage.removeItem(CLE);
      return true;
    } catch {
      return false;
    }
  };

  async function appel(chemin, cle, options) {
    const o = options || {};
    let r;
    try {
      r = await globalThis.fetch(API + chemin, {
        method: o.method || 'GET',
        headers: Object.assign({ Accept: 'application/vnd.github+json', Authorization: `Bearer ${cle}` }, o.corps ? { 'Content-Type': 'application/json' } : {}),
        body: o.corps ? JSON.stringify(o.corps) : undefined,
      });
    } catch {
      return { ok: false, statut: 0, message: 'GitHub ne répond pas : vérifie la connexion à internet, puis recommence.' };
    }
    let donnees = null;
    try {
      donnees = await r.json();
    } catch {
      donnees = null;
    }
    return { ok: r.ok, statut: r.status, donnees };
  }

  // Phrases en français pour les réponses de GitHub, avec la prochaine action.
  function expliquer(statut) {
    if (statut === 0) return 'GitHub ne répond pas : vérifie la connexion à internet, puis recommence.';
    if (statut === 401) return 'GitHub ne reconnaît pas cette clé (mal copiée ou expirée). Crée une nouvelle clé et colle-la dans l’accueil de Labo Blocs.';
    if (statut === 403) return 'Cette clé n’a pas le droit d’écrire dans le dépôt. Sur GitHub, donne-lui « Contents : Read and write » pour le dépôt labo-blocs.';
    if (statut === 404) return 'Cette clé ne voit pas le dépôt labo-blocs. Sur GitHub, choisis « Only select repositories › labo-blocs » pour cette clé.';
    return `GitHub a refusé l’envoi (code ${statut}). Recommence dans un instant ; sinon dépose le fichier à la main.`;
  }

  // La clé ouvre-t-elle le dépôt ? (le droit d'écrire se vérifie au premier envoi)
  async function verifierCle(cle) {
    if (!String(cle || '').trim()) return { ok: false, message: 'Colle d’abord la clé.' };
    const r = await appel(`/repos/${DEPOT}`, cle.trim());
    if (!r.ok) return { ok: false, message: r.message || expliquer(r.statut) };
    return { ok: true };
  }

  // Écrit un fichier texte du dépôt (créé, ou remplacé avec son sha s'il existe déjà).
  async function mettreFichierEnLigne(chemin, texte, message, cle) {
    const corps = { message, content: base64(texte), branch: BRANCHE };
    const existant = await appel(`/repos/${DEPOT}/contents/${chemin}?ref=${BRANCHE}`, cle);
    if (existant.ok && existant.donnees && existant.donnees.sha) corps.sha = existant.donnees.sha;
    else if (!existant.ok && existant.statut !== 404) return { ok: false, message: existant.message || expliquer(existant.statut) };
    const r = await appel(`/repos/${DEPOT}/contents/${chemin}`, cle, { method: 'PUT', corps });
    if (!r.ok) return { ok: false, message: r.message || expliquer(r.statut) };
    return { ok: true, lien: `https://github.com/${DEPOT}/blob/${BRANCHE}/${chemin}` };
  }

  // Envoie le parcours dans parcours/ (remplace le fichier s'il existe déjà, ex. même version publiée deux fois).
  async function mettreEnLigne(paquet, cle) {
    const e = envoiParcours(paquet);
    const r = await mettreFichierEnLigne(e.chemin, JSON.stringify(paquet, null, 2) + '\n', e.message, cle);
    return r.ok ? Object.assign(r, { nom: e.nom }) : r;
  }

  const api = { DEPOT_GITHUB: DEPOT, envoiParcours, lireCleGithub: lireCle, ecrireCleGithub: ecrireCle, verifierCleGithub: verifierCle, mettreEnLigne, mettreFichierEnLigne, expliquerGithub: expliquer };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign((global.LaboBlocs = global.LaboBlocs || {}), api);
})(this);
