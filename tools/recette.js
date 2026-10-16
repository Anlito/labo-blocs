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
      verifier(ecrit.includes('Le feu rouge') && ecrit.includes('"versionParcours": "1.1.0"'), 'parcours.js non écrit');
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
      return `exercice ${id} : ${phrases.join(' · ')} ; version 1.1.0 publiée ; chez l’élève : réussite, et « ${ecart.slice(0, 70)}… » pour un programme vide`;
    } finally {
      fs.rmSync(copie, { recursive: true, force: true });
    }
  });

  await b.close();
  await critere('Aucune erreur dans la console du navigateur', async () => verifier(!erreurs.length, erreurs.join(' | ')));

  const ok = resultats.filter((r) => r.ok).length;
  const md =
    `# Recette automatique — jalons 1 et 2\n\n${new Date().toLocaleString('fr-FR')} · ${path.basename(navigateur)} · page ouverte en file:// · ${ok}/${resultats.length} critères\n\n` +
    '| Critère | Résultat | Détail |\n|---|---|---|\n' +
    resultats.map((r) => `| ${r.nom} | ${r.ok ? '✔' : '✘'} | ${String(r.detail).replace(/\|/g, '/').replace(/\n/g, ' ')} |`).join('\n') +
    '\n';
  fs.writeFileSync(path.join(RACINE, 'RECETTE-AUTO.md'), md);
  console.log(`\n${ok}/${resultats.length} critères — RECETTE-AUTO.md`);
  process.exit(ok === resultats.length ? 0 : 1);
})();
