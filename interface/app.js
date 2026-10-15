// Démarrage de Labo Blocs côté élève : projet (site/projet.js), parcours (parcours/<id>/parcours.js), accueil,
// puis parcours et exercices. ?enseignant=1 : tout est ouvert et rien n'est enregistré (démonstration en classe).
(function (global) {
  'use strict';

  const A = global.LaboBlocs;
  const $ = (sel, racine) => (racine || document).querySelector(sel);
  const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  global.definirProjet = (p) => (A.projet = p);

  // Taille de l'interface : ×1 jusqu'à 1536×864, puis jusqu'à ×1,25 en 1920×1080 (vidéoprojecteur : ×1,4).
  function ajusterEchelle() {
    const projecteur = document.body.classList.contains('projecteur');
    const s = Math.min(projecteur ? 1.4 : 1.25, Math.max(projecteur ? 1.2 : 1, Math.min(innerWidth / 1536, innerHeight / 864)));
    document.documentElement.style.setProperty('--s', String(s));
    document.documentElement.style.fontSize = 16 * s + 'px';
  }

  // Icônes déclarées dans le HTML par data-icone.
  function poserIcones(racine) {
    for (const el of racine.querySelectorAll('[data-icone]')) {
      el.outerHTML = el.dataset.icone === 'lecture' ? A.LECTURE : A.icone(el.dataset.icone, { epaisseur: el.dataset.epaisseur });
    }
  }

  // Plein écran du navigateur : plus de place pour le programme (Échap ou le même bouton pour en sortir).
  function preparerPleinEcran() {
    const bouton = $('.btn-plein-ecran');
    if (!bouton || !document.fullscreenEnabled) return;
    bouton.hidden = false;
    const maj = () => {
      const actif = !!document.fullscreenElement;
      bouton.querySelector('.icone').outerHTML = A.icone(actif ? 'quitterPleinEcran' : 'pleinEcran', { epaisseur: 2.4 });
      $('.texte-plein-ecran', bouton).textContent = actif ? 'Quitter le plein écran' : 'Plein écran';
      bouton.title = actif ? 'Revenir à la fenêtre normale (touche Échap)' : 'Afficher Labo Blocs sur tout l’écran';
    };
    bouton.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else document.documentElement.requestFullscreen().catch(() => {
        const t = $('.message-bref');
        if (!t) return;
        t.textContent = 'Le plein écran n’est pas possible sur ce poste : appuie sur la touche F11.';
        t.hidden = false;
        setTimeout(() => (t.hidden = true), 5000);
      });
    });
    document.addEventListener('fullscreenchange', maj);
    maj();
  }

  function erreurFatale(texte) {
    document.body.innerHTML = `<main class="erreur-fatale"><h1>Labo Blocs ne peut pas démarrer</h1><p>${echapper(texte)}</p><p>Demande à ton professeur.</p></main>`;
  }

  function demarrerApplication() {
    const q = new URLSearchParams(location.search);
    if (q.has('projecteur')) document.body.classList.add('projecteur');
    ajusterEchelle();
    addEventListener('resize', ajusterEchelle);
    poserIcones(document);
    preparerPleinEcran();

    const projet = A.projet;
    if (!projet) return erreurFatale('Le fichier du projet (projet.js) est absent.');
    const brut = A.parcoursDefinis.find((p) => p.id === projet.parcours);
    if (!brut) return erreurFatale(`Le parcours « ${projet.parcours} » est introuvable.`);
    const problemes = A.controler(brut);
    if (problemes.length) return erreurFatale(problemes.join(' '));
    const paquet = A.preparer(brut);

    document.documentElement.style.setProperty('--accent', projet.accent || '#2547D0');
    for (const el of document.querySelectorAll('.titre-projet')) el.textContent = projet.titre;
    document.title = `${projet.titre} — Labo Blocs`;

    if (q.has('enseignant')) {
      const donnees = A.creerSauvegarde({ eleves: ['Mode enseignant'], classe: '' }, { parcours: paquet, projet: projet.id });
      A.relierParcours(donnees, paquet);
      return lancer(A.creerSession({ donnees, lecture: true }), paquet, { toutDebloquer: true, exercice: q.get('exercice') });
    }
    A.demarrerAccueil((r) => {
      const changes = A.relierParcours(r.donnees, paquet);
      const session = A.creerSession(r);
      lancer(session, paquet, {});
      if (changes.length) session.message(`Ton professeur a modifié ${changes.length > 1 ? changes.length + ' exercices' : 'un exercice'}. Tes blocs sont gardés : relance la vérification.`, 6000);
    }, paquet);
  }

  function lancer(session, paquet, options) {
    const D = session.donnees;
    const bandeau = $('.bandeau');
    if (!session.lecture) for (const el of bandeau.querySelectorAll('.etat-enregistrement, .btn-enregistrer')) el.hidden = false;
    $('.equipe-texte', bandeau).textContent = 'Équipe ' + D.equipe.eleves.join(' · ') + (D.equipe.classe ? ' · ' + D.equipe.classe : '');
    if (session.lecture) $('.equipe-texte', bandeau).textContent = 'Mode enseignant · rien n’est enregistré';

    const ecrans = { parcours: $('.ecran-parcours'), exercice: $('.ecran-exercice') };
    function montrer(nom) {
      for (const [k, el] of Object.entries(ecrans)) el.hidden = k !== nom;
      $('.btn-vers-parcours', bandeau).hidden = nom !== 'exercice';
      $('.bandeau-avancement', bandeau).hidden = nom !== 'exercice';
    }

    // Avancement dans le bandeau : « Exercice 4 sur 14 » et un segment par exercice (réussi, en cours, à faire).
    function majBandeau(ex) {
      const liste = paquet.exercices;
      const rang = liste.indexOf(ex);
      $('.avancement-texte', bandeau).textContent = `Exercice ${rang + 1} sur ${liste.length}`;
      const a = A.avancement(D, paquet);
      const segments = $('.segments', bandeau);
      segments.setAttribute('aria-label', `Progression : ${a.reussis} exercices réussis sur ${a.total}`);
      segments.innerHTML = liste
        .map((e, i) => {
          const etat = A.etat(D, paquet, e.id, options);
          return `<span class="segment segment-${etat}${i === rang ? ' segment-courant' : ''}"></span>`;
        })
        .join('');
    }

    const ecranExercice = A.creerEcranExercice({ session, paquet, toutDebloquer: options.toutDebloquer, majBandeau });
    const ecranParcours = A.creerEcranParcours({
      session,
      paquet,
      toutDebloquer: options.toutDebloquer,
      ouvrirExercice(id) {
        const ex = paquet.exercices.find((e) => e.id === id);
        montrer('exercice');
        if (!ecranExercice.ouvrir(ex)) montrer('parcours');
      },
    });
    function versParcours() {
      ecranExercice.quitter();
      ecranParcours.dessiner();
      montrer('parcours');
      document.title = `${A.projet.titre} — Labo Blocs`;
    }
    $('.btn-vers-parcours', bandeau).addEventListener('click', versParcours);

    ecranParcours.dessiner();
    if (options.exercice && paquet.exercices.some((e) => e.id === options.exercice)) {
      montrer('exercice');
      ecranExercice.ouvrir(paquet.exercices.find((e) => e.id === options.exercice));
    } else montrer('parcours');
    A.app = { session, paquet, ecranExercice, ecranParcours, versParcours };
  }

  Object.assign(A, { demarrerApplication, ajusterEchelle, poserIcones });
})(this);
