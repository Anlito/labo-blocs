// Édition d'un parcours (cahier des charges §4.2, §4.3 ; écrans B8 et B9) : tout ce que fait l'éditeur du professeur,
// sans affichage, pour être testé sous Node. Le paquet modifié est toujours le paquet « brut » (celui du fichier :
// paramètres « $nom » non remplacés, sans rang ni empreinte).
//
// Règles :
//   - l'identifiant d'un exercice ne change jamais et n'est jamais réutilisé, même après suppression
//     (paquet.idsRetires) : c'est lui que retiennent les sauvegardes des élèves ;
//   - le numéro affiché suit l'ordre (renuméroté) ; les numéros à lettre d'un même groupe restent ensemble (13A, 13B) ;
//   - changer la broche d'un composant la change aussi dans la solution et dans les scénarios ;
//   - publier = contrôle du paquet + chaque solution passe tous ses scénarios.

(function (global) {
  'use strict';

  const enNode = typeof module === 'object' && module.exports;
  const P = enNode ? require('./programme.js') : global.LaboBlocs;
  const V = enNode ? require('./validation.js') : global.LaboBlocs;
  const PA = enNode ? require('./parcours.js') : global.LaboBlocs;

  const copie = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  const nombreFr = (x) => String(Math.round(Number(x) * 100) / 100).replace('.', ',');

  // ---------- Parcours et exercices ----------

  // « Distributeur de céréales » → « distributeur-de-cereales »
  function identifiantDepuisTitre(titre) {
    return (
      String(titre || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'parcours'
    );
  }

  function creerParcours(options) {
    const o = options || {};
    const paquet = {
      format: PA.FORMAT_PARCOURS,
      version: 1,
      id: o.id || identifiantDepuisTitre(o.titre),
      titre: o.titre || 'Nouveau parcours',
      versionParcours: '1.0.0',
      jamaisPublie: true, // la première publication garde 1.0.0
      date: aujourdhui(),
      moteurMinimum: PA.VERSION_MOTEUR,
      carte: o.carte || 'uno',
      modes: ['simulateur'],
      boutonsVersMasse: o.boutonsVersMasse !== false,
      parametres: {},
      exercices: [],
      fiches: {},
      lexique: [],
    };
    ajouterExercice(paquet);
    return paquet;
  }

  function aujourdhui() {
    const d = new Date();
    const deux = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
  }

  // Préfixe des identifiants du parcours (« dist » pour dist-01, dist-13a…).
  function prefixeIds(paquet) {
    const compte = {};
    for (const e of paquet.exercices || []) {
      const m = /^(.+)-\d+[a-z]?$/.exec(e.id);
      if (m) compte[m[1]] = (compte[m[1]] || 0) + 1;
    }
    const meilleur = Object.keys(compte).sort((a, b) => compte[b] - compte[a])[0];
    return meilleur || paquet.id || 'ex';
  }

  // Nouvel identifiant : jamais un identifiant en service ni un identifiant retiré.
  function nouvelIdentifiant(paquet) {
    const pris = new Set([...(paquet.exercices || []).map((e) => e.id), ...(paquet.idsRetires || [])]);
    let n = 0;
    for (const id of pris) {
      const m = /-(\d+)[a-z]?$/.exec(id);
      if (m) n = Math.max(n, Number(m[1]));
    }
    const prefixe = prefixeIds(paquet);
    let id;
    do id = `${prefixe}-${String(++n).padStart(2, '0')}`;
    while (pris.has(id));
    return id;
  }

  function exerciceVide(paquet) {
    return {
      id: nouvelIdentifiant(paquet),
      numero: '',
      titre: 'Nouvel exercice',
      defi: false,
      consigne: '',
      composants: [],
      blocsAutorises: ['led_etat', 'attendre'],
      blocsDepart: null,
      scenarios: [{ nom: 'Scénario 1', etapes: [] }],
      indices: ['', ''],
      aSavoir: null,
      solutionReference: { demarrage: [], boucle: [] },
      // niveau (1, 2, 3) : absent = au choix de l'élève ; niveauVerrouille : l'élève ne peut pas en changer (évaluation)
    };
  }

  // Ajoute un exercice après la position « apres » (à la fin par défaut). Renvoie sa position.
  function ajouterExercice(paquet, apres) {
    const ex = exerciceVide(paquet);
    const i = apres === undefined || apres === null ? paquet.exercices.length : apres + 1;
    paquet.exercices.splice(i, 0, ex);
    renumeroter(paquet);
    return i;
  }

  function dupliquerExercice(paquet, i) {
    const ex = copie(paquet.exercices[i]);
    ex.id = nouvelIdentifiant(paquet);
    ex.titre = ex.titre + ' (copie)';
    ex.numero = '';
    paquet.exercices.splice(i + 1, 0, ex);
    renumeroter(paquet);
    return i + 1;
  }

  // L'identifiant d'un exercice supprimé n'est jamais redonné (les sauvegardes des élèves le gardent).
  function supprimerExercice(paquet, i) {
    const [ex] = paquet.exercices.splice(i, 1);
    paquet.idsRetires = [...new Set([...(paquet.idsRetires || []), ex.id])];
    renumeroter(paquet);
    return ex;
  }

  function deplacerExercice(paquet, de, vers) {
    if (vers < 0 || vers >= paquet.exercices.length || de === vers) return de;
    const [ex] = paquet.exercices.splice(de, 1);
    paquet.exercices.splice(vers, 0, ex);
    renumeroter(paquet);
    return vers;
  }

  // Numéros dans l'ordre : 1, 2, 3… Des exercices voisins numérotés 13A, 13B gardent leur lettre et un même numéro.
  function renumeroter(paquet) {
    let n = 0;
    let base = null;
    for (const ex of paquet.exercices) {
      const m = /^(\d+)([A-Z])$/.exec(String(ex.numero || ''));
      if (m && m[1] === base) ex.numero = n + m[2];
      else {
        n++;
        ex.numero = m ? n + m[2] : String(n);
      }
      base = m ? m[1] : null;
    }
    return paquet;
  }

  // ---------- Composants et broches ----------

  const TYPES_COMPOSANTS = [
    { type: 'led', nom: 'LED', sortie: true },
    { type: 'bouton', nom: 'Bouton', sortie: false },
    { type: 'servo', nom: 'Servomoteur', sortie: true },
    { type: 'buzzer', nom: 'Buzzer', sortie: true },
  ];

  // Broche d'un composant changée : la solution et les scénarios suivent. Renvoie ce qui a changé.
  function changerBroche(exercice, ancienne, nouvelle) {
    let solution = 0;
    let scenarios = 0;
    (function parcourir(x) {
      if (Array.isArray(x)) return x.forEach(parcourir);
      if (!x || typeof x !== 'object') return;
      for (const k of Object.keys(x)) {
        if (k === 'broche' && x[k] === ancienne) {
          x[k] = nouvelle;
          solution++;
        } else parcourir(x[k]);
      }
    })(exercice.solutionReference);
    for (const sc of exercice.scenarios || []) {
      for (const e of sc.etapes) {
        for (const k of ['appuyer', 'maintenir', 'relacher', 'sequence']) {
          if (e[k] === ancienne) {
            e[k] = nouvelle;
            scenarios++;
          }
        }
        for (const k of ['verifier', 'stable', 'impulsion']) {
          if (e[k] && ancienne in e[k]) {
            const v = {};
            for (const [b, val] of Object.entries(e[k])) v[b === ancienne ? nouvelle : b] = val;
            e[k] = v;
            scenarios++;
          }
        }
        if (Array.isArray(e.opposees) && e.opposees.includes(ancienne)) {
          e.opposees = e.opposees.map((b) => (b === ancienne ? nouvelle : b));
          scenarios++;
        }
      }
    }
    const motif = new RegExp(`(?<![\\p{L}\\d])${ancienne}(?![\\p{L}\\d])`, 'u');
    for (const c of exercice.composants || []) if (c.broche === ancienne) c.broche = nouvelle;
    return { solution, scenarios, consigne: motif.test(exercice.consigne || '') };
  }

  function remplacerDansConsigne(exercice, ancienne, nouvelle) {
    exercice.consigne = String(exercice.consigne || '').replace(new RegExp(`(?<![\\p{L}\\d])${ancienne}(?![\\p{L}\\d])`, 'gu'), nouvelle);
  }

  // ---------- Étapes des scénarios ----------

  // Chaque sorte d'étape, ses champs et sa valeur de départ. Les champs inconnus d'une étape sont gardés tels quels.
  //   types de champ : secondes, entier, bouton (broche d'un bouton), sortie (broche d'une sortie), etats ({ broche:
  //   valeur }), valeurs (liste de valeurs), deuxSorties ([broche, broche]), texte
  const TYPES_ETAPES = [
    { cle: 'attendre', nom: 'Attendre', champs: [{ nom: 'attendre', type: 'secondes', libelle: 'durée' }] },
    { cle: 'appuyer', nom: 'Appuyer brièvement sur un bouton', champs: [{ nom: 'appuyer', type: 'bouton', libelle: 'bouton' }] },
    { cle: 'maintenir', nom: 'Maintenir un bouton appuyé', champs: [{ nom: 'maintenir', type: 'bouton', libelle: 'bouton' }] },
    { cle: 'relacher', nom: 'Relâcher un bouton', champs: [{ nom: 'relacher', type: 'bouton', libelle: 'bouton' }] },
    {
      cle: 'verifier',
      nom: 'Vérifier l’état',
      champs: [
        { nom: 'verifier', type: 'etats', libelle: 'état attendu' },
        { nom: 'delai', type: 'secondes', libelle: 'délai accepté', facultatif: true, defaut: 0.3 },
      ],
    },
    {
      cle: 'stable',
      nom: 'Vérifier que l’état ne change pas',
      champs: [
        { nom: 'stable', type: 'etats', libelle: 'état attendu' },
        { nom: 'duree', type: 'secondes', libelle: 'pendant' },
      ],
    },
    {
      cle: 'impulsion',
      nom: 'Vérifier une impulsion (allumé un moment, puis éteint)',
      champs: [
        { nom: 'impulsion', type: 'etats', libelle: 'état pendant l’impulsion' },
        { nom: 'duree', type: 'secondes', libelle: 'pendant' },
        { nom: 'tolerance', type: 'secondes', libelle: 'à plus ou moins', facultatif: true, defaut: 0.5 },
        { nom: 'delai', type: 'secondes', libelle: 'délai accepté', facultatif: true, defaut: 0.3 },
      ],
    },
    {
      cle: 'sequence',
      nom: 'Vérifier une suite d’états (clignotement, angles)',
      champs: [
        { nom: 'sequence', type: 'sortie', libelle: 'sortie' },
        { nom: 'valeurs', type: 'valeurs', libelle: 'états dans l’ordre' },
        { nom: 'intervalle', type: 'secondes', libelle: 'chaque état dure' },
        { nom: 'duree', type: 'secondes', libelle: 'observer pendant' },
        { nom: 'changements', type: 'entier', libelle: 'changements au moins', facultatif: true },
      ],
    },
    {
      cle: 'opposees',
      nom: 'Vérifier deux sorties en alternance',
      champs: [
        { nom: 'opposees', type: 'deuxSorties', libelle: 'sorties' },
        { nom: 'duree', type: 'secondes', libelle: 'observer pendant' },
      ],
    },
  ];
  // Pour les vérifications : début de phrase montré à l'élève à la place du début automatique.
  const CHAMPS_PHRASE = [
    { nom: 'contexte', type: 'texte', libelle: 'situation (ex. « au démarrage »)', facultatif: true },
    { nom: 'attendu', type: 'texte', libelle: 'ce qui est attendu, dit à l’élève', facultatif: true },
  ];
  const VERIFICATIONS = ['verifier', 'stable', 'impulsion', 'sequence', 'opposees'];

  function typeEtape(etape) {
    const t = TYPES_ETAPES.find((x) => x.cle in etape);
    return t ? t.cle : null;
  }

  function nouvelleEtape(cle, exercice) {
    const composants = (exercice && exercice.composants) || [];
    const bouton = (composants.find((c) => c.type === 'bouton') || {}).broche || 'D2';
    const sortie = composants.find((c) => c.type !== 'bouton') || { type: 'led', broche: 'D2' };
    const autre = composants.filter((c) => c.type !== 'bouton')[1] || { broche: 'D3' };
    const valeurSortie = sortie.type === 'servo' ? 90 : 1;
    switch (cle) {
      case 'attendre':
        return { attendre: 1 };
      case 'appuyer':
      case 'maintenir':
      case 'relacher':
        return { [cle]: bouton };
      case 'verifier':
        return { verifier: { [sortie.broche]: valeurSortie } };
      case 'stable':
        return { stable: { [sortie.broche]: valeurSortie }, duree: 2 };
      case 'impulsion':
        return { impulsion: { [sortie.broche]: 1 }, duree: 5 };
      case 'sequence':
        return { sequence: sortie.broche, valeurs: sortie.type === 'servo' ? [0, 90] : [1, 0], intervalle: 1, duree: 6 };
      case 'opposees':
        return { opposees: [sortie.broche, autre.broche], duree: 6 };
      default:
        throw new Error('Étape inconnue : ' + cle);
    }
  }

  // Phrase d'une étape, pour le professeur : « Vérifier que la LED D9 est allumée ».
  function decrireEtape(etape, exercice) {
    const c = (b) => V.nomComposant((exercice.composants || []).find((x) => x.broche === b) || { type: /^D[56]$/.test(b) ? 'servo' : 'led', broche: b });
    const etat = (b, v) => {
      const comp = (exercice.composants || []).find((x) => x.broche === b);
      if (comp && comp.type === 'servo') return `${c(b)} est à ${nombreFr(v)}°`;
      return `${c(b)} est ${v ? (comp && comp.type === 'bouton' ? 'appuyé' : 'allumée') : comp && comp.type === 'bouton' ? 'relâché' : 'éteinte'}`;
    };
    const etats = (o) => Object.entries(o || {}).map(([b, v]) => etat(b, v)).join(' et ');
    const debut = etape.contexte ? etape.contexte.charAt(0).toUpperCase() + etape.contexte.slice(1) + ', v' : 'V';
    switch (typeEtape(etape)) {
      case 'attendre':
        return `Attendre ${nombreFr(etape.attendre)} s`;
      case 'appuyer':
        return `Appuyer brièvement sur ${c(etape.appuyer)}`;
      case 'maintenir':
        return `Maintenir appuyé ${c(etape.maintenir)}`;
      case 'relacher':
        return `Relâcher ${c(etape.relacher)}`;
      case 'verifier':
        return `${debut}érifier que ${etats(etape.verifier)}`;
      case 'stable':
        return `${debut}érifier que ${etats(etape.stable)} pendant ${nombreFr(etape.duree)} s`;
      case 'impulsion':
        return `${debut}érifier que ${etats(etape.impulsion)} pendant ${nombreFr(etape.duree)} s, puis plus`;
      case 'sequence':
        return `${debut}érifier que ${c(etape.sequence)} passe par ${(etape.valeurs || []).map(nombreFr).join(', ')} toutes les ${nombreFr(etape.intervalle)} s`;
      case 'opposees':
        return `${debut}érifier que ${c(etape.opposees[0])} et ${c(etape.opposees[1])} s’allument en alternance`;
      default:
        return 'Étape inconnue';
    }
  }

  // ---------- Solution et tests ----------

  // Programme lu dans Blockly (v1, avec les identifiants des blocs) → solution rangée dans le parcours : sans
  // identifiants, au format simplifié s'il n'a que « au démarrage » et « répéter indéfiniment ».
  function solutionDepuisProgramme(programme) {
    const sansIds = JSON.parse(JSON.stringify(programme, (k, v) => (k === 'id' ? undefined : v)));
    const simple = P.versSimplifie(sansIds);
    return simple && !simple.fils ? simple : sansIds;
  }

  // L'exercice tel que l'élève le recevra (paramètres remplacés), dans son parcours.
  function exercicePrepare(paquet, exercice) {
    return PA.preparer(Object.assign({}, paquet, { exercices: [exercice] })).exercices[0];
  }

  // « Tester mes scénarios sur ma solution » : chaque scénario, réussi ou non, avec la phrase que verrait l'élève.
  function testerScenarios(paquet, exercice) {
    const ex = exercicePrepare(paquet, exercice);
    return (ex.scenarios || []).map((sc, i) => {
      const nom = sc.nom || `Scénario ${i + 1}`;
      if (!sc.etapes.length) return { nom, reussi: false, vide: true, message: 'Ce scénario n’a aucune étape.' };
      if (!sc.etapes.some((e) => VERIFICATIONS.includes(typeEtape(e)))) return { nom, reussi: false, vide: true, message: 'Ce scénario ne vérifie rien : ajoute une étape « Vérifier ».' };
      try {
        const r = V.jouerScenario(ex, ex.solutionReference, sc);
        return { nom, reussi: r.reussi, message: r.reussi ? '' : r.message, etapes: sc.etapes.length };
      } catch (e) {
        return { nom, reussi: false, message: String(e.message || e) };
      }
    });
  }

  // Avant de publier : le paquet est complet et chaque solution passe tous ses scénarios. Phrases pour le professeur.
  function controlerPublication(paquet) {
    const problemes = PA.controler(paquet);
    for (const ex of paquet.exercices || []) {
      const nom = `Exercice ${ex.numero || ''} (${ex.titre})`;
      if (!String(ex.consigne || '').trim()) problemes.push(`${nom} : la consigne est vide.`);
      if (!(ex.blocsAutorises || []).length) problemes.push(`${nom} : aucun bloc n’est proposé aux élèves.`);
      for (const r of testerScenarios(paquet, ex)) if (!r.reussi) problemes.push(`${nom}, scénario « ${r.nom} » : ${r.vide ? r.message : 'la solution ne passe pas. ' + r.message}`);
    }
    return problemes;
  }

  // 1.4.0 → 1.5.0
  function versionSuivante(version) {
    const [a, b] = String(version || '1.0.0').split('.').map((x) => Number(x) || 0);
    return `${a || 1}.${b + 1}.0`;
  }

  // Version que donnera « Publier » (un parcours jamais publié garde sa première version).
  const versionAPublier = (paquet) => (paquet.jamaisPublie ? paquet.versionParcours : versionSuivante(paquet.versionParcours));

  // Paquet publié : nouvelle version, date du jour, moteur minimum à jour.
  function publier(paquet) {
    const p = copie(paquet);
    p.versionParcours = versionAPublier(paquet);
    delete p.jamaisPublie;
    p.date = aujourdhui();
    if (PA.comparerVersions(p.moteurMinimum, PA.VERSION_MOTEUR) < 0) p.moteurMinimum = PA.VERSION_MOTEUR;
    return p;
  }

  const api = {
    identifiantDepuisTitre,
    creerParcours,
    prefixeIds,
    nouvelIdentifiant,
    exerciceVide,
    ajouterExercice,
    dupliquerExercice,
    supprimerExercice,
    deplacerExercice,
    renumeroter,
    TYPES_COMPOSANTS,
    changerBroche,
    remplacerDansConsigne,
    TYPES_ETAPES,
    CHAMPS_PHRASE,
    VERIFICATIONS,
    typeEtape,
    nouvelleEtape,
    decrireEtape,
    solutionDepuisProgramme,
    exercicePrepare,
    testerScenarios,
    controlerPublication,
    versionSuivante,
    versionAPublier,
    publier,
  };
  if (enNode) module.exports = api;
  else Object.assign((global.LaboBlocs = global.LaboBlocs || {}), api);
})(this);
