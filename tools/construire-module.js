// Construit le module partagé dans dist/labo-blocs-<version>/ : ce qu'un projet copie dans son site/vendor/labo-blocs/
// (npm run vers-projet). Aucun lien réseau : tout est dans le dossier.
//
//   labo-blocs-noyau.js      moteur sans affichage (programme, code octet, simulation, validation, parcours, sauvegarde)
//                            — se charge aussi sous Node (tests des projets) avec vm.runInNewContext
//   labo-blocs-interface.js  blocs, éditeur, simulateur, aides, écran d'exercice, LaboBlocs.monterExercice
//   labo-blocs.css           styles de l'écran d'exercice, limités à l'élément .labo-blocs (n'abîment pas les pages du projet) ;
//                            l'élément qui reçoit tout l'écran a aussi la classe .labo-blocs-page
//   polices/ blockly/ LICENCES/   copies (aucun CDN)
//   VERSION.json             version du moteur et date de construction
//
// Le parcours de chaque projet est exporté à côté : dist/parcours/<id>-<version>.labo-parcours.json (fichier d'échange
// pour « Mettre à jour les exercices »).
//
// Usage : npm run module
const { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const RACINE = join(__dirname, '..');
const NOYAU = ['programme', 'code-octet', 'vm', 'simulation', 'validation', 'arduino', 'parcours', 'sauvegarde'];
const INTERFACE = ['gabarits', 'icones', 'blocs', 'editeur', 'simulateur-vue', 'aides', 'fichiers', 'session', 'accueil', 'ecran-parcours', 'ecran-exercice', 'app', 'integration'];
const { VERSION_MOTEUR } = require('../noyau/parcours.js');

// ---------- CSS limitée à .labo-blocs ----------

// Découpe une liste de sélecteurs aux virgules de premier niveau (pas celles de :not(a, b)).
function separer(selecteurs) {
  const r = [];
  let prof = 0;
  let debut = 0;
  for (let i = 0; i < selecteurs.length; i++) {
    const c = selecteurs[i];
    if (c === '(') prof++;
    else if (c === ')') prof--;
    else if (c === ',' && prof === 0) {
      r.push(selecteurs.slice(debut, i).trim());
      debut = i + 1;
    }
  }
  r.push(selecteurs.slice(debut).trim());
  return r.filter(Boolean);
}

// :root → .labo-blocs (couleurs, polices : aussi pour un petit morceau, ex. les blocs dessinés dans l'outil du
// professeur) ; html, body → .labo-blocs-page (mise en page plein écran, seulement l'élément qui reçoit l'écran).
function prefixerSelecteur(sel, racine) {
  if (sel === ':root') return [racine];
  if (sel === 'html' || sel === 'body') return [racine + '-page'];
  if (sel === '*') return [racine, racine + ' *'];
  if (/^\.blockly/.test(sel)) return [sel]; // menus de Blockly, posés à la fin de la page
  if (/^body[.\[:]/.test(sel)) return [racine + '-page' + sel.slice(4)];
  return [racine + ' ' + sel];
}

function prefixer(css, racine) {
  const sansCommentaires = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let sortie = '';
  let i = 0;
  while (i < sansCommentaires.length) {
    const ouvre = sansCommentaires.indexOf('{', i);
    if (ouvre < 0) break;
    const tete = sansCommentaires.slice(i, ouvre).trim();
    // Bloc entre accolades équilibrées.
    let prof = 1;
    let j = ouvre + 1;
    while (j < sansCommentaires.length && prof) {
      if (sansCommentaires[j] === '{') prof++;
      else if (sansCommentaires[j] === '}') prof--;
      j++;
    }
    const corps = sansCommentaires.slice(ouvre + 1, j - 1);
    if (/^@media/.test(tete)) sortie += `${tete} {\n${prefixer(corps, racine)}}\n`;
    else if (/^@/.test(tete)) sortie += `${tete} {${corps}}\n`;
    else {
      const selecteurs = [...new Set(separer(tete).flatMap((s) => prefixerSelecteur(s, racine)))];
      sortie += `${selecteurs.join(', ')} {${corps}}\n`;
    }
    i = j;
  }
  return sortie;
}

// ---------- Construction ----------

function lire(chemin) {
  return readFileSync(join(RACINE, chemin), 'utf8');
}

function assembler(dossier, noms) {
  return noms.map((n) => `// ===== ${dossier}/${n}.js =====\n${lire(`${dossier}/${n}.js`)}`).join('\n');
}

function construire() {
  const nom = `labo-blocs-${VERSION_MOTEUR}`;
  const OUT = join(RACINE, 'dist', nom);
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const entete = (quoi) => `// Labo Blocs ${VERSION_MOTEUR} — ${quoi}. Fichier construit par « npm run module » : ne pas modifier ici.\n`;

  // Dans le navigateur : LaboBlocs global. Sous Node : require() renvoie LaboBlocs (les fichiers du noyau ne voient pas
  // « module » et se rangent dans LaboBlocs comme dans le navigateur).
  const noyau =
    entete('moteur') +
    '(function () {\n  var module, exports, require;\n' +
    assembler('noyau', NOYAU) +
    "\n}).call(typeof globalThis !== 'undefined' ? globalThis : this);\n" +
    "if (typeof module === 'object' && module.exports) module.exports = globalThis.LaboBlocs;\n";
  writeFileSync(join(OUT, 'labo-blocs-noyau.js'), noyau);
  writeFileSync(join(OUT, 'labo-blocs-interface.js'), entete('interface') + assembler('interface', INTERFACE));

  const css = ['interface/css/composants.css', 'interface/css/labo-blocs.css'].map(lire).join('\n').replace(/url\('\.\.\/\.\.\/site\/vendor\/polices\//g, "url('polices/");
  writeFileSync(join(OUT, 'labo-blocs.css'), `/* Labo Blocs ${VERSION_MOTEUR} — styles limités à l'élément .labo-blocs. Construit par « npm run module ». */\n` + prefixer(css, '.labo-blocs'));

  for (const d of ['polices', 'blockly', 'LICENCES']) cpSync(join(RACINE, 'site', 'vendor', d), join(OUT, d), { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  writeFileSync(join(OUT, 'VERSION.json'), JSON.stringify({ moteur: VERSION_MOTEUR, construit: date }, null, 2) + '\n');
  writeFileSync(
    join(OUT, 'LISEZ-MOI.txt'),
    `Labo Blocs ${VERSION_MOTEUR} (module partagé), construit le ${date}.\n` +
      'Copié par « npm run vers-projet » depuis le dépôt labo-blocs. Ne pas modifier ces fichiers : ils sont remplacés à chaque copie.\n',
  );

  // Contrôle : le noyau se charge seul, sans navigateur.
  const bac = {};
  vm.runInNewContext(noyau, bac);
  if (!bac.LaboBlocs || bac.LaboBlocs.VERSION_MOTEUR !== VERSION_MOTEUR) throw new Error('Le noyau construit ne se charge pas.');
  const charge = require(join(OUT, 'labo-blocs-noyau.js'));
  if (!charge || typeof charge.valider !== 'function') throw new Error('Le noyau construit ne se charge pas sous Node.');

  // Parcours exportés (fichiers d'échange .labo-parcours.json).
  const P = join(RACINE, 'dist', 'parcours');
  mkdirSync(P, { recursive: true });
  const exportes = [];
  for (const id of readdirSync(join(RACINE, 'parcours'))) {
    const f = join(RACINE, 'parcours', id, 'parcours.js');
    if (!existsSync(f)) continue;
    const paquet = lireParcours(readFileSync(f, 'utf8'));
    const fichier = `${paquet.id}-${paquet.versionParcours}.labo-parcours.json`;
    writeFileSync(join(P, fichier), JSON.stringify(paquet, null, 2) + '\n');
    exportes.push(fichier);
  }
  return { dossier: OUT, nom, exportes };
}

// Lit un script « definirParcours({...}) » sans l'exécuter dans Node (même chose que le navigateur).
function lireParcours(texte) {
  let paquet = null;
  vm.runInNewContext(texte, { definirParcours: (p) => (paquet = JSON.parse(JSON.stringify(p))) }); // objets de ce contexte
  if (!paquet) throw new Error('Ce fichier n’appelle pas definirParcours({...}).');
  return paquet;
}

if (require.main === module) {
  const r = construire();
  console.log(`Module construit : dist/${r.nom}/`);
  for (const f of r.exportes) console.log(`Parcours exporté : dist/parcours/${f}`);
}

module.exports = { construire, prefixer, lireParcours };
