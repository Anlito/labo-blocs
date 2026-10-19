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
        if (etat.exercice && etat.exercice.libre) majComposantsLibres();
      },
      zoom(pourcent) {
        $('.zoom-valeur', ecran).textContent = pourcent + ' %';
      },
    });
    let vue = null;

    // ----- Caméra et IA (exercices avec « camera » : étiquettes à apprendre, blocs de la caméra) -----
    const panneauCamera = A.creerPanneauCamera
      ? A.creerPanneauCamera($('.camera-ia', ecran), {
          lecture,
          donnees: () => A.lireCamera(D),
          enregistrer(camera) {
            A.noterCamera(D, camera);
            session.aEnregistrer(true, true);
          },
          // Étiquettes créées ou renommées par l'équipe : les blocs déjà posés affichent les nouveaux noms.
          surEtiquettes() {
            const Blockly = global.Blockly;
            Blockly.Events.disable();
            try {
              for (const b of editeur.ws.getAllBlocks(false)) {
                const f = b.getField('ETIQUETTE');
                if (!f) continue;
                f.getOptions(false);
                if (f.doValueUpdate_) f.doValueUpdate_(f.getValue());
                if (f.forceRerender) f.forceRerender();
              }
            } finally {
              Blockly.Events.enable();
            }
          },
        })
      : null;

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
      // Exercice libre : une copie dont les composants suivent le programme de l'élève.
      etat.exercice = ex.libre ? Object.assign({}, ex, { composants: [] }) : ex;
      $('.consigne-numero', ecran).textContent = (ex.defi ? 'Défi · ' : '') + 'Exercice ' + ex.numero;
      $('.titre-exercice', ecran).textContent = ex.titre;
      document.title = `Exercice ${ex.numero} · ${ex.titre} — ${A.projet.titre}`;
      $('.consigne-texte', ecran).innerHTML = consigneHtml(ex.consigne, lexique);
      $('.consigne', ecran).classList.toggle('longue', ex.consigne.length > 300);
      const avant = A.progressionExercice(D, ex.id);
      const statutAvant = avant.statut;
      // Étiquettes de la caméra d'abord : les menus des blocs de la caméra les proposent au chargement.
      if (panneauCamera) panneauCamera.ouvrir(ex, {});
      editeur.charger(ex, programme ? (programme.blocks ? programme : A.versBlockly(programme)) : avant.programme);
      const libres = ex.libre ? composantsLibres() : null;
      if (libres) etat.exercice.composants = libres.composants;
      dessinerComposants(libres && libres.conflits);
      vue = A.creerVueSimulateur($('.simulateur', ecran), etat.exercice, { appuyerBouton });
      // Ce que voit la caméra arrive dans les capteurs du simulateur (et du mode « En direct »).
      if (!vue.capteurs) vue.capteurs = {};
      if (panneauCamera) panneauCamera.relier(vue.capteurs);
      // Exercice libre : « J'ai terminé » à la place de « Vérifier » ; ni indice ni solution s'il n'y en a pas.
      $('.btn-verifier:not(.btn-terminer)', ecran).hidden = !!ex.libre;
      $('.btn-terminer', ecran).hidden = !ex.libre || lecture;
      $('.verification', ecran).hidden = !!ex.libre && lecture; // mode enseignant : rien à vérifier ni à terminer
      $('.carte-aide', ecran).hidden = !!ex.libre && !(ex.indices || []).some(Boolean);
      btnSolution.hidden = !contexte.solution || !!ex.libre;
      if (panneauCarte) panneauCarte.choisirProfil(A.profil(ex.carte));
      montrerModes(ex);
      if (vue.verrouillerCapteurs) vue.verrouillerCapteurs(etat.modeTest === 'direct');
      niveauDeLExercice(ex);
      touches.clear();
      verifierClavier();
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

    // ----- Composants : ceux de l'exercice, ou ceux que le programme utilise (exercice libre) -----

    function composantsLibres() {
      const ex = etat.exercice;
      if (ex.carte && ex.carte !== 'uno') return { composants: [], conflits: [] }; // mBot, micro:bit : tout est sur la carte
      return A.composantsDuProgramme(editeur.lire().programme);
    }
    function dessinerComposants(conflits) {
      const ex = etat.exercice;
      // Beaucoup de composants (exercice 13) : le simulateur prend plus de place.
      ecran.classList.toggle('beaucoup', (ex.composants || []).length > 4);
      $('.liste-composants', ecran).innerHTML = (ex.composants || [])
        .map(
          (c) =>
            `<li${c.conflit ? ' class="composant-en-conflit"' : ''}><span class="composant-pastille composant-${c.type}">${A.icone(ICONES_COMPOSANTS[c.type] || 'info', { epaisseur: 2.4 })}</span>` +
            `<span>${echapper(NOMS_COMPOSANTS[c.type] || c.type)}${c.nom ? ' ' + echapper(c.nom) : ''} <span class="broche">${echapper(c.broche)}</span>${c.conflit ? ' <span class="broche-partagee">⚠ broche partagée</span>' : ''}</span></li>`,
        )
        .join('');
      // Ce qui est déjà sur la carte (rien à brancher).
      const surLaCarte = { mbot: 'Sur le robot : moteurs, LED, buzzer, bouton, capteur à ultrasons (port 3) et suiveur de ligne (port 2).', microbit: 'Sur la carte : écran 5 × 5, boutons A et B, logo tactile, haut-parleur et capteurs.' }[ex.carte];
      if (surLaCarte) $('.liste-composants', ecran).insertAdjacentHTML('beforeend', `<li class="composants-carte"><span class="composant-pastille composant-carte">${A.icone('puzzle', { epaisseur: 2.4 })}</span><span>${surLaCarte}</span></li>`);
      const note = $('.composants-note', ecran);
      const liste = conflits || [];
      note.classList.toggle('ecart', liste.length > 0);
      if (liste.length) {
        const nom = (t) => {
          const n = NOMS_COMPOSANTS[t] || t;
          return n === n.toUpperCase() ? n : n.toLowerCase();
        };
        note.textContent =
          liste.map((c) => `La broche ${c.broche} sert à deux composants (${c.types.map(nom).join(' et ')}).`).join(' ') +
          ' Une broche ne peut brancher qu’un seul composant : choisis une autre broche pour l’un d’eux.';
        note.hidden = false;
      } else if (ex.libre && (!ex.carte || ex.carte === 'uno')) {
        note.textContent = ex.composants.length ? 'Les composants suivent ton programme : à brancher sur ces broches.' : 'Pose un bloc (LED, bouton, servomoteur, buzzer) : son composant apparaît ici et dans le simulateur.';
        note.hidden = false;
      } else note.hidden = true;
    }
    // Le programme a changé : si ses composants aussi, la liste et le simulateur suivent.
    function majComposantsLibres() {
      const ex = etat.exercice;
      const r = composantsLibres();
      const avant = JSON.stringify(ex.composants);
      ex.composants = r.composants;
      dessinerComposants(r.conflits);
      if (JSON.stringify(r.composants) === avant || !vue) return;
      vue = A.creerVueSimulateur($('.simulateur', ecran), ex, { appuyerBouton });
      if (!vue.capteurs) vue.capteurs = {};
      if (panneauCamera) panneauCamera.relier(vue.capteurs);
      if (vue.verrouillerCapteurs) vue.verrouillerCapteurs(etat.modeTest === 'direct');
      afficher();
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
    // Le niveau 3 (code Arduino) n'existe que pour l'Arduino Uno.
    function niveauDeLExercice(ex) {
      const avecCode = !ex.carte || ex.carte === 'uno';
      if (ex.niveau) choisirNiveau(Number(ex.niveau));
      if (!avecCode && etat.niveau === 3) choisirNiveau(2);
      for (const b of ecran.querySelectorAll('.btn-niveau')) {
        const autre = Number(b.dataset.niveau) !== Number(ex.niveau);
        const sansCode = !avecCode && b.dataset.niveau === '3';
        b.disabled = (!!ex.niveauVerrouille && autre) || sansCode;
        b.title = sansCode ? 'Le code Arduino n’est montré que pour l’Arduino Uno.' : b.disabled ? 'Ton professeur a choisi le niveau de cet exercice.' : '';
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

    // ----- Modes : ceux que le parcours propose, ou ceux de l'exercice s'il en choisit d'autres -----
    //   simulateur · direct (« En direct » : le programme tourne dans l'ordinateur, la carte obéit) · carte

    // La caméra est dans l'ordinateur : un exercice avec caméra ne se fait pas « Dans la carte ».
    const modesDe = (ex) => ((ex && ex.modes) || paquet.modes || ['simulateur']).filter((m) => !(ex && ex.camera && m === 'carte'));
    const tousLesModes = new Set([paquet.modes || ['simulateur'], ...exercices.map((e) => e.modes || [])].flat());
    etat.modeTest = 'simulateur';
    const sectionTest = $('.simulateur', ecran);
    function montrerModes(ex) {
      const m = modesDe(ex);
      for (const b of ecran.querySelectorAll('.btn-mode')) b.hidden = !m.includes(b.dataset.mode);
      ecran.querySelector('.modes').hidden = m.length < 2;
      if (!m.includes(etat.modeTest)) choisirModeTest('simulateur');
    }
    function choisirModeTest(m) {
      if (m === etat.modeTest) return;
      if (etat.mode !== 'arrete') arreter();
      etat.modeTest = m;
      for (const b of ecran.querySelectorAll('.btn-mode')) b.setAttribute('aria-pressed', String(b.dataset.mode === m));
      sectionTest.classList.toggle('mode-carte', m === 'carte');
      sectionTest.classList.toggle('mode-direct', m === 'direct');
      $('.panneau-carte', ecran).hidden = m === 'simulateur';
      if (vue && vue.verrouillerCapteurs) vue.verrouillerCapteurs(m === 'direct');
      if (panneauCarte) panneauCarte.redessiner();
      $('.simu-note', ecran).textContent = '';
      majCommandes();
    }
    for (const b of ecran.querySelectorAll('.btn-mode')) b.addEventListener('click', () => choisirModeTest(b.dataset.mode));

    // « Dans la carte » : le programme de l'élève, compilé comme pour le simulateur, part dans la carte du parcours.
    // « En direct » : le même panneau connecte la carte ; « Lancer » fait tourner le programme et la carte obéit.
    const panneauCarte = tousLesModes.has('carte') || tousLesModes.has('direct')
      ? A.creerPanneauCarte($('.panneau-carte', ecran), {
          pourDirect: () => etat.modeTest === 'direct',
          surArretDirect: () => arreter(),
          programme() {
            const ex = etat.exercice;
            const prog = editeur.lire().programme;
            // clavier : le programme utilise le clavier de l'ordinateur (il ne part pas dans la carte, voir carte.js).
            return Object.assign(A.codeOctet.compiler(prog, { composants: ex.composants, boutonsVersMasse: ex.boutonsVersMasse }), { clavier: !!(A.utiliseClavier && A.utiliseClavier(prog)) });
          },
          surEnvoi(r) {
            if (lecture || !etat.exercice) return;
            A.noterEnvoi(D, etat.exercice.id, { carte: etat.exercice.carte, reussi: r.ok, octets: r.octets, message: r.message, programme: editeur.lire().programme });
            session.aEnregistrer(true, true);
          },
          surVidage(r) {
            if (lecture || !etat.exercice) return;
            A.noterVidage(D, etat.exercice.id, { carte: etat.exercice.carte, reussi: r.ok });
            session.aEnregistrer(true, true);
          },
        })
      : null;

    // ----- Simulation -----

    function nouvelleSimulation() {
      touches.clear();
      verifierClavier();
      const { programme } = editeur.lire();
      etat.sim = A.creerSimulation(programme, { composants: etat.exercice.composants, boutonsVersMasse: etat.exercice.boutonsVersMasse, carte: etat.exercice.carte, capteurs: vue && vue.capteurs });
      etat.servos = {};
      etat.rejeu = null;
      $('.simu-note', ecran).textContent = '';
    }
    // En direct : le programme tourne au rythme de l'horloge dans l'ordinateur (noyau/direct.js), la carte obéit.
    async function lancerDirect() {
      if (etat.mode === 'direct') return;
      const connexion = A.connexionCarte();
      if (!connexion.carte) {
        $('.simu-note', ecran).textContent = 'Connecte d’abord la carte (au-dessus), puis clique sur « Lancer ».';
        return;
      }
      const ex = etat.exercice;
      if (vue && vue.capteurs && A.capteursDepart) Object.assign(vue.capteurs, A.capteursDepart(ex.carte));
      const direct = A.creerDirect(editeur.lire().programme, { composants: ex.composants, boutonsVersMasse: ex.boutonsVersMasse, carte: ex.carte, capteurs: vue && vue.capteurs });
      etat.sim = direct.sim;
      touches.clear();
      verifierClavier();
      etat.servos = {};
      etat.rejeu = null;
      etat.mode = 'direct';
      $('.simu-note', ecran).textContent = '';
      majCommandes();
      const ok = await connexion.demarrerDirect(direct, { surErreur: () => etat.mode === 'direct' && arreter() });
      if (!ok && etat.mode === 'direct') arreter();
    }
    function lancer() {
      if (etat.modeTest === 'direct') return lancerDirect();
      if (etat.mode === 'pause') etat.mode = 'marche';
      else if (etat.mode === 'arrete') {
        nouvelleSimulation();
        etat.mode = 'marche';
      }
      majCommandes();
    }
    function pause() {
      if (etat.mode === 'direct') return arreter(); // en direct, « Pause » arrête (la carte éteint tout)
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
      if (etat.mode === 'direct') A.connexionCarte().arreterDirect();
      etat.mode = 'arrete';
      etat.sim = null;
      etat.servos = {};
      etat.rejeu = null;
      $('.simu-note', ecran).textContent = '';
      majCommandes();
      afficher();
    }
    // ----- Clavier de l'ordinateur (blocs « quand la touche … », « la touche … est appuyée ») -----
    // Pendant que le programme tourne (simulateur ou « En direct »), les touches de son programme sont pour lui :
    // elles ne font plus défiler la page ni ne cliquent les boutons. Jamais dans un champ de texte, ni avec Ctrl / Alt.
    const touches = new Set();
    let clavierDuProgramme = false;
    function verifierClavier() {
      clavierDuProgramme = !!(etat.exercice && A.utiliseClavier && A.utiliseClavier(editeur.lire().programme));
    }
    function toucher(t, valeur) {
      if (valeur) touches.add(t);
      else touches.delete(t);
      if (etat.sim && !etat.rejeu) etat.sim.changerEntree(A.entreeTouche(t), valeur ? 1 : 0);
      afficherClavier();
    }
    function lacherTouches() {
      for (const t of [...touches]) toucher(t, false);
    }
    function afficherClavier() {
      const p = $('.simu-clavier', ecran);
      p.hidden = !clavierDuProgramme;
      if (p.hidden) return;
      const marche = etat.mode === 'marche' || etat.mode === 'direct';
      const noms = [...touches].map((t) => (A.TOUCHES.find((x) => x[1] === t) || [t])[0]);
      p.textContent = !marche
        ? 'Ton programme utilise le clavier : clique sur « Lancer », puis appuie sur ses touches.'
        : `Clavier de l’ordinateur : ${noms.length ? `touche${noms.length > 1 ? 's' : ''} appuyée${noms.length > 1 ? 's' : ''} : ${noms.join(', ')}` : 'aucune touche appuyée'}.`;
    }
    function ecouterClavier(e, valeur) {
      if (ecran.hidden || !clavierDuProgramme || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = A.toucheDuClavier(e.key);
      const cible = e.target;
      if (!t || (cible && cible.closest && cible.closest('input, textarea, select, [contenteditable="true"], dialog'))) return;
      if (etat.mode !== 'marche' && etat.mode !== 'direct') return;
      e.preventDefault();
      e.stopPropagation();
      if (valeur && e.repeat) return;
      toucher(t, valeur);
    }
    // Phase de capture : avant l'éditeur de blocs (les flèches y déplaceraient le curseur).
    addEventListener('keydown', (e) => ecouterClavier(e, true), true);
    addEventListener('keyup', (e) => ecouterClavier(e, false), true);
    addEventListener('blur', lacherTouches);

    function appliquerBoutonsAvant() {
      if (!etat.boutonsAvant || !etat.sim) return;
      for (const [b, v] of Object.entries(etat.boutonsAvant)) etat.sim.changerEntree(b, v);
      etat.boutonsAvant = null;
    }
    // Bouton poussoir du simulateur : appuyé tant qu'on le tient. Programme arrêté : l'élève est invité à le lancer.
    function appuyerBouton(broche, valeur) {
      if (etat.rejeu) return;
      if (etat.modeTest === 'direct') {
        if (valeur) $('.simu-note', ecran).textContent = 'En direct, appuie sur le vrai bouton : l’écran montre ce que fait la carte.';
        return;
      }
      if (!etat.sim) {
        etat.boutonsAvant = etat.boutonsAvant || {};
        etat.boutonsAvant[broche] = valeur;
        if (valeur) $('.simu-note', ecran).textContent = 'Clique sur « Lancer » pour que ton programme réagisse au bouton.';
      } else etat.sim.changerEntree(broche, valeur);
      afficher();
    }
    function majCommandes() {
      const marche = etat.mode === 'marche' || etat.mode === 'direct';
      afficherClavier();
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

    // Valeur affichée d'un composant (deux composants d'un exercice libre peuvent partager une broche).
    function etatComposant(c, sim) {
      if (c.type === 'bouton') return sim ? sim.entrees[c.broche] || 0 : (etat.boutonsAvant && etat.boutonsAvant[c.broche]) || 0;
      if (c.type === 'buzzer') {
        const note = sim && sim.journal.filter((e) => e.broche === c.broche && e.type === 'son').pop();
        return note && note.valeur && sim.t < note.t + note.duree ? note.valeur : 0;
      }
      if (c.type === 'servo') return etat.servos[c.broche] || 0;
      return sim ? sim.sorties[c.broche] || 0 : 0;
    }
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
      for (const c of etat.exercice.composants || []) etats[c.broche + '|' + c.type] = etatComposant(c, sim, dtVirtuel);
      vue.afficher(etats, !!sim, sim);
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
      if (etat.mode === 'direct') afficher(dt);
      else if (etat.mode !== 'pause' || dtVirtuel) afficher(dtVirtuel);
      requestAnimationFrame(image);
    }
    requestAnimationFrame(image);

    // ----- Vérification et résultat (A5) -----

    const resultat = $('.resultat', ecran);
    const suivantDe = (ex) => exercices.slice(exercices.findIndex((x) => x.id === ex.id) + 1).find((x) => A.estDebloque(D, paquet, x.id, opts));

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
      // Les capteurs repartent des valeurs du test (celles de départ), pas de celles réglées à la main.
      if (vue && vue.capteurs && A.capteursDepart) Object.assign(vue.capteurs, A.capteursDepart(etat.exercice.carte));
      nouvelleSimulation();
      etat.boutonsAvant = null;
      for (const e of r.entrees) if (e.capteur !== undefined) etat.sim.planifierCapteur(e.t, e.capteur, e.valeur);
        else etat.sim.planifierEntree(e.t, e.broche, e.valeur);
      etat.rejeu = { fin: r.temps + 600 };
      etat.mode = 'marche';
      $('.simu-note', ecran).textContent = r.entrees.some((e) => e.capteur !== undefined) ? 'Le test se rejoue : les boutons et les capteurs changent tout seuls.' : 'Le test se rejoue : les boutons s’appuient tout seuls.';
      majCommandes();
    }
    function fermerResultat() {
      resultat.hidden = true;
    }
    // Exercice libre : l'équipe a terminé. Pas de correction : le programme est gardé, le professeur le regardera.
    function terminer() {
      fermerBulle();
      aides.fermer();
      const { programme } = editeur.lire();
      const ex = etat.exercice;
      A.noterProgramme(D, ex.id, editeur.sauvegarder());
      A.noterTermine(D, ex, programme);
      session.aEnregistrer(true, true);
      if (contexte.majBandeau) contexte.majBandeau(ex);
      const suivant = suivantDe(ex);
      resultat.className = 'resultat reussi';
      resultat.innerHTML =
        `<div class="resultat-message">${A.icone('coche', { epaisseur: 2.8 })}<div><strong>Ton programme est enregistré.</strong>` +
        '<span>C’est un exercice libre : ton professeur regardera ce que tu as inventé. Tu peux encore le modifier.</span>' +
        (suivant ? `<span>L’exercice ${echapper(suivant.numero)} est ouvert.</span>` : '') +
        (session.handle || lecture ? '' : '<span class="resultat-note">Pense à enregistrer ton travail dans le dossier de ton équipe.</span>') +
        '</div></div><div class="resultat-actions">' +
        (suivant ? `<button type="button" class="btn-principal btn-suivant">Exercice suivant${A.icone('suivant', { epaisseur: 2.8 })}</button>` : '') +
        `<button type="button" class="btn-secondaire btn-rester">${suivant ? 'Rester sur cet exercice' : 'Fermer'}</button></div>`;
      if (suivant) $('.btn-suivant', resultat).addEventListener('click', () => ouvrir(suivant));
      $('.btn-rester', resultat).addEventListener('click', fermerResultat);
      resultat.hidden = false;
      resultat.scrollIntoView({ block: 'nearest' });
    }
    $('.btn-verifier:not(.btn-terminer)', ecran).addEventListener('click', verifier);
    $('.btn-terminer', ecran).addEventListener('click', terminer);

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
      verifierClavier();
      afficherClavier();
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

    // Fermer l'onglet en direct : la carte éteint tout (sinon, au plus tard 3 s après, faute de signe de vie).
    addEventListener('pagehide', () => {
      if (etat.mode === 'direct') A.connexionCarte().arreterDirect();
    });

    choisirNiveau(1);
    majCommandes();
    return { ouvrir, quitter, editeur, etat, arreter, choisirModeTest };
  }

  Object.assign(A, { creerEcranExercice });
})(this);
