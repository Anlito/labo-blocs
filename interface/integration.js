// Labo Blocs dans un projet (distributeur de céréales…) : le projet garde ses pages (accueil, carnet, outil du
// professeur) et sa session d'équipe ; l'écran d'exercice est celui de Labo Blocs, posé dans un élément de sa page.
//
//   const ecran = LaboBlocs.monterExercice(element, {
//     session,                 // donnees (avec la rubrique « programmation »), lecture, aEnregistrer, enregistrer…
//     paquet,                  // parcours préparé (LaboBlocs.preparer)
//     projet: { id, titre, accent, logo },
//     media: 'vendor/labo-blocs/blockly/media/',   // images de Blockly, relatives à la page
//     retour: { texte: 'Carnet', action() {} },   // bouton en haut à gauche
//     toutDebloquer, solution, // mode enseignant
//     listeExercices,          // sans « retour » : le bouton « Exercices » ouvre la liste des exercices (mode enseignant)
//     actionsReussite(exercice) → [{ texte, principal, action }],
//   });
//   ecran.ouvrir(id, programme)  ·  ecran.quitter()
(function (global) {
  'use strict';

  const A = global.LaboBlocs;
  const $ = (sel, racine) => (racine || document).querySelector(sel);
  const echapper = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function monterExercice(hote, options) {
    const o = options || {};
    const { session, paquet } = o;
    const D = session.donnees;
    A.projet = Object.assign({}, A.projet, o.projet);
    if (o.media) A.mediaBlockly = o.media;

    hote.classList.add('labo-blocs', 'labo-blocs-page');
    hote.innerHTML = A.GABARITS.bandeau + A.GABARITS.exercice;
    A.poserIcones(hote);
    if (A.projet.accent) hote.style.setProperty('--accent', A.projet.accent);
    const bandeau = $('.bandeau', hote);
    const logo = $('.logo', bandeau);
    if (A.projet.logo) logo.src = A.projet.logo;
    else logo.remove();
    $('.titre-projet', bandeau).textContent = A.projet.titre || '';
    $('.equipe-texte', bandeau).textContent = session.lecture
      ? 'Mode enseignant · rien n’est enregistré'
      : 'Équipe ' + D.equipe.eleves.join(' · ') + (D.equipe.classe ? ' · ' + D.equipe.classe : '');
    $('.bandeau-avancement', bandeau).hidden = false;
    $('.ecran-exercice', hote).hidden = false;

    const retour = $('.btn-vers-parcours', bandeau);
    if (o.retour) {
      retour.hidden = false;
      retour.lastChild.textContent = o.retour.texte || 'Retour';
      retour.addEventListener('click', () => {
        ecran.quitter();
        o.retour.action();
      });
    }
    if (!o.retour && o.listeExercices) {
      retour.hidden = false;
      retour.lastChild.textContent = 'Exercices';
      const liste = document.createElement('dialog');
      liste.className = 'dialogue-liste';
      liste.setAttribute('aria-label', 'Choisir un exercice');
      hote.append(liste);
      retour.addEventListener('click', () => {
        liste.innerHTML =
          '<div class="dialogue-entete"><strong>Choisir un exercice</strong><button type="button" class="btn-fermer-liste" aria-label="Fermer">×</button></div><div class="liste-exercices">' +
          paquet.exercices
            .map((e) => `<button type="button" data-id="${e.id}"><span class="liste-numero">${e.numero}</span><span>${echapper(e.titre)}</span></button>`)
            .join('') +
          '</div>';
        liste.showModal();
      });
      liste.addEventListener('click', (e) => {
        if (e.target.closest('.btn-fermer-liste')) return liste.close();
        const b = e.target.closest('button[data-id]');
        if (!b) return;
        liste.close();
        ecran.quitter();
        ecran.ouvrir(paquet.exercices.find((x) => x.id === b.dataset.id));
      });
    }
    if (!session.lecture) {
      for (const el of bandeau.querySelectorAll('.etat-enregistrement, .btn-enregistrer')) el.hidden = false;
      $('.btn-enregistrer', bandeau).addEventListener('click', () => session.enregistrer('bouton'));
      if (session.majEtat) session.majEtat();
    }
    A.preparerPleinEcran(bandeau);

    const opts = { toutDebloquer: !!o.toutDebloquer };
    const ecran = A.creerEcranExercice({
      session,
      paquet,
      toutDebloquer: opts.toutDebloquer,
      solution: !!o.solution,
      actionsReussite: o.actionsReussite,
      majBandeau: (ex) => A.majAvancement(bandeau, D, paquet, ex, opts),
    });

    return {
      // Ouvre l'exercice demandé s'il est ouvert, sinon celui où l'équipe en est.
      ouvrir(id, programme) {
        const parId = (x) => paquet.exercices.find((e) => e.id === x);
        let ex = id && parId(id);
        if (!ex || !A.estDebloque(D, paquet, ex.id, opts)) ex = parId(A.exerciceAReprendre(D, paquet, opts)) || paquet.exercices[0];
        ecran.ouvrir(ex, programme);
        return ex;
      },
      quitter: ecran.quitter,
      ecran,
    };
  }

  A.monterExercice = monterExercice;
})(this);
