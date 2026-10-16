// Suivi d'une classe (jalon 5, outil du professeur) : les fichiers des équipes lus d'un coup, une ligne par équipe
// (progression par exercice, indices, dernier envoi dans la carte, dernière activité, état), les niveaux par compétence
// et la note, et les réglages du professeur (niveaux forcés, commentaires) gardés dans un fichier à part du dossier
// de la classe : labo-blocs-professeur.json (les fichiers des élèves ne sont jamais modifiés).
(function (global) {
  'use strict';

  const enNode = typeof module === 'object' && module.exports;
  const S = enNode ? require('./sauvegarde.js') : global.LaboBlocs;
  const K = enNode ? require('./competences.js') : global.LaboBlocs;

  const BLOQUEE_APRES = 10 * 60 * 1000; // une équipe qui ne réussit pas son exercice depuis 10 min…
  const BLOQUEE_ECHECS = 3; // … après au moins 3 vérifications ratées
  const INACTIVE_APRES = 45 * 60 * 1000;

  // « 2026-10-12T09:03:00 » (heure locale) → Date
  const date = (t) => (t ? new Date(t) : null);

  // fichiers : [{ nom (chemin), texte }] ; paquets : parcours préparés (celui de chaque équipe, par identifiant).
  // Renvoie { equipes: [...], refuses: [{ nom, raison }] }. Deux fichiers de la même équipe : le plus récent compte.
  function chargerEquipes(fichiers, paquets) {
    const parId = new Map((Array.isArray(paquets) ? paquets : [paquets]).map((p) => [p.id, p]));
    const defaut = Array.isArray(paquets) ? paquets[0] : paquets;
    const refuses = [];
    const parCle = new Map();
    for (const f of fichiers) {
      if (/labo-blocs-professeur\.json$/i.test(f.nom)) continue;
      const r = S.lireSauvegarde(f.texte);
      if (!r.ok) {
        refuses.push({ nom: f.nom, raison: r.raison });
        continue;
      }
      const d = r.donnees;
      const id = d.programmation && d.programmation.parcours && d.programmation.parcours.id;
      const paquet = (id && parId.get(id)) || defaut;
      S.relierParcours(d, paquet);
      const nomFichier = String(f.nom).split(/[\\/›]/).pop().trim();
      const cle = nomFichier.replace(/\.json$/i, '');
      const equipe = { cle, nom: f.nom, donnees: d, paquet, eleves: d.equipe.eleves.slice(), classe: d.equipe.classe || '', modifieLe: d.modifieLe || '' };
      const deja = parCle.get(cle);
      if (!deja || String(deja.modifieLe) < String(equipe.modifieLe)) parCle.set(cle, equipe);
    }
    const equipes = [...parCle.values()].sort((a, b) => a.classe.localeCompare(b.classe, 'fr') || a.eleves.join().localeCompare(b.eleves.join(), 'fr'));
    return { equipes, refuses };
  }

  // Résumé d'une équipe pour le tableau de classe.
  //   options : { maintenant (Date), forces, bareme }
  function resumerEquipe(equipe, options) {
    const o = options || {};
    const maintenant = o.maintenant || new Date();
    const d = equipe.donnees;
    const paquet = equipe.paquet;
    const ex = d.programmation.exercices;
    const cellules = paquet.exercices.map((e) => ({ id: e.id, numero: e.numero, defi: !!e.defi, etat: S.etat(d, paquet, e.id) }));
    let indices = 0;
    let dernierEnvoi = null;
    let derniere = null;
    for (const e of paquet.exercices) {
      const p = ex[e.id];
      if (!p) continue;
      indices += p.indicesOuverts || 0;
      for (const h of p.historique || []) {
        if (!derniere || h.date > derniere) derniere = h.date;
        if (h.type === 'envoi' && h.reussi && (!dernierEnvoi || h.date > dernierEnvoi.date)) dernierEnvoi = { date: h.date, numero: e.numero };
      }
    }
    if (d.modifieLe && (!derniere || d.modifieLe > derniere)) derniere = d.modifieLe;
    const av = S.avancement(d, paquet);
    const courant = paquet.exercices.find((e) => e.id === S.exerciceAReprendre(d, paquet));
    // Bloquée : l'exercice en cours n'est pas réussi, au moins 3 vérifications ratées, la première il y a plus de 10 min.
    let bloquee = null;
    const pc = courant && ex[courant.id];
    if (pc && pc.statut !== 'reussi') {
      const verifs = (pc.historique || []).filter((h) => h.type === 'verification');
      if (verifs.length >= BLOQUEE_ECHECS && maintenant - date(verifs[0].date) > BLOQUEE_APRES) bloquee = courant.numero;
    }
    const inactive = derniere ? maintenant - date(derniere) > INACTIVE_APRES : true;
    let etat;
    if (av.reussis === av.total) etat = { cle: 'fini', texte: 'Parcours terminé' };
    else if (bloquee && !inactive) etat = { cle: 'bloquee', texte: `Bloquée sur le ${bloquee}` };
    else if (inactive) etat = { cle: 'inactive', texte: derniere ? 'Pas d’activité récente' : 'Pas encore commencé' };
    else etat = { cle: 'rythme', texte: 'Au travail' };
    const evaluation = K.evaluerEquipe(d, paquet, { forces: o.forces, bareme: o.bareme });
    return {
      cellules,
      reussis: av.reussis,
      total: av.total,
      defisReussis: av.defisReussis,
      aReverifier: av.aReverifier,
      indices,
      dernierEnvoi,
      derniereActivite: derniere,
      enCours: courant && pc && pc.statut !== 'reussi' ? courant.numero : null,
      bloquee,
      etat,
      evaluation,
    };
  }

  // Chiffres du haut de la page.
  function resumerClasse(resumes, maintenant) {
    const jour = (maintenant || new Date()).toISOString().slice(0, 10);
    const local = (t) => String(t || '').slice(0, 10);
    return {
      equipes: resumes.length,
      bloquees: resumes.filter((r) => r.etat.cle === 'bloquee').length,
      envoisAujourdhui: resumes.filter((r) => r.dernierEnvoi && local(r.dernierEnvoi.date) === jour).length,
      aReverifier: resumes.reduce((s, r) => s + r.aReverifier, 0),
    };
  }

  // « il y a 3 min », « hier », « le 12/10 »
  function ilYa(t, maintenant) {
    if (!t) return '—';
    const m = (maintenant || new Date()) - date(t);
    if (m < 60 * 1000) return 'à l’instant';
    if (m < 60 * 60 * 1000) return `il y a ${Math.round(m / 60000)} min`;
    const d = date(t);
    const auj = maintenant || new Date();
    if (d.toDateString() === auj.toDateString()) return `à ${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
    const hier = new Date(auj);
    hier.setDate(auj.getDate() - 1);
    if (d.toDateString() === hier.toDateString()) return 'hier';
    return `le ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  // ---------- Fichier du professeur (dans le dossier de la classe) ----------
  //   { format: 'labo-blocs/professeur', version: 1, objectif: null | n, equipes: { <clé>: { forces, commentaire } } }
  const FORMAT_PROFESSEUR = 'labo-blocs/professeur';
  const NOM_FICHIER_PROFESSEUR = 'labo-blocs-professeur.json';
  function professeurVide() {
    return { format: FORMAT_PROFESSEUR, version: 1, objectif: null, equipes: {} };
  }
  function lireProfesseur(texte) {
    try {
      const p = JSON.parse(texte);
      if (p && p.format === FORMAT_PROFESSEUR && p.equipes) return Object.assign(professeurVide(), p);
    } catch {
      // fichier abîmé : on repart de zéro (l'ancien reste sur le disque jusqu'au prochain enregistrement)
    }
    return professeurVide();
  }
  const reglagesEquipe = (prof, cle) => prof.equipes[cle] || { forces: {}, commentaire: '' };

  // Résultats de la classe pour le Carnet de classe (et le CSV).
  function resultatsClasse(equipes, prof, options) {
    const o = options || {};
    const paquet = o.paquet || (equipes[0] && equipes[0].paquet);
    return K.creerResultats({
      projet: o.projet,
      paquet,
      date: o.date,
      equipes: equipes.map((e) => {
        const r = reglagesEquipe(prof, e.cle);
        return {
          eleves: e.eleves,
          classe: e.classe,
          commentaire: r.commentaire,
          evaluation: K.evaluerEquipe(e.donnees, e.paquet, { forces: r.forces, bareme: { objectif: prof.objectif } }),
        };
      }),
    });
  }

  const api = {
    chargerEquipes,
    resumerEquipe,
    resumerClasse,
    ilYa,
    FORMAT_PROFESSEUR,
    NOM_FICHIER_PROFESSEUR,
    professeurVide,
    lireProfesseur,
    reglagesEquipe,
    resultatsClasse,
  };
  if (enNode) module.exports = api;
  else Object.assign((global.LaboBlocs = global.LaboBlocs || {}), api);
})(this);
