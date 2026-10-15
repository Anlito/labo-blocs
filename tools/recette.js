// Recette automatique du jalon 1 dans un vrai navigateur (Chrome, Edge ou Chromium), en file:// :  npm run recette
// Chaque critère est vérifié sur la page réelle ; le compte rendu est écrit dans RECETTE-AUTO.md.
// Navigateur : variable CHROME, sinon Chrome / Edge installés aux endroits habituels.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer-core');

const RACINE = path.join(__dirname, '..');
const PAGE = pathToFileURL(path.join(RACINE, 'site', 'index.html')).href;
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

const resultats = [];
async function critere(nom, f) {
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
  const b = await puppeteer.launch({ executablePath: navigateur, headless: true, args: ['--allow-file-access-from-files', ...(process.getuid && process.getuid() === 0 ? ['--no-sandbox'] : [])] });
  const erreurs = [];
  async function page(url, options) {
    const p = await b.newPage();
    await p.setViewport({ width: 1366, height: 768 });
    p.on('pageerror', (e) => erreurs.push(e.message));
    p.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
    // « Quitter la page ? » (travail pas encore enregistré dans un fichier) : on accepte.
    p.on('dialog', (d) => d.accept());
    // « Firefox » : pas d'accès aux dossiers ni aux fichiers.
    if (options && options.sansDossiers) await p.evaluateOnNewDocument(() => ['showDirectoryPicker', 'showOpenFilePicker', 'showSaveFilePicker'].forEach((f) => delete window[f]));
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
    const reseau = await p.evaluate(() => performance.getEntriesByType('resource').filter((r) => !r.name.startsWith('file:')).map((r) => r.name));
    verifier(!reseau.length, 'ressources en ligne : ' + reseau.join(', '));
    return 'aucune ressource en ligne';
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
    verifier((await texte(p, '.chemin')).includes('Léa'), 'chemin du dossier');
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

  await critere('Simulateur : un appui sur le bouton allume la LED, le bloc en cours est surligné', async () => {
    const p = await page(PAGE + '?enseignant=1&exercice=dist-05');
    await charger(p, 'dist-05', 'solution');
    await p.click('.btn-lancer');
    await pause(300);
    await p.click('.bouton-poussoir');
    await pause(400);
    verifier((await texte(p, '.composant-led .pastille-etat')).includes('Allumée'), 'LED éteinte');
    verifier((await p.$$('.bloc-en-cours')).length >= 1, 'aucun bloc surligné');
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

  await b.close();
  await critere('Aucune erreur dans la console du navigateur', async () => verifier(!erreurs.length, erreurs.join(' | ')));

  const ok = resultats.filter((r) => r.ok).length;
  const md =
    `# Recette automatique — jalon 1\n\n${new Date().toLocaleString('fr-FR')} · ${path.basename(navigateur)} · page ouverte en file:// · ${ok}/${resultats.length} critères\n\n` +
    '| Critère | Résultat | Détail |\n|---|---|---|\n' +
    resultats.map((r) => `| ${r.nom} | ${r.ok ? '✔' : '✘'} | ${String(r.detail).replace(/\|/g, '/').replace(/\n/g, ' ')} |`).join('\n') +
    '\n';
  fs.writeFileSync(path.join(RACINE, 'RECETTE-AUTO.md'), md);
  console.log(`\n${ok}/${resultats.length} critères — RECETTE-AUTO.md`);
  process.exit(ok === resultats.length ? 0 : 1);
})();
