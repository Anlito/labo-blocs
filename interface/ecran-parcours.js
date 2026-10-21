// A3 · Parcours : les exercices dans l'ordre, l'état de chacun (verrouillé, à faire, en cours, réussi,
// à revérifier), les défis facultatifs, l'avancement. État toujours dit par un mot et un pictogramme.
(function (global) {
  'use strict';

  const A = global.LaboBlocs;
  const $ = (sel, racine) => (racine || document).querySelector(sel);
  const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const ETATS = {
    reussi: { mot: 'Réussi', icone: 'coche' },
    a_reverifier: { mot: 'À revérifier', icone: 'alerte' },
    en_cours: { mot: 'En cours', icone: 'lecture' },
    a_faire: { mot: 'À faire', icone: 'suivant' },
    verrouille: { mot: 'Réussis le précédent pour l’ouvrir', icone: 'cadenas' },
  };

  // contexte : { session, paquet, toutDebloquer, ouvrirExercice(id) }
  function creerEcranParcours(contexte) {
    const { session, paquet } = contexte;
    const D = session.donnees;
    const opts = { toutDebloquer: !!contexte.toutDebloquer };
    const ecran = $('.ecran-parcours');

    function dessiner() {
      const a = A.avancement(D, paquet);
      $('.parcours-compte', ecran).textContent = `${a.reussis} exercice${a.reussis > 1 ? 's' : ''} réussi${a.reussis > 1 ? 's' : ''} sur ${a.total}`;
      const barre = $('.barre', ecran);
      barre.setAttribute('aria-label', `${a.reussis} sur ${a.total}`);
      $('span', barre).style.width = Math.round((a.reussis / Math.max(1, a.total)) * 100) + '%';
      $('.pilule-revoir', ecran).hidden = !a.aReverifier;
      $('.revoir-texte', ecran).textContent = `${a.aReverifier} exercice${a.aReverifier > 1 ? 's' : ''} à revérifier`;
      const reprendre = paquet.exercices.find((e) => e.id === A.exerciceAReprendre(D, paquet, opts));
      const continuer = $('.btn-continuer', ecran);
      continuer.innerHTML = `<span>Continuer : exercice ${echapper(reprendre.numero)}</span>${A.icone('suivant', { epaisseur: 2.8 })}`;
      continuer.onclick = () => contexte.ouvrirExercice(reprendre.id);

      $('.parcours-grille', ecran).innerHTML = paquet.exercices
        .map((ex) => {
          const etat = A.etat(D, paquet, ex.id, opts);
          const courant = ex.id === reprendre.id && etat !== 'reussi' && etat !== 'verrouille';
          const e = courant ? { mot: 'En cours', icone: 'lecture' } : ETATS[etat];
          const motEtat = ex.libre && etat === 'reussi' ? 'Terminé' : e.mot;
          const prefixe = ex.apprentissage ? 'Apprentissage de l’IA' : ex.defi ? 'Défi facultatif' : ex.libre ? 'Exercice libre' : '';
          const mot = prefixe ? (etat === 'verrouille' ? prefixe + ' · verrouillé' : prefixe + ' · ' + motEtat.toLowerCase()) : motEtat;
          const classes = ['carte-exercice', 'etat-' + etat, courant ? 'courant' : '', ex.defi ? 'defi' : ''].join(' ');
          return (
            `<button type="button" class="${classes}" data-id="${echapper(ex.id)}"${etat === 'verrouille' ? ' aria-disabled="true"' : ''}>` +
            `<span class="numero-exercice">${echapper(ex.numero)}</span>` +
            `<span class="exercice-texte"><strong>${echapper(ex.titre)}</strong>` +
            `<span class="exercice-etat">${e.icone === 'lecture' ? A.LECTURE : A.icone(e.icone, { epaisseur: 2.6 })}${echapper(mot)}</span>` +
            (etat === 'a_reverifier' ? '<span class="exercice-note">La consigne a changé. Tes blocs sont gardés : relance la vérification.</span>' : '') +
            '</span></button>'
          );
        })
        .join('');
    }

    $('.parcours-grille', ecran).addEventListener('click', (e) => {
      const b = e.target.closest('.carte-exercice');
      if (!b) return;
      if (b.getAttribute('aria-disabled') === 'true') return session.message('Cet exercice s’ouvrira quand tu auras réussi le précédent.');
      contexte.ouvrirExercice(b.dataset.id);
    });

    return { dessiner };
  }

  Object.assign(A, { creerEcranParcours });
})(this);
