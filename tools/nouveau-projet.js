// Crée le dossier d'un nouveau projet relié à Labo Blocs, prêt à servir en classe (en file://, sans réseau) :
//
//   <dossier>/
//     LISEZ-MOI-LABO-BLOCS.md         ce qui a été créé, comment s'en servir et le mettre à jour
//     docs/BRIEF-LABO-BLOCS.md        consignes à donner à Claude Code (ou Claude Design) quand le projet grandit
//     site/programmation.html         page des élèves : accueil de l'équipe, parcours, exercices, sauvegarde
//     site/programmation-prof.html    outil du professeur : suivi de classe, niveaux, CSV, fichier pour le Carnet
//     site/projet-labo-blocs.js       réglages du projet (titre, couleur, classes, dossier des équipes)
//     site/parcours/<id>.js           parcours d'exercices (fait avec l'éditeur de Labo Blocs)
//     site/vendor/labo-blocs/         module partagé (remplacé en entier à chaque mise à jour)
//
// Les pages sont tirées de site/index.html et site/prof.html de Labo Blocs : elles restent identiques à celles de Labo
// Blocs. Rien n'est jamais écrasé : si une de ces pages ou les réglages existent déjà, rien n'est écrit.
//
// Usage : npm run nouveau-projet -- <dossier> --titre "Pont-levis" --parcours <id | fichier .labo-parcours.json>
//           [--id pont-levis] [--accent "#2547D0"] [--classes 4A,4B,4C] [--chemin "{classe}/COMMUN/TECHNOLOGIE/PONT-LEVIS/{equipe}"]
const { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } = require('node:fs');
const { join, resolve, basename } = require('node:path');
const { construire, lireParcours } = require('./construire-module.js');
const { scriptParcours, controler } = require('../noyau/parcours.js');

const RACINE = join(__dirname, '..');
const PAGE_ELEVES = 'programmation.html';
const PAGE_PROF = 'programmation-prof.html';
const REGLAGES = 'projet-labo-blocs.js';

const sansAccents = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// « Pont-levis à l'école » → « pont-levis-a-l-ecole »
const identifiant = (t) =>
  String(t)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// Lit un parcours : identifiant d'un parcours de Labo Blocs (parcours/<id>/parcours.js) ou fichier exporté
// (.labo-parcours.json, ou script definirParcours).
function chargerParcours(quoi) {
  const dossierLabo = join(RACINE, 'parcours', quoi, 'parcours.js');
  if (existsSync(dossierLabo)) return lireParcours(readFileSync(dossierLabo, 'utf8'));
  if (existsSync(quoi)) {
    const texte = readFileSync(quoi, 'utf8').replace(/^﻿/, '');
    if (/^\s*\{/.test(texte)) return JSON.parse(texte);
    return lireParcours(texte);
  }
  throw new Error(`Parcours « ${quoi} » introuvable : donnez l'identifiant d'un parcours de Labo Blocs (dossier parcours/) ou un fichier .labo-parcours.json.`);
}

// Page de Labo Blocs (site/index.html ou site/prof.html) → page du projet qui charge le module copié.
//   css : feuilles du module ; demarrer : fonction appelée à la fin.
function page(source, { titre, css, demarrer, classesBody, commentaire }) {
  const texte = readFileSync(join(RACINE, 'site', source), 'utf8');
  const corps = texte.slice(texte.indexOf('<body'), texte.indexOf('<!-- Bibliothèques'));
  // Le lien « Accueil » de Labo Blocs n'a pas de sens dans un projet.
  const body = corps.replace(/ *<a class="ed-btn ed-vers-accueil"[^\n]*\n/, '').replace(/^<body([^>]*)>/, (m, attrs) => {
    const classe = (attrs.match(/class="([^"]*)"/) || [])[1] || '';
    return `<body class="${[classesBody, classe].filter(Boolean).join(' ')}">`;
  });
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- ${commentaire}
     Page créée par « npm run nouveau-projet » (Labo Blocs). Le module est dans vendor/labo-blocs/ (ne pas le modifier) ;
     les réglages du projet sont dans ${REGLAGES}, le parcours dans parcours/. -->
<title>${titre}</title>
<link rel="icon" href="vendor/labo-blocs/logo.svg" type="image/svg+xml">
${css.map((f) => `<link rel="stylesheet" href="vendor/labo-blocs/${f}">`).join('\n')}
</head>
${body.replace(/src="img\/logo\.svg"/g, 'src="vendor/labo-blocs/logo.svg"')}<!-- Labo Blocs (copié dans le projet : aucun appel réseau) -->
<script src="vendor/labo-blocs/blockly/blockly_compressed.js"></script>
<script src="vendor/labo-blocs/blockly/fr.js"></script>
<script src="vendor/labo-blocs/labo-blocs-noyau.js"></script>
<script src="vendor/labo-blocs/labo-blocs-interface.js"></script>
<script>LaboBlocs.mediaBlockly = 'vendor/labo-blocs/blockly/media/';</script>
<!-- Réglages du projet et parcours -->
<script src="${REGLAGES}"></script>
<script src="parcours/__PARCOURS__.js"></script>
<script>LaboBlocs.${demarrer}();</script>
</body>
</html>
`;
}

function reglages(o) {
  return `// Réglages du projet dans Labo Blocs (modifiables par le professeur, avec un éditeur de texte).
//   titre : affiché en haut des pages ; accent : couleur du bandeau ;
//   parcours : identifiant du parcours chargé (fichier parcours/<id>.js) ;
//   classes : proposées à l'accueil des élèves ;
//   cheminSauvegarde : dossier de l'équipe sur le réseau, du plus haut au plus bas ({classe} et {equipe} sont remplacés).
definirProjet(${JSON.stringify(
    { id: o.id, titre: o.titre, accent: o.accent, logo: 'vendor/labo-blocs/logo.svg', parcours: o.parcours, classes: o.classes, cheminSauvegarde: o.chemin },
    null,
    2,
  )});
`;
}

function lisezMoi(o, paquet, version) {
  return `# ${o.titre} — programmation avec Labo Blocs

Dossier créé le ${new Date().toISOString().slice(0, 10)} par \`npm run nouveau-projet\` (Labo Blocs ${version}).
Parcours : **${paquet.titre}** (\`${paquet.id}\`, version ${paquet.versionParcours}, ${paquet.exercices.length} exercices).

## Ce qu'il y a dans \`site/\`

| Fichier | À quoi il sert |
|---|---|
| \`${PAGE_ELEVES}\` | **page des élèves** : l'équipe se crée (prénoms, classe), choisit son dossier, fait les exercices ; le travail s'enregistre dans un fichier \`.json\` par équipe |
| \`${PAGE_PROF}\` | **outil du professeur** : ouvrir le dossier de la classe, suivre les équipes, niveaux par compétence, note, export CSV et fichier pour le Carnet de classe |
| \`${REGLAGES}\` | réglages : titre, couleur, classes proposées, dossier des équipes sur le réseau |
| \`parcours/${paquet.id}.js\` | les exercices (créés et modifiés avec l'éditeur de Labo Blocs) |
| \`vendor/labo-blocs/\` | Labo Blocs lui-même : **ne rien modifier**, il est remplacé à chaque mise à jour |

Tout marche en ouvrant les pages depuis le réseau du collège (\`file://\`), sans internet et sans compte.
Chrome ou Edge conseillés (enregistrement automatique, envoi dans les cartes).

## Réglages choisis

- Classes : ${o.classes.join(', ')}
- Dossier d'une équipe : \`${o.chemin.join(' › ')}\`
- Couleur : \`${o.accent}\`

Pour les changer : ouvrir \`site/${REGLAGES}\` avec un éditeur de texte (ou demander à Claude Code).

## Mettre à jour

- **Les exercices** (après une modification dans l'éditeur de Labo Blocs) : depuis le dépôt labo-blocs,
  \`npm run vers-projet -- <ce dossier> --parcours ${paquet.id}\`. Le travail des équipes est gardé : un exercice
  modifié est simplement « à revérifier ».
- **Labo Blocs** (nouvelle version) : la même commande remplace \`site/vendor/labo-blocs/\`.

## Si le projet a plus tard ses propres pages (carnet, accueil, outil du professeur…)

Donner \`docs/BRIEF-LABO-BLOCS.md\` à Claude Code (ou Claude Design) : il explique comment garder les exercices de
Labo Blocs à l'intérieur des pages du projet, comme dans l'atelier du distributeur de céréales.
`;
}

function creerProjet(args) {
  const o = args;
  if (!o.dossier || !o.titre || !o.parcours) {
    throw new Error('Usage : npm run nouveau-projet -- <dossier> --titre "Titre du projet" --parcours <id | fichier .labo-parcours.json> [--id …] [--accent "#2547D0"] [--classes 4A,4B] [--chemin "{classe}/…/{equipe}"]');
  }
  const paquet = chargerParcours(o.parcours);
  const problemes = controler(paquet);
  if (problemes.length) throw new Error('Parcours refusé : ' + problemes.join(' '));
  const id = o.id || identifiant(o.titre);
  const reg = {
    id,
    titre: o.titre,
    accent: o.accent || '#2547D0',
    parcours: paquet.id,
    classes: o.classes && o.classes.length ? o.classes : ['5A', '5B', '5C', '5D'],
    chemin: o.chemin && o.chemin.length ? o.chemin : ['{classe}', 'COMMUN', 'TECHNOLOGIE', sansAccents(o.titre).toUpperCase(), '{equipe}'],
  };
  if (!reg.chemin.includes('{equipe}')) throw new Error('Le chemin du dossier doit contenir {equipe}.');

  const projet = resolve(o.dossier);
  const site = join(projet, 'site');
  const fichiers = {
    [join(site, PAGE_ELEVES)]: null,
    [join(site, PAGE_PROF)]: null,
    [join(site, REGLAGES)]: null,
  };
  const deja = Object.keys(fichiers).filter((f) => existsSync(f));
  if (deja.length) throw new Error(`Rien n'a été écrit : ${deja.map((f) => basename(f)).join(', ')} ${deja.length > 1 ? 'existent' : 'existe'} déjà dans ${site}. Pour mettre à jour, utilisez « npm run vers-projet ».`);

  const r = construire();
  const version = JSON.parse(readFileSync(join(r.dossier, 'VERSION.json'), 'utf8')).moteur;
  const versParcours = (t) => t.replace('__PARCOURS__', paquet.id);
  fichiers[join(site, PAGE_ELEVES)] = versParcours(
    page('index.html', { titre: `${reg.titre} — Labo Blocs`, css: ['labo-blocs.css'], demarrer: 'demarrerApplication', classesBody: 'labo-blocs labo-blocs-page', commentaire: 'Page des élèves : accueil de l’équipe, parcours et exercices.' }),
  );
  fichiers[join(site, PAGE_PROF)] = versParcours(
    page('prof.html', { titre: `Suivi de classe — ${reg.titre}`, css: ['labo-blocs.css', 'labo-blocs-professeur.css'], demarrer: 'demarrerProfesseur', classesBody: 'labo-blocs labo-blocs-page', commentaire: 'Outil du professeur : suivi de la classe, niveaux, exports.' }),
  );
  fichiers[join(site, REGLAGES)] = reglages(reg);

  mkdirSync(join(site, 'parcours'), { recursive: true });
  for (const [f, texte] of Object.entries(fichiers)) writeFileSync(f, texte);
  const fichierParcours = join(site, 'parcours', `${paquet.id}.js`);
  if (!existsSync(fichierParcours)) writeFileSync(fichierParcours, scriptParcours(paquet));
  const vendor = join(site, 'vendor', 'labo-blocs');
  rmSync(vendor, { recursive: true, force: true });
  mkdirSync(vendor, { recursive: true });
  cpSync(r.dossier, vendor, { recursive: true });

  mkdirSync(join(projet, 'docs'), { recursive: true });
  const brief = join(projet, 'docs', 'BRIEF-LABO-BLOCS.md');
  if (!existsSync(brief)) cpSync(join(RACINE, 'docs', 'BRIEF-LABO-BLOCS-POUR-UN-PROJET.md'), brief);
  const guide = join(projet, 'LISEZ-MOI-LABO-BLOCS.md');
  if (!existsSync(guide)) writeFileSync(guide, lisezMoi(reg, paquet, version));
  return { projet, site, reglages: reg, paquet, version };
}

// « --classes 4A,4B » ; « --chemin "{classe}/COMMUN/…/{equipe}" » (séparateurs / \ ou ›)
function lireArguments(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) o[a.slice(2)] = argv[++i];
    else if (!o.dossier) o.dossier = a;
  }
  if (o.classes) o.classes = o.classes.split(/[,;\s]+/).filter(Boolean);
  if (o.chemin) o.chemin = o.chemin.split(/[\\/›]+/).map((s) => s.trim()).filter(Boolean);
  return o;
}

if (require.main === module) {
  try {
    const r = creerProjet(lireArguments(process.argv.slice(2)));
    console.log(`Projet « ${r.reglages.titre} » prêt dans ${r.projet}`);
    console.log(`  élèves : site/${PAGE_ELEVES} · professeur : site/${PAGE_PROF}`);
    console.log(`  parcours ${r.paquet.id} ${r.paquet.versionParcours} · Labo Blocs ${r.version}`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

module.exports = { creerProjet, lireArguments, identifiant, PAGE_ELEVES, PAGE_PROF, REGLAGES };
