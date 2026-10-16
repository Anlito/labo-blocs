// A4 · Écran d'exercice (repris de l'atelier) : consigne en bandeau, composants, indices, éditeur de blocs, code Arduino
// (niveau 3), simulateur, vérification et son résultat (A5).
(function (global) {
  'use strict';

  const A = global.LaboBlocs;
  const $ = (sel, racine) => (racine || document).querySelector(sel);
  const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ---------- Consigne ----------

  // Souligne la première apparition de chaque mot du lexique.
  function souligner(texteEchappe, lexique, dejaVus) {
    const formes = [];
    lexique.forEach((entree, i) => (entree.formes || []).forEach((f) => formes.push({ f, i })));
    formes.sort((a, b) => b.f.length - a.f.length);
    if (!formes.length) return texteEchappe;
    const motif = new RegExp('(?<![\\p{L}\\d])(' + formes.map((x) => x.f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\p{L}\\d])', 'gu');
    return texteEchappe.replace(motif, (m) => {
      const x = formes.find((y) => y.f === m);
      if (!x || dejaVus.has(x.i)) return m;
      dejaVus.add(x.i);
      return `<button type="button" class="mot-cle" data-mot="${x.i}">${m}</button>`;
    });
  }

  // Les broches (D3, P0, A1) en pastille, comme dans la maquette.
  const broches = (html) => html.replace(/(?<![\p{L}\d>])([DPA]\d{1,2})(?![\p{L}\d])/gu, '<span class="broche">$1</span>');

  // Mots qui construisent le programme, mis en évidence (comme les blocs « Décisions » et « Boucles »).
  const STRUCTURE = /(?<![\p{L}\d])(sinon|si|alors|tant que|répéter|jusqu’à|jusqu'à|quand)(?![\p{L}\d])/giu;
  // Dans du HTML : seulement le texte, jamais l'intérieur des balises.
  const marquerStructure = (html) =>
    html
      .split(/(<[^>]+>)/)
      .map((morceau) => (morceau.startsWith('<') ? morceau : morceau.replace(STRUCTURE, '<strong class="mot-structure">$1</strong>')))
      .join('');

  // Une phrase « si … alors … sinon … » est coupée comme les blocs : chaque « si » commence une ligne,
  // « alors » et « sinon » vont à la ligne, en retrait.
  function decouper(phrase) {
    const coupe = /(?<![\p{L}\d])(sinon|si|alors)(?![\p{L}\d])/giu;
    const morceaux = [];
    let debut = 0;
    let niveau = 0;
    for (const m of phrase.matchAll(coupe)) {
      if (m.index > debut && phrase.slice(debut, m.index).trim()) morceaux.push({ texte: phrase.slice(debut, m.index).trim(), niveau });
      if (m.index > debut || !morceaux.length) debut = m.index;
      niveau = m[1].toLowerCase() === 'si' ? 0 : 1;
    }
    morceaux.push({ texte: phrase.slice(debut).trim(), niveau });
    return morceaux.filter((x) => x.texte);
  }

  function consigneHtml(texte, lexique) {
    const vus = new Set();
    const rendre = (t) => marquerStructure(broches(souligner(echapper(t), lexique, vus)));
    let html = '';
    let etiquettes = [];
    const vider = () => {
      if (etiquettes.length) html += `<div class="consigne-etiquettes">${etiquettes.join('')}</div>`;
      etiquettes = [];
    };
    for (const l of texte.split('\n')) {
      if (/^\s*-\s/.test(l)) etiquettes.push(`<span class="consigne-etiquette">${rendre(l.replace(/^\s*-\s/, ''))}</span>`);
      else {
        vider();
        const morceaux = decouper(l);
        if (morceaux.length > 1) html += `<p class="consigne-structure">${morceaux.map((m) => `<span class="consigne-ligne niveau-${m.niveau}">${rendre(m.texte)}</span>`).join('')}</p>`;
        else html += `<p>${rendre(l)}</p>`;
      }
    }
    vider();
    return html;
  }

  const NOMS_COMPOSANTS = { led: 'LED', bouton: 'Bouton', servo: 'Servomoteur', buzzer: 'Buzzer' };
  const ICONES_COMPOSANTS = { led: 'lumiere', bouton: 'bouton', servo: 'moteur', buzzer: 'son' };

  // contexte : { session, paquet, toutDebloquer, majBandeau(exercice), solution (bouton « Solution » du mode enseignant),
  //   actionsReussite(exercice) → [{ texte, principal, action }] (boutons ajoutés au message de réussite, ex. envoi dans
  //   la carte du projet) }
  function creerEcranExercice(contexte) {
    const { session, paquet } = contexte;
    const D = session.donnees;
    const exercices = paquet.exercices;
    const lexique = paquet.lexique || [];
    const lecture = !!session.lecture;
    const opts = { toutDebloquer: !!contexte.toutDebloquer };
    A.fiches = paquet.fiches || {};
    A.lexique = lexique;

    const etat = { exercice: null, mode: 'arrete', vitesse: 1, sim: null, servos: {}, rejeu: null, niveau: 1, boutonsAvant: null };
    const ecran = $('.ecran-exercice');

    const editeur = A.creerEditeur($('.editeur', ecran), {
      modifie() {
        if (etat.mode !== 'arrete') arreter();
        fermerResultat();
        programmeModifie();
        majCode();
      },
      zoom(pourcent) {
        $('.zoom-valeur', ecran).textContent = pourcent + ' %';
      },
    });
    let vue = null;

    // ----- Aides : indices, fiche « À savoir », lexique -----

    const aides = A.creerAides({
      indicesOuverts: () => A.progressionExercice(D, etat.exercice.id).indicesOuverts,
      ouvrirIndice(niveau) {
        A.noterIndice(D, etat.exercice.id, niveau);
        majIndices();
        session.aEnregistrer(true, true);
      },
    });
    function majIndices() {
      const n = A.progressionExercice(D, etat.exercice.id).indicesOuverts;
      $('.compteur-indices', ecran).textContent = `${n} sur 3 utilisés`;
      $('.texte-indice', ecran).textContent = n >= 3 ? 'Revoir les indices' : n ? `Revoir · ouvrir l’indice ${n + 1}` : 'Ouvrir l’indice 1';
    }
    // Mots du lexique déjà rencontrés : ceux des consignes des exercices ouverts par l'équipe.
    function motsVus() {
      const vus = new Set();
      for (const ex of exercices) {
        if (!D.programmation.exercices[ex.id]) continue;
        lexique.forEach((entree, i) => {
          if ((entree.formes || []).some((forme) => A.contientMot(ex.consigne, forme))) vus.add(i);
        });
      }
      return vus;
    }
    const lexiqueComplet = A.creerLexique(motsVus);
    // Pastille « ? » des blocs « Au démarrage » et « Répéter indéfiniment ».
    A.surAideChapeau = () => {
      fermerResultat();
      aides.explication('demarrage-boucle');
    };
    $('[data-aide="fiche"]', ecran).addEventListener('click', () => aides.fiche());
    $('[data-aide="indice"]', ecran).addEventListener('click', () => aides.indice());
    $('.btn-lexique', ecran).addEventListener('click', () => lexiqueComplet.ouvrir());

    // ----- Ouverture d'un exercice -----

    // programme : sauvegarde Blockly ou programme à montrer à la place de celui de l'équipe (lecture par le professeur).
    function ouvrir(ex, programme) {
      if (!A.estDebloque(D, paquet, ex.id, opts)) return false;
      if (etat.exercice) A.noterProgramme(D, etat.exercice.id, editeur.sauvegarder());
      A.aideLed = !!ex.aideLed; // menu de la LED : « HAUT (1) : allumée » pendant les premiers exercices
      arreter();
      fermerResultat();
      fermerBulle();
      etat.exercice = ex;
      $('.consigne-numero', ecran).textContent = (ex.defi ? 'Défi · ' : '') + 'Exercice ' + ex.numero;
      $('.titre-exercice', ecran).textContent = ex.titre;
      document.title = `Exercice ${ex.numero} · ${ex.titre} — ${A.projet.titre}`;
      $('.consigne-texte', ecran).innerHTML = consigneHtml(ex.consigne, lexique);
      $('.consigne', ecran).classList.toggle('longue', ex.consigne.length > 300);
      // Beaucoup de composants (exercice 13) : le simulateur prend plus de place.
      ecran.classList.toggle('beaucoup', (ex.composants || []).length > 4);
      $('.liste-composants', ecran).innerHTML = (ex.composants || [])
        .map(
          (c) =>
            `<li><span class="composant-pastille composant-${c.type}">${A.icone(ICONES_COMPOSANTS[c.type] || 'info', { epaisseur: 2.4 })}</span>` +
            `<span>${echapper(NOMS_COMPOSANTS[c.type] || c.type)}${c.nom ? ' ' + echapper(c.nom) : ''} <span class="broche">${echapper(c.broche)}</span></span></li>`,
        )
        .join('');
      const avant = A.progressionExercice(D, ex.id);
      const statutAvant = avant.statut;
      editeur.charger(ex, programme ? (programme.blocks ? programme : A.versBlockly(programme)) : avant.programme);
      vue = A.creerVueSimulateur($('.simulateur', ecran), ex, { basculerBouton });
      niveauDeLExercice(ex);
      afficher();
      A.noterOuverture(D, ex.id);
      aides.changerExercice(ex);
      majIndices();
      majCode();
      if (avant.aReverifier) montrerRevoir();
      if (contexte.majBandeau) contexte.majBandeau(ex);
      // Rouvrir un exercice déjà commencé n'est pas un travail à enregistrer.
      if (A.progressionExercice(D, ex.id).statut !== statutAvant) session.aEnregistrer(true);
      return true;
    }

    // ----- Consigne : bulle de définition -----

    let motOuvert = null;
    $('.consigne-texte', ecran).addEventListener('click', (e) => {
      const mot = e.target.closest('.mot-cle');
      if (!mot) return;
      if (motOuvert === mot.dataset.mot) return fermerBulle();
      motOuvert = mot.dataset.mot;
      const entree = lexique[Number(motOuvert)];
      const bulle = $('.bulle', ecran);
      $('.bulle-mot', bulle).textContent = entree.mot;
      $('.bulle-definition', bulle).textContent = entree.definition;
      bulle.hidden = false;
      // Sous le mot cliqué, sans sortir du bandeau de la consigne.
      const cadre = $('.consigne', ecran).getBoundingClientRect();
      const r = mot.getBoundingClientRect();
      bulle.style.left = Math.max(8, Math.min(r.left - cadre.left, cadre.width - bulle.offsetWidth - 8)) + 'px';
      bulle.style.top = r.bottom - cadre.top + 6 + 'px';
      $('.bulle-fermer', bulle).focus();
    });
    $('.bulle-fermer', ecran).addEventListener('click', fermerBulle);
    function fermerBulle() {
      motOuvert = null;
      $('.bulle', ecran).hidden = true;
    }
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !ecran.hidden) {
        fermerBulle();
        aides.fermer();
      }
    });

    // ----- Colonnes repliables : plus de place pour le programme (choix gardé sur ce poste) -----

    const CLE_COLONNES = 'labo-blocs-colonnes';
    const replie = { gauche: false, droite: false, consigne: false };
    try {
      Object.assign(replie, JSON.parse(localStorage.getItem(CLE_COLONNES)) || {});
    } catch {
      /* stockage indisponible : tout est déplié */
    }
    function majColonnes() {
      for (const cote of ['gauche', 'droite']) {
        ecran.classList.toggle('replie-' + cote, !!replie[cote]);
        const nom = cote === 'gauche' ? 'les composants et l’aide' : 'le simulateur';
        for (const b of ecran.querySelectorAll(`.btn-plier[data-colonne="${cote}"]`)) {
          b.setAttribute('aria-expanded', String(!replie[cote]));
          $('.texte-plier', b).textContent = (replie[cote] ? 'Afficher ' : 'Replier ') + nom;
          b.title = replie[cote] ? `Afficher ${nom}` : `Replier ${nom} pour agrandir le programme`;
          const icone = b.querySelector('.icone');
          const vers = (cote === 'gauche') === !replie[cote] ? 'chevronGauche' : 'chevronDroite';
          if (icone) icone.outerHTML = A.icone(vers, { epaisseur: 2.8 });
        }
      }
      // Texte de la consigne masqué : il reste le titre, « À savoir » et « Lexique ».
      $('.consigne', ecran).classList.toggle('reduite', !!replie.consigne);
      const bouton = $('.btn-reduire-consigne', ecran);
      bouton.setAttribute('aria-expanded', String(!replie.consigne));
      $('.texte-reduire', bouton).textContent = replie.consigne ? 'Afficher le texte' : 'Masquer le texte';
      if (replie.consigne) fermerBulle();
    }
    function basculerColonne(cote) {
      replie[cote] = !replie[cote];
      try {
        localStorage.setItem(CLE_COLONNES, JSON.stringify(replie));
      } catch {
        /* rien */
      }
      majColonnes();
    }
    for (const b of ecran.querySelectorAll('.btn-plier, .bande-repliee')) b.addEventListener('click', () => basculerColonne(b.dataset.colonne));
    $('.btn-reduire-consigne', ecran).addEventListener('click', () => basculerColonne('consigne'));
    majColonnes();

    // ----- Niveaux : 3 = code Arduino en lecture seule, relié aux blocs -----

    function choisirNiveau(n) {
      etat.niveau = n;
      for (const b of ecran.querySelectorAll('.btn-niveau')) b.setAttribute('aria-pressed', String(Number(b.dataset.niveau) === n));
      $('.code-arduino', ecran).hidden = n !== 3;
      ecran.classList.toggle('avec-code', n === 3);
      majCode();
    }
    for (const b of ecran.querySelectorAll('.btn-niveau')) b.addEventListener('click', () => choisirNiveau(Number(b.dataset.niveau)));
    // Niveau choisi par le professeur pour l'exercice (ex.niveau), éventuellement verrouillé (évaluation).
    function niveauDeLExercice(ex) {
      if (ex.niveau) choisirNiveau(Number(ex.niveau));
      for (const b of ecran.querySelectorAll('.btn-niveau')) {
        const autre = Number(b.dataset.niveau) !== Number(ex.niveau);
        b.disabled = !!ex.niveauVerrouille && autre;
        b.title = b.disabled ? 'Ton professeur a choisi le niveau de cet exercice.' : '';
      }
      $('.niveaux-libelle', ecran).textContent = ex.niveauVerrouille ? 'Niveau imposé' : 'Niveau';
    }
    let code = null;
    let blocChoisi = null;
    function majCode() {
      if (etat.niveau !== 3 || !etat.exercice) return;
      try {
        code = A.versArduino(editeur.lire().programme, { titre: `Exercice ${etat.exercice.numero} · ${etat.exercice.titre}`, boutonsVersMasse: etat.exercice.boutonsVersMasse });
      } catch {
        code = null;
      }
      dessinerCode();
    }
    function dessinerCode() {
      const zone = $('.code-lignes', ecran);
      if (!code) {
        zone.textContent = '';
        return;
      }
      const plage = blocChoisi && code.lignes[blocChoisi];
      zone.innerHTML = code.code
        .replace(/\n$/, '')
        .split('\n')
        .map((l, i) => `<span class="ligne${plage && i + 1 >= plage[0] && i + 1 <= plage[1] ? ' surlignee' : ''}">${echapper(l) || ' '}</span>`)
        .join('');
      const premiere = zone.querySelector('.surlignee');
      if (premiere) premiere.scrollIntoView({ block: 'nearest' });
    }
    editeur.ws.addChangeListener((e) => {
      if (e.type !== global.Blockly.Events.SELECTED) return;
      blocChoisi = e.newElementId || null;
      if (etat.niveau === 3) dessinerCode();
    });

    // ----- Modes : seulement ceux que le parcours propose (direct et carte : jalons 3 et 4) -----

    const modes = paquet.modes || ['simulateur'];
    for (const b of ecran.querySelectorAll('.btn-mode')) b.hidden = !modes.includes(b.dataset.mode);
    ecran.querySelector('.modes').hidden = modes.length < 2;

    // ----- Simulation -----

    function nouvelleSimulation() {
      const { programme } = editeur.lire();
      etat.sim = A.creerSimulation(programme, { composants: etat.exercice.composants, boutonsVersMasse: etat.exercice.boutonsVersMasse });
      etat.servos = {};
      etat.rejeu = null;
      $('.simu-note', ecran).textContent = '';
    }
    function lancer() {
      if (etat.mode === 'pause') etat.mode = 'marche';
      else if (etat.mode === 'arrete') {
        nouvelleSimulation();
        etat.mode = 'marche';
      }
      majCommandes();
    }
    function pause() {
      if (etat.mode === 'marche') etat.mode = 'pause';
      majCommandes();
    }
    function pasAPas() {
      if (etat.mode === 'arrete') nouvelleSimulation();
      etat.mode = 'pause';
      appliquerBoutonsAvant();
      etat.sim.pas();
      afficher();
      majCommandes();
    }
    function recommencer() {
      nouvelleSimulation();
      etat.mode = 'marche';
      majCommandes();
    }
    function arreter() {
      etat.mode = 'arrete';
      etat.sim = null;
      etat.servos = {};
      etat.rejeu = null;
      $('.simu-note', ecran).textContent = '';
      majCommandes();
      afficher();
    }
    function appliquerBoutonsAvant() {
      if (!etat.boutonsAvant || !etat.sim) return;
      for (const [b, v] of Object.entries(etat.boutonsAvant)) etat.sim.changerEntree(b, v);
      etat.boutonsAvant = null;
    }
    function basculerBouton(broche) {
      if (etat.rejeu) return;
      if (!etat.sim) {
        // Simulation arrêtée : on garde l'appui, il servira au lancement.
        etat.boutonsAvant = etat.boutonsAvant || {};
        etat.boutonsAvant[broche] = etat.boutonsAvant[broche] ? 0 : 1;
      } else etat.sim.changerEntree(broche, etat.sim.entrees[broche] ? 0 : 1);
      afficher();
    }
    function majCommandes() {
      const marche = etat.mode === 'marche';
      const b = $('.btn-lancer', ecran);
      b.classList.toggle('actif', marche);
      b.setAttribute('aria-pressed', String(marche));
      $('.btn-pause', ecran).disabled = !marche;
      $('.btn-recommencer', ecran).disabled = etat.mode === 'arrete';
      for (const v of ecran.querySelectorAll('.btn-vitesse')) v.setAttribute('aria-pressed', String(Number(v.dataset.vitesse) === etat.vitesse));
    }
    $('.btn-lancer', ecran).addEventListener('click', lancer);
    $('.btn-pause', ecran).addEventListener('click', pause);
    $('.btn-pas', ecran).addEventListener('click', pasAPas);
    $('.btn-recommencer', ecran).addEventListener('click', recommencer);
    for (const v of ecran.querySelectorAll('.btn-vitesse')) {
      v.addEventListener('click', () => {
        etat.vitesse = Number(v.dataset.vitesse);
        majCommandes();
      });
    }

    const chrono = (ms) => {
      const s = Math.floor(ms / 1000);
      return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    };

    function afficher(dtVirtuel) {
      if (!vue) return;
      const sim = etat.sim;
      const etats = {};
      for (const c of etat.exercice.composants || []) {
        if (c.type === 'bouton') etats[c.broche] = sim ? sim.entrees[c.broche] || 0 : (etat.boutonsAvant && etat.boutonsAvant[c.broche]) || 0;
        else if (c.type === 'led') etats[c.broche] = sim ? sim.sorties[c.broche] || 0 : 0;
        else if (c.type === 'buzzer') {
          const note = sim && sim.journal.filter((e) => e.broche === c.broche && e.type === 'son').pop();
          etats[c.broche] = note && note.valeur && sim.t < note.t + note.duree ? note.valeur : 0;
        } else {
          // Le bras du servo tourne à vitesse constante (180° en 0,3 s) vers sa consigne.
          const cible = sim ? sim.sorties[c.broche] || 0 : 0;
          const pos = etat.servos[c.broche] === undefined ? 0 : etat.servos[c.broche];
          const pasMax = (dtVirtuel || 0) * A.VITESSE_SERVO;
          etats[c.broche] = etat.servos[c.broche] = Math.abs(cible - pos) <= pasMax ? cible : pos + Math.sign(cible - pos) * pasMax;
          if (!sim) etats[c.broche] = etat.servos[c.broche] = 0;
        }
      }
      vue.afficher(etats, !!sim);
      editeur.surligner(sim ? sim.blocsEnCours : null);
      $('.chrono-valeur', ecran).textContent = chrono(sim ? sim.t : 0);
    }

    let dernier = performance.now();
    function image(maintenant) {
      const dt = Math.min(100, maintenant - dernier);
      dernier = maintenant;
      let dtVirtuel = 0;
      if (etat.mode === 'marche' && etat.sim && !ecran.hidden) {
        appliquerBoutonsAvant();
        dtVirtuel = dt * etat.vitesse;
        let cible = etat.sim.t + dtVirtuel;
        if (etat.rejeu && cible >= etat.rejeu.fin) {
          cible = etat.rejeu.fin;
          etat.mode = 'pause';
          $('.simu-note', ecran).textContent = 'Fin du test : regarde l’état des composants.';
          majCommandes();
        }
        etat.sim.avancerJusqua(cible);
        // Le journal ne sert pas à l'affichage : on évite qu'il grossisse sans fin.
        if (etat.sim.journal.length > 20000) etat.sim.journal.splice(0, 15000);
      }
      if (etat.mode !== 'pause' || dtVirtuel) afficher(dtVirtuel);
      requestAnimationFrame(image);
    }
    requestAnimationFrame(image);

    // ----- Vérification et résultat (A5) -----

    const resultat = $('.resultat', ecran);
    const suivantDe = (ex) => exercices.slice(exercices.indexOf(ex) + 1).find((x) => A.estDebloque(D, paquet, x.id, opts));

    function verifier() {
      fermerBulle();
      aides.fermer();
      const { programme, horsProgramme, incomplets } = editeur.lire();
      const ex = etat.exercice;
      const r = A.valider(ex, programme);
      const notes = [];
      if (horsProgramme.length) notes.push('Un bloc est resté seul, hors du programme : il ne s’exécute pas. Accroche-le dans « Au démarrage » ou « Répéter indéfiniment ».');
      if (incomplets.length) notes.push('Un bloc a une case vide : complète-la.');
      A.noterProgramme(D, ex.id, editeur.sauvegarder());
      A.noterVerification(D, ex, { reussi: r.reussi, message: r.message, programme });
      session.aEnregistrer(true, true);
      if (contexte.majBandeau) contexte.majBandeau(ex);
      resultat.className = 'resultat ' + (r.reussi ? 'reussi' : 'ecart');
      if (r.reussi) {
        const suivant = suivantDe(ex);
        resultat.innerHTML =
          `<div class="resultat-message">${A.icone('coche', { epaisseur: 2.8 })}<div><strong>Ton programme fait ce qu’on attend.</strong>` +
          (suivant ? `<span>L’exercice ${echapper(suivant.numero)} est ouvert.</span>` : '<span>Tu as fini le parcours. Bravo !</span>') +
          (session.handle || lecture ? '' : '<span class="resultat-note">Pense à enregistrer ton travail dans le dossier de ton équipe.</span>') +
          '</div></div><div class="resultat-actions">' +
          (suivant ? `<button type="button" class="btn-principal btn-suivant">Exercice suivant${A.icone('suivant', { epaisseur: 2.8 })}</button>` : '') +
          `<button type="button" class="btn-secondaire btn-rester">${suivant ? 'Rester sur cet exercice' : 'Fermer'}</button></div>`;
        if (suivant) $('.btn-suivant', resultat).addEventListener('click', () => ouvrir(suivant));
        // Actions propres au projet (ex. « Envoyer dans la carte Arduino » après l'exercice 13).
        const actions = (contexte.actionsReussite && contexte.actionsReussite(ex)) || [];
        for (const a of actions.slice().reverse()) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = a.principal ? 'btn-principal' : 'btn-secondaire';
          b.textContent = a.texte;
          b.addEventListener('click', a.action);
          $('.resultat-actions', resultat).prepend(b);
        }
        $('.btn-rester', resultat).addEventListener('click', fermerResultat);
      } else {
        resultat.innerHTML =
          `<div class="resultat-message">${A.icone('info', { epaisseur: 2.4 })}<div><span>${echapper(r.message)}</span>` +
          notes.map((n) => `<span class="resultat-note">${echapper(n)}</span>`).join('') +
          '</div></div><div class="resultat-actions">' +
          `<button type="button" class="btn-secondaire btn-voir-test">${A.icone('oeil')}Voir le test</button></div>`;
        $('.btn-voir-test', resultat).addEventListener('click', () => rejouer(r));
      }
      resultat.hidden = false;
      resultat.scrollIntoView({ block: 'nearest' });
    }
    function montrerRevoir() {
      resultat.className = 'resultat ecart';
      resultat.innerHTML = `<div class="resultat-message">${A.icone('alerte', { epaisseur: 2.4 })}<div><span>Cet exercice a été modifié par ton professeur. Tes blocs sont gardés : relance la vérification.</span></div></div>`;
      resultat.hidden = false;
    }

    // Rejoue le test raté dans le simulateur : les boutons s'appuient tout seuls.
    function rejouer(r) {
      fermerResultat();
      nouvelleSimulation();
      etat.boutonsAvant = null;
      for (const e of r.entrees) etat.sim.planifierEntree(e.t, e.broche, e.valeur);
      etat.rejeu = { fin: r.temps + 600 };
      etat.mode = 'marche';
      $('.simu-note', ecran).textContent = 'Le test se rejoue : les boutons s’appuient tout seuls.';
      majCommandes();
    }
    function fermerResultat() {
      resultat.hidden = true;
    }
    $('.btn-verifier', ecran).addEventListener('click', verifier);

    // Mode enseignant : remplacer le programme par la solution de référence (démonstration en classe).
    const btnSolution = $('.btn-solution', ecran);
    btnSolution.hidden = !contexte.solution;
    btnSolution.addEventListener('click', () => {
      if (!etat.exercice || !confirm('Remplacer le programme affiché par la solution de référence ?')) return;
      arreter();
      editeur.charger(etat.exercice, A.versBlockly(etat.exercice.solutionReference));
      majCode();
    });

    // ----- Outils de l'espace de travail -----

    $('.btn-annuler', ecran).addEventListener('click', editeur.annuler);
    $('.btn-retablir', ecran).addEventListener('click', editeur.retablir);
    $('.btn-zoom-moins', ecran).addEventListener('click', () => editeur.zoomer(-1));
    $('.btn-zoom-plus', ecran).addEventListener('click', () => editeur.zoomer(1));
    $('.btn-recentrer', ecran).addEventListener('click', editeur.recentrer);

    // ----- Enregistrement -----

    let minuteurSecours = null;
    function programmeModifie() {
      clearTimeout(minuteurSecours);
      minuteurSecours = setTimeout(() => session.aEnregistrer(false), 800);
    }
    // Avant chaque écriture, le programme affiché est rangé dans les données de l'équipe.
    session.surAvantEcriture(() => {
      if (etat.exercice && !ecran.hidden) A.noterProgramme(D, etat.exercice.id, editeur.sauvegarder());
    });
    // Temps passé : seulement l'activité réelle (onglet visible et actif).
    setInterval(() => {
      if (etat.exercice && !ecran.hidden && document.visibilityState === 'visible' && document.hasFocus()) A.ajouterTemps(D, etat.exercice.id, 1);
    }, 1000);

    function quitter() {
      if (etat.exercice) A.noterProgramme(D, etat.exercice.id, editeur.sauvegarder());
      arreter();
      aides.fermer();
    }

    choisirNiveau(1);
    majCommandes();
    return { ouvrir, quitter, editeur, etat, arreter };
  }

  Object.assign(A, { creerEcranExercice });
})(this);
