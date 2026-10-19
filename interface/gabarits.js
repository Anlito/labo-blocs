// Gabarits HTML des écrans partagés : le bandeau et l'écran d'exercice (A4, A5). Le site de Labo Blocs et les
// projets (distributeur de céréales…) affichent ainsi exactement le même écran.
(function (global) {
  'use strict';

  const A = (global.LaboBlocs = global.LaboBlocs || {});

  const BANDEAU = `<header class="bandeau">
  <div class="bandeau-accent"></div>
  <div class="bandeau-barre">
    <img class="logo" alt="" width="34" height="34">
    <div class="bandeau-titre">
      <strong class="titre-projet"></strong>
      <span class="equipe-texte"></span>
    </div>
    <button type="button" class="btn-onglet btn-vers-parcours" hidden><span data-icone="retour" data-epaisseur="2.8"></span>Parcours</button>
    <div class="bandeau-avancement" hidden>
      <span class="avancement-texte"></span>
      <div class="segments" role="img"></div>
    </div>
    <span class="espace"></span>
    <button type="button" class="btn-onglet btn-plein-ecran" hidden><span data-icone="pleinEcran" data-epaisseur="2.4"></span><span class="texte-plein-ecran">Plein écran</span></button>
    <span class="etat-enregistrement" aria-live="polite" hidden></span>
    <button type="button" class="btn-onglet btn-enregistrer" hidden><span data-icone="disquette" data-epaisseur="2.4"></span>Enregistrer</button>
  </div>
</header>`;

  const EXERCICE = `<div class="ecran ecran-exercice" hidden>
  <section class="carte consigne" aria-label="Consigne">
    <div class="consigne-tete">
      <span class="consigne-numero"></span>
      <h1 class="titre-exercice"></h1>
      <div class="consigne-actions">
        <button type="button" class="btn-aide" data-aide="fiche" aria-expanded="false"><span data-icone="info"></span>À savoir</button>
        <button type="button" class="btn-aide btn-lexique"><span data-icone="livre"></span>Lexique</button>
        <button type="button" class="btn-reduire-consigne" aria-expanded="true"><span class="texte-reduire">Masquer le texte</span></button>
      </div>
    </div>
    <div class="consigne-texte"></div>
    <div class="bulle" role="dialog" aria-label="Définition" hidden>
      <div class="bulle-entete"><strong class="bulle-mot"></strong><button type="button" class="bulle-fermer" aria-label="Fermer">×</button></div>
      <p class="bulle-definition"></p>
    </div>
  </section>

  <aside class="colonne-aide">
    <button type="button" class="bande-repliee" data-colonne="gauche" aria-expanded="false" title="Afficher les composants et l’aide">
      <span data-icone="chevronDroite" data-epaisseur="2.8"></span><span class="bande-texte">Composants et aide</span>
    </button>
    <section class="carte carte-aide" aria-label="Indices">
      <div class="aide-tete"><h2>Besoin d’aide ?</h2><span class="compteur compteur-indices"></span></div>
      <p class="aide-texte">Les indices s’ouvrent un par un. Ton professeur voit combien tu en as utilisé.</p>
      <button type="button" class="btn-secondaire btn-indice" data-aide="indice" aria-expanded="false"><span data-icone="ampoule"></span><span class="texte-indice">Ouvrir l’indice 1</span></button>
    </section>
    <section class="carte composants-liste" aria-label="Composants">
      <h2>Composants</h2>
      <ul class="liste-composants"></ul>
      <p class="composants-note" hidden></p>
    </section>
  </aside>

  <main class="colonne-programme">
    <div class="programme-tete">
      <h2>Mon programme</h2>
      <button type="button" class="btn-onglet btn-solution" hidden title="Remplacer le programme affiché par la solution de référence"><span data-icone="oeil" data-epaisseur="2.4"></span>Solution</button>
      <div class="niveaux" role="group" aria-label="Niveau">
        <span class="niveaux-libelle">Niveau</span>
        <button type="button" class="btn-niveau" data-niveau="1" aria-pressed="true">1 · Premiers pas</button>
        <button type="button" class="btn-niveau" data-niveau="2" aria-pressed="false">2 · Boucles</button>
        <button type="button" class="btn-niveau" data-niveau="3" aria-pressed="false">3 · Code</button>
      </div>
    </div>
    <section class="editeur" aria-label="Éditeur de blocs">
      <div class="editeur-blockly"></div>
      <div class="editeur-etiquettes" aria-hidden="true"></div>
      <aside class="panneau-aide" aria-labelledby="titre-aide" hidden>
        <div class="panneau-aide-entete">
          <span class="panneau-aide-icone"></span>
          <h2 class="panneau-aide-titre" id="titre-aide"></h2>
          <button type="button" class="panneau-aide-fermer" aria-label="Fermer">×</button>
        </div>
        <div class="panneau-aide-corps"></div>
      </aside>
      <div class="editeur-outils">
        <div class="groupe-outils">
          <button type="button" class="btn-annuler" aria-label="Annuler" title="Annuler (Ctrl+Z)"><span data-icone="annuler"></span></button>
          <button type="button" class="btn-retablir" aria-label="Rétablir" title="Rétablir (Ctrl+Y)"><span data-icone="retablir"></span></button>
        </div>
        <div class="groupe-outils">
          <button type="button" class="btn-zoom-moins" aria-label="Dézoomer">−</button>
          <span class="zoom-valeur">100 %</span>
          <button type="button" class="btn-zoom-plus" aria-label="Zoomer">+</button>
        </div>
        <div class="groupe-outils">
          <button type="button" class="btn-recentrer" aria-label="Recentrer" title="Recentrer"><span data-icone="recentrer"></span></button>
        </div>
      </div>
    </section>
    <section class="code-arduino" aria-label="Code Arduino" hidden>
      <div class="code-tete"><strong>Code Arduino · niveau 3, lecture seule</strong><span>Clique sur un bloc : ses lignes se surlignent</span></div>
      <pre class="code-lignes"></pre>
    </section>
    <!-- Languettes sur les bords : replier ou rouvrir la colonne voisine -->
    <button type="button" class="btn-plier" data-colonne="gauche" aria-expanded="true" title="Replier les composants et l’aide pour agrandir le programme">
      <span data-icone="chevronGauche" data-epaisseur="2.8"></span><span class="texte-plier">Replier les composants et l’aide</span>
    </button>
    <button type="button" class="btn-plier" data-colonne="droite" aria-expanded="true" title="Replier le simulateur pour agrandir le programme">
      <span class="texte-plier">Replier le simulateur</span><span data-icone="chevronDroite" data-epaisseur="2.8"></span>
    </button>
  </main>

  <aside class="colonne-test">
    <button type="button" class="bande-repliee" data-colonne="droite" aria-expanded="false" title="Afficher le simulateur">
      <span data-icone="chevronGauche" data-epaisseur="2.8"></span><span class="bande-texte">Tester et vérifier</span>
    </button>
    <section class="carte simulateur" aria-label="Tester">
      <div class="simu-titre">
        <span>Tester</span>
        <div class="modes" role="group" aria-label="Mode">
          <button type="button" class="btn-mode" data-mode="simulateur" aria-pressed="true">Simulateur</button>
          <button type="button" class="btn-mode" data-mode="direct" aria-pressed="false" hidden>En direct</button>
          <button type="button" class="btn-mode" data-mode="carte" aria-pressed="false" hidden>Dans la carte</button>
        </div>
      </div>
      <div class="panneau-carte" aria-live="polite" hidden></div>
      <div class="simu-carte"></div>
      <div class="simu-milieu">
        <div class="simu-composants"></div>
        <div class="simu-distributeur"></div>
      </div>
      <div class="simu-ligne">
        <span class="simu-note" aria-live="polite"></span>
        <div class="chrono" aria-label="Temps de la simulation"><span data-icone="horloge" data-epaisseur="2.4"></span><span class="chrono-valeur">00:00</span></div>
      </div>
      <p class="simu-clavier" hidden></p>
      <div class="simu-commandes">
        <button type="button" class="btn-lancer" aria-pressed="false"><span data-icone="lecture"></span>Lancer</button>
        <button type="button" class="btn-commande btn-pause" disabled><span data-icone="pause" data-epaisseur="3.4"></span>Pause</button>
        <button type="button" class="btn-commande btn-pas" title="Pas à pas : un bloc à la fois"><span data-icone="pas" data-epaisseur="2.6"></span>Pas</button>
        <button type="button" class="btn-commande btn-recommencer" disabled aria-label="Recommencer"><span data-icone="recommencer" data-epaisseur="2.8"></span></button>
        <div class="vitesse" role="group" aria-label="Vitesse">
          <button type="button" class="btn-vitesse" data-vitesse="1" aria-pressed="true">×1</button>
          <button type="button" class="btn-vitesse" data-vitesse="2" aria-pressed="false">×2</button>
          <button type="button" class="btn-vitesse" data-vitesse="5" aria-pressed="false">×5</button>
        </div>
      </div>
    </section>
    <section class="carte camera-ia" aria-label="Caméra et IA" hidden></section>
    <section class="carte verification">
      <button type="button" class="btn-verifier"><span data-icone="coche"></span>Vérifier mon programme</button>
      <button type="button" class="btn-verifier btn-terminer" hidden><span data-icone="coche"></span>J’ai terminé</button>
      <div class="resultat" role="status" aria-live="polite" hidden></div>
    </section>
  </aside>

  <dialog class="dialogue-lexique" aria-label="Lexique">
    <div class="dialogue-entete">
      <span data-icone="livre" data-epaisseur="2.4"></span>
      <strong>Lexique</strong>
      <button type="button" class="btn-fermer-lexique" aria-label="Fermer">×</button>
    </div>
    <div class="lexique-outils">
      <input type="search" class="lexique-recherche" placeholder="Chercher un mot…" aria-label="Chercher un mot">
      <label class="lexique-filtre"><input type="checkbox" class="lexique-vus"> Mots déjà vus</label>
    </div>
    <div class="lexique-grille" aria-live="polite"></div>
  </dialog>
</div>`;

  const GABARITS = { bandeau: BANDEAU, exercice: EXERCICE };

  // Remplace chaque élément <… data-gabarit="nom"> de la racine par son gabarit.
  function poserGabarits(racine) {
    for (const el of racine.querySelectorAll('[data-gabarit]')) el.outerHTML = GABARITS[el.dataset.gabarit];
  }

  Object.assign(A, { GABARITS, poserGabarits });
})(this);
