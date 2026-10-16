// Éditeur de parcours du professeur (écrans B8 et B9 de la maquette) : liste des exercices réordonnable, exercice
// (titre, consigne, composants et broches, blocs proposés, niveau, fiche « À savoir », indices), solution de référence
// en blocs, scénarios de test à étapes, « Tester mes scénarios sur ma solution », aperçu du simulateur.
//
// Le parcours modifié est gardé au fur et à mesure dans ce navigateur (brouillon). « Publier » le contrôle (chaque
// solution doit passer ses scénarios), passe à la version suivante, écrit parcours/<id>/parcours.js dans le dossier de
// Labo Blocs et télécharge le fichier d'échange <id>-<version>.labo-parcours.json pour les projets.
// Les opérations sur le paquet sont dans noyau/edition.js (testées sous Node).
(function (global) {
  'use strict';

  const A = global.LaboBlocs;
  const $ = (sel, racine) => (racine || document).querySelector(sel);
  const $$ = (sel, racine) => [...(racine || document).querySelectorAll(sel)];
  const echapper = (s) => String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const copie = (x) => JSON.parse(JSON.stringify(x));
  const CLE_BROUILLON = 'labo-blocs-editeur-brouillon';
  const NIVEAUX = { 1: '1 · Premiers pas', 2: '2 · Boucles et conditions', 3: '3 · Code Arduino' };

  const etat = { etapesOuvertes: new Set(), paquet: null, i: 0, editeur: null, apercu: null, resultats: null, messageSolution: null, enregistreA: null, brochesVues: null };
  const ex = () => etat.paquet.exercices[etat.i];

  // ---------- Parcours connus, brouillon, fichiers ----------

  // Les scripts parcours/<id>/parcours.js listés dans parcours/index.js (lisibles en file://).
  function chargerScript(src) {
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      s.src = src;
      document.body.append(s);
    });
  }

  async function parcoursConnus() {
    let ids = [];
    global.definirIndexParcours = (liste) => (ids = liste);
    await chargerScript('../parcours/index.js');
    const trouves = [];
    for (const id of ids) {
      let p = null;
      global.definirParcours = (x) => (p = x);
      await chargerScript(`../parcours/${id}/parcours.js`);
      if (p) trouves.push(JSON.parse(JSON.stringify(p)));
    }
    return { ids, trouves };
  }

  function lireBrouillon() {
    try {
      return JSON.parse(localStorage.getItem(CLE_BROUILLON));
    } catch {
      return null;
    }
  }

  let minuteur = null;
  function modifie() {
    clearTimeout(minuteur);
    minuteur = setTimeout(garderBrouillon, 400);
    majEtatBandeau('…');
  }
  function garderBrouillon() {
    try {
      localStorage.setItem(CLE_BROUILLON, JSON.stringify({ paquet: etat.paquet, modifieLe: new Date().toISOString(), selection: ex() && ex().id }));
      etat.enregistreA = new Date();
      majEtatBandeau();
    } catch {
      majEtatBandeau('!');
    }
  }
  function majEtatBandeau(signe) {
    const el = $('.ed-etat');
    if (signe === '…') el.textContent = 'Modification…';
    else if (signe === '!') el.textContent = 'Le brouillon n’a pas pu être gardé (stockage du navigateur plein) : exporte le parcours.';
    else el.textContent = etat.enregistreA ? 'Brouillon gardé à ' + etat.enregistreA.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
  }

  function message(texte, duree) {
    const t = $('.message-bref');
    t.textContent = texte;
    t.hidden = false;
    clearTimeout(message.minuteur);
    message.minuteur = setTimeout(() => (t.hidden = true), duree || 3500);
  }

  function telecharger(nom, texte, type) {
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(new Blob([texte], { type: type || 'application/json' }));
    lien.download = nom;
    document.body.append(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(lien.href), 1000);
  }

  // Fichier choisi : fichier d'échange .json, ou script parcours.js.
  function lireTexteParcours(texte) {
    const t = String(texte).replace(/^﻿/, '').trim();
    const m = t.match(/definirParcours\(([\s\S]*)\);?\s*$/);
    return JSON.parse(m ? m[1] : t);
  }

  // ---------- Accueil de l'éditeur ----------

  async function accueil() {
    $('.ed-accueil').hidden = false;
    $('.ed-edition').hidden = true;
    for (const b of $$('.ed-bandeau .ed-btn')) b.hidden = true;
    $('.ed-parcours-titre').textContent = '';
    $('.ed-etat').textContent = '';
    const { trouves } = await parcoursConnus();
    const brouillon = lireBrouillon();
    let h = '';
    if (brouillon && brouillon.paquet) {
      const date = new Date(brouillon.modifieLe);
      h +=
        `<button type="button" class="ed-carte-choix ed-carte-brouillon" data-choix="brouillon"><strong>Reprendre le brouillon : ${echapper(brouillon.paquet.titre)}</strong>` +
        `<span>Modifié le ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}, pas encore publié.</span></button>`;
    }
    trouves.forEach((p, k) => {
      h +=
        `<button type="button" class="ed-carte-choix" data-choix="connu" data-k="${k}"><strong>${echapper(p.titre)}</strong>` +
        `<span>Version ${echapper(p.versionParcours)} · ${p.exercices.length} exercices</span></button>`;
    });
    h +=
      '<label class="ed-carte-choix"><strong>Ouvrir un fichier…</strong><span>Un parcours exporté (<code>.labo-parcours.json</code>) ou un <code>parcours.js</code>.</span>' +
      '<input type="file" class="entree-parcours" accept=".json,.js,application/json" hidden></label>' +
      '<button type="button" class="ed-carte-choix" data-choix="nouveau"><strong>Nouveau parcours</strong><span>Un premier exercice vide, à compléter.</span></button>';
    const cartes = $('.ed-cartes');
    cartes.innerHTML = h;
    const erreur = $('.ed-erreur');
    erreur.hidden = true;
    cartes.onclick = (e) => {
      const b = e.target.closest('[data-choix]');
      if (!b) return;
      const choix = b.dataset.choix;
      if (choix === 'brouillon') return ouvrir(brouillon.paquet, brouillon.selection);
      if (choix === 'connu') {
        if (brouillon && brouillon.paquet && brouillon.paquet.id === trouves[b.dataset.k].id && !confirm('Un brouillon non publié de ce parcours existe. L’abandonner et repartir de la version publiée ?')) return;
        return ouvrir(trouves[b.dataset.k]);
      }
      if (choix === 'nouveau') {
        const titre = prompt('Titre du nouveau parcours :', 'Nouveau parcours');
        if (!titre) return;
        if (brouillon && brouillon.paquet && !confirm(`Le brouillon de « ${brouillon.paquet.titre} » sera remplacé. Continuer ?`)) return;
        return ouvrir(A.creerParcours({ titre }));
      }
    };
    $('.entree-parcours', cartes).onchange = async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        const p = lireTexteParcours(await f.text());
        const pb = A.controler(p);
        if (pb.length && pb[0] === 'Ce fichier n’est pas un parcours Labo Blocs.') throw new Error(pb[0]);
        ouvrir(p);
      } catch (err) {
        erreur.textContent = (err && err.message && /parcours/.test(err.message) ? err.message : 'Ce fichier n’est pas un parcours Labo Blocs lisible.') + ' Choisis un fichier .labo-parcours.json ou parcours.js.';
        erreur.hidden = false;
      }
    };
  }

  // ---------- Édition ----------

  function ouvrir(paquet, selection) {
    etat.paquet = copie(paquet);
    etat.paquet.exercices = etat.paquet.exercices || [];
    if (!etat.paquet.exercices.length) A.ajouterExercice(etat.paquet);
    etat.i = Math.max(0, etat.paquet.exercices.findIndex((e) => e.id === selection));
    $('.ed-accueil').hidden = true;
    $('.ed-edition').hidden = false;
    for (const b of $$('.ed-bandeau .ed-btn')) b.hidden = false;
    garderBrouillon();
    majBandeau();
    if (!etat.editeur) creerEditeurSolution();
    dessinerListe();
    choisir(etat.i);
  }

  function majBandeau() {
    const p = etat.paquet;
    $('.ed-parcours-titre').textContent = `Parcours : ${p.titre} · ${p.jamaisPublie ? 'pas encore publié' : 'version ' + p.versionParcours}`;
    $('.texte-publier').textContent = `Publier la version ${A.versionAPublier(p)}`;
    document.title = `${p.titre} — Éditeur de parcours`;
  }

  // ----- Liste des exercices -----

  function dessinerListe() {
    const liste = $('.ed-exercices');
    liste.innerHTML = etat.paquet.exercices
      .map(
        (e, k) =>
          `<li draggable="true" data-k="${k}" class="${k === etat.i ? 'choisi' : ''}"><button type="button" class="ed-exercice" aria-current="${k === etat.i}">` +
          `<span class="ed-poignee" aria-hidden="true">⋮⋮</span><span class="ed-numero">${echapper(e.numero)}</span>` +
          `<span class="ed-titre-ex">${echapper(e.titre)}</span>${e.defi ? '<span class="ed-defi">défi</span>' : ''}</button></li>`,
      )
      .join('');
    $('.ed-nombre').textContent = String(etat.paquet.exercices.length);
    $('.btn-monter').disabled = etat.i === 0;
    $('.btn-descendre').disabled = etat.i === etat.paquet.exercices.length - 1;
    $('.btn-supprimer').disabled = etat.paquet.exercices.length < 2;
  }

  function lierListe() {
    const liste = $('.ed-exercices');
    liste.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-k]');
      if (li) choisir(Number(li.dataset.k));
    });
    let tire = null;
    liste.addEventListener('dragstart', (e) => {
      const li = e.target.closest('li[data-k]');
      tire = li ? Number(li.dataset.k) : null;
      if (li) e.dataTransfer.effectAllowed = 'move';
    });
    liste.addEventListener('dragover', (e) => {
      if (tire === null) return;
      e.preventDefault();
      for (const li of $$('li', liste)) li.classList.remove('cible');
      const li = e.target.closest('li[data-k]');
      if (li) li.classList.add('cible');
    });
    liste.addEventListener('drop', (e) => {
      e.preventDefault();
      const li = e.target.closest('li[data-k]');
      if (tire === null || !li) return;
      deplacer(tire, Number(li.dataset.k));
      tire = null;
    });
    liste.addEventListener('dragend', () => {
      tire = null;
      for (const li of $$('li', liste)) li.classList.remove('cible');
    });
    $('.btn-ajouter').addEventListener('click', () => {
      const k = A.ajouterExercice(etat.paquet, etat.i);
      modifie();
      dessinerListe();
      choisir(k);
    });
    $('.btn-dupliquer').addEventListener('click', () => {
      const k = A.dupliquerExercice(etat.paquet, etat.i);
      modifie();
      dessinerListe();
      choisir(k);
    });
    $('.btn-supprimer').addEventListener('click', () => {
      const e = ex();
      if (!confirm(`Supprimer l’exercice ${e.numero} « ${e.titre} » ? Le travail déjà fait par les élèves reste dans leurs fichiers.`)) return;
      A.supprimerExercice(etat.paquet, etat.i);
      modifie();
      dessinerListe();
      choisir(Math.min(etat.i, etat.paquet.exercices.length - 1));
    });
    $('.btn-monter').addEventListener('click', () => deplacer(etat.i, etat.i - 1));
    $('.btn-descendre').addEventListener('click', () => deplacer(etat.i, etat.i + 1));
  }

  function deplacer(de, vers) {
    const k = A.deplacerExercice(etat.paquet, de, vers);
    modifie();
    etat.i = k;
    dessinerListe();
    // Le numéro affiché a pu changer.
    const n = $('.ed-numero-ex');
    if (n) n.textContent = `Exercice ${ex().numero}`;
  }

  function choisir(k) {
    etat.i = k;
    etat.etapesOuvertes.clear();
    etat.resultats = null;
    etat.messageSolution = null;
    arreterApercu();
    for (const li of $$('.ed-exercices li')) {
      const oui = Number(li.dataset.k) === k;
      li.classList.toggle('choisi', oui);
      $('button', li).setAttribute('aria-current', String(oui));
    }
    $('.btn-monter').disabled = k === 0;
    $('.btn-descendre').disabled = k === etat.paquet.exercices.length - 1;
    dessinerFormulaire();
    chargerSolution();
    dessinerScenarios();
    dessinerApercu();
  }

  function majLigneListe() {
    const li = $(`.ed-exercices li[data-k="${etat.i}"]`);
    if (!li) return;
    $('.ed-titre-ex', li).textContent = ex().titre;
    const defi = $('.ed-defi', li);
    if (ex().defi && !defi) $('button', li).insertAdjacentHTML('beforeend', '<span class="ed-defi">défi</span>');
    if (!ex().defi && defi) defi.remove();
  }

  // ----- Formulaire de l'exercice -----

  // Modes d'un exercice : comme le parcours, ou un choix à lui (ex. « En direct » seulement pour un exercice).
  const MODES_EXERCICE = [
    ['', 'Comme le parcours'],
    ['simulateur', 'Simulateur seulement'],
    ['simulateur+direct', 'Simulateur et En direct'],
    ['simulateur+carte', 'Simulateur et Dans la carte'],
    ['simulateur+direct+carte', 'Simulateur, En direct et Dans la carte'],
  ];
  const nomsModes = (m) => m.map((x) => ({ simulateur: 'Simulateur', direct: 'En direct', carte: 'Dans la carte' })[x]).join(', ');

  function dessinerFormulaire() {
    const e = ex();
    const fiches = etat.paquet.fiches || {};
    const optionsFiches =
      '<option value="">Aucune fiche</option>' +
      Object.entries(fiches)
        .map(([cle, f]) => `<option value="${echapper(cle)}"${cle === e.aSavoir ? ' selected' : ''}>Fiche ${echapper(cle)} · ${echapper(f.titre)}</option>`)
        .join('') +
      '<option value="__nouvelle">+ Nouvelle fiche…</option>';
    const fiche = e.aSavoir && fiches[e.aSavoir];
    const blocsCoches = new Set(e.blocsAutorises || []);
    const zone = $('.ed-formulaire');
    zone.innerHTML =
      // Exercice
      '<div class="carte ed-carte">' +
      `<div class="ed-carte-tete"><h3 class="ed-numero-ex">Exercice ${echapper(e.numero)}</h3><span class="ed-aide">identifiant : <code>${echapper(e.id)}</code></span></div>` +
      `<label>Titre<input class="champ" data-champ="titre" value="${echapper(e.titre)}" maxlength="80"></label>` +
      `<label>Consigne<textarea class="champ" data-champ="consigne" rows="4">${echapper(e.consigne)}</textarea></label>` +
      '<p class="ed-aide">« si », « alors », « sinon » vont à la ligne chez l’élève. Une ligne qui commence par « - » devient une étiquette.</p>' +
      '<div class="ed-rangee">' +
      `<label>Niveau de blocs<select class="champ" data-champ="niveau"><option value="">Au choix de l’élève</option>${Object.entries(NIVEAUX)
        .map(([n, t]) => `<option value="${n}"${String(e.niveau || '') === n ? ' selected' : ''}>${t}</option>`)
        .join('')}</select></label>` +
      `<label class="ed-case"><input type="checkbox" class="champ" data-champ="niveauVerrouille"${e.niveauVerrouille ? ' checked' : ''}${e.niveau ? '' : ' disabled'}> Niveau imposé (évaluation)</label>` +
      `<label class="ed-case"><input type="checkbox" class="champ" data-champ="defi"${e.defi ? ' checked' : ''}> Défi facultatif</label>` +
      '</div>' +
      `<label>Modes pour tester<select class="champ" data-champ="modes">${MODES_EXERCICE.map(([v, t]) => `<option value="${v}"${(e.modes ? e.modes.join('+') : '') === v ? ' selected' : ''}>${v ? t : `${t} (${nomsModes(etat.paquet.modes || ['simulateur'])})`}</option>`).join('')}</select></label>` +
      `<label>Fiche « À savoir »<select class="champ-fiche">${optionsFiches}</select></label>` +
      (fiche
        ? '<details class="ed-fiche"><summary>Modifier la fiche</summary>' +
          `<label>Titre de la fiche<input class="champ-fiche-titre" value="${echapper(fiche.titre)}"></label>` +
          `<label>Lignes (une par ligne)<textarea class="champ-fiche-lignes" rows="4">${echapper((fiche.lignes || []).join('\n'))}</textarea></label>` +
          (fiche.schema || fiche.etapes ? '<p class="ed-aide">Cette fiche a aussi un schéma ou des étapes en blocs : ils sont gardés tels quels.</p>' : '') +
          '<p class="ed-aide">Une fiche peut servir à plusieurs exercices : la modifier la change partout.</p></details>'
        : '') +
      '</div>' +
      // Composants
      '<div class="carte ed-carte">' +
      '<div class="ed-carte-tete"><h3>Composants et broches</h3></div>' +
      '<div class="ed-composants"></div>' +
      '<p class="ed-message ed-message-broche" hidden></p>' +
      '<button type="button" class="btn-aide btn-ajouter-composant">Ajouter un composant</button>' +
      '<p class="ed-aide">Si tu changes une broche, la solution et les scénarios suivent ; la consigne, seulement si tu le demandes.</p>' +
      '</div>' +
      // Blocs
      '<div class="carte ed-carte">' +
      '<div class="ed-carte-tete"><h3>Blocs proposés aux élèves</h3><span class="ed-aide">Coche ce qui apparaît dans la palette.</span></div>' +
      '<div class="ed-blocs">' +
      A.CATEGORIES.filter((cat) => !cat.carte || cat.carte === carteDuParcours()).map(
        (cat) =>
          `<fieldset><legend>${echapper(cat.nom)}${cat.carte ? ` <span class="ed-aide">· ${echapper(A.profil(cat.carte).nom)}</span>` : ''}</legend>` +
          cat.blocs.map((t) => `<label class="ed-case"><input type="checkbox" class="champ-bloc" value="${t}"${blocsCoches.has(t) ? ' checked' : ''}> ${echapper(A.NOMS_BLOCS[t] || t)}</label>`).join('') +
          '</fieldset>',
      ).join('') +
      '</div></div>' +
      // Indices
      '<div class="carte ed-carte">' +
      '<div class="ed-carte-tete"><h3>Indices</h3></div>' +
      `<label>Indice 1 · avec des mots<textarea class="champ-indice" data-n="0" rows="2">${echapper((e.indices || [])[0] || '')}</textarea></label>` +
      `<label>Indice 2 · les blocs à utiliser<textarea class="champ-indice" data-n="1" rows="2">${echapper((e.indices || [])[1] || '')}</textarea></label>` +
      '<p class="ed-aide">Indice 3 : la forme du programme est tirée automatiquement de la solution de référence.</p>' +
      '</div>';
    dessinerComposants();
    lierFormulaire();
  }

  function lierFormulaire() {
    const zone = $('.ed-formulaire');
    zone.oninput = (evt) => {
      const t = evt.target;
      const e = ex();
      if (t.matches('[data-champ="titre"], [data-champ="consigne"]')) {
        e[t.dataset.champ] = t.value;
        if (t.dataset.champ === 'titre') majLigneListe();
        modifie();
      } else if (t.matches('.champ-indice')) {
        e.indices = e.indices || ['', ''];
        e.indices[Number(t.dataset.n)] = t.value;
        modifie();
      } else if (t.matches('.champ-fiche-titre')) {
        etat.paquet.fiches[e.aSavoir].titre = t.value;
        modifie();
      } else if (t.matches('.champ-fiche-lignes')) {
        etat.paquet.fiches[e.aSavoir].lignes = t.value.split('\n').filter((l) => l.trim());
        modifie();
      } else if (t.matches('.champ-nom-composant')) {
        e.composants[Number(t.dataset.k)].nom = t.value.trim() || undefined;
        if (!e.composants[Number(t.dataset.k)].nom) delete e.composants[Number(t.dataset.k)].nom;
        modifie();
        dessinerApercu();
      }
    };
    zone.onchange = (evt) => {
      const t = evt.target;
      const e = ex();
      if (t.matches('[data-champ="niveau"]')) {
        if (t.value) e.niveau = Number(t.value);
        else {
          delete e.niveau;
          delete e.niveauVerrouille;
        }
        $('[data-champ="niveauVerrouille"]', zone).disabled = !t.value;
        if (!t.value) $('[data-champ="niveauVerrouille"]', zone).checked = false;
        modifie();
      } else if (t.matches('[data-champ="modes"]')) {
        if (t.value) e.modes = t.value.split('+');
        else delete e.modes;
        modifie();
      } else if (t.matches('[data-champ="niveauVerrouille"], [data-champ="defi"]')) {
        if (t.checked) e[t.dataset.champ] = true;
        else delete e[t.dataset.champ];
        if (t.dataset.champ === 'defi') {
          e.defi = t.checked;
          majLigneListe();
        }
        modifie();
      } else if (t.matches('.champ-fiche')) {
        if (t.value === '__nouvelle') {
          const titre = prompt('Titre de la nouvelle fiche « À savoir » :');
          if (!titre) return dessinerFormulaire();
          const cles = Object.keys(etat.paquet.fiches || {});
          let n = cles.length + 1;
          while (cles.includes(String(n))) n++;
          etat.paquet.fiches = etat.paquet.fiches || {};
          etat.paquet.fiches[String(n)] = { titre, lignes: [] };
          e.aSavoir = String(n);
        } else e.aSavoir = t.value || null;
        modifie();
        dessinerFormulaire();
      } else if (t.matches('.champ-bloc')) {
        e.blocsAutorises = $$('.champ-bloc:checked', zone).map((x) => x.value);
        etat.editeur.changerPalette(e.blocsAutorises);
        modifie();
      } else if (t.matches('.champ-type-composant')) {
        const c = e.composants[Number(t.dataset.k)];
        c.type = t.value;
        const broches = brochesDe(c.type);
        if (!broches.includes(c.broche)) changerBroche(Number(t.dataset.k), broches[0]);
        modifie();
        dessinerComposants();
        dessinerScenarios();
        dessinerApercu();
      } else if (t.matches('.champ-broche-composant')) {
        changerBroche(Number(t.dataset.k), t.value);
      }
    };
    zone.onclick = (evt) => {
      const t = evt.target.closest('button');
      if (!t) return;
      const e = ex();
      if (t.matches('.btn-ajouter-composant')) {
        const prises = new Set(e.composants.map((c) => c.broche));
        const broche = (brochesDe(typesComposants()[0].type).find((b) => !prises.has(b)) || brochesDe(typesComposants()[0].type)[0]);
        e.composants.push({ type: typesComposants()[0].type, broche });
        modifie();
        dessinerComposants();
        dessinerApercu();
      } else if (t.matches('.btn-retirer-composant')) {
        const c = e.composants[Number(t.dataset.k)];
        const utilise = JSON.stringify([e.solutionReference, e.scenarios]).includes(`"${c.broche}"`);
        if (utilise && !confirm(`La broche ${c.broche} sert encore dans la solution ou les scénarios. Retirer quand même le composant ?`)) return;
        e.composants.splice(Number(t.dataset.k), 1);
        modifie();
        dessinerComposants();
        dessinerApercu();
      } else if (t.matches('.btn-remplacer-consigne')) {
        A.remplacerDansConsigne(e, t.dataset.ancienne, t.dataset.nouvelle);
        $('[data-champ="consigne"]', zone).value = e.consigne;
        $('.ed-message-broche', zone).hidden = true;
        modifie();
      }
    };
  }

  // Carte du parcours : elle décide des composants, des broches et des blocs proposés.
  const carteDuParcours = () => (etat.paquet && etat.paquet.carte) || 'uno';
  const brochesDe = (type) => A.brochesDe(carteDuParcours(), type) || [];
  const typesComposants = () => A.TYPES_COMPOSANTS.filter((t) => A.profil(carteDuParcours()).composants.includes(t.type));

  function dessinerComposants() {
    const e = ex();
    e.composants = e.composants || [];
    const zone = $('.ed-composants');
    zone.innerHTML = e.composants.length
      ? e.composants
          .map((c, k) => {
            const broches = brochesDe(c.type).length ? brochesDe(c.type) : [c.broche];
            return (
              `<div class="ed-composant">` +
              `<label>Sorte<select class="champ-type-composant" data-k="${k}">${typesComposants().map((t) => `<option value="${t.type}"${t.type === c.type ? ' selected' : ''}>${t.nom}</option>`).join('')}</select></label>` +
              `<label>Nom (facultatif)<input class="champ-nom-composant" data-k="${k}" value="${echapper(c.nom || '')}" placeholder="ex. Trappe" maxlength="20"></label>` +
              `<label>Broche<select class="champ-broche-composant" data-k="${k}">${broches.map((b) => `<option${b === c.broche ? ' selected' : ''}>${b}</option>`).join('')}</select></label>` +
              `<button type="button" class="btn-aide btn-retirer-composant" data-k="${k}" aria-label="Retirer ce composant" title="Retirer ce composant">${A.icone('corbeille', { epaisseur: 2.4 })}</button>` +
              '</div>'
            );
          })
          .join('')
      : typesComposants().length
        ? '<p class="ed-aide">Aucun composant : ajoute ceux que l’élève branche (LED, bouton, servomoteur…).</p>'
        : `<p class="ed-aide">Rien à brancher sur ${echapper(A.profil(carteDuParcours()).nom)} : ses moteurs, capteurs et LED sont dans les blocs (ultrasons sur le port ${A.profil(carteDuParcours()).ports.ultrasons}, suiveur de ligne sur le port ${A.profil(carteDuParcours()).ports.ligne}).</p>`;
    const ajouter = $('.btn-ajouter-composant');
    if (ajouter) ajouter.hidden = !typesComposants().length;
  }

  function changerBroche(k, nouvelle) {
    const e = ex();
    const ancienne = e.composants[k].broche;
    if (ancienne === nouvelle) return;
    if (e.composants.some((c, j) => j !== k && c.broche === nouvelle)) {
      message(`La broche ${nouvelle} est déjà prise par un autre composant de l’exercice.`);
      return dessinerComposants();
    }
    const r = A.changerBroche(e, ancienne, nouvelle);
    modifie();
    dessinerComposants();
    const zone = $('.ed-message-broche');
    zone.innerHTML =
      `Broche ${ancienne} → ${nouvelle} : ${r.solution} bloc${r.solution > 1 ? 's' : ''} de la solution et ${r.scenarios} étape${r.scenarios > 1 ? 's' : ''} des scénarios mis à jour.` +
      (r.consigne ? ` La consigne parle encore de ${ancienne}. <button type="button" class="btn-lien btn-remplacer-consigne" data-ancienne="${ancienne}" data-nouvelle="${nouvelle}">Remplacer aussi dans la consigne</button>` : '');
    zone.hidden = false;
    chargerSolution();
    dessinerScenarios();
    dessinerApercu();
  }

  // ----- Solution de référence -----

  function creerEditeurSolution() {
    etat.editeur = A.creerEditeur($('.ed-solution'), {
      modifie() {
        const e = ex();
        const avant = JSON.stringify(e.solutionReference);
        const { programme } = etat.editeur.lire();
        e.solutionReference = A.solutionDepuisProgramme(programme);
        if (avant.includes('"$')) {
          etat.messageSolution = 'Les paramètres ($…) de cette solution sont remplacés par leur valeur actuelle.';
          majMessageSolution();
        }
        etat.resultats = null;
        $('.ed-resultats') && ($('.ed-resultats').innerHTML = '');
        lancerApercu();
        modifie();
      },
      zoom() {},
    });
  }

  function chargerSolution() {
    const e = ex();
    // Les paramètres « $nom » prennent leur valeur, comme chez l'élève.
    const solution = A.appliquerParametres(e.solutionReference || { demarrage: [], boucle: [] }, etat.paquet.parametres || {});
    A.carteCourante = carteDuParcours();
    etat.editeur.charger({ blocsAutorises: e.blocsAutorises, composants: e.composants, carte: carteDuParcours() }, A.versBlockly(solution));
    majMessageSolution();
  }

  function majMessageSolution() {
    const el = $('.ed-message-solution');
    el.textContent = etat.messageSolution || '';
    el.hidden = !etat.messageSolution;
  }

  // ----- Scénarios de test -----

  // Composants branchés + ce qui est sur la carte (boutons A et B, logo, moteurs du mBot).
  const tousComposants = (e) => (e.composants || []).concat(A.composantsCarte(carteDuParcours()));
  function sorties(e) {
    return tousComposants(e).filter((c) => c.type !== 'bouton');
  }
  function boutons(e) {
    return tousComposants(e).filter((c) => c.type === 'bouton');
  }
  function nomCourt(c) {
    if (c.integre) return c.libelle.replace(/^(le|la|les) /, '') + ' (sur la carte)';
    const t = { led: 'LED', bouton: 'bouton', servo: 'servomoteur', buzzer: 'buzzer' }[c.type] || c.type;
    return `${t}${c.nom ? ' ' + c.nom : ''} ${c.broche}`;
  }
  function optionsBroches(liste, choisie) {
    const vues = liste.map((c) => `<option value="${c.broche}"${c.broche === choisie ? ' selected' : ''}>${echapper(nomCourt(c))}</option>`);
    if (choisie && !liste.some((c) => c.broche === choisie)) vues.unshift(`<option value="${choisie}" selected>${choisie} (aucun composant)</option>`);
    return vues.join('');
  }
  function valeurEtat(c, v, attrs) {
    if (c && c.type === 'servo') return `<input type="number" class="ed-petit" min="0" max="180" step="1" value="${v}" ${attrs} aria-label="angle en degrés"> °`;
    if (c && c.type === 'moteur') return `<input type="number" class="ed-petit" min="-100" max="100" step="1" value="${v}" ${attrs} aria-label="vitesse en % (négative : en arrière)"> %`;
    return `<select ${attrs}><option value="1"${v ? ' selected' : ''}>${c && c.type === 'bouton' ? 'appuyé' : 'allumée'}</option><option value="0"${v ? '' : ' selected'}>${c && c.type === 'bouton' ? 'relâché' : 'éteinte'}</option></select>`;
  }

  function champEtapeHtml(etape, champ, s, k) {
    const e = ex();
    const att = (extra) => `data-s="${s}" data-k="${k}" data-champ="${champ.nom}" ${extra || ''}`;
    const v = etape[champ.nom];
    const libelle = `<span class="ed-champ-libelle">${echapper(champ.libelle)}</span>`;
    switch (champ.type) {
      case 'secondes':
        if (champ.facultatif && v === undefined) return `<label class="ed-champ ed-facultatif">${libelle}<input type="number" class="ed-petit" min="0" step="0.1" placeholder="${String(champ.defaut).replace('.', ',')}" ${att()}> s</label>`;
        return `<label class="ed-champ">${libelle}<input type="number" class="ed-petit" min="0" step="0.1" value="${v}" ${att()}> s</label>`;
      case 'entier':
        return `<label class="ed-champ${champ.facultatif ? ' ed-facultatif' : ''}">${libelle}<input type="number" class="ed-petit" min="0" step="1" value="${v === undefined ? '' : v}" ${att()}></label>`;
      case 'bouton':
        return `<label class="ed-champ">${libelle}<select ${att()}>${optionsBroches(boutons(e), v)}</select></label>`;
      case 'sortie':
        return `<label class="ed-champ">${libelle}<select ${att()}>${optionsBroches(sorties(e), v)}</select></label>`;
      case 'deuxSorties':
        return (
          `<label class="ed-champ">${libelle}<select ${att('data-rang="0"')}>${optionsBroches(sorties(e), v[0])}</select></label>` +
          `<label class="ed-champ"><span class="ed-champ-libelle">et</span><select ${att('data-rang="1"')}>${optionsBroches(sorties(e), v[1])}</select></label>`
        );
      case 'capteur': {
        // Un capteur et sa valeur : { distance: 10 }.
        const [nom, val] = Object.entries(v || {})[0] || [];
        const liste = A.capteursCarte(carteDuParcours());
        const choisi = liste.find((x) => x.nom === nom) || liste[0];
        const menu = liste.map((x) => `<option value="${x.nom}"${x === choisi ? ' selected' : ''}>${echapper(x.libelle)}</option>`).join('');
        const valeur = choisi.options
          ? `<select ${att('data-quoi="valeur-capteur"')}>${choisi.options.map(([t, o]) => `<option value="${o}"${Number(o) === Number(val) ? ' selected' : ''}>${echapper(t)}</option>`).join('')}</select>`
          : `<input type="number" class="ed-petit" min="${choisi.min}" max="${choisi.max}" step="1" value="${val}" ${att('data-quoi="valeur-capteur"')}> ${choisi.unite}`;
        return `<label class="ed-champ">${libelle}<select ${att('data-quoi="nom-capteur"')}>${menu}</select></label><label class="ed-champ"><span class="ed-champ-libelle">à</span>${valeur}</label>`;
      }
      case 'valeurs':
        return `<label class="ed-champ">${libelle}<input class="ed-moyen" value="${(v || []).join(' ; ')}" ${att()} aria-describedby="aide-valeurs"></label>`;
      case 'etats': {
        const lignes = Object.entries(v || {})
          .map(([b, val]) => {
            const c = tousComposants(e).find((x) => x.broche === b);
            return (
              `<span class="ed-etat-ligne"><select ${att(`data-etat="${b}" data-quoi="broche"`)}>${optionsBroches(sorties(e).concat(boutons(e)), b)}</select>` +
              ` ${valeurEtat(c, val, att(`data-etat="${b}" data-quoi="valeur"`))}` +
              (Object.keys(v).length > 1 ? `<button type="button" class="btn-lien" ${att(`data-etat="${b}" data-action="retirer-etat"`)}>retirer</button>` : '') +
              '</span>'
            );
          })
          .join('');
        return `<div class="ed-champ ed-etats">${libelle}${lignes}<button type="button" class="btn-lien" ${att('data-action="ajouter-etat"')}>+ un autre composant</button></div>`;
      }
      case 'texte':
        return `<label class="ed-champ ed-facultatif">${libelle}<input class="ed-moyen" value="${echapper(v || '')}" ${att()}></label>`;
      default:
        return '';
    }
  }

  function dessinerScenarios() {
    const e = ex();
    e.scenarios = e.scenarios || [];
    const zone = $('.ed-scenarios');
    let h = '<div class="ed-carte-tete"><h3>Scénarios de test</h3><span class="ed-aide">On décrit ce qu’on observe, pas la forme du programme.</span></div>';
    e.scenarios.forEach((sc, s) => {
      h +=
        `<section class="ed-scenario" data-s="${s}">` +
        `<div class="ed-scenario-tete"><label>Scénario ${s + 1}<input class="ed-nom-scenario" data-s="${s}" value="${echapper(sc.nom || '')}" placeholder="ex. Bouton relâché, puis appuyé"></label>` +
        (e.scenarios.length > 1 ? `<button type="button" class="btn-lien" data-s="${s}" data-action="retirer-scenario">Supprimer ce scénario</button>` : '') +
        '</div><ol class="ed-etapes">';
      sc.etapes.forEach((etape, k) => {
        const cle = A.typeEtape(etape);
        const type = A.TYPES_ETAPES.find((t) => t.cle === cle);
        const cleOuverte = `${s}:${k}`;
        h += `<li class="ed-etape"><details${etat.etapesOuvertes.has(cleOuverte) ? ' open' : ''} data-ouverte="${cleOuverte}"><summary class="ed-etape-tete"><span class="ed-etape-phrase">${echapper(A.decrireEtape(etape, e, carteDuParcours()))}</span>`;
        h +=
          `<span class="ed-etape-outils"><button type="button" class="btn-icone" data-s="${s}" data-k="${k}" data-action="monter" aria-label="Monter l’étape"${k ? '' : ' disabled'}>${A.icone('chevronHaut', { epaisseur: 2.8 })}</button>` +
          `<button type="button" class="btn-icone" data-s="${s}" data-k="${k}" data-action="descendre" aria-label="Descendre l’étape"${k < sc.etapes.length - 1 ? '' : ' disabled'}>${A.icone('chevronBas', { epaisseur: 2.8 })}</button>` +
          `<button type="button" class="btn-icone" data-s="${s}" data-k="${k}" data-action="retirer" aria-label="Retirer l’étape">${A.icone('corbeille', { epaisseur: 2.4 })}</button></span></summary>`;
        if (type) {
          h += '<div class="ed-etape-champs">' + type.champs.map((c) => champEtapeHtml(etape, c, s, k)).join('');
          if (A.VERIFICATIONS.includes(cle)) {
            h += `<details class="ed-phrase"${etape.contexte || etape.attendu ? ' open' : ''}><summary>Phrase pour l’élève</summary>${A.CHAMPS_PHRASE.map((c) => champEtapeHtml(etape, c, s, k)).join('')}</details>`;
          }
          h += '</div>';
        } else h += `<pre class="ed-inconnue">${echapper(JSON.stringify(etape))}</pre>`;
        h += '</details></li>';
      });
      h +=
        '</ol><div class="ed-ajout-etape">' +
        `<select class="ed-sorte-etape" data-s="${s}" aria-label="Sorte d’étape">${A.TYPES_ETAPES.filter((t) => !t.avecCapteurs || A.capteursCarte(carteDuParcours()).length).map((t) => `<option value="${t.cle}">${t.nom}</option>`).join('')}</select>` +
        `<button type="button" class="btn-aide" data-s="${s}" data-action="ajouter-etape">Ajouter une étape</button></div></section>`;
    });
    h +=
      '<p class="ed-aide" id="aide-valeurs">Suite d’états : 1 = allumée, 0 = éteinte, ou des angles (0 ; 90 ; 180), séparés par « ; ».</p>' +
      '<div class="ed-scenarios-actions"><button type="button" class="btn-aide" data-action="ajouter-scenario">Ajouter un scénario</button>' +
      '<button type="button" class="btn-principal btn-tester" data-action="tester">Tester mes scénarios sur ma solution</button></div>' +
      '<div class="ed-resultats" aria-live="polite"></div>';
    zone.innerHTML = h;
    if (etat.resultats) afficherResultats();
  }

  function lierScenarios() {
    const zone = $('.ed-scenarios');
    zone.addEventListener(
      'toggle',
      (evt) => {
        const d = evt.target;
        if (!d.dataset || !d.dataset.ouverte) return;
        if (d.open) etat.etapesOuvertes.add(d.dataset.ouverte);
        else etat.etapesOuvertes.delete(d.dataset.ouverte);
      },
      true,
    );
    const etapeDe = (t) => ex().scenarios[Number(t.dataset.s)].etapes[Number(t.dataset.k)];
    zone.addEventListener('input', (evt) => {
      const t = evt.target;
      if (t.matches('.ed-nom-scenario')) {
        ex().scenarios[Number(t.dataset.s)].nom = t.value;
        modifie();
      }
    });
    zone.addEventListener('change', (evt) => {
      const t = evt.target;
      if (!t.dataset.champ) return;
      const etape = etapeDe(t);
      const champ = t.dataset.champ;
      const nombre = (x) => Number(String(x).replace(',', '.'));
      if (t.dataset.quoi === 'nom-capteur') {
        const c = A.capteursCarte(carteDuParcours()).find((x) => x.nom === t.value);
        etape.regler = { [t.value]: c.options ? c.options[0][1] : Math.max(c.min, 0) };
        etat.resultats = null;
        modifie();
        return dessinerScenarios();
      } else if (t.dataset.quoi === 'valeur-capteur') {
        const nom = Object.keys(etape.regler)[0];
        etape.regler = { [nom]: nombre(t.value) };
      } else if (t.dataset.etat) {
        const objet = etape[champ];
        if (t.dataset.quoi === 'broche') {
          const nouveau = {};
          for (const [b, v] of Object.entries(objet)) nouveau[b === t.dataset.etat ? t.value : b] = v;
          etape[champ] = nouveau;
        } else objet[t.dataset.etat] = nombre(t.value);
      } else if (t.dataset.rang) etape[champ][Number(t.dataset.rang)] = t.value;
      else if (t.type === 'number') {
        if (t.value === '') delete etape[champ];
        else etape[champ] = nombre(t.value);
      } else if (champ === 'valeurs') {
        etape.valeurs = t.value.split(/[;\s]+/).filter(Boolean).map(nombre).filter((x) => !Number.isNaN(x));
      } else if (champ === 'contexte' || champ === 'attendu') {
        if (t.value.trim()) etape[champ] = t.value.trim();
        else delete etape[champ];
      } else etape[champ] = t.value;
      etat.resultats = null;
      modifie();
      dessinerScenarios();
    });
    zone.addEventListener('click', (evt) => {
      const t = evt.target.closest('[data-action]');
      if (!t) return;
      evt.preventDefault(); // un bouton dans le résumé d'une étape ne l'ouvre ni ne la ferme
      const e = ex();
      const sc = t.dataset.s !== undefined ? e.scenarios[Number(t.dataset.s)] : null;
      const k = Number(t.dataset.k);
      switch (t.dataset.action) {
        case 'tester':
          return tester();
        case 'ajouter-scenario':
          e.scenarios.push({ nom: `Scénario ${e.scenarios.length + 1}`, etapes: [] });
          break;
        case 'retirer-scenario':
          if (!confirm(`Supprimer le scénario « ${sc.nom || ''} » ?`)) return;
          e.scenarios.splice(Number(t.dataset.s), 1);
          break;
        case 'ajouter-etape':
          sc.etapes.push(A.nouvelleEtape($(`.ed-sorte-etape[data-s="${t.dataset.s}"]`, zone).value, e, carteDuParcours()));
          etat.etapesOuvertes.add(`${t.dataset.s}:${sc.etapes.length - 1}`);
          break;
        case 'monter':
        case 'descendre': {
          const vers = t.dataset.action === 'monter' ? k - 1 : k + 1;
          const [x] = sc.etapes.splice(k, 1);
          sc.etapes.splice(vers, 0, x);
          const avant = `${t.dataset.s}:${k}`;
          if (etat.etapesOuvertes.delete(avant)) etat.etapesOuvertes.add(`${t.dataset.s}:${vers}`);
          break;
        }
        case 'retirer':
          sc.etapes.splice(k, 1);
          etat.etapesOuvertes.clear();
          break;
        case 'ajouter-etat': {
          const etape = etapeDe(t);
          const objet = etape[t.dataset.champ];
          const libre = sorties(e).find((c) => !(c.broche in objet));
          if (!libre) return message('Tous les composants de sortie sont déjà dans cette vérification.');
          objet[libre.broche] = libre.type === 'servo' ? 90 : libre.type === 'moteur' ? 50 : 1;
          break;
        }
        case 'retirer-etat':
          delete etapeDe(t)[t.dataset.champ][t.dataset.etat];
          break;
        default:
          return;
      }
      etat.resultats = null;
      modifie();
      dessinerScenarios();
    });
  }

  function tester() {
    etat.resultats = A.testerScenarios(etat.paquet, ex());
    afficherResultats();
  }

  function afficherResultats() {
    const zone = $('.ed-resultats');
    const r = etat.resultats;
    if (!r.length) {
      zone.innerHTML = '<p class="ed-message ed-ecart">Cet exercice n’a aucun scénario : ajoute-en un pour que la vérification des élèves puisse marcher.</p>';
      return;
    }
    zone.innerHTML = r
      .map((x) =>
        x.reussi
          ? `<p class="ed-message ed-reussi">${A.icone('coche', { epaisseur: 2.6 })}<span><strong>${echapper(x.nom)}</strong> : la solution passe les ${x.etapes} étape${x.etapes > 1 ? 's' : ''}.</span></p>`
          : `<p class="ed-message ed-ecart">${A.icone('info', { epaisseur: 2.4 })}<span><strong>${echapper(x.nom)}</strong> : ${x.vide ? '' : 'la solution ne passe pas. Ce que verrait l’élève : '}« ${echapper(x.message)} »</span></p>`,
      )
      .join('');
  }

  // ----- Aperçu du simulateur -----

  const apercu = { sim: null, servos: {}, boutons: {}, raf: null, dernier: 0 };

  // L'aperçu fait tourner la solution en continu : appuyer sur un bouton montre tout de suite ce qu'elle fait.
  function dessinerApercu() {
    arreterApercu();
    const e = A.exercicePrepare(etat.paquet, ex());
    etat.apercu = A.creerVueSimulateur($('.ed-simulateur'), e, {
      appuyerBouton(broche, valeur) {
        apercu.boutons[broche] = valeur;
        if (apercu.sim) apercu.sim.changerEntree(broche, valeur);
        afficherApercu(0);
      },
    });
    apercu.exercice = e;
    lancerApercu();
  }

  function afficherApercu(dt) {
    if (!etat.apercu) return;
    const sim = apercu.sim;
    const etats = {};
    for (const c of apercu.exercice.composants || []) {
      if (c.type === 'bouton') etats[c.broche] = sim ? sim.entrees[c.broche] || 0 : apercu.boutons[c.broche] || 0;
      else if (c.type === 'servo') {
        const cible = sim ? sim.sorties[c.broche] || 0 : 0;
        const pos = apercu.servos[c.broche] || 0;
        const pas = (dt || 0) * A.VITESSE_SERVO;
        etats[c.broche] = apercu.servos[c.broche] = Math.abs(cible - pos) <= pas ? cible : pos + Math.sign(cible - pos) * pas;
      } else etats[c.broche] = sim ? sim.sorties[c.broche] || 0 : 0;
    }
    etat.apercu.afficher(etats, !!sim, sim);
    const t = sim ? Math.floor(sim.t / 1000) : 0;
    $('.ed-apercu .chrono-valeur').textContent = String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  }

  function lancerApercu() {
    cancelAnimationFrame(apercu.raf);
    // Toujours la solution du moment (elle a pu changer depuis le dessin de l'aperçu).
    const e = (apercu.exercice = A.exercicePrepare(etat.paquet, ex()));
    apercu.sim = A.creerSimulation(e.solutionReference, { composants: e.composants, boutonsVersMasse: e.boutonsVersMasse, carte: e.carte, capteurs: etat.apercu && etat.apercu.capteurs });
    for (const [b, v] of Object.entries(apercu.boutons)) if (v) apercu.sim.changerEntree(b, 1);
    apercu.servos = {};
    apercu.dernier = performance.now();
    const image = (maintenant) => {
      if (!apercu.sim) return;
      const dt = Math.min(100, maintenant - apercu.dernier);
      apercu.dernier = maintenant;
      apercu.sim.avancerJusqua(apercu.sim.t + dt);
      if (apercu.sim.journal.length > 20000) apercu.sim.journal.splice(0, 15000);
      afficherApercu(dt);
      apercu.raf = requestAnimationFrame(image);
    };
    apercu.raf = requestAnimationFrame(image);
  }

  function arreterApercu() {
    cancelAnimationFrame(apercu.raf);
    apercu.sim = null;
    apercu.servos = {};
    if (etat.apercu) afficherApercu(0);
  }


  // ---------- Réglages du parcours ----------

  function ouvrirReglages() {
    const d = $('.dialogue-reglages');
    const p = etat.paquet;
    $('.reglage-titre', d).value = p.titre;
    $('.reglage-id', d).textContent = p.id;
    $('.reglage-moteur', d).textContent = p.moteurMinimum || A.VERSION_MOTEUR;
    $('.reglage-carte', d).value = p.carte || 'uno';
    $('.reglage-boutons', d).checked = p.boutonsVersMasse !== false;
    $('.reglage-mode-carte', d).checked = (p.modes || ['simulateur']).includes('carte');
    $('.reglage-mode-direct', d).checked = (p.modes || ['simulateur']).includes('direct');
    const liste = $('.liste-parametres', d);
    const ligne = (nom, valeur) =>
      `<div class="ed-parametre"><label>Nom<input class="parametre-nom" value="${echapper(nom)}" pattern="[A-Za-z][A-Za-z0-9]*"></label>` +
      `<label>Valeur<input class="parametre-valeur ed-petit" type="number" step="any" value="${valeur}"></label></div>`;
    liste.innerHTML = Object.entries(p.parametres || {}).map(([n, v]) => ligne(n, v)).join('') || '<p class="ed-aide">Aucun paramètre.</p>';
    $('.btn-ajouter-parametre', d).onclick = () => {
      if (!$('.ed-parametre', liste)) liste.innerHTML = '';
      liste.insertAdjacentHTML('beforeend', ligne('', 0));
    };
    d.onclose = () => {
      if (d.returnValue !== 'ok') return;
      p.titre = $('.reglage-titre', d).value.trim() || p.titre;
      const carteAvant = p.carte || 'uno';
      p.carte = $('.reglage-carte', d).value;
      const carteChangee = carteAvant !== p.carte;
      p.boutonsVersMasse = $('.reglage-boutons', d).checked;
      p.modes = ['simulateur'].concat($('.reglage-mode-direct', d).checked ? ['direct'] : [], $('.reglage-mode-carte', d).checked ? ['carte'] : []);
      const params = {};
      for (const l of $$('.ed-parametre', liste)) {
        const nom = $('.parametre-nom', l).value.trim();
        if (/^[A-Za-z][A-Za-z0-9]*$/.test(nom)) params[nom] = Number($('.parametre-valeur', l).value);
      }
      p.parametres = params;
      modifie();
      majBandeau();
      if (carteChangee) dessinerFormulaire(); // composants, broches et blocs de la nouvelle carte
      chargerSolution();
      dessinerApercu();
    };
    d.showModal();
  }

  // ---------- Exporter, publier ----------

  function nomExport(p) {
    return `${p.id}-${p.versionParcours}.labo-parcours.json`;
  }

  function exporter() {
    telecharger(nomExport(etat.paquet), JSON.stringify(etat.paquet, null, 2) + '\n');
    message(`Le fichier ${nomExport(etat.paquet)} est dans tes téléchargements (brouillon, version ${etat.paquet.versionParcours}).`, 5000);
  }

  // Dossier de Labo Blocs (celui qui contient « parcours » et « site ») ou directement son dossier « parcours ».
  async function dossierParcours() {
    const choisi = await global.showDirectoryPicker({ id: 'labo-blocs', mode: 'readwrite' });
    if (choisi.name === 'parcours') return choisi;
    try {
      return await choisi.getDirectoryHandle('parcours');
    } catch {
      throw new Error('Ce dossier n’est pas celui de Labo Blocs : il n’a pas de sous-dossier « parcours ». Choisis le dossier qui contient « site » et « parcours ».');
    }
  }

  async function ecrire(dossier, nom, texte) {
    const f = await dossier.getFileHandle(nom, { create: true });
    const w = await f.createWritable();
    await w.write(texte);
    await w.close();
  }

  function ouvrirPublier() {
    const d = $('.dialogue-publier');
    const contenu = $('.publier-contenu', d);
    const actions = $('.publier-actions', d);
    const problemes = A.controlerPublication(etat.paquet);
    const suivante = A.versionAPublier(etat.paquet);
    if (problemes.length) {
      contenu.innerHTML =
        `<p class="ed-message ed-ecart">${A.icone('info', { epaisseur: 2.4 })}<span>La version ${suivante} ne peut pas encore être publiée : les élèves ne pourraient pas réussir ces exercices.</span></p>` +
        `<ul class="publier-problemes">${problemes.map((x) => `<li>${echapper(x)}</li>`).join('')}</ul>`;
      actions.innerHTML = '<button type="button" class="btn-principal btn-fermer-publier">Revenir aux exercices</button>';
    } else {
      const local = global.showDirectoryPicker && (location.protocol === 'file:' || ['localhost', '127.0.0.1'].includes(location.hostname));
      contenu.innerHTML =
        `<p class="ed-message ed-reussi">${A.icone('coche', { epaisseur: 2.6 })}<span>Les ${etat.paquet.exercices.length} exercices sont prêts : chaque solution passe ses scénarios.</span></p>` +
        `<p>La version <strong>${suivante}</strong> du parcours « ${echapper(etat.paquet.titre)} » va être :</p><ul>` +
        (local
          ? `<li>écrite dans le dossier de Labo Blocs (<code>parcours/${echapper(etat.paquet.id)}/parcours.js</code>) : choisis le dossier qui contient « site » et « parcours » ;</li>`
          : `<li>téléchargée sous le nom <code>parcours.js</code>, à copier dans <code>parcours/${echapper(etat.paquet.id)}/</code> de Labo Blocs ;</li>`) +
        `<li>téléchargée pour les projets : <code>${echapper(etat.paquet.id)}-${suivante}.labo-parcours.json</code>, à donner à « Mettre à jour les exercices » (outil du professeur du projet).</li></ul>`;
      actions.innerHTML = '<button type="button" class="btn-secondaire btn-fermer-publier">Annuler</button><button type="button" class="btn-principal btn-confirmer-publier">Publier</button>';
      $('.btn-confirmer-publier', actions).onclick = () => publier(local);
    }
    $('.btn-fermer-publier', actions).onclick = () => d.close();
    d.showModal();
  }

  async function publier(local) {
    const d = $('.dialogue-publier');
    const publie = A.publier(etat.paquet);
    const script = A.scriptParcours(publie);
    try {
      if (local) {
        const dossier = await dossierParcours();
        const sien = await dossier.getDirectoryHandle(publie.id, { create: true });
        await ecrire(sien, 'parcours.js', script);
        // Un nouveau parcours rejoint la liste de l'éditeur.
        let ids = [];
        try {
          const t = await (await (await dossier.getFileHandle('index.js')).getFile()).text();
          ids = JSON.parse(t.match(/definirIndexParcours\((\[[\s\S]*?\])\)/)[1]);
        } catch {
          ids = [];
        }
        if (!ids.includes(publie.id)) {
          ids.push(publie.id);
          await ecrire(
            dossier,
            'index.js',
            '// Parcours de Labo Blocs, ouverts par l’éditeur (site/editeur.html). L’éditeur met cette liste à jour quand il\n// enregistre un nouveau parcours dans ce dossier.\n' +
              `definirIndexParcours(${JSON.stringify(ids)});\n`,
          );
        }
      } else telecharger('parcours.js', script, 'text/javascript');
      telecharger(nomExport(publie), JSON.stringify(publie, null, 2) + '\n');
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      $('.publier-contenu', d).insertAdjacentHTML('beforeend', `<p class="ed-message ed-ecart">${echapper((e && e.message) || 'L’écriture n’a pas marché.')} Rien n’a été publié.</p>`);
      return;
    }
    etat.paquet = publie;
    try {
      localStorage.removeItem(CLE_BROUILLON);
    } catch {
      /* rien */
    }
    etat.enregistreA = null;
    majBandeau();
    $('.ed-etat').textContent = `Version ${publie.versionParcours} publiée`;
    $('.publier-contenu', d).innerHTML =
      `<p class="ed-message ed-reussi">${A.icone('coche', { epaisseur: 2.6 })}<span>Version ${publie.versionParcours} publiée.</span></p>` +
      `<p>Pour un projet (ex. le distributeur) : outil du professeur › « Exercices » › « Choisir un fichier… » avec <code>${echapper(nomExport(publie))}</code> (dans tes téléchargements).</p>` +
      '<p>Pour la version en ligne : envoyer le fichier <code>parcours/' + echapper(publie.id) + '/parcours.js</code> sur le dépôt GitHub de Labo Blocs.</p>';
    $('.publier-actions', d).innerHTML = '<button type="button" class="btn-principal btn-fermer-publier">Fermer</button>';
    $('.btn-fermer-publier', d).onclick = () => d.close();
  }

  // ---------- Démarrage ----------

  function demarrerEditeurParcours() {
    A.ajusterEchelle();
    addEventListener('resize', A.ajusterEchelle);
    A.poserIcones(document);
    lierListe();
    lierScenarios();
    $('.btn-apercu').addEventListener('click', lancerApercu); // « Recommencer » : la solution repart de zéro
    $('.btn-reglages').addEventListener('click', ouvrirReglages);
    $('.btn-exporter').addEventListener('click', exporter);
    $('.btn-publier').addEventListener('click', ouvrirPublier);
    $('.btn-fermer-parcours').addEventListener('click', () => {
      garderBrouillon();
      arreterApercu();
      accueil();
    });
    accueil();
    A.editeurParcours = { etat, ouvrir, choisir, tester };
  }

  A.demarrerEditeurParcours = demarrerEditeurParcours;
})(this);
