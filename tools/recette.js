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
    e = await attendreCarte(p, ATTENTE);
    verifier(e.cle === 'vide' && !(await p.evaluate(() => carteVirtuelle.programmeHex())), `après « Vider la carte » : ${e.cle}`);
    await p.close();
    return `programme de la carte ${installe.version} (${installe.nom}) installé par le câble ; ${garde.length / 2} octets envoyés et gardés ; carte vidée`;
  });

  await critere('Dans la carte · mBot : envoi du programme et « Vider la carte »', async () => {
    const p = await ouvrirDansLaCarte('decouverte-mbot', 'mbot-03', { modele: 'mcore', firmware: '0.2' });
    await p.click('.panneau-carte [data-action="connecter"]');
    let e = await attendreCarte(p, ATTENTE);
    verifier(e.cle === 'connectee', `connexion : ${e.cle} ${e.message}`);
    await p.click('.panneau-carte [data-action="envoyer"]');
    e = await attendreCarte(p, ATTENTE);
    const garde = await p.evaluate(() => carteVirtuelle.programmeHex());
    verifier(e.cle === 'envoye' && garde === (await octetsSolution(p, 'mbot-03')), `envoi : ${e.cle}`);
    await p.click('.panneau-carte [data-action="vider"]');
    e = await attendreCarte(p, ATTENTE);
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
    await p.evaluate(() => carteVirtuelle.copierFichier('0.2'));
    await p.click('.panneau-carte [data-action="reconnecter"]');
    e = await attendreCarte(p, ATTENTE);
    verifier(e.cle === 'connectee', `après copie : ${e.cle} ${e.message}`);
    await p.click('.panneau-carte [data-action="envoyer"]');
    e = await attendreCarte(p, ATTENTE);
    const garde = await p.evaluate(() => carteVirtuelle.programmeHex());
    verifier(e.cle === 'envoye' && garde === (await octetsSolution(p, 'mb-03')), `envoi : ${e.cle}`);
    await p.click('.panneau-carte [data-action="vider"]');
    e = await attendreCarte(p, ATTENTE);
    verifier(e.cle === 'vide', `vidage : ${e.cle}`);
    await p.close();
    return `fichier à copier sur MICROBIT, puis ${garde.length / 2} octets envoyés et carte vidée`;
  });

  await critere('Dans la carte · erreurs USB en français, avec la prochaine action', async () => {
    const phrases = [];
    const cas = [
      ['carte déjà utilisée', null, 'dist-02', { modele: 'uno', firmware: '0.2', occupee: true }, 'occupee', /Ferme-le, puis réessaie/],
      ['carte pas à jour', null, 'dist-02', { modele: 'uno', firmware: '0.1' }, 'pas-a-jour', /Installer le programme de la carte/],
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
    const p = await page(PAGE + '?parcours=decouverte-mbot&enseignant=1&exercice=mbot-03', { carte: { modele: 'mcore', firmware: '0.2', cle: true } });
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
    // Robot sans programme de base : par la clé, on demande le câble.
    const q = await page(PAGE + '?parcours=decouverte-mbot&enseignant=1&exercice=mbot-01', { carte: { modele: 'mcore', cle: true } });
    await q.click('.btn-mode[data-mode="direct"]');
    await q.click('.panneau-carte [data-action="connecter-cle"]');
    e = await attendreCarte(q, ATTENTE);
    verifier(e.cle === 'a-installer' && /câble USB/.test(e.message), 'robot neuf par la clé : ' + e.message);
    await q.close();
    return `par la clé : « ${roule} », obstacle à 8 cm → « ${arret} » (tableau : ${tableau}, curseur ${curseur}) ; envoi par la clé ; robot neuf : « ${e.message.slice(0, 60)}… »`;
  });

  await critere('En direct · micro:bit : bouton A de la carte → LED P0 et cœur ; modes choisis par exercice', async () => {
    const p = await page(PAGE + '?parcours=decouverte-microbit&enseignant=1&exercice=mb-01', { carte: { modele: 'microbit-v2', firmware: '0.2' } });
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

  await critere('Accueil de Labo Blocs : éditeur, suivi de classe, et chaque parcours à essayer en mode enseignant', async () => {
    const p = await page(pathToFileURL(path.join(RACINE, 'site', 'accueil.html')).href);
    const outils = await p.$$eval('.ed-cartes:not(.ac-parcours) a', (l) => l.map((a) => a.getAttribute('href')));
    const parcours = await p.$$eval('.ac-parcours a', (l) => l.map((a) => [a.getAttribute('href'), a.querySelector('strong').textContent]));
    verifier(outils.join() === 'editeur.html,prof.html' && parcours.length === 3, JSON.stringify({ outils, parcours }));
    await p.click('.ac-parcours a:nth-child(2)');
    await pause(1200);
    const equipe = await texte(p, '.equipe-texte');
    const titre = await p.title();
    verifier(/Mode enseignant/.test(equipe) && /mBot/.test(titre), `${equipe} · ${titre}`);
    await p.close();
    const e = await page(pathToFileURL(path.join(RACINE, 'site', 'editeur.html')).href);
    verifier(await visible(e, '.ed-vers-accueil'), 'pas de lien Accueil dans l’éditeur');
    await e.close();
    return `${parcours.map((x) => x[1]).join(', ')} ; « ${titre} » ouvert en mode enseignant ; lien Accueil dans l’éditeur`;
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
      const chemin = await texte(p, '.chemin');
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
