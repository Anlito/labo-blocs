// Accueil (A1, A2 ; repris de l'atelier) : « Nouvelle équipe » (prénoms, classe, dossier de l'équipe),
// « Ouvrir notre sauvegarde », ou « Reprendre le travail de … ».
// Pas de compte : l'équipe tape ses prénoms. Le fichier est la seule référence ; la copie du
// navigateur sert seulement à reprendre après une fermeture d'onglet.
(function (global) {
  'use strict';

  const A = global.LaboBlocs;
  const F = A.fichiers;
  const $ = (sel, racine) => (racine || document).querySelector(sel);
  const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function dateFr(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  // paquet : parcours préparé (pour l'avancement d'une sauvegarde trouvée dans le dossier).
  function demarrer(commencer, paquet) {
    const racine = $('.ecran-accueil');
    const nouvelleSauvegarde = () => A.creerSauvegarde(equipe, { parcours: paquet, projet: A.projet.id, application: A.projet.application });
    function avancementTexte(d) {
      const copie = JSON.parse(JSON.stringify(d));
      A.relierParcours(copie, paquet);
      const a = A.avancement(copie, paquet);
      return `${a.reussis}/${a.total} exercices réussis`;
    }
    racine.hidden = false;
    let equipe = null; // { eleves, classe, nom }

    for (const el of racine.querySelectorAll('[data-icone]')) el.outerHTML = A.icone(el.dataset.icone, { epaisseur: el.dataset.epaisseur });

    const panneaux = [...racine.querySelectorAll('.accueil-panneau')];
    function montrer(nom) {
      for (const p of panneaux) p.hidden = p.dataset.panneau !== nom;
      const champ = racine.querySelector(`[data-panneau="${nom}"] input, [data-panneau="${nom}"] button.btn-principal`);
      if (champ) champ.focus();
    }
    function erreur(nomPanneau, message) {
      const zone = $('.erreur-' + nomPanneau, racine);
      zone.textContent = message || '';
      zone.hidden = !message;
    }

    // ----- Choix -----

    const secours = F.lireSecours();
    const carte = $('.accueil-reprendre', racine);
    if (secours) {
      carte.hidden = false;
      $('.reprendre-equipe', carte).textContent = secours.equipe.eleves.join(', ') + (secours.equipe.classe ? ' · ' + secours.equipe.classe : '');
      $('.reprendre-date', carte).textContent = 'Dernière modification le ' + dateFr(secours.modifieLe);
    }
    $('.btn-reprendre', racine).addEventListener('click', async () => {
      // Le fichier mémorisé est réutilisé s'il est bien celui de cette équipe ; on prend la version la plus récente.
      let handle = await F.handleMemorise();
      let donnees = secours;
      if (handle) {
        try {
          // Pas de fenêtre d'autorisation ici : on lit le fichier seulement si c'est déjà permis.
          // L'autorisation d'écrire sera demandée au premier vrai travail (vérification, indice, Enregistrer).
          if ((await handle.queryPermission({ mode: 'read' })) === 'granted') {
            const lecture = A.lireSauvegarde(await (await handle.getFile()).text());
            const meme = lecture.ok && A.nomEquipe(lecture.donnees.equipe.eleves) === A.nomEquipe(secours.equipe.eleves);
            if (!meme) handle = null;
            else if (lecture.donnees.modifieLe > secours.modifieLe) donnees = lecture.donnees;
          }
        } catch {
          handle = null;
        }
      }
      fin(donnees, handle);
    });
    $('.btn-pas-nous', racine).addEventListener('click', () => (carte.hidden = true));

    $('.btn-ouvrir', racine).addEventListener('click', async () => {
      erreur('choix', '');
      let r;
      try {
        r = await F.ouvrir();
      } catch {
        return erreur('choix', 'Le fichier n’a pas pu être ouvert. Réessaie.');
      }
      if (!r) return;
      if (!r.lecture.ok) return erreur('choix', r.lecture.raison + ' Rien n’a été modifié.');
      // Pas de demande d'autorisation à l'ouverture : rien n'a encore été fait. Elle viendra au premier
      // vrai travail de l'équipe (vérification, indice ou clic sur « Enregistrer »).
      fin(r.lecture.donnees, r.handle);
    });

    // ----- Équipe -----

    $('.info-firefox', racine).hidden = F.accesDossiers;

    // Classes proposées et chemin du dossier (modèle) : redessinés si la liste du collège en ligne arrive après.
    const choixClasse = $('.champ-classe', racine);
    function majClasses() {
      const modele = A.projet.cheminSauvegarde || ['{classe}', '{equipe}'];
      $('.chemin-texte', racine).textContent = A.remplirChemin(modele, (A.projet.classes || ['5A'])[0] || '5A', 'Prénom_Prénom').join(' › ');
      const choisie = choixClasse.value;
      choixClasse.innerHTML =
        '<option value="">Choisis ta classe</option>' + (A.projet.classes || []).map((c) => `<option>${echapper(c)}</option>`).join('');
      if ((A.projet.classes || []).includes(choisie)) choixClasse.value = choisie;
    }
    majClasses();
    A.surCollege = majClasses;

    $('.formulaire-equipe', racine).addEventListener('submit', (e) => {
      e.preventDefault();
      const eleves = [...racine.querySelectorAll('.champ-prenom')].map((c) => c.value.trim()).filter(Boolean);
      if (!eleves.length) return erreur('equipe', 'Écris au moins un prénom.');
      if (eleves.some((p) => !/^[\p{L}][\p{L}' -]*$/u.test(p))) return erreur('equipe', 'Un prénom ne doit contenir que des lettres.');
      if (!choixClasse.value) return erreur('equipe', 'Choisis ta classe.');
      erreur('equipe', '');
      equipe = { eleves, classe: choixClasse.value, nom: A.nomEquipe(eleves) };
      preparerDossier();
      montrer('dossier');
    });

    // ----- Dossier de l'équipe -----

    function preparerDossier() {
      const chemin = A.remplirChemin(A.projet.cheminSauvegarde || ['{classe}', '{equipe}'], equipe.classe, equipe.nom);
      // Le chemin jusqu'au dossier du projet, celui-ci surligné : l'élève le sélectionne, Labo Blocs y crée le dossier de l'équipe.
      const cible = chemin.length - 2;
      $('.chemin', racine).innerHTML = chemin
        .slice(0, -1)
        .map((p, i) => `<span class="chemin-dossier${i === cible ? ' cible' : ''}">${echapper(p)}</span>`)
        .join('<span class="chemin-fleche" aria-hidden="true">›</span>');
      $('.nom-fichier', racine).textContent = equipe.nom + '.json';
      $('.nom-dossier-equipe', racine).textContent = equipe.nom;
      // Dossier du projet : celui que l'élève choisit ; Labo Blocs y crée lui-même le dossier de l'équipe.
      equipe.parent = chemin.length > 1 ? chemin[chemin.length - 2] : '';
      for (const el of racine.querySelectorAll('.nom-dossier-projet')) el.textContent = equipe.parent || 'du projet';
      racine.querySelector('[data-panneau="dossier"]').classList.toggle('sans-acces', !F.accesDossiers);
      $('.dossier-resultat', racine).innerHTML = '';
      $('.btn-choisir-dossier', racine).hidden = !F.accesDossiers;
      $('.btn-commencer-sans-dossier', racine).hidden = F.accesDossiers;
    }

    function resultat(html) {
      $('.dossier-resultat', racine).innerHTML = html;
    }

    async function choisirDossier() {
      erreur('dossier', '');
      let choix;
      try {
        choix = await F.choisirDossier();
      } catch {
        return erreur('dossier', 'Ce dossier ne peut pas être utilisé. Choisis-en un autre.');
      }
      if (!choix) return;
      // Le dossier de l'équipe est toujours créé (ou retrouvé) par Labo Blocs dans le dossier du projet.
      const creer = async () =>
        valider(await F.creerSousDossier(choix.dossier, equipe.nom), `Le dossier « ${equipe.nom} » est prêt dans « ${choix.nom} ».`);
      const sorte = F.analyserDossier(choix.nom, equipe.nom, equipe.parent);
      if (sorte === 'parent') return creer();
      if (sorte === 'equipe') {
        // L'élève est allé un cran trop loin : le dossier du projet est celui qui contient ce dossier.
        resultat(
          `<div class="avertissement"><p>Tu as choisi le dossier <strong>« ${echapper(choix.nom)} »</strong>. ` +
            `Choisis plutôt le dossier qui le contient, <strong>« ${echapper(equipe.parent || 'du projet')} »</strong> : Labo Blocs y retrouve ou y crée lui-même le dossier de ton équipe.</p>` +
            '<div class="accueil-actions"><button type="button" class="btn-principal btn-autre-dossier">Choisir le dossier du projet</button></div></div>',
        );
        $('.btn-autre-dossier', racine).addEventListener('click', choisirDossier);
        return;
      }
      // Un autre dossier : on demande à l'élève (le dossier de l'équipe sera quand même créé par Labo Blocs).
      resultat(
        `<div class="avertissement"><p>Le dossier choisi s’appelle <strong>« ${echapper(choix.nom)} »</strong>. ` +
          `Le dossier du projet s’appelle <strong>« ${echapper(equipe.parent || 'du projet')} »</strong>.</p>` +
          '<div class="accueil-actions">' +
          '<button type="button" class="btn-principal btn-autre-dossier">Choisir un autre dossier</button>' +
          `<button type="button" class="btn-secondaire btn-creer-ici">Créer « ${echapper(equipe.nom)} » dans « ${echapper(choix.nom)} »</button>` +
          '</div></div>',
      );
      $('.btn-autre-dossier', racine).addEventListener('click', choisirDossier);
      $('.btn-creer-ici', racine).addEventListener('click', creer);
    }

    async function valider(dossier, note) {
      const nom = equipe.nom + '.json';
      // Ne jamais écraser une sauvegarde qui existe déjà : on propose de l'ouvrir.
      const existante = await F.sauvegardeExistante(dossier, nom);
      if (existante) {
        if (!existante.lecture.ok) {
          return resultat(
            `<div class="avertissement"><p>Ce dossier contient déjà un fichier « ${echapper(nom)} » qui n’est pas une sauvegarde d’équipe. ` +
              'Il n’a pas été touché. Choisis un autre dossier.</p></div>',
          );
        }
        const d = existante.lecture.donnees;
        resultat(
          `<div class="avertissement"><p>Ce dossier contient déjà la sauvegarde de <strong>${echapper(d.equipe.eleves.join(', '))}</strong> ` +
            `(${avancementTexte(d)}, modifiée le ${dateFr(d.modifieLe)}). Elle n’a pas été touchée.</p>` +
            '<div class="accueil-actions">' +
            '<button type="button" class="btn-principal btn-ouvrir-existante">Ouvrir cette sauvegarde</button>' +
            '<button type="button" class="btn-secondaire btn-autre-dossier">Choisir un autre dossier</button></div></div>',
        );
        $('.btn-ouvrir-existante', racine).addEventListener('click', () => fin(d, existante.handle));
        $('.btn-autre-dossier', racine).addEventListener('click', choisirDossier);
        return;
      }
      const donnees = nouvelleSauvegarde();
      let handle;
      try {
        handle = await F.fichierDansDossier(dossier, nom);
        await F.enregistrer(donnees, handle);
      } catch {
        return erreur('dossier', 'Impossible d’écrire dans ce dossier. Vérifie que c’est bien le dossier de ton équipe, ou demande à ton professeur.');
      }
      resultat(
        `<div class="confirmation">${A.icone('coche', { couleur: '#2E7D32', epaisseur: 2.8 })}<div>` +
          `<p><strong>Dossier validé.</strong> ${echapper(note)}</p>` +
          `<p>Ton travail s’enregistre dans le fichier « ${echapper(nom)} » de ce dossier.</p></div></div>` +
          `<div class="accueil-actions"><button type="button" class="btn-principal btn-commencer">Commencer${A.icone('suivant', { epaisseur: 2.8 })}</button></div>`,
      );
      $('.btn-choisir-dossier', racine).hidden = true;
      const b = $('.btn-commencer', racine);
      b.addEventListener('click', () => fin(donnees, handle));
      b.focus();
    }

    $('.btn-choisir-dossier', racine).addEventListener('click', choisirDossier);
    $('.btn-commencer-sans-dossier', racine).addEventListener('click', () => fin(nouvelleSauvegarde(), null));
    $('.btn-retour-equipe', racine).addEventListener('click', () => montrer('choix'));

    function fin(donnees, handle) {
      F.memoriserHandle(handle);
      F.sauverSecours(donnees);
      racine.hidden = true;
      commencer({ donnees, handle });
    }

    montrer('choix');
  }

  A.demarrerAccueil = demarrer;
})(this);
