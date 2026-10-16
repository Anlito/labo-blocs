// Catalogue des exercices. Les fichiers site/exercices/*.js appellent definirParametres(...) et
// definirExercice(...) : ce sont des données (même contenu qu'un fichier JSON), placées dans un
// script pour que le site fonctionne aussi en ouvrant index.html depuis un dossier (file://).

(function (global) {
  'use strict';

  const P = typeof module === 'object' && module.exports ? require('./programme.js') : global.Atelier;

  const ORDRE = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13A', '13B'];

  function creerCatalogue() {
    const parametres = {};
    const brutes = [];
    return {
      definirParametres: (p) => Object.assign(parametres, p),
      definirExercice: (e) => brutes.push(e),
      parametres,
      // Exercices dans l'ordre du parcours, avec les paramètres « $nom » remplacés.
      exercices() {
        const rang = (e) => (ORDRE.includes(String(e.id)) ? ORDRE.indexOf(String(e.id)) : ORDRE.length);
        return brutes
          .slice()
          .sort((a, b) => rang(a) - rang(b))
          .map((e) => P.appliquerParametres(e, parametres));
      },
    };
  }

  const api = { creerCatalogue, ORDRE };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    const Atelier = (global.Atelier = global.Atelier || {});
    Object.assign(Atelier, api);
    Atelier.catalogue = creerCatalogue();
    global.definirParametres = Atelier.catalogue.definirParametres;
    global.definirExercice = Atelier.catalogue.definirExercice;
    global.definirLexique = (liste) => (Atelier.lexique = liste);
    global.definirClasses = (liste) => (Atelier.classes = liste);
    global.definirFiches = (fiches) => (Atelier.fiches = fiches);
    global.definirCarnet = (carnet) => (Atelier.carnet = carnet);
    global.definirBareme = (bareme) => (Atelier.bareme = bareme);
    global.definirCheminSauvegarde = (chemin) => (Atelier.cheminSauvegarde = chemin);
    global.definirComposantsTuto = (liste) => (Atelier.composantsTuto = liste);
  }
})(this);
