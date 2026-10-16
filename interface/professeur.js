// Outil du professeur de Labo Blocs (jalon 5, site/prof.html) : suivre une classe (maquette B10), fiche d'une
// équipe (B11) avec le programme de chaque exercice rejouable dans le simulateur, niveaux par compétence (forcés si
// besoin), commentaire, exports (CSV, et fichier de résultats pour le Carnet de classe).
// Les fichiers des élèves ne sont jamais modifiés : les réglages du professeur vont dans labo-blocs-professeur.json,
// dans le dossier de la classe (ou dans le navigateur quand les fichiers sont importés un par un).
(function (global) {
  'use strict';

  const A = global.LaboBlocs;
  const $ = (sel, racine) => (racine || document).querySelector(sel);
  const $$ = (sel, racine) => [...(racine || document).querySelectorAll(sel)];
  const echapper = (s) => String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const nombreFr = (x, d) => (x === null || x === undefined ? '—' : String(Math.round(x * Math.pow(10, d || 1)) / Math.pow(10, d || 1)).replace('.', ','));
  const SYMBOLES = { reussi: '✓', en_cours: '▶', a_reverifier: '!', a_faire: '·', verrouille: '' };
  const MOTS = { reussi: 'réussi', en_cours: 'en cours', a_reverifier: 'modifié, à revérifier', a_faire: 'à faire', verrouille: 'pas encore ouvert' };
  const CLE_LOCALE = 'labo-blocs-professeur';

  const etat = {
    dossier: null,
    fichiersDossier: [],
    fichiersImportes: [],
    equipes: [],
    refuses: [],
    prof: A.professeurVide(),
    vue: 'accueil',
    equipe: null,
    derniereLecture: null,
    lecteurs: new Map(),
  };
  let paquets = [];

  function message(texte, duree) {
    const m = $('.message-bref');
    m.textContent = texte;
    m.hidden = false;
    clearTimeout(message.t);
    message.t = setTimeout(() => (m.hidden = true), duree || 3000);
  }

  // ---------- Dossier mémorisé (pour « Reprendre ») ----------
  function base() {
    return new Promise((ok, ko) => {
      const r = indexedDB.open('labo-blocs-professeur', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('dossiers');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ko(r.error);
    });
  }
  async function memoriser(handle) {
    try {
      const db = await base();
      db.transaction('dossiers', 'readwrite').objectStore('dossiers').put(handle, 'classe');
    } catch {
      // pas de mémoire : on redemandera le dossier
    }
  }
  async function memorise() {
    try {
      const db = await base();
      return await new Promise((ok) => {
        const r = db.transaction('dossiers').objectStore('dossiers').get('classe');
        r.onsuccess = () => ok(r.result || null);
        r.onerror = () => ok(null);
      });
    } catch {
      return null;
    }
  }

  // ---------- Lecture des fichiers ----------
  const cache = new Map();
  async function lireDossier(dossier, chemin, profondeur) {
    const sortie = [];
    for await (const entree of dossier.values()) {
      if (entree.kind === 'file' && /\.json$/i.test(entree.name)) {
        const nom = chemin + entree.name;
        let f;
        try {
          f = await entree.getFile();
        } catch {
          continue; // fichier en cours d'écriture par une équipe : relu au prochain passage
        }
        const connu = cache.get(nom);
        if (connu && connu.date === f.lastModified && connu.taille === f.size) sortie.push({ nom, texte: connu.texte });
        else {
          const texte = await f.text();
          cache.set(nom, { date: f.lastModified, taille: f.size, texte });
          sortie.push({ nom, texte });
        }
      } else if (entree.kind === 'directory' && profondeur < 4) {
        sortie.push(...(await lireDossier(entree, chemin + entree.name + ' › ', profondeur + 1)));
      }
    }
    return sortie;
  }
  async function lireFichiers(liste) {
    const sortie = [];
    for (const f of liste) if (/\.json$/i.test(f.name)) sortie.push({ nom: f.name, texte: await f.text() });
    return sortie;
  }

  // ---------- Réglages du professeur ----------
  async function lireReglages() {
    if (etat.dossier) {
      try {
        const f = await (await etat.dossier.getFileHandle(A.NOM_FICHIER_PROFESSEUR)).getFile();
        etat.prof = A.lireProfesseur(await f.text());
        return;
      } catch {
        etat.prof = A.professeurVide();
        return;
      }
    }
    try {
      etat.prof = A.lireProfesseur(localStorage.getItem(CLE_LOCALE) || '');
    } catch {
      etat.prof = A.professeurVide();
    }
  }
  let minuteurReglages = null;
  function reglagesModifies() {
    $('.pr-etat').textContent = 'Réglages modifiés…';
    clearTimeout(minuteurReglages);
    minuteurReglages = setTimeout(ecrireReglages, 600);
  }
  async function ecrireReglages() {
    const texte = JSON.stringify(etat.prof, null, 2) + '\n';
    if (etat.dossier) {
      try {
        if ((await etat.dossier.requestPermission({ mode: 'readwrite' })) !== 'granted') throw new Error('refus');
        const h = await etat.dossier.getFileHandle(A.NOM_FICHIER_PROFESSEUR, { create: true });
        const w = await h.createWritable();
        await w.write(texte);
        await w.close();
        $('.pr-etat').textContent = 'Réglages enregistrés dans le dossier de la classe';
        return;
      } catch {
        $('.pr-etat').textContent = 'Réglages gardés dans ce navigateur (le dossier n’a pas pu être écrit)';
      }
    }
    try {
      localStorage.setItem(CLE_LOCALE, texte);
      if (!etat.dossier) $('.pr-etat').textContent = 'Réglages gardés dans ce navigateur';
    } catch {
      $('.pr-etat').textContent = 'Réglages non enregistrés';
    }
  }

  // ---------- Classe ----------
  function recalculer() {
    const r = A.chargerEquipes([...etat.fichiersDossier, ...etat.fichiersImportes], paquets);
    etat.equipes = r.equipes;
    etat.refuses = r.refuses;
    if (etat.vue === 'fiche' && !etat.equipes.some((e) => e.cle === etat.equipe)) etat.vue = 'classe';
    dessiner();
  }

  async function actualiser() {
    if (!etat.dossier) return recalculer();
    try {
      etat.fichiersDossier = await lireDossier(etat.dossier, etat.dossier.name + ' › ', 0);
      etat.derniereLecture = new Date();
    } catch {
      message('Le dossier n’a pas pu être relu (réseau ?). Nouvel essai dans 30 secondes.', 5000);
    }
    recalculer();
  }

  async function ouvrirDossier(handle) {
    try {
      if ((await handle.queryPermission({ mode: 'read' })) !== 'granted' && (await handle.requestPermission({ mode: 'read' })) !== 'granted') throw new Error('refus');
    } catch {
      return erreurAccueil('Le dossier n’est pas accessible. Choisis-le à nouveau.');
    }
    etat.dossier = handle;
    etat.fichiersImportes = [];
    cache.clear();
    await memoriser(handle);
    await lireReglages();
    etat.vue = 'classe';
    await actualiser();
    clearInterval(actualiser.minuteur);
    actualiser.minuteur = setInterval(() => document.visibilityState === 'visible' && actualiser(), 30000);
  }

  async function importer(fichiers) {
    if (!fichiers.length) return;
    if (!etat.dossier && !etat.fichiersImportes.length) await lireReglages();
    // Le même fichier importé deux fois remplace le premier.
    const noms = new Set(fichiers.map((f) => f.nom));
    etat.fichiersImportes = etat.fichiersImportes.filter((f) => !noms.has(f.nom)).concat(fichiers);
    etat.vue = etat.vue === 'accueil' ? 'classe' : etat.vue;
    recalculer();
    if (!etat.equipes.length) {
      etat.vue = 'accueil';
      dessiner();
      erreurAccueil(etat.refuses.length ? `Aucune sauvegarde d’équipe dans ces fichiers (${etat.refuses[0].raison})` : 'Aucune sauvegarde d’équipe dans ces fichiers.');
    }
  }

  function erreurAccueil(texte) {
    const e = $('.pr-erreur');
    e.textContent = texte;
    e.hidden = !texte;
  }

  // ---------- Dessin ----------
  function dessiner() {
    $('.pr-accueil').hidden = etat.vue !== 'accueil';
    $('.pr-classe').hidden = etat.vue !== 'classe';
    $('.pr-fiche').hidden = etat.vue !== 'fiche';
    $('.pr-btn-changer').hidden = etat.vue === 'accueil';
    if (etat.vue === 'classe') dessinerClasse();
    if (etat.vue === 'fiche') dessinerFiche();
  }

  const reglagesDe = (e) => A.reglagesEquipe(etat.prof, e.cle);
  const resumer = (e) => A.resumerEquipe(e, { forces: reglagesDe(e).forces, bareme: { objectif: etat.prof.objectif } });
  const nomEquipe = (e) => e.eleves.join(' · ');

  function paquetPrincipal() {
    const p = etat.equipes[0] && etat.equipes[0].paquet;
    return p || paquets.find((x) => x.id === (A.projet && A.projet.parcours)) || paquets[0];
  }

  function dessinerClasse() {
    const paquet = paquetPrincipal();
    const classes = [...new Set(etat.equipes.map((e) => e.classe).filter(Boolean))];
    $('.pr-titre-classe').textContent = classes.length ? `Classe ${classes.join(', ')}` : 'Classe';
    const lu = etat.derniereLecture ? ` · lu à ${etat.derniereLecture.getHours()} h ${String(etat.derniereLecture.getMinutes()).padStart(2, '0')}` : '';
    $('.pr-chemin').textContent = (etat.dossier ? etat.dossier.name : 'Fichiers importés') + ` · ${paquet.titre}` + lu;
    // Exercices attendus
    const choix = $('.pr-choix-objectif');
    choix.innerHTML =
      `<option value="">Tous (${paquet.exercices.length})</option>` +
      paquet.exercices.map((e, i) => `<option value="${i + 1}"${etat.prof.objectif === i + 1 ? ' selected' : ''}>Jusqu’à l’exercice ${echapper(e.numero)}</option>`).join('');
    const resumes = etat.equipes.map((e) => ({ e, r: resumer(e) }));
    const c = A.resumerClasse(resumes.map((x) => x.r));
    const tuile = (n, texte, attention) => `<div class="pr-chiffre${attention && n ? ' pr-attention' : ''}"><b>${n}</b><span>${texte}</span></div>`;
    $('.pr-chiffres').innerHTML =
      tuile(c.equipes, c.equipes > 1 ? 'équipes' : 'équipe') +
      tuile(c.bloquees, 'bloquée(s) depuis plus de 10 min', true) +
      tuile(c.envoisAujourdhui, 'envoi(s) dans la carte aujourd’hui') +
      tuile(c.aReverifier, 'exercice(s) modifié(s), à revérifier', true);
    const refus = $('.pr-refuses');
    refus.hidden = !etat.refuses.length;
    refus.textContent = etat.refuses.length ? `${etat.refuses.length} fichier(s) ignoré(s) : ${etat.refuses.map((r) => `${r.nom} (${r.raison})`).join(' ; ')}` : '';
    const codes = resumes.length ? resumes[0].r.evaluation.competences.map((x) => x.code) : [];
    let h =
      '<thead><tr><th scope="col">Équipe</th>' +
      `<th scope="col">Exercices ${echapper(paquet.exercices[0].numero)} à ${echapper(paquet.exercices[paquet.exercices.length - 1].numero)}</th>` +
      '<th scope="col">Indices</th><th scope="col">Dernier envoi carte</th><th scope="col">Activité</th>' +
      codes.map((k) => `<th scope="col" title="${echapper(A.COMPETENCES.find((x) => x.code === k).libelle)}">${k}</th>`).join('') +
      '<th scope="col">Note /20</th><th scope="col">État</th></tr></thead><tbody>';
    for (const { e, r } of resumes) {
      const cellules = r.cellules
        .map((x) => `<span class="pr-cel pr-${x.etat}" title="Exercice ${echapper(x.numero)} : ${MOTS[x.etat]}">${SYMBOLES[x.etat]}</span>`)
        .join('');
      h +=
        `<tr data-cle="${echapper(e.cle)}"><th scope="row"><button type="button" class="pr-lien-equipe" data-cle="${echapper(e.cle)}">${echapper(nomEquipe(e))}</button>` +
        `<span class="pr-sous">${e.classe ? echapper(e.classe) + ' · ' : ''}${r.reussis} réussi(s) sur ${r.total}${r.defisReussis ? ' + défi' : ''}</span></th>` +
        `<td><span class="pr-cellules" role="img" aria-label="${r.reussis} exercices réussis sur ${r.total}${r.enCours ? ', exercice ' + echapper(r.enCours) + ' en cours' : ''}">${cellules}</span></td>` +
        `<td class="pr-nombre">${r.indices}</td>` +
        `<td>${r.dernierEnvoi ? `${echapper(r.dernierEnvoi.numero)} · ${A.ilYa(r.dernierEnvoi.date)}` : 'Aucun envoi'}</td>` +
        `<td>${A.ilYa(r.derniereActivite)}</td>` +
        r.evaluation.competences.map((k) => `<td>${k.niveau ? `<span class="pr-niveau pr-niveau-${k.niveau}" title="${A.nomNiveau(k.niveau)}${k.force ? ' (forcé)' : ''}">${k.niveau}${k.force ? '*' : ''}</span>` : '—'}</td>`).join('') +
        `<td class="pr-nombre">${nombreFr(r.evaluation.note)}</td>` +
        `<td><span class="pr-etat-equipe pr-etat-${r.etat.cle}">${r.etat.cle === 'bloquee' ? '⚠ ' : ''}${echapper(r.etat.texte)}</span></td></tr>`;
    }
    $('.pr-tableau').innerHTML = h + '</tbody>';
  }

  function dessinerFiche() {
    const e = etat.equipes.find((x) => x.cle === etat.equipe);
    const r = resumer(e);
    const reg = reglagesDe(e);
    const ex = e.donnees.programmation.exercices;
    const options = (k) =>
      `<option value="">Calculé${k.calcule ? ` : ${k.calcule} · ${A.nomNiveau(k.calcule)}` : ' : pas évalué'}</option>` +
      A.NIVEAUX_COMPETENCE.map((n) => `<option value="${n.v}"${k.force === n.v ? ' selected' : ''}>Forcer : ${n.v} · ${n.pronote}</option>`).join('');
    let h =
      '<div class="pr-fiche-tete"><button type="button" class="btn-secondaire pr-retour">← Classe</button>' +
      `<div><h1>${echapper(nomEquipe(e))}</h1><p class="pr-chemin">${e.classe ? 'Classe ' + echapper(e.classe) + ' · ' : ''}${echapper(e.nom)} · ${r.reussis} réussi(s) sur ${r.total} · ${echapper(r.etat.texte)}</p></div></div>` +
      '<div class="pr-fiche-grille">' +
      '<section class="carte ed-carte"><div class="ed-carte-tete"><h3>Compétences</h3><span class="ed-aide">Programme de technologie du cycle 4 (BO 2024)</span></div>' +
      '<table class="pr-competences"><tbody>' +
      r.evaluation.competences
        .map(
          (k) =>
            `<tr><th scope="row"><b>${k.code}</b> ${echapper(k.libelle)}<span class="pr-sous">${k.exercices.length} exercice(s) attendu(s)${k.moyenne !== null ? ` · réussite ${Math.round(k.moyenne * 100)} %` : ''}</span></th>` +
            `<td>${k.niveau ? `<span class="pr-niveau pr-niveau-${k.niveau}">${k.niveau}</span> ${A.nomNiveau(k.niveau)}` : '—'}</td>` +
            `<td><select class="pr-forcer" data-code="${k.code}" aria-label="Niveau ${k.code}">${options(k)}</select></td></tr>`,
        )
        .join('') +
      `</tbody></table><p class="pr-note">Note : <b>${nombreFr(r.evaluation.note)}</b> / 20 <span class="ed-aide">(moyenne des niveaux × 5)</span></p>` +
      `<label>Commentaire du professeur<textarea class="pr-commentaire" rows="3" placeholder="Visible dans l’export et dans le Carnet de classe.">${echapper(reg.commentaire)}</textarea></label></section>` +
      '<section class="carte ed-carte"><div class="ed-carte-tete"><h3>Exercices</h3><span class="ed-aide">« Voir » ouvre le programme de l’équipe dans le simulateur (lecture seule).</span></div>' +
      '<table class="pr-exercices"><thead><tr><th scope="col">Exercice</th><th scope="col">État</th><th scope="col">Vérifications</th><th scope="col">Indices</th><th scope="col">Temps</th><th scope="col">Carte</th><th scope="col"></th></tr></thead><tbody>';
    for (const x of e.paquet.exercices) {
      const p = ex[x.id];
      const st = A.etat(e.donnees, e.paquet, x.id);
      const envois = p ? (p.historique || []).filter((y) => y.type === 'envoi' && y.reussi) : [];
      const minutes = p ? Math.round((p.tempsPasseSecondes || 0) / 60) : 0;
      h +=
        `<tr><th scope="row">${echapper(x.numero)} · ${echapper(x.titre)}${x.defi ? ' <span class="pr-sous">défi</span>' : ''}<span class="pr-sous">${echapper(A.competenceDe(x))}</span></th>` +
        `<td><span class="pr-cel pr-${st}">${SYMBOLES[st]}</span> ${MOTS[st]}</td>` +
        `<td class="pr-nombre">${p ? p.tentatives : 0}</td><td class="pr-nombre">${p ? p.indicesOuverts : 0}</td>` +
        `<td class="pr-nombre">${minutes ? minutes + ' min' : '—'}</td>` +
        `<td>${envois.length ? `${envois.length} envoi(s)` : '—'}</td>` +
        `<td>${p && p.programme ? `<button type="button" class="btn-secondaire pr-voir" data-id="${echapper(x.id)}">Voir</button>` : ''}</td></tr>`;
    }
    h += '</tbody></table></section></div>';
    const fiche = $('.pr-fiche');
    fiche.innerHTML = h;
    $('.pr-retour', fiche).onclick = () => {
      etat.vue = 'classe';
      dessiner();
    };
    for (const s of $$('.pr-forcer', fiche)) {
      s.onchange = () => {
        const r2 = (etat.prof.equipes[e.cle] = Object.assign({ forces: {}, commentaire: '' }, etat.prof.equipes[e.cle]));
        if (s.value) r2.forces[s.dataset.code] = Number(s.value);
        else delete r2.forces[s.dataset.code];
        reglagesModifies();
        dessinerFiche();
      };
    }
    $('.pr-commentaire', fiche).oninput = (evt) => {
      const r2 = (etat.prof.equipes[e.cle] = Object.assign({ forces: {}, commentaire: '' }, etat.prof.equipes[e.cle]));
      r2.commentaire = evt.target.value;
      reglagesModifies();
    };
    for (const b of $$('.pr-voir', fiche)) b.onclick = () => voirProgramme(e, b.dataset.id);
  }

  // Programme d'un exercice, dans l'écran d'exercice de Labo Blocs (lecture seule : rien n'est enregistré).
  function voirProgramme(e, id) {
    const dlg = $('.pr-programme');
    let l = etat.lecteurs.get(e.cle);
    if (!l || l.modifieLe !== e.modifieLe) {
      const hote = document.createElement('div');
      hote.className = 'pr-programme-hote';
      $('.pr-programme-hote', dlg).replaceWith(hote);
      const session = A.creerSession({ donnees: JSON.parse(JSON.stringify(e.donnees)), lecture: true });
      A.relierParcours(session.donnees, e.paquet);
      const ecran = A.monterExercice(hote, {
        session,
        paquet: e.paquet,
        projet: { titre: `${nomEquipe(e)} · programme de l’équipe`, accent: '#14213D' },
        toutDebloquer: true,
        retour: { texte: 'Fermer', action: () => dlg.close() },
      });
      l = { ecran, hote, modifieLe: e.modifieLe };
      etat.lecteurs.set(e.cle, l);
    } else if ($('.pr-programme-hote', dlg) !== l.hote) $('.pr-programme-hote', dlg).replaceWith(l.hote);
    dlg.showModal();
    l.ecran.ouvrir(id, e.donnees.programmation.exercices[id].programme);
    $('.equipe-texte', l.hote).textContent = `Équipe ${nomEquipe(e)} · lecture seule, rien n’est enregistré`;
  }

  // ---------- Exports ----------
  function telecharger(nom, texte, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texte], { type }));
    a.download = nom;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function resultats() {
    const paquet = paquetPrincipal();
    return A.resultatsClasse(etat.equipes, etat.prof, { projet: { id: (A.projet && A.projet.id) || paquet.id, titre: (A.projet && A.projet.titre) || paquet.titre }, paquet });
  }
  function nomExport(ext) {
    const classes = [...new Set(etat.equipes.map((e) => e.classe).filter(Boolean))].join('-') || 'classe';
    const jour = new Date().toISOString().slice(0, 10);
    return `labo-blocs-${paquetPrincipal().id}-${classes}-${jour}.${ext}`.replace(/\s+/g, '_');
  }

  // ---------- Démarrage ----------
  async function demarrerProfesseur() {
    for (const el of $$('[data-icone]')) el.outerHTML = A.icone(el.dataset.icone, { epaisseur: el.dataset.epaisseur });
    for (const p of A.parcoursDefinis) if (!A.controler(p).length) paquets.push(A.preparer(p));
    const q = new URLSearchParams(location.search);
    if (q.get('parcours')) paquets.sort((a, b) => (a.id === q.get('parcours') ? -1 : b.id === q.get('parcours') ? 1 : 0));
    else if (A.projet) paquets.sort((a, b) => (a.id === A.projet.parcours ? -1 : b.id === A.projet.parcours ? 1 : 0));
    $('.pr-projet').textContent = `Suivi de classe · ${(A.projet && A.projet.titre) || paquets[0].titre}`;
    document.title = `Suivi de classe — ${(A.projet && A.projet.titre) || 'Labo Blocs'}`;

    const peutDossier = 'showDirectoryPicker' in global;
    const ouvrir = $('.pr-ouvrir');
    // Réglages du collège (liste commune) appliqués au projet.
    if (A.projet && A.projetAvecCollege) A.projet = A.projetAvecCollege(A.projet);
    // Exemple du dossier d'une classe, d'après les réglages du projet (dossier des équipes sans « {equipe} »).
    const chemin = A.projet && A.projet.cheminSauvegarde;
    if (chemin && chemin.length > 1) {
      const classe = (A.projet.classes && A.projet.classes[0]) || '5A';
      // À partir du dossier de la classe (« Bureau › Classe » avant lui n'aide pas à reconnaître le dossier).
      const debut = Math.max(0, chemin.indexOf('{classe}'));
      const dossier = chemin.slice(debut, chemin.indexOf('{equipe}') >= 0 ? chemin.indexOf('{equipe}') : chemin.length).map((x) => x.replace('{classe}', classe));
      const court = dossier.length > 2 ? [dossier[0], '…', dossier[dossier.length - 1]] : dossier;
      ouvrir.querySelector('span').textContent = `Ex. ${court.join(' › ')}. Relu toutes les 30 secondes (Chrome, Edge).`;
    }
    if (!peutDossier) {
      ouvrir.disabled = true;
      ouvrir.querySelector('span').textContent = 'Avec Chrome ou Edge seulement. Ici : importe les fichiers des équipes.';
    }
    ouvrir.onclick = async () => {
      try {
        await ouvrirDossier(await global.showDirectoryPicker({ id: 'labo-blocs-classe', mode: 'readwrite' }));
      } catch {
        // fenêtre fermée
      }
    };
    const connu = peutDossier ? await memorise() : null;
    if (connu) {
      $('.pr-reprendre').hidden = false;
      $('.pr-reprendre-nom').textContent = connu.name;
      $('.pr-reprendre').onclick = () => ouvrirDossier(connu);
    }
    for (const entree of $$('.pr-fichiers')) {
      entree.onchange = async () => {
        await importer(await lireFichiers([...entree.files]));
        entree.value = '';
      };
    }
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', async (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files.length) await importer(await lireFichiers([...e.dataTransfer.files]));
    });
    $('.pr-actualiser').onclick = () => actualiser().then(() => message('Classe relue.'));
    $('.pr-btn-changer').onclick = () => {
      clearInterval(actualiser.minuteur);
      Object.assign(etat, { dossier: null, fichiersDossier: [], fichiersImportes: [], equipes: [], vue: 'accueil' });
      erreurAccueil('');
      dessiner();
    };
    $('.pr-choix-objectif').onchange = (evt) => {
      etat.prof.objectif = evt.target.value ? Number(evt.target.value) : null;
      reglagesModifies();
      dessiner();
    };
    $('.pr-tableau').onclick = (evt) => {
      const b = evt.target.closest('[data-cle]');
      if (!b) return;
      etat.equipe = b.dataset.cle;
      etat.vue = 'fiche';
      dessiner();
      scrollTo(0, 0);
    };
    $('.pr-csv').onclick = () => {
      telecharger(nomExport('csv'), A.csvResultats(resultats()), 'text/csv;charset=utf-8');
      message('Le tableau (.csv) est dans tes téléchargements.');
    };
    $('.pr-carnet').onclick = () => {
      telecharger(nomExport('labo-resultats.json'), JSON.stringify(resultats(), null, 2) + '\n', 'application/json');
      message('Fichier pour le Carnet de classe téléchargé : Carnet › projet › Notes › « Importer des résultats Labo Blocs ».', 6000);
    };
    dessiner();
  }

  A.demarrerProfesseur = demarrerProfesseur;
})(this);
