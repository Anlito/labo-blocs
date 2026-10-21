// Éditeur de blocs (repris de l'atelier) : Blockly, palette de l'exercice, blocs de départ, surlignage des blocs en cours,
// blocs restés seuls hors du programme, zoom, annuler / rétablir.
(function (global) {
  'use strict';

  const A = global.LaboBlocs;

  function creerEditeur(conteneur, rappels) {
    const Blockly = global.Blockly;
    A.definirBlocs(Blockly);
    const zone = conteneur.querySelector('.editeur-blockly');
    const calque = conteneur.querySelector('.editeur-etiquettes');
    // Tuiles des catégories : couleur de la famille et pictogramme.
    if (!document.getElementById('style-categories')) {
      const style = document.createElement('style');
      style.id = 'style-categories';
      style.textContent = A.CATEGORIES.map(
        (c) => `.cat-${c.cle}{background-color:${c.couleur};background-image:url("${A.imageIcone(c.icone || c.cle, '#1F2A30', 2.4)}")}`,
      ).join('\n');
      document.head.appendChild(style);
    }
    const echelle = () => Number(getComputedStyle(document.documentElement).getPropertyValue('--s')) || 1;

    const ws = Blockly.inject(zone, {
      toolbox: { kind: 'categoryToolbox', contents: [] },
      renderer: 'zelos',
      // Images de Blockly (corbeille…) copiées dans le dépôt : aucun appel réseau.
      media: A.mediaBlockly || 'vendor/blockly/media/', // un projet le règle (monterExercice)
      theme: A.themeBlockly,
      trashcan: true,
      sounds: false,
      move: { scrollbars: true, drag: true, wheel: true },
      zoom: { controls: false, wheel: false, pinch: true, startScale: 0.9 * echelle(), maxScale: 2, minScale: 0.4, scaleSpeed: 1.15 },
      grid: { spacing: 22, length: 2, colour: '#C9D4DA', snap: false },
      maxInstances: { demarrage: 1, boucle: 1 },
    });
    let enChargement = false;
    let enCours = null;

    // ---------- Chargement / sauvegarde ----------

    // Variables : celles de l'exercice (CHOIX si l'exercice n'en dit rien), celles déjà dans le programme, et celles que
    // l'élève crée (« Créer une variable », si l'exercice le permet).
    let exerciceCourant = null;
    const optionsPalette = () => ({ variables: A.variablesConnues, creerVariables: !!(exerciceCourant && exerciceCourant.variablesLibres) });
    function creerVariable() {
      let message = 'Nom de ta nouvelle variable (par exemple : vitesse, compteur) :';
      for (;;) {
        const texte = global.prompt(message, '');
        if (texte === null) return;
        const r = A.nomDeVariable(texte, A.variablesConnues);
        if (r.ok) {
          A.variablesConnues = A.variablesConnues.concat(r.nom);
          ws.updateToolbox(A.palette(exerciceCourant.blocsAutorises, exerciceCourant.composants, optionsPalette()));
          return;
        }
        message = r.message + ' Nouveau nom :';
      }
    }
    ws.registerButtonCallback('creerVariable', creerVariable);
    function creerListe() {
      let message = 'Nom de ta nouvelle liste (par exemple : sequence, notes) :';
      for (;;) {
        const texte = global.prompt(message, '');
        if (texte === null) return;
        const r = A.nomDeVariable(texte, A.listesConnues.concat(A.variablesConnues), 'liste');
        if (r.ok) {
          A.listesConnues = A.listesConnues.concat(r.nom);
          ws.updateToolbox(A.palette(exerciceCourant.blocsAutorises, exerciceCourant.composants, optionsPalette()));
          return;
        }
        message = r.message + ' Nouveau nom :';
      }
    }
    ws.registerButtonCallback('creerListe', creerListe);

    // Une fonction (ou son paramètre) change de nom : ses appels (et les blocs du paramètre) suivent.
    function renommer(e) {
      const def = ws.getBlockById(e.blockId);
      if (!def || !A.BLOCS_DEFINITION_FONCTION.includes(def.type) || (e.name !== 'NOM' && e.name !== 'PARAM')) return;
      const suivre = e.name === 'NOM' ? ['fonction_appeler', 'fonction_appeler_param'] : ['parametre'];
      const champ = e.name === 'NOM' ? 'FONCTION' : 'PARAM';
      const portee = e.name === 'NOM' ? ws.getAllBlocks(false) : def.getDescendants(false);
      for (const b of portee) {
        if (!suivre.includes(b.type) || b.getFieldValue(champ) !== e.oldValue) continue;
        const f = b.getField(champ);
        f.getOptions(false); // le menu se recalcule avec le nouveau nom
        f.setValue(e.newValue);
      }
    }

    function charger(exercice, sauvegarde) {
      enChargement = true;
      exerciceCourant = exercice;
      // Carte de l'exercice : les menus de broches des blocs la suivent (Uno : D2…D13, micro:bit : P0…P2).
      A.carteCourante = exercice.carte || 'uno';
      // Les événements de Blockly partent un instant plus tard : on les coupe pendant le chargement,
      // sinon ils passeraient pour une modification de l'élève (et arrêteraient la simulation).
      Blockly.Events.disable();
      try {
        const depart = sauvegarde || A.versBlockly(exercice.blocsDepart || { demarrage: [], boucle: [] });
        const fournies = Array.isArray(exercice.variables) ? exercice.variables : ['CHOIX'];
        const noms = A.nomsDeSauvegarde(depart);
        A.variablesConnues = [...new Set(fournies.concat(noms.variables))];
        A.listesConnues = [...new Set((Array.isArray(exercice.listes) ? exercice.listes : []).concat(noms.listes))];
        A.fonctionsConnues = noms.fonctions;
        A.parametresConnus = noms.parametres;
        ws.updateToolbox(A.palette(exercice.blocsAutorises, exercice.composants, optionsPalette()));
        ws.clear();
        Blockly.serialization.workspaces.load(depart, ws);
        // « Au démarrage » et « Répéter indéfiniment » ne se suppriment pas, même dans une sauvegarde.
        for (const b of ws.getTopBlocks(false)) if (b.type === 'demarrage' || b.type === 'boucle') b.setDeletable(false);
      } finally {
        Blockly.Events.enable();
      }
      // Les noms de la sauvegarde ont servi au chargement ; ensuite, les menus suivent les blocs posés.
      A.fonctionsConnues = [];
      A.parametresConnus = [];
      ws.clearUndo();
      ws.setScale(0.9 * echelle());
      ws.scroll(0, 0);
      enChargement = false;
      majHorsProgramme();
    }

    function sauvegarder() {
      return Blockly.serialization.workspaces.save(ws);
    }

    function lire() {
      return A.depuisBlockly(sauvegarder());
    }

    // ---------- Étiquettes posées à côté des blocs ----------

    function position(bloc) {
      const r = bloc.getSvgRoot().getBoundingClientRect();
      const z = zone.getBoundingClientRect();
      // Pour un bloc en C, on se cale sur sa première ligne (son en-tête).
      const hauteur = Math.min(r.height, 44 * ws.scale);
      return { x: r.right - z.left, y: r.top - z.top + hauteur / 2 };
    }

    function dessinerEtiquettes() {
      calque.innerHTML = '';
      const ajouter = (bloc, classe, texte, decalage) => {
        const p = position(bloc);
        const e = document.createElement('span');
        e.className = 'etiquette-bloc ' + classe;
        e.textContent = texte;
        e.style.left = p.x + (decalage || 12) + 'px';
        e.style.top = p.y + 'px';
        calque.appendChild(e);
      };
      const b = enCours && ws.getBlockById(enCours);
      if (b && !b.isInFlyout) {
        // Bloc en C : l'étiquette se place après la ligne d'en-tête, à droite du bloc.
        ajouter(b, 'etiquette-en-cours', '◀ en cours');
      }
      for (const h of horsProgramme) {
        const bloc = ws.getBlockById(h);
        if (bloc) ajouter(bloc, 'etiquette-hors', 'hors du programme', 14);
      }
    }

    // ---------- Bloc en cours ----------

    // id : un bloc, ou une liste (un bloc en cours par fil : « Répéter indéfiniment » et les blocs « quand… »).
    let tousEnCours = [];
    function surligner(id) {
      const ids = Array.isArray(id) ? id.filter(Boolean) : id ? [id] : [];
      if (ids.join() === tousEnCours.join()) return;
      for (const ancien of tousEnCours) {
        const b = ws.getBlockById(ancien);
        if (b && b.getSvgRoot()) b.getSvgRoot().classList.remove('bloc-en-cours');
      }
      tousEnCours = ids;
      enCours = ids[0] || null;
      for (const x of ids) {
        const b = ws.getBlockById(x);
        if (b && b.getSvgRoot()) b.getSvgRoot().classList.add('bloc-en-cours');
      }
      dessinerEtiquettes();
    }

    // ---------- Blocs restés seuls hors du programme ----------

    let horsProgramme = [];
    function majHorsProgramme() {
      for (const b of ws.getAllBlocks(false)) b.getSvgRoot().classList.remove('bloc-hors-programme');
      horsProgramme = [];
      for (const b of ws.getTopBlocks(false)) {
        if (b.type === 'demarrage' || b.type === 'boucle' || b.type === 'quand_bouton' || b.type === 'quand_camera' || b.type === 'quand_touche' || b.type === 'quand_joystick' || A.BLOCS_DEFINITION_FONCTION.includes(b.type) || b.isInsertionMarker()) continue;
        if (b.isDragging && b.isDragging()) continue;
        horsProgramme.push(b.id);
        b.getSvgRoot().classList.add('bloc-hors-programme');
      }
      dessinerEtiquettes();
    }

    ws.addChangeListener((e) => {
      if (enChargement) return;
      const deplacementVue = e.type === Blockly.Events.VIEWPORT_CHANGE;
      if (deplacementVue || e.type === Blockly.Events.BLOCK_DRAG || e.isUiEvent) {
        if (e.type === Blockly.Events.BLOCK_DRAG && !e.isStart) majHorsProgramme();
        else dessinerEtiquettes();
        if (deplacementVue) rappels.zoom(Math.round((ws.scale / echelle()) * 100));
        return;
      }
      if (e.type === Blockly.Events.BLOCK_CHANGE && e.element === 'field') renommer(e);
      majHorsProgramme();
      rappels.modifie();
    });

    // ---------- Boutons de l'espace de travail ----------

    function zoomer(sens) {
      const centre = zone.getBoundingClientRect();
      ws.zoom(centre.width / 2, centre.height / 2, sens);
    }

    function recentrer() {
      ws.setScale(0.9 * echelle());
      ws.scroll(0, 0);
    }

    // Bouton « Commentaire » : un commentaire sur le bloc choisi (ouvert), sinon une note en haut à gauche de ce qu'on
    // voit. Le texte s'écrit tout de suite.
    function commenter() {
      const choisi = Blockly.getSelected && Blockly.getSelected();
      if (choisi && choisi.workspace === ws && typeof choisi.setCommentText === 'function') {
        if (choisi.getCommentText() === null) choisi.setCommentText('');
        const icone = choisi.getIcon && choisi.getIcon(Blockly.icons.IconType.COMMENT);
        if (icone && icone.setBubbleVisible) icone.setBubbleVisible(true);
        // La zone de texte de la bulle qui vient de s'ouvrir (celle qui a le texte du bloc, la dernière posée).
        setTimeout(() => {
          const texte = choisi.getCommentText() || '';
          const zones = [...ws.getParentSvg().parentNode.querySelectorAll('textarea')].filter((t) => t.value === texte && !t.closest('.blocklyWorkspaceComment, .blocklyComment'));
          const zoneTexte = zones.pop();
          if (zoneTexte) zoneTexte.focus();
        }, 50);
        return;
      }
      // À droite des blocs (sans les cacher), en restant dans ce qu'on voit.
      const vue = ws.getMetricsManager().getViewMetrics(true);
      const blocs = ws.getBlocksBoundingBox();
      const droite = blocs && blocs.right > blocs.left ? blocs.right + 40 : vue.left + 30;
      const x = Math.max(vue.left + 20, Math.min(droite, vue.left + vue.width - 240));
      const decalage = ws.getTopComments().length * 24; // une note de plus ne cache pas la précédente
      const note = new Blockly.comments.RenderedWorkspaceComment(ws);
      note.setText('');
      note.setSize(new Blockly.utils.Size(220, 110));
      note.moveTo(new Blockly.utils.Coordinate(x, vue.top + 20 + decalage));
      setTimeout(() => {
        const zoneTexte = note.getSvgRoot && note.getSvgRoot().querySelector('textarea');
        if (zoneTexte) zoneTexte.focus();
      }, 50);
    }

    // La zone change de taille (fenêtre, consigne réduite) : Blockly doit se redimensionner.
    new ResizeObserver(() => {
      Blockly.svgResize(ws);
      dessinerEtiquettes();
    }).observe(zone);

    return {
      ws,
      charger,
      sauvegarder,
      lire,
      surligner,
      zoomer,
      recentrer,
      commenter,
      annuler: () => ws.undo(false),
      retablir: () => ws.undo(true),
      horsProgramme: () => horsProgramme.slice(),
      // Éditeur du professeur : les blocs proposés changent sans recharger le programme.
      changerPalette: (blocsAutorises) => ws.updateToolbox(A.palette(blocsAutorises, null, optionsPalette())),
    };
  }

  A.creerEditeur = creerEditeur;
})(this);
