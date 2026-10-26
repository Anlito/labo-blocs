// Recette automatique du jalon 1 dans un vrai navigateur (Chrome, Edge ou Chromium), en file:// :  npm run recette
// Chaque critère est vérifié sur la page réelle ; le compte rendu est écrit dans RECETTE-AUTO.md.
// Navigateur : variable CHROME, sinon Chrome / Edge installés aux endroits habituels.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer-core');

const RACINE = path.join(__dirname, '..');
const PAGE = pathToFileURL(path.join(RACINE, 'site', 'index.html')).href;
const CARTE_VIRTUELLE = fs.readFileSync(path.join(RACINE, 'tests', 'outils', 'carte-virtuelle.js'), 'utf8');
const CANDIDATS = [
  process.env.CHROME,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/opt/pw-browsers/chromium',
].filter(Boolean);
const navigateur = CANDIDATS.find((c) => fs.existsSync(c));
if (!navigateur) {
  console.error('Aucun navigateur trouvé : indiquer son chemin dans la variable CHROME.');
  process.exit(1);
}

// Empreinte du code professeur (site/code-professeur.js) : la recette ne connaît pas le code.
const { CLE: CLE_PORTE } = require('../interface/porte-professeur.js');
const EMPREINTE_PORTE = (() => {
  let r = {};
  require('node:vm').runInNewContext(fs.readFileSync(path.join(RACINE, 'site', 'code-professeur.js'), 'utf8'), { definirCodeProfesseur: (x) => (r = x) });
  return r.empreinte;
})();

// Réglages du collège : la recette ne dépend ni d'internet ni des classes publiées par le professeur.
// Copie de secours et version « en ligne » sont remplacées par des réglages d'essai fixes (5A à 5F) ;
// seul un appel marqué __recette (critère « Réglages du collège ») passe tel quel.
const { ADRESSE_COLLEGE } = require('../interface/college.js');
const COLLEGE_ESSAI = { format: 'labo-blocs/college', version: 1, classes: ['5A', '5B', '5C', '5D', '5E', '5F'], cheminClasse: ['Bureau', 'Classe', '{classe}', 'COMMUN', 'TECHNOLOGIE'] };
const COLLEGE_LOCAL = `definirCollege(${JSON.stringify(COLLEGE_ESSAI)});`;
function collegeDEssai(essai) {
  let vraie;
  Object.defineProperty(window, 'definirCollege', {
    configurable: true,
    get: () => (c) => vraie && vraie(c && c.__recette ? c : essai),
    set: (f) => { vraie = f; },
  });
}

const resultats = [];
// RECETTE_SEULEMENT=<mot> : seulement les critères dont le nom contient ce mot (pour mettre au point un critère).
async function critere(nom, f) {
  if (process.env.RECETTE_SEULEMENT && !nom.includes(process.env.RECETTE_SEULEMENT)) return;
  try {
    const detail = await f();
    resultats.push({ nom, ok: true, detail: detail || '' });
    console.log('✔', nom);
  } catch (e) {
    resultats.push({ nom, ok: false, detail: e.message });
    console.log('✘', nom, '—', e.message);
  }
}
const verifier = (condition, message) => {
  if (!condition) throw new Error(message);
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({ executablePath: navigateur, headless: true, protocolTimeout: 300000, args: ['--allow-file-access-from-files', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', ...(process.getuid && process.getuid() === 0 ? ['--no-sandbox'] : [])] });
  const erreurs = [];
  async function page(url, options) {
    const p = await b.newPage();
    await p.setViewport({ width: 1366, height: 768 });
    // Réglages du collège « en ligne » : servis par la copie du dépôt (la recette ne dépend pas d'internet).
    await p.setRequestInterception(true);
    p.on('request', (r) => (r.url().startsWith(ADRESSE_COLLEGE) ? r.respond({ status: 200, contentType: 'text/javascript', body: COLLEGE_LOCAL }) : r.continue()));
    await p.evaluateOnNewDocument(collegeDEssai, COLLEGE_ESSAI);
    p.on('pageerror', (e) => erreurs.push(e.message));
    p.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
    // « Quitter la page ? » (travail pas encore enregistré dans un fichier) : on accepte.
    p.on('dialog', (d) => d.accept());
    // Code professeur déjà donné sur cet ordinateur (sauf pour essayer la porte elle-même).
    if (!(options && options.porte)) await p.evaluateOnNewDocument((cle, empreinte) => localStorage.setItem(cle, empreinte), CLE_PORTE, EMPREINTE_PORTE);
    else await p.evaluateOnNewDocument((cle) => [localStorage, sessionStorage].forEach((s) => s.removeItem(cle)), CLE_PORTE);
    // « Firefox » : pas d'accès aux dossiers ni aux fichiers.
    if (options && options.sansDossiers) await p.evaluateOnNewDocument(() => ['showDirectoryPicker', 'showOpenFilePicker', 'showSaveFilePicker'].forEach((f) => delete window[f]));
    // Carte virtuelle à la place du câble USB (jalon 3) : { modele, firmware, occupee }.
    if (options && options.carte) await p.evaluateOnNewDocument(`${CARTE_VIRTUELLE};installerCarteVirtuelle(${JSON.stringify(options.carte)});`);
    await p.goto(url);
    await pause(600);
    return p;
  }
  const texte = (p, sel) => p.$eval(sel, (e) => e.textContent.trim());
  const visible = (p, sel) => p.$eval(sel, (e) => !e.closest('[hidden]') && e.getClientRects().length > 0).catch(() => false);
  const charger = (p, id, quoi) =>
    p.evaluate(
      (id, quoi) => {
        const L = LaboBlocs;
        const ex = L.app.paquet.exercices.find((e) => e.id === id);
        L.app.ecranExercice.editeur.charger(ex, L.versBlockly(quoi === 'solution' ? ex.solutionReference : { demarrage: [], boucle: [] }));
      },
      id,
      quoi,
    );

  await critere('L’outil s’ouvre depuis un dossier (file://), sans internet, sans erreur', async () => {
    const p = await page(PAGE);
    verifier(await visible(p, '.ecran-accueil'), 'accueil absent');
    // Seule exception (décision de Thomas, 16/10/2026) : la lecture des réglages du collège, avec copie de secours.
    const reseau = await p.evaluate((adresse) => performance.getEntriesByType('resource').filter((r) => !r.name.startsWith('file:') && !r.name.startsWith(adresse)).map((r) => r.name), ADRESSE_COLLEGE);
    verifier(!reseau.length, 'ressources en ligne : ' + reseau.join(', '));
    return 'aucune ressource en ligne, sauf la lecture des réglages du collège (copie de secours sinon)';
  });

  await critere('Polices de la charte chargées depuis le dépôt (Lexend, Atkinson Hyperlegible)', async () => {
    const p = await page(PAGE);
    await p.evaluate(() => document.fonts.ready);
    const ok = await p.evaluate(() => document.fonts.check('700 16px Lexend') && document.fonts.check('400 16px "Atkinson Hyperlegible"'));
    verifier(ok, 'polices absentes');
  });

  await critere('Firefox (sans accès aux dossiers) : message clair, nouvelle équipe, « Enregistrer » télécharge', async () => {
    const p = await page(PAGE, { sansDossiers: true });
    verifier(await visible(p, '.info-firefox'), 'pas de message Firefox');
    await p.type('.champ-prenom', 'léa');
    await p.select('.champ-classe', '5A');
    await p.click('.formulaire-equipe button[type=submit]');
    await pause(200);
    verifier((await texte(p, '[data-panneau="dossier"]')).includes('Léa'), 'dossier de l’équipe');
    await p.click('.btn-commencer-sans-dossier');
    await pause(300);
    verifier(await visible(p, '.ecran-parcours'), 'parcours non affiché');
    return await texte(p, '.equipe-texte');
  });

  await critere('Parcours : 14 exercices, le 1 ouvert, les autres verrouillés, 13B en défi facultatif', async () => {
    const p = await page(PAGE, { sansDossiers: true });
    await p.type('.champ-prenom', 'Hugo');
    await p.select('.champ-classe', '5B');
    await p.click('.formulaire-equipe button[type=submit]');
    await p.click('.btn-commencer-sans-dossier');
    await pause(300);
    const cartes = await p.$$eval('.carte-exercice', (l) => l.map((c) => [c.dataset.id, c.className, c.textContent]));
    verifier(cartes.length === 14, cartes.length + ' cartes');
    verifier(cartes[0][1].includes('courant'), 'exercice 1 pas en cours');
    verifier(cartes.slice(1).every((c) => c[1].includes('etat-verrouille')), 'exercices suivants pas verrouillés');
    verifier(cartes[13][1].includes('defi') && cartes[13][2].includes('Défi facultatif'), '13B pas en défi');
  });

  await critere('Programme faux : un seul écart, observable, en ambre, sans « faux » ni « erreur »', async () => {
    const p = await page(PAGE + '?enseignant=1&exercice=dist-05');
    await p.click('.btn-verifier');
    await pause(200);
    const t = await texte(p, '.resultat');
    const couleur = await p.$eval('.resultat', (e) => getComputedStyle(e).backgroundColor);
    verifier(t.startsWith('Quand le bouton D3 est appuyé, la LED D9 devrait être allumée.'), t);
    verifier(!/faux|erreur/i.test(t), 'mot interdit');
    verifier(couleur === 'rgb(255, 241, 208)', 'couleur ' + couleur);
    return t.replace('Voir le test', '');
  });

  await critere('Solution : réussite en vert, exercice suivant ouvert, avancement mis à jour', async () => {
    const p = await page(PAGE + '?enseignant=1&exercice=dist-05');
    await charger(p, 'dist-05', 'solution');
    await p.click('.btn-verifier');
    await pause(200);
    const t = await texte(p, '.resultat');
    verifier(t.includes('Ton programme fait ce qu’on attend') && t.includes('L’exercice 6 est ouvert'), t);
    await p.click('.btn-suivant');
    await pause(300);
    verifier((await texte(p, '.consigne-numero')) === 'Exercice 6', 'exercice 6 non ouvert');
  });

  await critere('Les 14 solutions de référence réussissent dans la page', async () => {
    const p = await page(PAGE + '?enseignant=1');
    const r = await p.evaluate(() =>
      LaboBlocs.app.paquet.exercices.map((ex) => {
        const prog = LaboBlocs.depuisBlockly(LaboBlocs.versBlockly(ex.solutionReference)).programme;
        return [ex.id, LaboBlocs.valider(ex, prog).reussi];
      }),
    );
    const rates = r.filter((x) => !x[1]).map((x) => x[0]);
    verifier(!rates.length, 'ratées : ' + rates.join(' '));
  });

  await critere('Simulateur : le bouton poussoir allume la LED tant qu’on le tient, le bloc en cours est surligné', async () => {
    const p = await page(PAGE + '?enseignant=1&exercice=dist-05');
    await charger(p, 'dist-05', 'solution');
    await p.click('.btn-lancer');
    await pause(300);
    // Bouton poussoir : appuyé tant qu'on garde le clic.
    const b = await (await p.$('.bouton-poussoir')).boundingBox();
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await p.mouse.down();
    await pause(400);
    verifier((await texte(p, '.composant-led .pastille-etat')).includes('Allumée'), 'LED éteinte pendant l’appui');
    verifier((await p.$$('.bloc-en-cours')).length >= 1, 'aucun bloc surligné');
    await p.mouse.up();
    await pause(400);
    verifier((await texte(p, '.composant-led .pastille-etat')).includes('Éteinte'), 'LED encore allumée après avoir lâché');
    return 'appui maintenu : LED allumée ; bouton lâché : LED éteinte';
  });

  await critere('Niveau 3 : code Arduino en lecture seule, un clic sur un bloc surligne ses lignes', async () => {
    const p = await page(PAGE + '?enseignant=1&exercice=dist-05');
    await charger(p, 'dist-05', 'solution');
    await p.click('.btn-niveau[data-niveau="3"]');
    await p.evaluate(() => LaboBlocs.app.ecranExercice.editeur.ws.getAllBlocks(false).find((x) => x.type === 'led_etat').select());
    await pause(200);
    const lignes = await p.$$eval('.code-lignes .surlignee', (l) => l.map((e) => e.textContent.trim()));
    verifier(lignes.join() === 'digitalWrite(9, HIGH);', lignes.join(' | '));
  });

  await critere('Indices : trois niveaux ouverts un par un, compteur visible, la solution jamais montrée', async () => {
    const p = await page(PAGE + '?enseignant=1&exercice=dist-05');
    await p.click('.btn-indice');
    for (let i = 0; i < 3; i++) {
      await p.click('.btn-indice-suivant');
      await pause(100);
    }
    verifier((await texte(p, '.compteur-indices')) === '3 sur 3 utilisés', 'compteur');
    verifier((await p.$$('.panneau-aide-corps .pb-trou')).length > 0, 'silhouette sans cases à compléter');
    verifier(!(await p.$('.btn-indice-suivant')), 'un 4e indice est proposé');
  });

  await critere('Colonnes repliables : la zone de programmation s’agrandit, le choix est gardé', async () => {
    const p = await page(PAGE + '?enseignant=1&exercice=dist-13a');
    const largeur = () => p.$eval('.editeur', (e) => e.getBoundingClientRect().width);
    const avant = await largeur();
    await p.click('.btn-plier[data-colonne="gauche"]');
    await p.click('.btn-plier[data-colonne="droite"]');
    await pause(300);
    const apres = await largeur();
    verifier(apres > avant * 1.8, `${Math.round(avant)} → ${Math.round(apres)} px`);
    await p.reload();
    await pause(600);
    verifier(Math.abs((await largeur()) - apres) < 2, 'choix non gardé');
    await p.click('.bande-repliee[data-colonne="gauche"]');
    await p.click('.bande-repliee[data-colonne="droite"]');
    await pause(300);
    verifier(await visible(p, '.btn-verifier'), 'colonne de test non rouverte');
    return `${Math.round(avant)} → ${Math.round(apres)} px`;
  });

  await critere('Reprendre le travail après fermeture de l’onglet (copie de secours)', async () => {
    const p = await page(PAGE, { sansDossiers: true });
    await p.type('.champ-prenom', 'Inès');
    await p.select('.champ-classe', '5C');
    await p.click('.formulaire-equipe button[type=submit]');
    await p.click('.btn-commencer-sans-dossier');
    await pause(300);
    await p.click('.btn-continuer');
    await pause(300);
    await charger(p, 'dist-01', 'solution');
    await p.click('.btn-verifier');
    await pause(300);
    await p.reload();
    await pause(600);
    verifier(await visible(p, '.carte-reprendre'), 'pas de carte « Reprendre »');
    await p.click('.btn-reprendre');
    await pause(300);
    const t = await texte(p, '.parcours-compte');
    verifier(t.startsWith('1 exercice réussi'), t);
  });

  // ---------- Jalon 2 : éditeur de parcours ----------

  await critere('Éditeur : le parcours du distributeur s’ouvre, chaque solution passe ses scénarios', async () => {
    const p = await page(pathToFileURL(path.join(RACINE, 'site', 'editeur.html')).href);
    await p.evaluate(() => localStorage.clear());
    await p.reload();
    await pause(800);
    await p.click('[data-choix="connu"]');
    await pause(800);
    const n = await p.$$eval('.ed-exercices li', (l) => l.length);
    verifier(n === 14, `${n} exercices`);
    await p.click('.btn-publier');
    await pause(400);
    const t = await texte(p, '.publier-contenu');
    verifier(/Les 14 exercices sont prêts/.test(t), t.slice(0, 160));
    return 'publication possible : version ' + (await texte(p, '.texte-publier')).replace('Publier la version ', '');
  });

  await critere('Commentaires : l’élève commente son programme (bouton « Commentaire ») ; le professeur écrit le programme de départ', async () => {
    // Élève : une note dans l'espace des blocs (rien n'est choisi), puis un commentaire sur « Au démarrage ».
    const p = await page(PAGE + '?enseignant=1&exercice=dist-01');
    await charger(p, 'dist-01', 'vide');
    await p.click('.btn-commentaire');
    await pause(300);
    await p.keyboard.type('Ma note pour plus tard');
    await p.evaluate(() => {
      const ws = Blockly.getMainWorkspace();
      Blockly.common.setSelected(ws.getTopBlocks(false).find((b) => b.type === 'demarrage'));
    });
    await p.click('.btn-commentaire');
    await pause(300);
    await p.keyboard.type('Ici on prépare');
    await p.evaluate(() => document.activeElement.blur()); // le texte est pris quand on quitte la bulle
    await pause(300);
    const eleve = await p.evaluate(() => {
      const prog = LaboBlocs.depuisBlockly(Blockly.serialization.workspaces.save(Blockly.getMainWorkspace())).programme;
      return { notes: (prog.notes || []).map((n) => n.texte), demarrage: prog.fils.find((f) => f.quand === 'demarrage').commentaire };
    });
    verifier(eleve.notes.join() === 'Ma note pour plus tard' && eleve.demarrage === 'Ici on prépare', JSON.stringify(eleve));
    await p.close();
    // Professeur : onglet « Programme de départ », une note, gardée quand on change d'onglet.
    const e = await page(pathToFileURL(path.join(RACINE, 'site', 'editeur.html')).href);
    await e.evaluate(() => localStorage.clear());
    await e.reload();
    await pause(800);
    await e.click('[data-choix="connu"]');
    await pause(800);
    await e.click('.ed-onglet-blocs[data-onglet="depart"]');
    await pause(300);
    const aide = await e.$eval('.ed-aide-blocs', (x) => x.textContent);
    await e.click('.ed-commentaire');
    await pause(300);
    await e.keyboard.type('Indice du professeur');
    await pause(300);
    await e.click('.ed-onglet-blocs[data-onglet="solution"]');
    await pause(300);
    const solution = await e.evaluate(() => Blockly.getMainWorkspace().getTopComments().length);
    await e.click('.ed-onglet-blocs[data-onglet="depart"]');
    await pause(300);
    const depart = await e.evaluate(() => Blockly.getMainWorkspace().getTopComments().map((c) => c.getText()));
    await e.close();
    verifier(/Ce que chaque élève trouve/.test(aide) && solution === 0 && depart.join() === 'Indice du professeur', JSON.stringify({ aide, solution, depart }));
    return `élève : note « ${eleve.notes[0]} », commentaire sur « Au démarrage » : « ${eleve.demarrage} » ; professeur : programme de départ avec la note « ${depart[0]} » (la solution n’en a pas)`;
  });

  await critere('Éditeur : un exercice complet créé sans code, publié, puis réussi par un élève', async () => {
    // Copie de Labo Blocs : le dépôt n'est pas modifié.
    const copie = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'labo-blocs-recette-'));
    for (const d of ['site', 'noyau', 'interface', 'parcours']) fs.cpSync(path.join(RACINE, d), path.join(copie, d), { recursive: true });
    try {
      const p = await page(pathToFileURL(path.join(copie, 'site', 'editeur.html')).href);
      await p.evaluate(() => localStorage.clear());
      await p.reload();
      await pause(800);
      await p.click('[data-choix="connu"]');
      await pause(800);
      // Après le dernier exercice (13B) : « Ajouter ».
      await p.click('.ed-exercices li[data-k="13"]');
      await pause(300);
      await p.click('.btn-ajouter');
      await pause(500);
      const id = await p.evaluate(() => LaboBlocs.editeurParcours.etat.paquet.exercices[14].id);
      const remplir = async (sel, valeur) => {
        await p.click(sel, { clickCount: 3 });
        await p.keyboard.press('Backspace');
        await p.type(sel, valeur);
      };
      await remplir('[data-champ="titre"]', 'Le feu rouge');
      await remplir('[data-champ="consigne"]', 'Allumer la LED de la broche D4 pendant 2 secondes, puis l’éteindre.');
      await p.click('.btn-ajouter-composant');
      await pause(200);
      await p.select('.champ-broche-composant', 'D4');
      await pause(200);
      await remplir('.champ-indice[data-n="0"]', 'La LED s’allume, on attend, puis elle s’éteint.');
      await remplir('.champ-indice[data-n="1"]', 'Blocs : « contrôler la LED », « attendre », « contrôler la LED ».');
      // Solution : les blocs posés dans « Au démarrage » (comme le ferait le professeur à la souris).
      await p.evaluate(() => {
        const ws = LaboBlocs.editeurParcours.etat.editeur.ws;
        Blockly.serialization.workspaces.load(
          LaboBlocs.versBlockly({ demarrage: [{ bloc: 'led_etat', broche: 'D4', etat: 1 }, { bloc: 'attendre', duree: 2 }, { bloc: 'led_etat', broche: 'D4', etat: 0 }], boucle: [] }),
          ws,
        );
      });
      await pause(300);
      // Scénario : vérifier allumée, attendre 2,5 s, vérifier éteinte.
      const ajouter = async (sorte) => {
        await p.select('.ed-sorte-etape[data-s="0"]', sorte);
        await p.click('[data-action="ajouter-etape"][data-s="0"]');
        await pause(150);
      };
      await ajouter('verifier');
      await ajouter('attendre');
      await p.$eval('[data-s="0"][data-k="1"][data-champ="attendre"]', (e) => {
        e.value = '2.5';
        e.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await pause(150);
      await ajouter('verifier');
      await p.select('[data-s="0"][data-k="2"][data-champ="verifier"][data-quoi="valeur"]', '0');
      await pause(150);
      const phrases = await p.$$eval('.ed-etape-phrase', (l) => l.map((x) => x.textContent));
      await p.click('.btn-tester');
      await pause(300);
      const resultat = await texte(p, '.ed-resultats');
      verifier(/la solution passe les 3 étapes/.test(resultat), resultat);
      // Publier : le dossier de Labo Blocs est simulé dans le stockage du navigateur.
      await p.evaluate(async () => {
        const racine = await navigator.storage.getDirectory();
        for await (const [n] of racine.entries()) await racine.removeEntry(n, { recursive: true });
        const lb = await racine.getDirectoryHandle('labo-blocs', { create: true });
        await lb.getDirectoryHandle('parcours', { create: true });
        window.showDirectoryPicker = async () => lb;
      });
      await p.click('.btn-publier');
      await pause(400);
      await p.click('.btn-confirmer-publier');
      await pause(800);
      const ecrit = await p.evaluate(async () => {
        const racine = await navigator.storage.getDirectory();
        const dossier = await (await (await racine.getDirectoryHandle('labo-blocs')).getDirectoryHandle('parcours')).getDirectoryHandle('distributeur');
        return (await (await dossier.getFileHandle('parcours.js')).getFile()).text();
      });
      verifier(ecrit.includes('Le feu rouge') && ecrit.includes('"versionParcours": "1.4.0"'), 'parcours.js non écrit');
      fs.writeFileSync(path.join(copie, 'parcours', 'distributeur', 'parcours.js'), ecrit);
      await p.close();
      // L'élève (mode enseignant pour aller droit à l'exercice) : consigne, palette, vérification réussie.
      const eleve = await page(pathToFileURL(path.join(copie, 'site', 'index.html')).href + `?enseignant=1&exercice=${id}`);
      const consigne = await texte(eleve, '.consigne-texte');
      verifier(/D4 pendant 2 secondes/.test(consigne), consigne);
      await charger(eleve, id, 'solution');
      await eleve.click('.btn-verifier');
      await pause(300);
      verifier(await eleve.$eval('.resultat', (e) => e.classList.contains('reussi')), 'la solution ne réussit pas chez l’élève');
      // Un programme vide échoue avec la phrase des scénarios du professeur.
      await charger(eleve, id, 'vide');
      await eleve.click('.btn-verifier');
      await pause(300);
      const ecart = await texte(eleve, '.resultat');
      verifier(/LED D4 devrait être allumée/.test(ecart), ecart);
      await eleve.close();
      return `exercice ${id} : ${phrases.join(' · ')} ; version 1.4.0 publiée ; chez l’élève : réussite, et « ${ecart.slice(0, 70)}… » pour un programme vide`;
    } finally {
      fs.rmSync(copie, { recursive: true, force: true });
    }
  });

  // ---------- Jalon 3 : cartes (carte virtuelle à la place du câble USB) ----------

  const etatCarte = (p) => p.$eval('.panneau-carte', (e) => ({ cle: e.dataset.etat, titre: (e.querySelector('.pc-titre') || {}).textContent, message: (e.querySelector('.pc-message') || {}).textContent }));
  // Attend la fin d'une action : un état nouveau (ou un nouveau message) qui n'est pas une attente.
  let dernierEtat = '';
  async function attendreCarte(p, pasCes) {
    let e = null;
    for (let i = 0; i < 80; i++) {
      e = await etatCarte(p);
      const cle = e.cle + e.message;
      if (!pasCes.includes(e.cle) && (cle !== dernierEtat || i > 12)) break;
      await pause(250);
    }
    dernierEtat = e.cle + e.message;
    return e;
  }
  const ATTENTE = ['connexion', 'installation', 'envoi', 'choisir'];
  // « Vider la carte » : la carte peut repasser un instant par « connectée » avant « vidée ».
  const ATTENTE_VIDAGE = [...ATTENTE, 'connectee', 'envoye'];
  async function ouvrirDansLaCarte(parcours, exercice, carte) {
    const p = await page(PAGE + `?${parcours ? 'parcours=' + parcours + '&' : ''}enseignant=1&exercice=${exercice}`, { carte });
    await charger(p, exercice, 'solution');
    await p.click('.btn-mode[data-mode="carte"]');
    await pause(200);
    return p;
  }
  const octetsSolution = (p, id) =>
    p.evaluate((id) => {
      const ex = LaboBlocs.app.paquet.exercices.find((e) => e.id === id);
      return Array.from(LaboBlocs.codeOctet.compiler(ex.solutionReference, { composants: ex.composants, boutonsVersMasse: ex.boutonsVersMasse }).octets, (x) => x.toString(16).padStart(2, '0')).join('');
    }, id);

  await critere('Dans la carte · Arduino Uno neuve : programme de la carte installé, programme de l’élève envoyé, carte vidée', async () => {
    const p = await ouvrirDansLaCarte(null, 'dist-03', { modele: 'uno' });
    verifier((await etatCarte(p)).cle === 'aucune', 'état de départ');
    await p.click('.panneau-carte [data-action="connecter"]');
    let e = await attendreCarte(p, ATTENTE);
    verifier(e.cle === 'a-installer', `après connexion : ${e.cle} ${e.message}`);
    await p.click('.panneau-carte [data-action="installer"]');
    e = await attendreCarte(p, ATTENTE);
    verifier(e.cle === 'connectee', `après installation : ${e.cle} ${e.message}`);
    const installe = await p.evaluate(() => carteVirtuelle.firmware);
    await p.click('.panneau-carte [data-action="envoyer"]');
    e = await attendreCarte(p, ATTENTE);
    verifier(e.cle === 'envoye', `après envoi : ${e.cle} ${e.message}`);
    const garde = await p.evaluate(() => carteVirtuelle.programmeHex());
    verifier(garde && garde === (await octetsSolution(p, 'dist-03')), 'le programme gardé par la carte n’est pas celui de l’élève');
    await p.click('.panneau-carte [data-action="vider"]');
    e = await attendreCarte(p, ATTENTE_VIDAGE);
    verifier(e.cle === 'vide' && !(await p.evaluate(() => carteVirtuelle.programmeHex())), `après « Vider la carte » : ${e.cle}`);
    await p.close();
    return `programme de la carte ${installe.version} (${installe.nom}) installé par le câble ; ${garde.length / 2} octets envoyés et gardés ; carte vidée`;
  });

  await critere('Dans la carte · mBot : envoi du programme et « Vider la carte »', async () => {
    const p = await ouvrirDansLaCarte('decouverte-mbot', 'mbot-03', { modele: 'mcore', firmware: '0.3' });
    await p.click('.panneau-carte [data-action="connecter"]');
    let e = await attendreCarte(p, ATTENTE);
    verifier(e.cle === 'connectee', `connexion : ${e.cle} ${e.message}`);
    await p.click('.panneau-carte [data-action="envoyer"]');
    e = await attendreCarte(p, ATTENTE);
    const garde = await p.evaluate(() => carteVirtuelle.programmeHex());
    verifier(e.cle === 'envoye' && garde === (await octetsSolution(p, 'mbot-03')), `envoi : ${e.cle}`);
    await p.click('.panneau-carte [data-action="vider"]');
    e = await attendreCarte(p, ATTENTE_VIDAGE);
    verifier(e.cle === 'vide' && /robot/.test(e.message), `vidage : ${e.cle}`);
    await p.close();
    return `${garde.length / 2} octets envoyés, puis carte vidée : « ${e.message.slice(0, 60)}… »`;
  });

  await critere('Dans la carte · micro:bit V2 : fichier du programme de la carte à copier, envoi, vidage', async () => {
    const p = await ouvrirDansLaCarte('decouverte-microbit', 'mb-03', { modele: 'microbit-v2' });
    await p.click('.panneau-carte [data-action="connecter"]');
    let e = await attendreCarte(p, ATTENTE);
    verifier(e.cle === 'a-installer' && /MICROBIT/.test(e.message), `connexion : ${e.cle} ${e.message}`);
    await p.click('.panneau-carte [data-action="installer"]');
    e = await attendreCarte(p, ATTENTE);
    verifier(/\.hex/.test(e.message), 'fichier non proposé : ' + e.message);
    await p.evaluate(() => carteVirtuelle.copierFichier('0.3'));
    await p.click('.panneau-carte [data-action="reconnecter"]');
    e = await attendreCarte(p, ATTENTE);
    verifier(e.cle === 'connectee', `après copie : ${e.cle} ${e.message}`);
    await p.click('.panneau-carte [data-action="envoyer"]');
    e = await attendreCarte(p, ATTENTE);
    const garde = await p.evaluate(() => carteVirtuelle.programmeHex());
    verifier(e.cle === 'envoye' && garde === (await octetsSolution(p, 'mb-03')), `envoi : ${e.cle}`);
    await p.click('.panneau-carte [data-action="vider"]');
    e = await attendreCarte(p, ATTENTE_VIDAGE);
    verifier(e.cle === 'vide', `vidage : ${e.cle}`);
    await p.close();
    return `fichier à copier sur MICROBIT, puis ${garde.length / 2} octets envoyés et carte vidée`;
  });

  await critere('Dans la carte · erreurs USB en français, avec la prochaine action', async () => {
    const phrases = [];
    const cas = [
      ['carte déjà utilisée', null, 'dist-02', { modele: 'uno', firmware: '0.2', occupee: true }, 'occupee', /Ferme-le, puis réessaie/],
      ['carte pas à jour', null, 'dist-02', { modele: 'uno', firmware: '0.1' }, 'pas-a-jour', /Installer le programme de la carte/],
      ['mBot sans l’afficheur (0.2)', 'decouverte-mbot', 'mbot-03', { modele: 'mcore', firmware: '0.2' }, 'pas-a-jour', /Installer le programme de la carte/],
      ['micro:bit sans le dessin (0.2)', 'decouverte-microbit', 'mb-01', { modele: 'microbit-v2', firmware: '0.2' }, 'pas-a-jour', /Enregistrer le fichier/],
      ['mauvaise carte', 'decouverte-microbit', 'mb-01', { modele: 'uno', firmware: '0.2' }, 'mauvaise-carte', /Branche la bonne carte/],
    ];
    for (const [nom, parcours, ex, carte, cle, attendu] of cas) {
      const p = await ouvrirDansLaCarte(parcours, ex, carte);
      await p.click('.panneau-carte [data-action="connecter"]');
      const e = await attendreCarte(p, ATTENTE);
      verifier(e.cle === cle && attendu.test(e.message), `${nom} : ${e.cle} — ${e.message}`);
      const bouton = await p.$eval('.panneau-carte button', (b) => b.textContent);
      phrases.push(`${nom} : « ${e.message.slice(0, 50)}… » [${bouton}]`);
      await p.close();
    }
    return phrases.join(' · ');
  });

  await critere('Simulateur · micro:bit (écran, bouton A, capteurs) et mBot (moteurs, distance)', async () => {
    const p = await page(PAGE + '?parcours=decouverte-microbit&enseignant=1&exercice=mb-01');
    await charger(p, 'mb-01', 'solution');
    await p.click('.btn-lancer');
    await pause(300);
    const a = await p.$('.mb-bouton[data-entree="A"]');
    const r = await a.boundingBox();
    await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
    await p.mouse.down();
    await pause(400);
    const pendant = await p.evaluate(() => ({ ecran: document.querySelector('.mb-ecran').getAttribute('aria-label'), led: document.querySelector('.composant[data-broche="P0"] .pastille-etat').textContent }));
    await p.mouse.up();
    await pause(300);
    const apres = await p.evaluate(() => document.querySelector('.mb-ecran').getAttribute('aria-label'));
    verifier(/16 points/.test(pendant.ecran) && /Allumée/.test(pendant.led) && /éteint/.test(apres), JSON.stringify({ pendant, apres }));
    await p.close();
    const m = await page(PAGE + '?parcours=decouverte-mbot&enseignant=1&exercice=mbot-03');
    await charger(m, 'mbot-03', 'solution');
    await m.click('.btn-lancer');
    await pause(400);
    const roule = await m.$eval('[data-etat="moteur gauche"]', (e) => e.textContent);
    await m.evaluate(() => {
      const r = document.querySelector('[data-capteur="distance"]');
      r.value = 10;
      r.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await pause(400);
    const arrete = await m.$eval('[data-etat="moteur gauche"]', (e) => e.textContent);
    verifier(roule === '50 % en avant' && arrete === 'arrêté', `${roule} / ${arrete}`);
    await m.click('.btn-verifier');
    await pause(400);
    verifier(await m.$eval('.resultat', (e) => e.classList.contains('reussi')), 'la solution de l’exercice mBot ne réussit pas');
    await m.close();
    return `micro:bit : bouton A tenu → cœur (16 points) et LED P0 allumée ; mBot : « ${roule} », obstacle à 10 cm → « ${arrete} », vérification réussie`;
  });

  await critere('Afficheur LED du mBot (port 4) : dessin à cliquer, simulateur, nombre ; envoyé en direct au robot (0.3)', async () => {
    const p = await page(PAGE + '?parcours=decouverte-mbot&enseignant=1&exercice=mbot-04', { carte: { modele: 'mcore', firmware: '0.3' } });
    const categories = await p.$$eval('.cat-libelle', (l) => l.map((x) => x.textContent.trim()));
    verifier(categories.includes('Afficheur'), 'catégorie Afficheur absente : ' + categories.join(', '));
    await p.evaluate(() => {
      const L = LaboBlocs;
      const ex = L.app.paquet.exercices.find((e) => e.id === 'mbot-04');
      const vide = '0'.repeat(32);
      L.app.ecranExercice.editeur.charger(ex, L.versBlockly({ demarrage: [{ bloc: 'mbot_matrice_dessin', dessin: vide }, { bloc: 'attendre', duree: 1.5 }, { bloc: 'mbot_matrice_nombre', valeur: 3.14 }], boucle: [] }));
    });
    // Un clic sur le petit dessin du bloc ouvre la grille ; on allume le point en haut à gauche et celui en bas à droite.
    const champ = await p.evaluate(() => {
      const b = Blockly.getMainWorkspace().getAllBlocks(false).find((x) => x.type === 'mbot_matrice_dessin');
      const r = b.getField('DESSIN').getSvgRoot().getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await p.mouse.click(champ.x, champ.y);
    await p.waitForSelector('.dessin-point', { visible: true, timeout: 3000 });
    await pause(200);
    await p.click('.dessin-point[aria-label="point colonne 1, ligne 1"]');
    await p.click('.dessin-point[aria-label="point colonne 16, ligne 8"]');
    const compte = await p.$eval('.dessin-compte', (x) => x.textContent);
    const valeur = await p.evaluate(() => Blockly.getMainWorkspace().getAllBlocks(false).find((x) => x.type === 'mbot_matrice_dessin').getFieldValue('DESSIN'));
    verifier(valeur === '01' + '0'.repeat(28) + '80' && compte === '2 points allumés', `dessin : ${valeur} (${compte})`);
    await p.click('.dessin-fermer');
    verifier(!(await p.$('.blocklyDessinMatrice')), 'la fenêtre du dessin ne se ferme pas');
    const largeur = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    await p.click('.btn-lancer');
    await pause(400);
    const dessin = await p.$eval('.matrice-points', (x) => x.getAttribute('aria-label'));
    const coins = await p.$$eval('.matrice-point', (l) => [l[0].classList.contains('allume'), l[127].classList.contains('allume')]);
    await pause(1500);
    const nombre = await p.$eval('.matrice-points', (x) => x.getAttribute('aria-label'));
    verifier(dessin === 'Afficheur : 2 points allumés' && coins.every(Boolean) && /Afficheur : \d+ points allumés/.test(nombre) && nombre !== dessin, `${dessin} / ${coins} / ${nombre}`);
    verifier(largeur, 'la page déborde en largeur');
    // En direct par le câble : le dessin part en deux commandes, le nombre en centièmes.
    await p.click('.btn-mode[data-mode="direct"]');
    await p.click('.panneau-carte [data-action="connecter"]');
    const e = await attendreCarte(p, ATTENTE);
    verifier(e.cle === 'connectee', 'connexion : ' + e.cle + ' ' + e.message);
    await p.click('.btn-lancer');
    await pause(1900);
    const envoyes = await p.evaluate(() => carteVirtuelle.extensions.filter((x) => /^X 1 1[0-5] /.test(x)));
    verifier(envoyes.join(' | ') === 'X 1 10 1 0 0 0 | X 1 11 0 0 0 32768 | X 1 12 314', 'envoyé : ' + envoyes.join(' | '));
    await p.close();
    return `palette : catégorie Afficheur ; grille : ${compte} → « ${valeur} » ; simulateur : « ${dessin} », puis « ${nombre} » (3,14) ; en direct : ${envoyes.join(' · ')}`;
  });

  await critere('micro:bit : dessin 5 × 5 à cliquer, montré par l’écran du simulateur, envoyé en direct (0.3)', async () => {
    const p = await page(PAGE + '?parcours=decouverte-microbit&enseignant=1&exercice=mb-04', { carte: { modele: 'microbit-v2', firmware: '0.3' } });
    await p.evaluate(() => {
      const L = LaboBlocs;
      const ex = L.app.paquet.exercices.find((e) => e.id === 'mb-04');
      L.app.ecranExercice.editeur.charger(ex, L.versBlockly({ demarrage: [{ bloc: 'mb_dessin', dessin: '0'.repeat(25) }], boucle: [] }));
    });
    const champ = await p.evaluate(() => {
      const b = Blockly.getMainWorkspace().getAllBlocks(false).find((x) => x.type === 'mb_dessin');
      const r = b.getField('DESSIN').getSvgRoot().getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await p.mouse.click(champ.x, champ.y);
    await p.waitForSelector('.dessin-point', { visible: true, timeout: 3000 });
    await pause(200);
    const nb = await p.$$eval('.dessin-point', (l) => l.length);
    for (const [x, y] of [[1, 1], [3, 3], [5, 5]]) await p.click(`.dessin-point[aria-label="point colonne ${x}, ligne ${y}"]`);
    const valeur = await p.evaluate(() => Blockly.getMainWorkspace().getAllBlocks(false).find((x) => x.type === 'mb_dessin').getFieldValue('DESSIN'));
    await p.click('.dessin-fermer');
    verifier(nb === 25 && valeur === '1000000000001000000000001', `grille de ${nb} points, dessin « ${valeur} »`);
    await p.click('.btn-lancer');
    await pause(300);
    const ecran = await p.$eval('.mb-ecran', (x) => x.getAttribute('aria-label'));
    verifier(/3 points allumés/.test(ecran), 'écran : ' + ecran);
    await p.click('.btn-mode[data-mode="direct"]');
    await p.click('.panneau-carte [data-action="connecter"]');
    const e = await attendreCarte(p, ATTENTE);
    verifier(e.cle === 'connectee', 'connexion : ' + e.cle + ' ' + e.message);
    await p.click('.btn-lancer');
    await pause(500);
    const envoye = await p.evaluate(() => carteVirtuelle.extensions.find((x) => /^X 2 15 /.test(x)));
    verifier(envoye === 'X 2 15 4097 512', 'envoyé : ' + envoye);
    await p.close();
    return `grille de ${nb} points → « ${valeur} » ; simulateur : « ${ecran} » ; en direct : « ${envoye} »`;
  });

  await critere('Clavier de l’ordinateur : le mBot piloté aux flèches (simulateur, vérification, En direct)', async () => {
    const p = await page(PAGE + '?parcours=decouverte-mbot&enseignant=1&exercice=mbot-05', { carte: { modele: 'mcore', firmware: '0.3' } });
    const categories = await p.$$eval('.cat-libelle', (l) => l.map((x) => x.textContent.trim()));
    verifier(categories.includes('Clavier'), 'catégorie Clavier absente : ' + categories.join(', '));
    await charger(p, 'mbot-05', 'solution');
    await pause(200);
    await p.click('.btn-lancer');
    await pause(300);
    await p.keyboard.down('ArrowUp');
    await pause(400);
    const haut = await p.evaluate(() => ({ moteur: document.querySelector('[data-etat="moteur gauche"]').textContent, clavier: document.querySelector('.simu-clavier').textContent, defile: document.querySelector('.colonne-test').scrollTop }));
    await p.keyboard.up('ArrowUp');
    await pause(300);
    const lache = await p.$eval('[data-etat="moteur gauche"]', (x) => x.textContent);
    verifier(haut.moteur === '50 % en avant' && /flèche haut/.test(haut.clavier) && lache === 'arrêté', JSON.stringify({ haut, lache }));
    await p.click('.btn-verifier');
    await pause(400);
    verifier(await p.$eval('.resultat', (e) => e.classList.contains('reussi')), 'la solution de l’exercice au clavier ne réussit pas');
    const modes = await p.$$eval('.btn-mode', (l) => l.filter((b) => !b.hidden).map((b) => b.dataset.mode));
    verifier(modes.join() === 'simulateur,direct', 'modes : ' + modes.join());
    // Petit écran (zone des blocs basse) : la longue liste des touches sort de la zone, elle n'est pas coupée.
    await p.evaluate(() => (document.querySelector('.resultat').hidden = true));
    await p.setViewport({ width: 1280, height: 620 });
    await pause(300);
    const champ = await p.evaluate(() => {
      const ws = Blockly.getMainWorkspace();
      const b = ws.getAllBlocks(false).find((x) => x.type === 'touche_appuyee');
      ws.centerOnBlock(b.id);
      const r = b.getField('TOUCHE').getSvgRoot().getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await p.mouse.click(champ.x, champ.y);
    await pause(500);
    const liste = await p.evaluate(() => {
      const d = document.querySelector('.blocklyDropDownDiv');
      const r = d.getBoundingClientRect();
      const visibles = [r.top + 8, r.bottom - 8].map((y) => d.contains(document.elementFromPoint(r.left + r.width / 2, y)));
      return { hauteur: Math.round(r.height), visibles };
    });
    await p.keyboard.press('Escape');
    await p.setViewport({ width: 1366, height: 768 });
    verifier(liste.hauteur > 150 && liste.visibles.every(Boolean), 'liste des touches coupée : ' + JSON.stringify(liste));
    // En direct (câble) : la flèche haut fait partir l'ordre des moteurs, rien d'autre (le clavier reste dans l'ordinateur).
    await p.click('.btn-mode[data-mode="direct"]');
    await p.click('.panneau-carte [data-action="connecter"]');
    const e = await attendreCarte(p, ATTENTE);
    verifier(e.cle === 'connectee', 'connexion : ' + e.cle);
    await p.click('.btn-lancer');
    await pause(500);
    await p.keyboard.down('ArrowUp');
    await pause(500);
    const avance = await p.evaluate(() => carteVirtuelle.extensions.slice(-1)[0]);
    await p.keyboard.up('ArrowUp');
    await pause(500);
    const arret = await p.evaluate(() => carteVirtuelle.extensions.slice(-1)[0]);
    const clavierEnvoye = await p.evaluate(() => carteVirtuelle.extensions.some((x) => /^X 4 /.test(x)));
    verifier(avance === 'X 1 1 50 50' && arret === 'X 1 1 0 0' && !clavierEnvoye, `${avance} / ${arret} / clavier envoyé : ${clavierEnvoye}`);
    await p.close();
    return `palette : catégorie Clavier ; simulateur : flèche haut tenue → « ${haut.moteur} » (« ${haut.clavier} »), relâchée → « ${lache} » ; vérification réussie ; liste des touches entière sur un petit écran (${liste.hauteur} px) ; modes ${modes.join(', ')} ; en direct : « ${avance} » puis « ${arret} »`;
  });

  await critere('Joystick (Uno A0, A1, D2) : manche tiré dans le simulateur, vérification « Régler : joystick », axes relus en direct', async () => {
    const p = await page(PAGE + '?enseignant=1&exercice=dist-01', { carte: { modele: 'uno', firmware: '0.2' } });
    // Exercice construit dans la page : poussé vers le haut → LED D9, bouton du joystick → LED D10.
    await p.evaluate(() => {
      const L = LaboBlocs;
      const ex = L.app.paquet.exercices.find((e) => e.id === 'dist-01');
      const si = (condition, broche) => ({ bloc: 'si_sinon', condition, alors: [{ bloc: 'led_etat', broche, etat: 1 }], sinon: [{ bloc: 'led_etat', broche, etat: 0 }] });
      Object.assign(ex, {
        composants: [L.nouveauJoystick('uno'), { type: 'led', broche: 'D9' }, { type: 'led', broche: 'D10' }],
        blocsAutorises: ['joystick_direction', 'joystick_bouton', 'joystick_position', 'quand_joystick', 'si_sinon', 'led_etat'],
        solutionReference: { demarrage: [], boucle: [si({ bloc: 'joystick_direction', direction: 'haut' }, 'D9'), si({ bloc: 'joystick_bouton' }, 'D10')] },
        scenarios: [{ nom: 'Joystick', etapes: [{ regler: { joystick: 1 } }, { verifier: { D9: 1 } }, { regler: { joystick: 0 } }, { verifier: { D9: 0 } }, { maintenir: 'D2' }, { verifier: { D10: 1 } }] }],
        modes: ['simulateur', 'direct'],
      });
      L.app.ecranExercice.ouvrir(ex);
    });
    await pause(300);
    const categories = await p.$$eval('.cat-libelle', (l) => l.map((x) => x.textContent.trim()));
    verifier(categories.includes('Joystick'), 'catégorie Joystick absente : ' + categories.join(', '));
    await charger(p, 'dist-01', 'solution');
    await pause(200);
    await p.click('.btn-lancer');
    await pause(300);
    // Le manche tiré vers le haut à la souris, puis lâché (il revient au centre).
    const r = await p.$eval('.joystick-plateau', (x) => { const b = x.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, h: b.height }; });
    await p.mouse.move(r.x, r.y);
    await p.mouse.down();
    await p.mouse.move(r.x, r.y - r.h / 2, { steps: 4 });
    await pause(400);
    const tire = await p.evaluate(() => ({ led: document.querySelector('.composant[data-broche="D9"] .pastille-etat').textContent, joystick: document.querySelector('.composant-joystick .pastille-etat').textContent }));
    await p.mouse.up();
    await pause(400);
    const lache = await p.evaluate(() => ({ led: document.querySelector('.composant[data-broche="D9"] .pastille-etat').textContent, joystick: document.querySelector('.composant-joystick .pastille-etat').textContent }));
    verifier(/Allumée/.test(tire.led) && /Y : 100/.test(tire.joystick) && /Éteinte/.test(lache.led) && /X : 0 · Y : 0/.test(lache.joystick), JSON.stringify({ tire, lache }));
    // Le bouton du joystick (SW) se tient comme un bouton poussoir.
    const sw = await p.$('.composant-joystick .bouton-poussoir');
    const b = await sw.boundingBox();
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await p.mouse.down();
    await pause(300);
    const d10 = await texte(p, '.composant[data-broche="D10"] .pastille-etat');
    await p.mouse.up();
    verifier(/Allumée/.test(d10), 'bouton du joystick : D10 ' + d10);
    await p.click('.btn-recommencer');
    await p.click('.btn-verifier');
    await pause(500);
    verifier(await p.$eval('.resultat', (e) => e.classList.contains('reussi')), 'la solution au joystick ne réussit pas');
    await p.evaluate(() => (document.querySelector('.resultat').hidden = true));
    // En direct : la carte relit A0 et A1 (« RA 14 », « RA 15 ») ; le joystick poussé vers le haut allume la vraie LED.
    await p.click('.btn-mode[data-mode="direct"]');
    await p.click('.panneau-carte [data-action="connecter"]');
    const e = await attendreCarte(p, ATTENTE);
    verifier(e.cle === 'connectee', 'connexion : ' + e.cle);
    await p.click('.btn-lancer');
    await pause(600);
    await p.evaluate(() => (carteVirtuelle.analogiques[15] = 1023));
    await pause(600);
    const haut = await p.evaluate(() => carteVirtuelle.sorties);
    const lu = await p.evaluate(() => ['RA 14', 'RA 15', 'M 2 P'].map((l) => carteVirtuelle.journal.includes(l)));
    verifier(haut['9'] === 1 && lu.every(Boolean), `sorties ${JSON.stringify(haut)} ; RA 14, RA 15, M 2 P : ${lu}`);
    await p.click('.panneau-carte [data-action="arreter-direct"]');
    await pause(300);
    await p.close();
    return `palette : catégorie Joystick ; manche tiré vers le haut → « ${tire.joystick} », D9 « ${tire.led} » ; lâché → « ${lache.joystick} » ; bouton du joystick → D10 allumée ; vérification réussie ; en direct : RA 14 / RA 15 relus, D9 allumée`;
  });

  // ---------- Jalon 4 : En direct (carte virtuelle) ----------

  const sorties = (p) => p.evaluate(() => JSON.stringify(carteVirtuelle.sorties));

  await critere('Un même exercice : simulateur, puis En direct, puis Dans la carte (Uno, exercice 7)', async () => {
    const p = await page(PAGE + '?enseignant=1&exercice=dist-07', { carte: { modele: 'uno', firmware: '0.2' } });
    await charger(p, 'dist-07', 'solution');
    // 1. Simulateur : la vérification réussit.
    await p.click('.btn-verifier');
    await pause(400);
    verifier(await p.$eval('.resultat', (e) => e.classList.contains('reussi')), 'simulateur : pas de réussite');
    await p.evaluate(() => (document.querySelector('.resultat').hidden = true));
    // 2. En direct : la carte obéit, son vrai bouton (D3) allume la LED D9.
    await p.click('.btn-mode[data-mode="direct"]');
    await p.click('.panneau-carte [data-action="connecter"]');
    let e = await attendreCarte(p, ATTENTE);
    verifier(e.cle === 'connectee', 'connexion : ' + e.cle);
    await p.click('.btn-lancer');
    await pause(700);
    e = await etatCarte(p);
    verifier(e.cle === 'direct' && /câble branché/.test(e.message) && /fermes l’onglet/.test(e.message), 'bandeau du direct : ' + e.message);
    const surveillees = await p.evaluate(() => carteVirtuelle.surveillees.join(' '));
    await p.evaluate(() => carteVirtuelle.appuyer(3, 0));
    await pause(500);
    const apresAppui = await sorties(p);
    const ecranLed = await p.$eval('.composant[data-broche="D9"] .pastille-etat', (x) => x.textContent);
    await p.evaluate(() => carteVirtuelle.appuyer(3, 1));
    verifier(surveillees === '3 4' && JSON.parse(apresAppui)['9'] === 1 && /Allumée/.test(ecranLed), `surveillées ${surveillees}, sorties ${apresAppui}, écran « ${ecranLed} »`);
    // Signe de vie : la carte ne s'éteint pas toute seule pendant le direct.
    await pause(3500);
    verifier((await p.evaluate(() => carteVirtuelle.securite)) === 0, 'la carte a tout éteint faute de signe de vie');
    await p.click('.panneau-carte [data-action="arreter-direct"]');
    await pause(500);
    const fin = await p.evaluate(() => carteVirtuelle.journal.slice(-2).join(' ; '));
    verifier(/W ; OFF/.test(fin) && (await sorties(p)) === '{}', 'arrêt : ' + fin);
    // 3. Dans la carte : le même programme part dans la carte.
    await p.click('.btn-mode[data-mode="carte"]');
    await pause(200);
    await p.click('.panneau-carte [data-action="envoyer"]');
    e = await attendreCarte(p, ATTENTE);
    const garde = await p.evaluate(() => carteVirtuelle.programmeHex());
    verifier(e.cle === 'envoye' && garde === (await octetsSolution(p, 'dist-07')), 'envoi : ' + e.cle);
    await p.close();
    return `simulateur : réussi ; en direct : boutons D3 D4 surveillés, appui sur le vrai D3 → LED D9 allumée (carte et écran), signe de vie tenu 3,5 s, « Arrêter » → W, OFF ; dans la carte : ${garde.length / 2} octets envoyés`;
  });

  await critere('En direct · mBot par la clé 2.4G : moteurs, ultrasons relus, envoi par la clé ; installation au câble', async () => {
    const p = await page(PAGE + '?parcours=decouverte-mbot&enseignant=1&exercice=mbot-03', { carte: { modele: 'mcore', firmware: '0.3', cle: true } });
    await charger(p, 'mbot-03', 'solution');
    await p.evaluate(() => (carteVirtuelle.capteurs['X 1 2 3'] = 100));
    await p.click('.btn-mode[data-mode="direct"]');
    await p.click('.panneau-carte [data-action="connecter-cle"]');
    let e = await attendreCarte(p, ATTENTE);
    verifier(e.cle === 'connectee', 'connexion par la clé : ' + e.cle);
    await p.click('.btn-lancer');
    await pause(700);
    const roule = await p.evaluate(() => carteVirtuelle.extensions.slice(-1)[0]);
    await p.evaluate(() => (carteVirtuelle.capteurs['X 1 2 3'] = 8));
    await pause(600);
    const arret = await p.evaluate(() => carteVirtuelle.extensions.slice(-1)[0]);
    const tableau = await p.$eval('[data-etat="moteur gauche"]', (x) => x.textContent);
    const curseur = await p.$eval('[data-capteur="distance"]', (x) => `${x.value}${x.disabled ? ' verrouillé' : ''}`);
    verifier(roule === 'X 1 1 50 50' && arret === 'X 1 1 0 0' && tableau === 'arrêté' && curseur === '8 verrouillé', `${roule} / ${arret} / ${tableau} / ${curseur}`);
    await p.click('.btn-mode[data-mode="carte"]');
    await pause(300);
    await p.click('.panneau-carte [data-action="envoyer"]');
    e = await attendreCarte(p, ATTENTE);
    verifier(e.cle === 'envoye' && /robot/.test(e.message), 'envoi par la clé : ' + e.cle + ' ' + e.message);
    await p.close();
    // Page d'essai de la clé (professeur) : dit si la clé et le robot se parlent.
    const essai = await page(pathToFileURL(path.join(RACINE, 'site', 'essai-cle.html')).href, { carte: { modele: 'mcore', firmware: '0.3', cle: true } });
    await essai.click('#essayer');
    await essai.waitForSelector('#message:not([hidden])', { timeout: 10000 });
    const essaiCle = await essai.$eval('#message', (m) => ({ texte: m.textContent, ok: m.classList.contains('ok') }));
    verifier(essaiCle.ok && /PONG v2 0\.3 mcore/.test(essaiCle.texte), 'page d’essai de la clé : ' + essaiCle.texte);
    await essai.close();
    // Robot sans programme de base : par la clé, on demande le câble.
    const q = await page(PAGE + '?parcours=decouverte-mbot&enseignant=1&exercice=mbot-01', { carte: { modele: 'mcore', cle: true } });
    await q.click('.btn-mode[data-mode="direct"]');
    await q.click('.panneau-carte [data-action="connecter-cle"]');
    e = await attendreCarte(q, ATTENTE);
    verifier(e.cle === 'a-installer' && /câble USB/.test(e.message), 'robot neuf par la clé : ' + e.message);
    await q.close();
    return `par la clé : « ${roule} », obstacle à 8 cm → « ${arret} » (tableau : ${tableau}, curseur ${curseur}) ; envoi par la clé ; page d’essai de la clé : « ${essaiCle.texte.slice(0, 60)}… » ; robot neuf : « ${e.message.slice(0, 60)}… »`;
  });

  await critere('En direct · micro:bit : bouton A de la carte → LED P0 et cœur ; modes choisis par exercice', async () => {
    const p = await page(PAGE + '?parcours=decouverte-microbit&enseignant=1&exercice=mb-01', { carte: { modele: 'microbit-v2', firmware: '0.3' } });
    await charger(p, 'mb-01', 'solution');
    await p.click('.btn-mode[data-mode="direct"]');
    await p.click('.panneau-carte [data-action="connecter"]');
    let e = await attendreCarte(p, ATTENTE);
    verifier(e.cle === 'connectee', 'connexion : ' + e.cle);
    await p.click('.btn-lancer');
    await pause(600);
    await p.evaluate(() => (carteVirtuelle.capteurs['X 2 5'] = 1));
    await pause(600);
    const s = await sorties(p);
    const ext = await p.evaluate(() => carteVirtuelle.extensions.join(' | '));
    verifier(JSON.parse(s)['0'] === 1 && /X 2 2 3/.test(ext), `${s} ; ${ext}`);
    await p.click('.panneau-carte [data-action="arreter-direct"]');
    await pause(300);
    // Un exercice qui ne propose que le simulateur : les autres modes disparaissent.
    const modes = await p.evaluate(() => {
      const ex = LaboBlocs.app.paquet.exercices.find((x) => x.id === 'mb-02');
      ex.modes = ['simulateur'];
      LaboBlocs.app.ecranExercice.ouvrir(ex);
      return { boutons: [...document.querySelectorAll('.btn-mode')].filter((b) => !b.hidden).map((b) => b.dataset.mode), groupe: !document.querySelector('.modes').hidden };
    });
    verifier(modes.boutons.join() === 'simulateur' && !modes.groupe, JSON.stringify(modes));
    await p.close();
    return `bouton A de la vraie carte → P0 allumée et « ${ext.split(' | ').find((x) => /X 2 2/.test(x))} » ; exercice réglé « simulateur seulement » : sélecteur de modes caché`;
  });

  // ---------- Jalon 5 : outil du professeur ----------

  await critere('Professeur : classe test de 8 équipes suivie (tableau, fiche, niveau forcé, programme rejoué) et exportée', async () => {
    const { creerClasse } = require('./classe-test.js');
    const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'labo-blocs-classe-'));
    try {
      const fichiers = creerClasse(path.join(tmp, '5A')).map((f, i) => {
        const copie = path.join(tmp, `equipe${i + 1}.json`); // noms ASCII pour l'envoi de fichiers du navigateur
        fs.copyFileSync(f, copie);
        return copie;
      });
      const telechargements = path.join(tmp, 'telechargements');
      fs.mkdirSync(telechargements);
      const p = await page(pathToFileURL(path.join(RACINE, 'site', 'prof.html')).href);
      const cdp = await p.target().createCDPSession();
      await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: telechargements });
      await (await p.$('.pr-accueil .pr-fichiers')).uploadFile(...fichiers);
      await pause(800);
      const lignes = await p.$$eval('.pr-tableau tbody tr', (l) => l.length);
      const chiffres = await texte(p, '.pr-chiffres');
      const bloquees = await p.$$eval('.pr-etat-bloquee', (l) => l.map((x) => x.textContent.trim()));
      verifier(lignes === 8 && /8\s*équipes/.test(chiffres) && bloquees.length === 2, `${lignes} lignes, « ${chiffres.replace(/\s+/g, ' ')} », ${bloquees}`);
      // Fiche de Lucas · Ethan : niveau C9 forcé à 3, commentaire, programme rejoué.
      await p.evaluate(() => [...document.querySelectorAll('.pr-lien-equipe')].find((b) => /Lucas/.test(b.textContent)).click());
      await pause(300);
      await p.select('.pr-forcer[data-code="C9"]', '3');
      await p.type('.pr-commentaire', 'Beaucoup d’aide au début.');
      await pause(800);
      const note = await texte(p, '.pr-note');
      await p.click('.pr-voir');
      await pause(1200);
      const programme = await p.evaluate(() => [document.querySelector('.pr-programme').open, document.querySelector('.pr-programme .titre-exercice').textContent, document.querySelectorAll('.pr-programme .blocklyDraggable').length]);
      verifier(programme[0] && programme[2] > 1, 'programme non affiché : ' + JSON.stringify(programme));
      await p.click('.pr-programme .btn-vers-parcours');
      await p.click('.pr-retour');
      await pause(200);
      await p.click('.pr-csv');
      await p.click('.pr-carnet');
      await pause(1200);
      const noms = fs.readdirSync(telechargements);
      const csv = fs.readFileSync(path.join(telechargements, noms.find((n) => n.endsWith('.csv'))), 'utf8');
      const r = JSON.parse(fs.readFileSync(path.join(telechargements, noms.find((n) => n.endsWith('.labo-resultats.json'))), 'utf8'));
      const lucas = r.equipes.find((e) => e.eleves[0] === 'Lucas');
      verifier(csv.trim().split('\r\n').length === 9 && r.format === 'labo-blocs/resultats' && r.equipes.length === 8, `${noms.join(', ')}`);
      verifier(lucas.niveaux.C9 === 3 && /aide/.test(lucas.commentaire), JSON.stringify(lucas));
      await p.close();
      return `8 équipes, 2 bloquées ; fiche : C9 forcé à 3, ${note.replace(/\s+/g, ' ')} ; programme rejoué (« ${programme[1]} ») ; exports : ${noms.join(' + ')} (compétences ${r.competences.map((c) => c.code).join(', ')})`;
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // ---------- Accueil du professeur ----------

  await critere('Code professeur : accueil, éditeur, suivi et mode enseignant cachés sans le code ; page des élèves libre', async () => {
    const url = (f, q) => pathToFileURL(path.join(RACINE, 'site', f)).href + (q || '');
    const r = [];
    for (const [f, q] of [['accueil.html'], ['reglages.html'], ['editeur.html'], ['prof.html'], ['index.html', '?parcours=decouverte-mbot&enseignant=1'], ['index.html']]) {
      const p = await page(url(f, q), { porte: true });
      const etat = await p.evaluate(() => {
        const porte = document.querySelector('.porte-professeur');
        const autre = [...document.body.children].find((e) => !e.classList.contains('porte-professeur') && e.tagName !== 'SCRIPT');
        return { porte: !!porte, cache: !!autre && getComputedStyle(autre).visibility === 'hidden' };
      });
      r.push(`${f}${q ? ' (enseignant)' : ''} : ${etat.porte ? 'code demandé' : 'libre'}`);
      if (f === 'index.html' && !q) verifier(!etat.porte, 'la page des élèves demande un code');
      else verifier(etat.porte && etat.cache, `${f} : ${JSON.stringify(etat)}`);
      if (f === 'accueil.html') {
        await p.type('.porte-code', 'pas-le-code');
        await p.click('.porte-boite button');
        await p.waitForFunction(() => !document.querySelector('.porte-ecart').hidden, { timeout: 20000 });
        const ecart = await p.$eval('.porte-ecart', (e) => [e.textContent, getComputedStyle(e).backgroundColor, getComputedStyle(e).color]);
        verifier(!/faux|erreur/i.test(ecart[0]) && ecart[1] === 'rgb(255, 244, 220)' && (await p.$('.porte-professeur')), 'mauvais code : ' + ecart.join(' · '));
        r.push(`mauvais code : « ${ecart[0]} » (ambre)`);
      }
      await p.close();
    }
    // Code déjà donné : l'accueil s'ouvre ; « Verrouiller » redemande le code (page sans code remis à chaque chargement).
    const p = await b.newPage();
    await p.goto(url('accueil.html'));
    await p.evaluate((cle, empreinte) => localStorage.setItem(cle, empreinte), CLE_PORTE, EMPREINTE_PORTE);
    await p.reload();
    await pause(500);
    verifier(!(await p.$('.porte-professeur')), 'code mémorisé non reconnu');
    await p.evaluate(() => [...document.querySelectorAll('.ed-btn')].find((x) => /Verrouiller/.test(x.textContent)).click());
    await pause(800);
    verifier(!!(await p.$('.porte-professeur')), '« Verrouiller » sans effet');
    await p.close();
    return r.join(' ; ') + ' ; « Verrouiller » redemande le code';
  });


  await critere('Accueil de Labo Blocs : éditeur, suivi de classe, et chaque parcours à essayer en mode enseignant', async () => {
    const p = await page(pathToFileURL(path.join(RACINE, 'site', 'accueil.html')).href);
    const outils = await p.$$eval('.ed-cartes:not(.ac-parcours) a', (l) => l.map((a) => a.getAttribute('href')));
    const parcours = await p.$$eval('.ac-carte', (l) => l.map((c) => [c.querySelector('.ac-essayer').getAttribute('href'), c.querySelector('strong').textContent]));
    verifier(outils.join() === 'editeur.html,prof.html' && parcours.length >= 3 && /mBot/.test(parcours[1][1]), JSON.stringify({ outils, parcours }));
    // Réglages (classes, chemin, clé GitHub) : page à part, liée depuis le bandeau et le pied de l'accueil.
    const versReglages = await p.$$eval('a[href="reglages.html"]', (l) => l.length);
    verifier(versReglages === 2 && !(await p.$('.ac-college')) && !(await p.$('.ac-github')), `liens Réglages : ${versReglages}`);
    await p.click('.ac-carte:nth-child(2) .ac-essayer');
    await pause(1200);
    const equipe = await texte(p, '.equipe-texte');
    const titre = await p.title();
    verifier(/Mode enseignant/.test(equipe) && /mBot/.test(titre), `${equipe} · ${titre}`);
    await p.close();
    const e = await page(pathToFileURL(path.join(RACINE, 'site', 'editeur.html')).href);
    verifier(await visible(e, '.ed-vers-accueil'), 'pas de lien Accueil dans l’éditeur');
    await e.close();
    return `${parcours.map((x) => x[1]).join(', ')} ; « ${titre} » ouvert en mode enseignant ; lien Accueil dans l’éditeur ; Réglages sur une page à part`;
  });

  // ---------- Parcours ajouté par un fichier, classes et dossier réglés dans le parcours ----------

  await critere('Parcours déposé dans parcours/ (.labo-parcours.json) : publié, à l’accueil, classes et dossier du parcours', async () => {
    const { publier } = require('./publier.js');
    const { lireTexteParcours } = require('./parcours-depot.js');
    const depose = path.join(RACINE, 'parcours', 'essai-recette-1.0.0.labo-parcours.json');
    const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'labo-blocs-site-'));
    const base = lireTexteParcours(fs.readFileSync(path.join(RACINE, 'parcours', 'decouverte-mbot', 'parcours.js'), 'utf8'));
    const essai = Object.assign(base, { id: 'essai-recette', titre: 'Robot du couloir', versionParcours: '1.0.0', classes: ['4A', '4C'], cheminSauvegarde: ['{classe}', 'COMMUN', 'ROBOT', '{equipe}'] });
    essai.exercices = essai.exercices.map((e) => Object.assign({}, e, { id: 'essai-' + e.id }));
    try {
      fs.writeFileSync(depose, JSON.stringify(essai, null, 2));
      const r = publier(path.join(tmp, 'site-publie'));
      verifier(r.parcours.includes('essai-recette 1.0.0'), r.parcours.join(', '));
      const site = path.join(r.dossier, 'site');
      // Accueil : le nouveau parcours est proposé.
      const a = await page(pathToFileURL(path.join(site, 'accueil.html')).href);
      const titres = await a.$$eval('.ac-carte strong', (l) => l.map((x) => x.textContent));
      verifier(titres.includes('Robot du couloir'), titres.join(', '));
      await a.close();
      // Page des élèves avec ce parcours : ses classes et son dossier.
      const p = await page(pathToFileURL(path.join(site, 'index.html')).href + '?parcours=essai-recette', { sansDossiers: true });
      const classes = await p.$$eval('.champ-classe option', (o) => o.map((x) => x.value).filter(Boolean));
      verifier(classes.join() === '4A,4C', 'classes : ' + classes.join());
      await p.type('.champ-prenom', 'inès');
      await p.select('.champ-classe', '4C');
      await p.click('.formulaire-equipe button[type=submit]');
      await pause(200);
      const chemin = (await texte(p, '.chemin')).replace(/\s+/g, ' ') + ' › ' + (await texte(p, '.dossier-equipe-auto .nom-dossier-equipe'));
      verifier(/4C ?› ?COMMUN ?› ?ROBOT ?› ?Inès/.test(chemin), 'dossier : ' + chemin);
      await p.close();
      // Le distributeur garde les classes du site (projet.js).
      const q = await page(pathToFileURL(path.join(site, 'index.html')).href, { sansDossiers: true });
      const classesDistributeur = await q.$$eval('.champ-classe option', (o) => o.map((x) => x.value).filter(Boolean));
      verifier(classesDistributeur.length === 6 && classesDistributeur[0] === '5A', classesDistributeur.join());
      await q.close();
      return `« Robot du couloir » publié et proposé à l’accueil ; élèves : classes ${classes.join(', ')}, dossier « ${chemin} » ; distributeur : ${classesDistributeur.join(', ')}`;
    } finally {
      fs.rmSync(depose, { force: true });
      fs.rmSync(tmp, { recursive: true, force: true });
      for (const f of fs.readdirSync(path.join(RACINE, 'dist', 'parcours'))) if (f.startsWith('essai-recette')) fs.rmSync(path.join(RACINE, 'dist', 'parcours', f));
    }
  });

  // ---------- Exercice libre ----------

  await critere('Exercice libre : composants qui suivent le programme, broche en double signalée, « J’ai terminé », pas de niveau', async () => {
    const { creerProjet } = require('./nouveau-projet.js');
    const { lireTexteParcours } = require('./parcours-depot.js');
    const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'labo-blocs-libre-'));
    try {
      const base = lireTexteParcours(fs.readFileSync(path.join(RACINE, 'parcours', 'distributeur', 'parcours.js'), 'utf8'));
      const libre = { id: 'libre-1', numero: '1', titre: 'Invente ton animation', consigne: 'Invente une animation lumineuse avec des LED et un bouton.', libre: true, composants: [], blocsAutorises: ['led_etat', 'attendre', 'bouton_etat', 'si_alors', 'servo_angle'] };
      const paquet = Object.assign(base, { id: 'atelier-libre', titre: 'Atelier libre', versionParcours: '1.0.0', exercices: [libre, base.exercices[0]] });
      const fichier = path.join(tmp, 'atelier-libre-1.0.0.labo-parcours.json');
      fs.writeFileSync(fichier, JSON.stringify(paquet));
      const r = creerProjet({ dossier: path.join(tmp, 'projet'), titre: 'Atelier libre', parcours: fichier, classes: ['5A'] });
      const p = await page(pathToFileURL(path.join(r.site, 'programmation.html')).href, { sansDossiers: true });
      await p.type('.champ-prenom', 'Noé');
      await p.select('.champ-classe', '5A');
      await p.click('.formulaire-equipe button[type=submit]');
      await p.click('.btn-commencer-sans-dossier');
      await pause(300);
      const etiquette = await p.$eval('.carte-exercice', (c) => c.textContent);
      verifier(/Exercice libre/.test(etiquette), 'étiquette : ' + etiquette);
      await p.click('.carte-exercice');
      await pause(900);
      const boutons = await p.evaluate(() => [!!document.querySelector('.btn-verifier:not(.btn-terminer)').hidden, !document.querySelector('.btn-terminer').hidden]);
      verifier(boutons[0] && boutons[1], 'boutons : ' + boutons);
      const vide = await texte(p, '.composants-note');
      verifier(/Pose un bloc/.test(vide), 'aide : ' + vide);
      // L'élève pose « allumer la LED D5 » et « si le bouton D2 est appuyé » (événements de Blockly comme un vrai geste).
      const poser = (prog) =>
        p.evaluate((prog) => {
          const ws = LaboBlocs.app.ecranExercice.editeur.ws;
          Blockly.serialization.workspaces.load(LaboBlocs.versBlockly(prog), ws);
        }, prog);
      const led = (b) => ({ bloc: 'led_etat', broche: b, etat: 1 });
      await poser({ demarrage: [], boucle: [led('D5'), { bloc: 'si_alors', condition: { bloc: 'bouton_etat', broche: 'D2' }, alors: [led('D6')] }] });
      await pause(600);
      const liste = await p.$$eval('.liste-composants li', (l) => l.map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
      const cartes = await p.$$eval('.simu-composants > *', (l) => l.length);
      verifier(liste.length === 3 && /LED.*D5/.test(liste[0]) && /Bouton.*D2/.test(liste[1]) && cartes === 3, `liste ${liste.join(' | ')} ; simulateur ${cartes}`);
      // Le simulateur fait tourner le programme avec ces composants.
      await p.click('.btn-lancer');
      await pause(500);
      const d5 = await p.evaluate(() => LaboBlocs.app.ecranExercice.etat.sim && LaboBlocs.app.ecranExercice.etat.sim.sorties.D5);
      verifier(d5 === 1, 'LED D5 : ' + d5);
      // Même broche pour une LED et un bouton : message en ambre.
      await poser({ demarrage: [], boucle: [led('D2'), { bloc: 'si_alors', condition: { bloc: 'bouton_etat', broche: 'D2' }, alors: [] }] });
      await pause(600);
      const conflit = await p.$eval('.composants-note', (e) => [e.textContent, e.classList.contains('ecart'), getComputedStyle(e).backgroundColor]);
      verifier(conflit[1] && /D2 sert à deux composants/.test(conflit[0]), 'conflit : ' + conflit.join(' · '));
      // Les deux composants restent dans le simulateur, marqués « broche partagée ».
      const marques = await p.$$eval('.simu-composants .composant.conflit', (l) => l.map((x) => x.textContent.replace(/\s+/g, ' ')));
      verifier(marques.length === 2 && marques.every((m) => /Broche partagée/.test(m)), 'cartes en conflit : ' + marques.join(' | '));
      // « J'ai terminé » : enregistré, exercice suivant ouvert.
      await p.click('.btn-terminer');
      await pause(300);
      const fin = await p.evaluate(() => [document.querySelector('.resultat').className, document.querySelector('.resultat').textContent, LaboBlocs.app.session.donnees.programmation.exercices['libre-1'].statut, LaboBlocs.estDebloque(LaboBlocs.app.session.donnees, LaboBlocs.app.paquet, LaboBlocs.app.paquet.exercices[1].id)]);
      verifier(/reussi/.test(fin[0]) && /exercice libre/.test(fin[1]) && fin[2] === 'reussi' && fin[3], JSON.stringify(fin));
      const ev = await p.evaluate(() => LaboBlocs.evaluerEquipe(LaboBlocs.app.session.donnees, LaboBlocs.app.paquet).competences.flatMap((c) => c.exercices));
      verifier(!ev.includes('libre-1'), 'compté dans une compétence');
      await p.close();
      return `composants : ${liste.join(', ')} ; LED D5 allumée en simulation ; « ${conflit[0].slice(0, 60)}… » en ambre ; terminé, exercice 2 ouvert, sans niveau`;
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // ---------- Mise en ligne directe d'un parcours (GitHub simulé : rien ne part vraiment) ----------

  await critere('Mise en ligne directe : clé enregistrée dans les Réglages, « Publier » envoie le parcours dans parcours/ du dépôt', async () => {
    const fauxGithub = () => {
      window.__appelsGithub = [];
      const vrai = window.fetch;
      window.fetch = async (url, o) => {
        if (!String(url).startsWith('https://api.github.com')) return vrai(url, o);
        const methode = (o && o.method) || 'GET';
        window.__appelsGithub.push({ url: String(url), methode, corps: o && o.body ? JSON.parse(o.body) : null });
        const statut = methode === 'PUT' ? 201 : /\/contents\//.test(url) ? 404 : 200;
        return new Response(JSON.stringify({}), { status: statut, headers: { 'Content-Type': 'application/json' } });
      };
    };
    const a = await page(pathToFileURL(path.join(RACINE, 'site', 'reglages.html')).href);
    await a.evaluate(fauxGithub);
    await a.evaluate(() => localStorage.removeItem('labo-blocs-cle-github'));
    await a.click('.ac-enregistrer-cle');
    await pause(200);
    const vide = await texte(a, '.ac-message');
    await a.type('.ac-cle', 'github_pat_essai_recette');
    await a.click('.ac-enregistrer-cle');
    await pause(400);
    const enregistree = await a.evaluate(() => [document.querySelector('.ac-message').textContent, localStorage.getItem('labo-blocs-cle-github'), document.querySelector('.ac-github-etat').textContent]);
    verifier(/Colle/.test(vide) && /Clé enregistrée/.test(enregistree[0]) && enregistree[1] === 'github_pat_essai_recette', JSON.stringify(enregistree));
    await a.close();
    // Éditeur : publier « Découverte du mBot » → un PUT vers parcours/decouverte-mbot-<version>.labo-parcours.json.
    const e = await page(pathToFileURL(path.join(RACINE, 'site', 'editeur.html')).href, { sansDossiers: true });
    await e.evaluate(fauxGithub);
    await e.evaluate(() => [...document.querySelectorAll('.ed-carte-choix')].find((c) => /mBot/.test(c.textContent)).click());
    await pause(1500);
    await e.click('.btn-publier');
    await pause(1500);
    const annonce = await texte(e, '.publier-contenu');
    await e.click('.btn-confirmer-publier');
    await pause(1500);
    const fin = await e.evaluate(() => [document.querySelector('.publier-contenu').textContent, window.__appelsGithub]);
    const put = fin[1].find((x) => x.methode === 'PUT');
    verifier(/mise en ligne/.test(annonce) && put && /\/contents\/parcours\/decouverte-mbot-[\d.]+\.labo-parcours\.json$/.test(put.url) && put.corps.branch === 'main', JSON.stringify({ annonce, fin }));
    const envoye = JSON.parse(Buffer.from(put.corps.content, 'base64').toString('utf8'));
    verifier(envoye.id === 'decouverte-mbot' && /mise en ligne/.test(fin[0]), fin[0]);
    await e.evaluate(() => localStorage.removeItem('labo-blocs-cle-github'));
    await e.close();
    return `clé enregistrée (vide refusée) ; « ${fin[0].replace(/\s+/g, ' ').slice(0, 60)}… » ; envoyé : ${put.url.split('/contents/')[1]} (version ${envoye.versionParcours})`;
  });

  await critere('Page des élèves : tous les parcours, sans code professeur, chacun ouvre l’accueil de l’équipe', async () => {
    const p = await page(pathToFileURL(path.join(RACINE, 'site', 'eleves.html')).href, { porte: true, sansDossiers: true });
    const cartes = await p.$$eval('.el-carte', (l) => l.map((a) => [a.querySelector('strong').textContent, a.getAttribute('href')]));
    const porte = !!(await p.$('.porte-professeur'));
    verifier(cartes.length >= 3 && cartes.some((c) => /mBot/.test(c[0])) && !porte, JSON.stringify({ cartes, porte }));
    // Fenêtre basse : la page défile à la molette jusqu'au dernier parcours.
    await p.setViewport({ width: 1366, height: 500 });
    await p.mouse.move(600, 300);
    await p.mouse.wheel({ deltaY: 5000 });
    await pause(400);
    const dernier = await p.$$eval('.el-carte', (l) => Math.round(l[l.length - 1].getBoundingClientRect().bottom));
    verifier(dernier <= 500, `dernier parcours hors de la fenêtre (bas à ${dernier} px pour 500 px) : la page ne défile pas`);
    await p.setViewport({ width: 1366, height: 768 });
    await p.evaluate(() => [...document.querySelectorAll('.el-carte')].find((a) => /micro:bit/.test(a.textContent)).click());
    await pause(1200);
    const titre = await p.title();
    const formulaire = await visible(p, '.formulaire-equipe');
    verifier(/micro:bit/.test(titre) && formulaire && !(await p.$('.porte-professeur')), `${titre} · formulaire ${formulaire}`);
    await p.close();
    return `${cartes.length} parcours (${cartes.map((c) => c[0]).join(', ')}), la page défile jusqu’au dernier ; « Découverte de la micro:bit » ouvre l’accueil de l’équipe, sans code`;
  });

  await critere('Dossier de l’équipe : l’élève choisit le dossier du projet, Labo Blocs crée toujours le dossier de l’équipe', async () => {
    const p = await page(PAGE);
    // Dossiers simulés dans le stockage du navigateur : le dossier du projet, un dossier d'équipe déjà là, un autre.
    await p.evaluate(async () => {
      const racine = await navigator.storage.getDirectory();
      for await (const [n] of racine.entries()) await racine.removeEntry(n, { recursive: true });
      window.__dossiers = {};
      for (const n of ['DISTRIBUTEUR DE CEREALES', 'Ana_Ben', 'Documents']) window.__dossiers[n] = await racine.getDirectoryHandle(n, { create: true });
      window.showDirectoryPicker = async () => window.__dossiers[window.__choix];
    });
    await p.type('.champ-prenom', 'ana');
    await p.type('.formulaire-equipe label:nth-of-type(2) .champ-prenom', 'ben');
    await p.select('.champ-classe', '5B');
    await p.click('.formulaire-equipe button[type=submit]');
    await pause(200);
    const aide = (await texte(p, '[data-panneau="dossier"]')).replace(/\s+/g, ' ');
    verifier(/DISTRIBUTEUR DE CEREALES/.test(aide) && /Ana_Ben/.test(aide) && /ne le crée pas toi-même/.test(aide), 'aide : ' + aide);
    const choisir = async (nom) => {
      await p.evaluate((n) => (window.__choix = n), nom);
      const b = (await p.$('.dossier-resultat .btn-autre-dossier')) || (await p.$('.btn-choisir-dossier'));
      await b.click();
      await pause(500);
      return p.evaluate(() => [document.querySelector('.dossier-resultat').textContent.replace(/\s+/g, ' '), !!document.querySelector('.btn-garder'), !!document.querySelector('.btn-creer-ici'), !!document.querySelector('.dossier-resultat .confirmation')]);
    };
    const equipe = await choisir('Ana_Ben');
    verifier(/Choisis plutôt le dossier qui le contient/.test(equipe[0]) && !equipe[3], 'dossier de l’équipe : ' + equipe[0]);
    const autre = await choisir('Documents');
    verifier(/Le dossier du projet s’appelle/.test(autre[0]) && autre[2] && !autre[1] && !autre[3], 'autre dossier : ' + autre[0]);
    const projet = await choisir('DISTRIBUTEUR DE CEREALES');
    const cree = await p.evaluate(async () => {
      const d = await window.__dossiers['DISTRIBUTEUR DE CEREALES'].getDirectoryHandle('Ana_Ben');
      return JSON.parse(await (await (await d.getFileHandle('Ana_Ben.json')).getFile()).text()).equipe;
    });
    verifier(projet[3] && /Le dossier « Ana_Ben » est prêt dans « DISTRIBUTEUR DE CEREALES »/.test(projet[0]) && cree.eleves.join() === 'Ana,Ben', 'projet : ' + projet[0]);
    await p.close();
    return `dossier de l’équipe refusé (« choisis celui qui le contient ») ; autre dossier : créer dedans ou rechoisir (plus de « utiliser quand même ») ; dossier du projet : « Ana_Ben/Ana_Ben.json » créé`;
  });

  // ---------- Variables créées par les élèves ----------

  await critere('Caméra et IA : étiquettes de l’exercice, photos (webcam simulée), IA chargée depuis le dossier, solution vérifiée', async () => {
    const p = await page(PAGE + '?parcours=decouverte-camera&enseignant=1&exercice=cam-01');
    await pause(500);
    const etat = await p.evaluate(() => ({
      noms: [...document.querySelectorAll('.cam-nom')].map((x) => x.textContent),
      modes: [...document.querySelectorAll('.btn-mode')].filter((x) => !x.hidden).map((x) => x.dataset.mode),
      menu: LaboBlocs.optionsEtiquettes().map((x) => x[0]),
    }));
    verifier(etat.noms.join() === 'Rien,Pouce levé,Main ouverte' && !etat.modes.includes('carte') && etat.menu.join() === 'rien,Pouce levé,Main ouverte', JSON.stringify(etat));
    // Sans caméra : « faire comme si », puis la solution vérifiée.
    await p.click('.cam-comme[data-n="1"]');
    await charger(p, 'cam-01', 'solution');
    await p.click('.btn-verifier');
    await pause(400);
    const resultat = await texte(p, '.resultat');
    verifier(resultat.includes('Ton programme fait ce qu’on attend'), resultat);
    // Webcam simulée : l'IA (TensorFlow.js + MobileNet, copiés dans le dépôt) apprend 10 photos de « Pouce levé » et de « Rien ».
    await p.click('.cam-allumer');
    await p.waitForFunction(() => !document.querySelector('.cam-video').hidden || !document.querySelector('.cam-message').hidden && !/Chargement/.test(document.querySelector('.cam-message').textContent), { timeout: 120000 });
    verifier(await visible(p, '.cam-video'), await texte(p, '.cam-message'));
    for (const n of [1, 0]) {
      await p.click(`.cam-etiquette[data-n="${n}"] .cam-photo`);
      await p.waitForFunction((n) => /^10 photos/.test(document.querySelector(`.cam-etiquette[data-n="${n}"] .cam-nb`).textContent), { timeout: 120000 }, n);
    }
    await pause(1500);
    const vu = await texte(p, '.cam-vu');
    verifier(/L’IA reconnaît : (Rien|Pouce levé) \(\d+ %\)/.test(vu), vu);
    // « Ce que pense l'IA » en direct : une barre par étiquette, la photo la plus ressemblante ; photos qui s'ajoutent.
    const reflexion = await p.evaluate(() => ({ barres: document.querySelectorAll('.cam-barre').length, proche: !!document.querySelector('.cam-proche img'), suite: document.querySelector('.cam-suite').textContent }));
    verifier(reflexion.barres === 3 && reflexion.proche, JSON.stringify(reflexion));
    await p.click('.cam-etiquette[data-n="1"] .cam-photo');
    await p.waitForFunction(() => /^20 photos/.test(document.querySelector('.cam-etiquette[data-n="1"] .cam-nb').textContent), { timeout: 120000 });
    // En bas de la colonne (dernière étiquette), l'image de la caméra reste visible en haut : on cadre en prenant les photos.
    const cadrage = await p.evaluate(async () => {
      const c = document.querySelector('.colonne-test');
      c.scrollTop = c.scrollHeight;
      await new Promise((r) => setTimeout(r, 300));
      const zone = c.getBoundingClientRect();
      const video = document.querySelector('.cam-video').getBoundingClientRect();
      const bouton = [...document.querySelectorAll('.cam-photo')].pop().getBoundingClientRect();
      return { video: video.top >= zone.top - 1 && video.bottom <= zone.bottom, bouton: bouton.top >= video.bottom && bouton.bottom <= zone.bottom };
    });
    verifier(cadrage.video && cadrage.bouton, 'en bas de la colonne, l’image de la caméra ou le bouton de la dernière étiquette est caché : ' + JSON.stringify(cadrage));
    const enLigne = await p.evaluate((adresse) => performance.getEntriesByType('resource').filter((r) => !r.name.startsWith('file:') && !r.name.startsWith(adresse)).map((r) => r.name), ADRESSE_COLLEGE);
    verifier(!enLigne.length, 'ressources en ligne : ' + enLigne.join(', '));
    await p.click('.cam-allumer');
    // Exercice 3 : les élèves créent leurs étiquettes (menu des blocs compris).
    const q = await page(PAGE + '?parcours=decouverte-camera&enseignant=1&exercice=cam-03');
    await pause(500);
    await q.type('.cam-nouveau-nom', 'Loup');
    await q.click('.cam-nouvelle button');
    await q.type('.cam-nouveau-nom', 'loup');
    await q.click('.cam-nouvelle button');
    const libres = await q.evaluate(() => ({ noms: [...document.querySelectorAll('.cam-nom')].map((x) => x.textContent), ecart: document.querySelector('.cam-ecart').textContent, menu: LaboBlocs.optionsEtiquettes().map((x) => x[0]) }));
    verifier(libres.noms.join() === 'Rien,Loup' && /existe déjà/.test(libres.ecart) && libres.menu.join() === 'rien,Loup', JSON.stringify(libres));
    return `étiquettes ${etat.noms.join(', ')} ; modes ${etat.modes.join(', ')} ; solution réussie ; webcam simulée : « ${vu} » ; réflexion : ${reflexion.barres} barres, « ${reflexion.suite} » ; 10 + 10 photos (image de la caméra visible avec la dernière étiquette) ; étiquette créée par l’élève : ${libres.noms.slice(1).join(', ')}`;
  });

  await critere('Variables : données par le professeur (menu) ou créées par l’élève (« Créer une variable »), nom vérifié', async () => {
    const { creerProjet } = require('./nouveau-projet.js');
    const { lireTexteParcours } = require('./parcours-depot.js');
    const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'labo-blocs-variables-'));
    try {
      const base = lireTexteParcours(fs.readFileSync(path.join(RACINE, 'parcours', 'distributeur', 'parcours.js'), 'utf8'));
      const blocs = ['affecter', 'ajouter_a', 'variable', 'nombre', 'attendre', 'led_etat'];
      const ex1 = { id: 'var-1', numero: '1', titre: 'Compter', consigne: 'Crée ta variable et compte.', libre: true, composants: [], blocsAutorises: blocs, variables: [], variablesLibres: true };
      const ex2 = { id: 'var-2', numero: '2', titre: 'Le score', consigne: 'Utilise la variable score.', libre: true, composants: [], blocsAutorises: blocs, variables: ['score'] };
      const paquet = Object.assign(base, { id: 'variables', titre: 'Variables', versionParcours: '1.0.0', exercices: [ex1, ex2] });
      const fichier = path.join(tmp, 'variables-1.0.0.labo-parcours.json');
      fs.writeFileSync(fichier, JSON.stringify(paquet));
      const r = creerProjet({ dossier: path.join(tmp, 'projet'), titre: 'Variables', parcours: fichier, classes: ['5A'] });
      const p = await page(pathToFileURL(path.join(r.site, 'programmation.html')).href + '?enseignant=1&exercice=var-1', { sansDossiers: true });
      await pause(600);
      const palette = () =>
        p.evaluate(() => {
          const t = LaboBlocs.app.ecranExercice.editeur.ws.options.languageTree;
          const cat = t.contents.find((c) => c.name === 'Variables');
          return cat ? cat.contents.map((x) => (x.kind === 'button' ? 'bouton' : x.type + (x.fields && x.fields.VAR ? ':' + x.fields.VAR : ''))) : [];
        });
      // Exercice 1 : aucune variable donnée → seulement « Créer une variable » (et le nombre).
      const avant = await palette();
      verifier(avant.join() === 'bouton,nombre', 'palette avant : ' + avant.join());
      // Nom refusé (mot du langage), puis accepté (« ma vitesse » → ma_vitesse).
      const reponses = ['delay', 'ma vitesse'];
      const messages = [];
      const repondre = async (d) => {
        if (d.type() !== 'prompt') return;
        messages.push(d.message());
        await d.accept(reponses.shift());
      };
      p.removeAllListeners('dialog');
      p.on('dialog', repondre);
      await p.evaluate(() => LaboBlocs.app.ecranExercice.editeur.ws.getButtonCallback('creerVariable')());
      await pause(300);
      const apres = await palette();
      verifier(apres.join() === 'bouton,affecter:ma_vitesse,ajouter_a:ma_vitesse,variable:ma_vitesse,nombre' && /mot du langage/.test(messages[1] || ''), JSON.stringify({ apres, messages }));
      // La variable créée s'utilise dans le programme et la simulation.
      await p.evaluate(() => {
        const ws = LaboBlocs.app.ecranExercice.editeur.ws;
        Blockly.serialization.workspaces.load(LaboBlocs.versBlockly({ demarrage: [{ bloc: 'affecter', variable: 'ma_vitesse', valeur: { bloc: 'nombre', valeur: 7 } }], boucle: [] }), ws);
      });
      await pause(400);
      await p.click('.btn-lancer');
      await pause(400);
      const valeur = await p.evaluate(() => LaboBlocs.app.ecranExercice.etat.sim.variables.ma_vitesse);
      verifier(valeur === 7, 'ma_vitesse = ' + valeur);
      // Exercice 2 : la variable donnée par le professeur, pas de bouton.
      await p.evaluate(() => LaboBlocs.app.ecranExercice.ouvrir(LaboBlocs.app.paquet.exercices[1]));
      await pause(500);
      const ex2Palette = await palette();
      verifier(ex2Palette.join() === 'affecter:score,ajouter_a:score,variable:score,nombre', 'exercice 2 : ' + ex2Palette.join());
      await p.close();
      return `créée par l’élève : « delay » refusé, « ma vitesse » → ma_vitesse (= 7 en simulation) ; donnée par le professeur : score (sans bouton)`;
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // ---------- Réglages du collège (liste de classes commune à tous les outils) ----------

  await critere('Réglages du collège : liste commune publiée depuis la page Réglages ; la page des élèves suit (niveaux du projet, version en ligne)', async () => {
    const a = await page(pathToFileURL(path.join(RACINE, 'site', 'reglages.html')).href);
    // GitHub simulé : rien ne part vraiment.
    await a.evaluate(() => {
      window.__appels = [];
      localStorage.setItem('labo-blocs-cle-github', 'github_pat_essai');
      window.fetch = async (url, o) => {
        const methode = (o && o.method) || 'GET';
        window.__appels.push({ url: String(url), methode, corps: o && o.body ? JSON.parse(o.body) : null });
        return new Response('{}', { status: methode === 'PUT' ? 200 : 404 });
      };
    });
    const avant = await a.$eval('.ac-classes', (t) => t.value.split('\n'));
    await a.$eval('.ac-classes', (t) => (t.value = '5A\n5B\n4A\n4B'));
    await a.click('.ac-publier-college');
    await pause(400);
    const envoi = await a.evaluate(() => [document.querySelector('.ac-message-college').textContent, window.__appels.find((x) => x.methode === 'PUT')]);
    verifier(envoi[1] && /contents\/site\/college\.js$/.test(envoi[1].url) && /Réglages publiés \(4 classes\)/.test(envoi[0]), JSON.stringify(envoi));
    const contenu = Buffer.from(envoi[1].corps.content, 'base64').toString('utf8');
    verifier(/"4B"/.test(contenu) && /"cheminClasse"/.test(contenu), contenu.slice(0, 200));
    await a.evaluate(() => localStorage.removeItem('labo-blocs-cle-github'));
    await a.close();
    // Page des élèves (distributeur, niveau 5) : classes du collège de niveau 5, puis la version « en ligne » arrive.
    const p = await page(PAGE, { sansDossiers: true });
    const classes = () => p.$$eval('.champ-classe option', (o) => o.map((x) => x.value).filter(Boolean));
    const debut = await classes();
    const chemin = await texte(p, '.chemin-texte');
    await p.evaluate(() => definirCollege({ format: 'labo-blocs/college', version: 1, classes: ['5A', '5G', '4A'], cheminClasse: ['Reseau', '{classe}', 'TECHNO'], __recette: true }));
    await pause(200);
    const apres = await classes();
    const cheminApres = await texte(p, '.chemin-texte');
    verifier(debut.every((c) => c.startsWith('5')) && apres.join() === '5A,5G' && /Reseau › 5A › TECHNO › DISTRIBUTEUR DE CEREALES/.test(cheminApres), JSON.stringify({ debut, chemin, apres, cheminApres }));
    await p.close();
    return `accueil : ${avant.length} classes lues, 4 publiées (site/college.js) ; élèves (niveau 5) : ${debut.join(', ')} → version en ligne ${apres.join(', ')} ; « ${cheminApres} »`;
  });

  // ---------- Kit nouveau projet ----------

  await critere('Nouveau projet (npm run nouveau-projet) : page des élèves et outil du professeur marchent en file://', async () => {
    const { creerProjet } = require('./nouveau-projet.js');
    const { creerClasse } = require('./classe-test.js');
    const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'labo-blocs-projet-'));
    try {
      const r = creerProjet({ dossier: path.join(tmp, 'pont'), titre: 'Pont-levis', parcours: 'distributeur', accent: '#0B7A75', classes: ['4A', '4B'] });
      // Élèves : nouvelle équipe (« Firefox »), parcours, un exercice ouvert avec ses blocs, styles du module appliqués.
      const p = await page(pathToFileURL(path.join(r.site, 'programmation.html')).href, { sansDossiers: true });
      verifier((await p.$$eval('.champ-classe option', (o) => o.map((x) => x.value).filter(Boolean))).join() === '4A,4B', 'classes du projet');
      await p.type('.champ-prenom', 'zoé');
      await p.select('.champ-classe', '4B');
      await p.click('.formulaire-equipe button[type=submit]');
      await pause(200);
      const chemin = (await texte(p, '.chemin')) + ' › ' + (await texte(p, '.dossier-equipe-auto .nom-dossier-equipe'));
      verifier(/PONT-LEVIS/.test(chemin) && chemin.includes('Zoé'), 'chemin : ' + chemin);
      await p.click('.btn-commencer-sans-dossier');
      await pause(300);
      verifier(await visible(p, '.ecran-parcours'), 'parcours non affiché');
      const style = await p.evaluate(() => {
        const t = getComputedStyle(document.querySelector('.titre-projet'));
        return { titre: document.querySelector('.titre-projet').textContent, police: getComputedStyle(document.body).fontFamily, accent: getComputedStyle(document.querySelector('.bandeau')).getPropertyValue('--accent').trim(), taille: parseFloat(t.fontSize) };
      });
      verifier(style.titre === 'Pont-levis' && /Atkinson|Lexend/.test(style.police) && style.accent === '#0B7A75' && style.taille >= 13, JSON.stringify(style));
      await p.click('.carte-exercice');
      await pause(900);
      const blocs = await p.$$eval('.ecran-exercice .blocklyToolbox, .ecran-exercice .blocklyFlyout, .ecran-exercice .blocklyToolboxDiv', (l) => l.length);
      verifier((await visible(p, '.ecran-exercice')) && blocs > 0, 'exercice non affiché');
      const titreEx = await texte(p, '.titre-exercice');
      await p.close();
      // Professeur : les 8 équipes test, dont une sauvegarde « d'un autre projet » (application pont-levis).
      const fichiers = creerClasse(path.join(tmp, '4A')).map((f, i) => {
        const copie = path.join(tmp, `equipe${i + 1}.json`);
        const d = JSON.parse(fs.readFileSync(f, 'utf8'));
        if (i === 0) Object.assign(d, { application: 'pont-levis', formatVersion: 3, carnet: { etape: 2 } });
        fs.writeFileSync(copie, JSON.stringify(d));
        return copie;
      });
      const q = await page(pathToFileURL(path.join(r.site, 'programmation-prof.html')).href);
      const exemple = await texte(q, '.pr-ouvrir span');
      verifier(/4A › … › PONT-LEVIS/.test(exemple), 'exemple de dossier : ' + exemple);
      await (await q.$('.pr-accueil .pr-fichiers')).uploadFile(...fichiers);
      await pause(800);
      const lignes = await q.$$eval('.pr-tableau tbody tr', (l) => l.length);
      const projet = await texte(q, '.pr-projet');
      const largeur = await q.evaluate(() => document.querySelector('.pr-tableau').getBoundingClientRect().width);
      verifier(lignes === 8 && /Pont-levis/.test(projet) && largeur > 900, `${lignes} lignes, « ${projet} », tableau ${Math.round(largeur)} px`);
      await q.close();
      return `élèves : équipe Zoé (4B), dossier « ${chemin.replace(/\s+/g, ' ')} », exercice « ${titreEx} » ; professeur : ${lignes} équipes (dont une sauvegarde d'un autre projet)`;
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  await b.close();
  await critere('Aucune erreur dans la console du navigateur', async () => verifier(!erreurs.length, erreurs.join(' | ')));

  const ok = resultats.filter((r) => r.ok).length;
  const md =
    `# Recette automatique — jalons 1 à 5\n\n${new Date().toLocaleString('fr-FR')} · ${path.basename(navigateur)} · page ouverte en file:// · ${ok}/${resultats.length} critères\n\n` +
    '| Critère | Résultat | Détail |\n|---|---|---|\n' +
    resultats.map((r) => `| ${r.nom} | ${r.ok ? '✔' : '✘'} | ${String(r.detail).replace(/\|/g, '/').replace(/\n/g, ' ')} |`).join('\n') +
    '\n';
  fs.writeFileSync(path.join(RACINE, 'RECETTE-AUTO.md'), md);
  console.log(`\n${ok}/${resultats.length} critères — RECETTE-AUTO.md`);
  process.exit(ok === resultats.length ? 0 : 1);
})();
