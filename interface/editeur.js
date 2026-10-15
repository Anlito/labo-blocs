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
        (c) => `.cat-${c.cle}{background-color:${c.couleur};background-image:url("${A.imageIcone(c.cle, '#1F2A30', 2.4)}")}`,
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

    function charger(exercice, sauvegarde) {
      enChargement = true;
      // Les événements de Blockly partent un instant plus tard : on les coupe pendant le chargement,
      // sinon ils passeraient pour une modification de l'élève (et arrêteraient la simulation).
      Blockly.Events.disable();
      try {
        ws.updateToolbox(A.palette(exercice.blocsAutorises, exercice.composants));
        ws.clear();
        const depart = sauvegarde || A.versBlockly(exercice.blocsDepart || { demarrage: [], boucle: [] });
        Blockly.serialization.workspaces.load(depart, ws);
        // « Au démarrage » et « Répéter indéfiniment » ne se suppriment pas, même dans une sauvegarde.
        for (const b of ws.getTopBlocks(false)) if (b.type === 'demarrage' || b.type === 'boucle') b.setDeletable(false);
      } finally {
        Blockly.Events.enable();
      }
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
        if (b.type === 'demarrage' || b.type === 'boucle' || b.type === 'quand_bouton' || b.isInsertionMarker()) continue;
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
      annuler: () => ws.undo(false),
      retablir: () => ws.undo(true),
      horsProgramme: () => horsProgramme.slice(),
    };
  }

  A.creerEditeur = creerEditeur;
})(this);
