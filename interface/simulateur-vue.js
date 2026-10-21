// Affichage du simulateur (repris de l'atelier) : carte Arduino stylisée (dessin original, sans logo), fils, cartes des
// composants, et l'illustration propre au projet s'il en a une (« illustration » de l'exercice, ex. le distributeur).
// Aucune logique de programme ici : on affiche des états.
(function (global) {
  'use strict';

  const A = global.LaboBlocs;
  const NS = 'http://www.w3.org/2000/svg';

  // Position des broches sur la rangée DIGITAL du dessin de la carte.
  const XS = { GND: 144.5, D13: 154.5, D12: 164, D11: 174, D10: 183.5, D9: 193.5, D8: 203, D7: 219.5, D6: 229, D5: 239, D4: 248.5, D3: 258.5, D2: 268 };
  const PY = 57;
  const FILS = { D3: '#D32F2F', D4: '#1976D2', D5: '#F9A825', D6: '#7B1FA2', D8: '#2E7D32', D9: '#00838F', D10: '#455A64', D7: '#6D4C41', D11: '#AD1457', GND: '#7B4A2A' };
  const FAMILLES = { led: '#FAB22B', bouton: '#1A6E8E', servo: '#C2185B', buzzer: '#6D4C41', joystick: '#00838F' };
  const COULEURS_LED = { PetiteDose: '#F5B800', GrandeDose: '#2F80ED', Trappe: '#E53935' };

  const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function couleurFil(broche) {
    return FILS[broche] || '#455A64';
  }
  function couleurLed(c) {
    return c.couleur || COULEURS_LED[c.nom] || '#E53935';
  }
  function libelle(c) {
    const type = { led: 'LED', bouton: 'BOUTON', servo: 'Servomoteur', buzzer: 'Buzzer', joystick: 'Joystick' }[c.type] || c.type;
    return c.nom ? `${type} ${c.nom}` : type;
  }

  // ---------- Carte Arduino ----------

  function dessinCarte(composants, recadrer) {
    const etiquettes = ['GND', '13', '12', '~11', '~10', '~9', '8', '7', '~6', '~5', '4', '~3', '2'];
    const broches = ['GND', 'D13', 'D12', 'D11', 'D10', 'D9', 'D8', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2'];
    let trous = '';
    broches.forEach((b, i) => {
      const x = XS[b];
      trous += `<rect x="${x - 3.2}" y="${PY - 3.2}" width="6.4" height="6.4" rx="1" fill="#0E1418" stroke="#C9A227" stroke-width="0.8"/>`;
      trous += `<text x="${x}" y="74" class="carte-etiquette" text-anchor="middle">${etiquettes[i]}</text>`;
    });
    // Fils : de chaque broche utilisée vers le haut, le long du bord droit, puis vers les cartes.
    // Le joystick : seul son bouton (SW) est sur la rangée DIGITAL ; ses axes vont aux entrées analogiques.
    const utilises = [{ broche: 'GND' }].concat(composants.map((c) => (c.type === 'joystick' ? { broche: c.bouton } : c))).filter((c) => XS[c.broche] !== undefined);
    const vus = new Set();
    const fils = utilises
      .filter((c) => (vus.has(c.broche) ? false : vus.add(c.broche)))
      .sort((a, b) => XS[b.broche] - XS[a.broche]);
    let traces = '';
    fils.forEach((f, r) => {
      const x = XS[f.broche];
      const y = 34 - r * 4;
      const lx = 334 + r * 4.5;
      const coul = couleurFil(f.broche);
      traces +=
        `<polyline points="${x},${PY} ${x},${y} ${lx},${y} ${lx},${recadrer ? 94 : 280}" fill="none" stroke="${coul}" ` +
        `stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>` +
        `<circle cx="${x}" cy="${PY}" r="2.6" fill="${coul}" stroke="#FFFFFF" stroke-width="1"/>`;
    });
    const vb = recadrer ? '128 2 246 92' : '0 0 372 280';
    return (
      `<svg class="carte-arduino" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Carte Arduino UNO et ses fils">` +
      // Circuit imprimé
      '<rect x="14" y="44" width="308" height="228" rx="12" fill="#1C7286" stroke="#11505F" stroke-width="2"/>' +
      '<circle cx="30" cy="60" r="5" fill="#F4F7F9" stroke="#11505F"/><circle cx="306" cy="60" r="5" fill="#F4F7F9" stroke="#11505F"/>' +
      '<circle cx="30" cy="256" r="5" fill="#F4F7F9" stroke="#11505F"/><circle cx="306" cy="256" r="5" fill="#F4F7F9" stroke="#11505F"/>' +
      // Prise USB et prise d'alimentation
      '<rect x="2" y="78" width="46" height="40" rx="3" fill="#C5CFD5" stroke="#7C8B94" stroke-width="1.5"/>' +
      '<rect x="8" y="86" width="34" height="24" rx="2" fill="#9AA8B0"/>' +
      '<rect x="4" y="196" width="40" height="36" rx="4" fill="#2B3338"/>' +
      '<circle cx="24" cy="214" r="8" fill="#11171A"/>' +
      // Rangée DIGITAL
      '<rect x="137" y="49" width="138" height="16" rx="2" fill="#1B2226"/>' +
      trous +
      '<text x="206" y="88" class="carte-titre" text-anchor="middle">DIGITAL</text>' +
      // Rangées du bas (alimentation et analogique), pour l'allure
      '<rect x="96" y="250" width="80" height="14" rx="2" fill="#1B2226"/>' +
      '<rect x="196" y="250" width="66" height="14" rx="2" fill="#1B2226"/>' +
      '<text x="136" y="244" class="carte-etiquette" text-anchor="middle">POWER</text>' +
      '<text x="229" y="244" class="carte-etiquette" text-anchor="middle">ANALOG IN</text>' +
      // Microcontrôleur et quartz
      '<rect x="150" y="176" width="120" height="34" rx="3" fill="#2B3338"/>' +
      '<rect x="72" y="150" width="26" height="12" rx="6" fill="#B8C4CA"/>' +
      // Bouton reset et voyants
      '<rect x="62" y="56" width="16" height="16" rx="3" fill="#C5CFD5"/><circle cx="70" cy="64" r="4.5" fill="#D32F2F"/>' +
      '<rect x="110" y="104" width="7" height="4" fill="#F9A825"/><text x="122" y="108" class="carte-etiquette">L</text>' +
      '<rect x="270" y="112" width="7" height="4" fill="#4CAF50"/><text x="282" y="116" class="carte-etiquette">ON</text>' +
      '<text x="180" y="140" class="carte-nom" text-anchor="middle">UNO</text>' +
      '<g class="carte-surlignage"></g>' +
      traces +
      '</svg>'
    );
  }

  function surlignerBroche(conteneur, broche) {
    const g = conteneur.querySelector('.carte-surlignage');
    if (!g) return;
    g.innerHTML =
      broche && XS[broche] !== undefined
        ? `<rect x="${XS[broche] - 6}" y="${PY - 7}" width="12" height="36" rx="3" fill="rgba(255,196,0,.35)" stroke="#FFC400" stroke-width="2.5"/>`
        : '';
  }

  // ---------- Cartes des composants ----------

  function dessinLed(couleur) {
    return (
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
      `<circle class="led-halo" cx="24" cy="18" r="18" fill="${couleur}" opacity="0"/>` +
      '<path class="led-verre" d="M14 30V18a10 10 0 0 1 20 0v12z" fill="#EEF3F6" stroke="#7C8B94" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path class="led-reflet" d="M18.5 18a6 6 0 0 1 3.5-5.5" fill="none" stroke="#FFFFFF" opacity=".95" stroke-width="2.5" stroke-linecap="round"/>' +
      '<rect class="led-socle" x="11" y="29" width="26" height="5" rx="2" fill="#7C8B94"/>' +
      '<path d="M20 34v12M28 34v9" fill="none" stroke="#7C8B94" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>'
    );
  }

  function dessinBouton() {
    return (
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
      '<rect x="5" y="30" width="38" height="12" rx="3" fill="#3B4A52"/>' +
      '<rect class="bouton-capuchon" x="13" y="12" width="22" height="18" rx="4" fill="#1A6E8E" stroke="#12506A" stroke-width="2"/>' +
      '<path d="M12 42v5M36 42v5" fill="none" stroke="#7C8B94" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>'
    );
  }

  function dessinServo() {
    let graduations = '';
    for (let a = 0; a <= 180; a += 30) {
      const r = (a * Math.PI) / 180;
      const x1 = 24 + 19 * Math.cos(r);
      const y1 = 36 - 19 * Math.sin(r);
      const x2 = 24 + (a % 90 === 0 ? 15 : 16.5) * Math.cos(r);
      const y2 = 36 - (a % 90 === 0 ? 15 : 16.5) * Math.sin(r);
      graduations += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="#4F5D66" stroke-width="${a % 90 === 0 ? 2.5 : 1.5}" stroke-linecap="round"/>`;
    }
    return (
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
      '<path d="M5 36A19 19 0 0 1 43 36" fill="none" stroke="#9AA8B0" stroke-width="2"/>' +
      graduations +
      '<text x="47" y="45" class="servo-texte" text-anchor="end">0°</text>' +
      '<text x="24" y="12" class="servo-texte" text-anchor="middle">90°</text>' +
      '<text x="1" y="45" class="servo-texte">180°</text>' +
      '<rect x="15" y="33" width="18" height="13" rx="2" fill="#3B4A52"/>' +
      '<g class="servo-bras" style="transform-origin:24px 36px">' +
      '<line x1="24" y1="36" x2="39" y2="36" stroke="#1F2A30" stroke-width="6" stroke-linecap="round"/>' +
      '<line x1="24" y1="36" x2="39" y2="36" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/>' +
      '</g>' +
      '<circle cx="24" cy="36" r="3.5" fill="#FFFFFF" stroke="#1F2A30" stroke-width="2"/>' +
      '</svg>'
    );
  }

  function dessinBuzzer() {
    return (
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
      '<circle cx="24" cy="24" r="16" fill="#2B3338"/><circle cx="24" cy="24" r="4" fill="#11171A"/>' +
      '<path class="buzzer-onde" d="M40 14a16 16 0 0 1 0 20M44 9a22 22 0 0 1 0 30" fill="none" stroke="#6D4C41" stroke-width="2.5" stroke-linecap="round" opacity="0"/>' +
      '</svg>'
    );
  }

  // Joystick : le manche (à tirer à la souris, au doigt ou aux flèches) et son bouton (SW, en appuyant dessus).
  function dessinJoystick() {
    return (
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
      '<rect x="3" y="3" width="42" height="42" rx="8" fill="#3B4A52"/>' +
      '<circle cx="24" cy="24" r="17" fill="#26323A" stroke="#7C8B94" stroke-width="1.5"/>' +
      '<path d="M24 9v30M9 24h30" stroke="#4F5D66" stroke-width="1.2"/>' +
      '<circle class="joystick-manche" cx="24" cy="24" r="8" fill="#00838F" stroke="#FFFFFF" stroke-width="2"/>' +
      '</svg>'
    );
  }

  function carteComposant(c, compact) {
    const fam = FAMILLES[c.type];
    let dessin;
    if (c.type === 'joystick') {
      const nom = echapper(libelle(c));
      return (
        `<div class="composant composant-joystick${compact ? ' compact' : ''}" data-broche="${c.broche}" data-type="joystick" style="--famille:${fam}">` +
        `<div class="composant-dessin joystick-plateau" tabindex="0" role="slider" aria-valuemin="-100" aria-valuemax="100" aria-valuenow="0" ` +
        `aria-label="${nom} : tire le manche (ou flèches du clavier)">${dessinJoystick()}</div>` +
        `<button type="button" class="composant-dessin bouton-poussoir" aria-pressed="false" ` +
        `aria-label="Bouton du joystick ${c.bouton} : maintenir pour appuyer">${dessinBouton()}</button>` +
        '<div class="composant-texte">' +
        `<div class="composant-nom"><span class="composant-fil" style="background:${couleurFil(c.bouton)}"></span>` +
        `<span>${nom} · X ${c.broche} · Y ${c.y} · bouton ${c.bouton}</span></div>` +
        `<div class="composant-etat"><span class="pastille-etat" aria-live="polite"></span>` +
        (compact ? '' : '<span class="composant-aide">Tire le manche ; maintiens le bouton pour appuyer</span>') +
        '</div></div></div>'
      );
    }
    if (c.type === 'led') dessin = `<div class="composant-dessin">${dessinLed(couleurLed(c))}</div>`;
    else if (c.type === 'bouton')
      dessin =
        `<button type="button" class="composant-dessin bouton-poussoir" aria-pressed="false" ` +
        `aria-label="Bouton poussoir ${echapper(libelle(c))} ${c.broche} : maintenir pour appuyer">${dessinBouton()}</button>`;
    else if (c.type === 'buzzer') dessin = `<div class="composant-dessin">${dessinBuzzer()}</div>`;
    else dessin = `<div class="composant-dessin">${dessinServo()}</div>`;
    const aide = c.type === 'bouton' && !compact ? '<span class="composant-aide">Maintiens le clic pour appuyer</span>' : '';
    return (
      `<div class="composant composant-${c.type}${compact ? ' compact' : ''}" data-broche="${c.broche}" data-type="${c.type}" style="--famille:${fam};--led:${couleurLed(c)}">` +
      dessin +
      '<div class="composant-texte">' +
      `<div class="composant-nom"><span class="composant-fil" style="background:${couleurFil(c.broche)}"></span>` +
      `<span>${echapper(libelle(c))} · ${c.broche}</span></div>` +
      `<div class="composant-etat"><span class="pastille-etat" aria-live="polite"></span>${aide}</div>` +
      '</div></div>'
    );
  }

  // ---------- Distributeur de céréales ----------

  function dessinDistributeur() {
    let grains = '';
    const pos = [
      [38, 56], [48, 50], [58, 58], [70, 52], [82, 57], [44, 66], [56, 70], [66, 64], [78, 68], [50, 78], [62, 80], [72, 76],
      [34, 44], [46, 40], [60, 44], [74, 40], [86, 46], [40, 32], [54, 30], [68, 32], [80, 30],
    ];
    for (const [x, y] of pos) grains += `<ellipse cx="${x}" cy="${y}" rx="4.2" ry="3.2" fill="#E0A44A" stroke="#A86A1E" stroke-width="1"/>`;
    let chute = '';
    for (let i = 0; i < 6; i++)
      chute += `<ellipse class="grain-chute" style="animation-delay:${(i * 0.13).toFixed(2)}s" cx="${57 + (i % 3) * 3}" cy="100" rx="3.4" ry="2.6" fill="#E0A44A" stroke="#A86A1E" stroke-width="0.8"/>`;
    const voyant = (cle, x, nom) =>
      `<g class="voyant" data-voyant="${cle}"><circle cx="${x}" cy="150" r="7" fill="#EEF3F6" stroke="#7C8B94" stroke-width="2"/>` +
      `<text x="${x}" y="166" text-anchor="middle" class="voyant-nom">${nom}</text></g>`;
    return (
      '<svg class="distributeur" viewBox="0 0 120 200" role="img" aria-label="Distributeur de céréales">' +
      // Trémie transparente pleine de céréales
      '<path d="M22 18h76l-28 70H50z" fill="#F4F7F9" stroke="#4F5D66" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<clipPath id="tremie"><path d="M23 26h74l-27 61H51z"/></clipPath>' +
      `<g clip-path="url(#tremie)">${grains}</g>` +
      '<rect x="18" y="12" width="84" height="8" rx="3" fill="#4F5D66"/>' +
      // Trappe (tourne autour de sa charnière, à gauche du goulot)
      '<g class="trappe" style="transform-origin:50px 90px"><rect x="48" y="88" width="24" height="5" rx="2" fill="#C2185B" stroke="#7A0F39" stroke-width="1"/></g>' +
      '<circle cx="50" cy="90.5" r="2.4" fill="#1F2A30"/>' +
      `<g class="chute">${chute}</g>` +
      // Boîtier et voyants
      '<rect x="14" y="132" width="92" height="44" rx="8" fill="#FFFFFF" stroke="#4F5D66" stroke-width="2.5"/>' +
      voyant('PetiteDose', 34, 'Petite') +
      voyant('GrandeDose', 60, 'Grande') +
      voyant('Trappe', 86, 'Trappe') +
      // Bol
      '<path d="M36 182h48a24 14 0 0 1-48 0z" fill="#1A6E8E" stroke="#12506A" stroke-width="2"/>' +
      '<text x="60" y="126" text-anchor="middle" class="trappe-etat"></text>' +
      '</svg>'
    );
  }


  // ---------- Console Simon ----------

  // Quatre touches de couleur : la n° k est la k-ième LED et le k-ième bouton des composants de l'exercice
  // (bleu, vert, jaune, rouge, comme le standard D2 à D10 du Simon). Une touche s'appuie à la souris, au doigt
  // ou au clavier ; allumée, elle est vive, entourée et marquée « ● » (jamais la couleur seule).
  const COULEURS_SIMON = [
    ['Bleu', '#3B82F6'],
    ['Vert', '#23C17A'],
    ['Jaune', '#FFCF3F'],
    ['Rouge', '#FF5566'],
  ];
  function htmlSimon(touches, avecSon) {
    return (
      '<div class="simon-console" role="group" aria-label="Console Simon">' +
      '<div class="simon-touches">' +
      touches
        .map(
          (t, k) =>
            `<button type="button" class="simon-touche simon-touche-${k + 1}" data-k="${k}" style="--simon:${COULEURS_SIMON[k][1]}" aria-pressed="false" ` +
            `aria-label="Touche ${COULEURS_SIMON[k][0].toLowerCase()} : bouton ${t.bouton || '?'}, LED ${t.led || '?'} ; maintenir pour appuyer">` +
            `<span class="simon-nom">${COULEURS_SIMON[k][0]}</span><span class="simon-etat" aria-hidden="true"></span></button>`,
        )
        .join('') +
      '<span class="simon-centre" aria-hidden="true">SIMON</span></div>' +
      (avecSon ? '<button type="button" class="simon-son" aria-pressed="true">Son : activé</button>' : '') +
      '</div>'
    );
  }

  // Son du buzzer, joué par l'ordinateur (WebAudio) : une note carrée, douce, comme un buzzer piézo.
  let sonPrecedent = null; // celui de la vue précédente : coupé quand un autre exercice s'ouvre
  function creerSon() {
    if (sonPrecedent) sonPrecedent.couper();
    let audio = null;
    let note = 0;
    return (sonPrecedent = {
      couper() {
        if (audio) audio.ctx.close();
        audio = null;
        note = 0;
      },
      jouer(frequence) {
        const f = Math.round(Number(frequence) || 0);
        if (f === note) return;
        note = f;
        const Contexte = global.AudioContext || global.webkitAudioContext;
        if (!Contexte) return;
        if (!audio && f) {
          const ctx = new Contexte();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          gain.gain.value = 0;
          osc.connect(gain).connect(ctx.destination);
          osc.start();
          audio = { ctx, osc, gain };
        }
        if (!audio) return;
        if (audio.ctx.state === 'suspended') audio.ctx.resume();
        const t = audio.ctx.currentTime;
        if (f) audio.osc.frequency.setValueAtTime(f, t);
        audio.gain.gain.setTargetAtTime(f ? 0.06 : 0, t, 0.005);
      },
    });
  }

  // ---------- micro:bit et mBot (jalon 3) ----------

  // Réglage d'un capteur : curseur + valeur écrite (jamais la couleur seule).
  function curseur(nom, libelle, min, max, pas, valeur, unite) {
    return (
      `<label class="capteur"><span class="capteur-nom">${libelle}</span>` +
      `<input type="range" data-capteur="${nom}" min="${min}" max="${max}" step="${pas}" value="${valeur}">` +
      `<output class="capteur-valeur" data-valeur="${nom}">${valeur}${unite ? ' ' + unite : ''}</output></label>`
    );
  }
  function choix(nom, libelle, options, valeur) {
    return (
      `<label class="capteur"><span class="capteur-nom">${libelle}</span>` +
      `<select data-capteur="${nom}">${options.map(([t, v]) => `<option value="${v}"${String(v) === String(valeur) ? ' selected' : ''}>${echapper(t)}</option>`).join('')}</select></label>`
    );
  }

  function htmlMicrobit() {
    let points = '';
    for (let i = 0; i < 25; i++) points += '<span class="mb-point"></span>';
    const bouton = (n) => `<button type="button" class="mb-bouton poussoir-carte" data-entree="${n}" aria-pressed="false" aria-label="Bouton ${n} de la micro:bit : maintenir pour appuyer">${n}</button>`;
    return (
      '<div class="mb-carte" role="group" aria-label="Carte micro:bit">' +
      bouton('A') +
      '<div class="mb-centre">' +
      '<button type="button" class="mb-logo poussoir-carte" data-entree="logo" aria-pressed="false" aria-label="Logo tactile de la micro:bit : maintenir pour le toucher">' +
      '<svg viewBox="0 0 40 20" aria-hidden="true"><rect x="2" y="2" width="36" height="16" rx="8" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="12" cy="10" r="3" fill="currentColor"/><circle cx="28" cy="10" r="3" fill="currentColor"/></svg>' +
      '<span>logo</span></button>' +
      `<div class="mb-ecran" role="img" aria-label="Écran de la micro:bit : éteint">${points}</div>` +
      '<div class="mb-son" aria-live="polite"></div>' +
      '</div>' +
      bouton('B') +
      '</div>'
    );
  }

  // Afficheur LED Matrix 8×16 (port 4) : seulement dans les exercices qui ont ses blocs.
  function htmlMatrice() {
    let points = '';
    for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) points += '<span class="matrice-point"></span>';
    return `<figure class="mbot-matrice"><div class="matrice-points" role="img" aria-label="Afficheur : éteint">${points}</div><figcaption>Afficheur (port 4)</figcaption></figure>`;
  }

  function htmlMbot(avecMatrice) {
    const roue = (x, cote) =>
      `<g class="mbot-roue" data-roue="${cote}"><rect x="${x}" y="30" width="22" height="60" rx="6" fill="#2B3338"/>` +
      `<text x="${x + 11}" y="66" text-anchor="middle" class="mbot-fleche"></text></g>`;
    const led = (x, cote) => `<circle class="mbot-led" data-led="${cote}" cx="${x}" cy="44" r="7" fill="#EEF3F6" stroke="#7C8B94" stroke-width="2"/>`;
    return (
      '<div class="mbot" role="group" aria-label="Robot mBot">' +
      '<svg class="mbot-dessin" viewBox="0 0 160 112" aria-hidden="true">' +
      // capteur à ultrasons (avant), châssis, roues, LED de la carte, suiveur de ligne
      '<rect x="56" y="2" width="48" height="16" rx="4" fill="#1A6E8E"/><circle cx="70" cy="10" r="6" fill="#DCE6EA"/><circle cx="90" cy="10" r="6" fill="#DCE6EA"/>' +
      '<rect x="30" y="20" width="100" height="84" rx="12" fill="#2F80ED" stroke="#1B4F9B" stroke-width="2"/>' +
      '<rect x="46" y="34" width="68" height="48" rx="4" fill="#1C7286"/>' +
      roue(6, 'gauche') +
      roue(132, 'droite') +
      led(62, 'gauche') +
      led(98, 'droite') +
      '<text x="80" y="66" text-anchor="middle" class="mbot-texte">mCore</text>' +
      '<rect x="66" y="92" width="28" height="8" rx="2" fill="#1F2A30"/>' +
      '</svg>' +
      '<ul class="mbot-etats">' +
      '<li>Moteur gauche : <strong data-etat="moteur gauche">arrêté</strong></li>' +
      '<li>Moteur droit : <strong data-etat="moteur droit">arrêté</strong></li>' +
      '<li>LED gauche : <strong data-etat="LED gauche">éteinte</strong></li>' +
      '<li>LED droite : <strong data-etat="LED droite">éteinte</strong></li>' +
      '<li class="mbot-son" aria-live="polite"></li>' +
      '</ul>' +
      '<button type="button" class="mbot-bouton poussoir-carte" data-entree="bouton" aria-pressed="false" aria-label="Bouton de la carte mCore : maintenir pour appuyer">Bouton de la carte</button>' +
      (avecMatrice ? htmlMatrice() : '') +
      '</div>'
    );
  }

  function htmlCapteurs(carte, c) {
    if (carte === 'microbit') {
      return (
        curseur('temperature', 'Température', -10, 50, 1, c.temperature, '°C') +
        curseur('lumiere', 'Lumière', 0, 255, 1, c.lumiere, '') +
        curseur('x', 'Accélération x', -1024, 1024, 16, c.x, 'mg') +
        curseur('y', 'Accélération y', -1024, 1024, 16, c.y, 'mg') +
        curseur('z', 'Accélération z', -1024, 1024, 16, c.z, 'mg') +
        choix('geste', 'Geste', [['aucun', 0]].concat(A.GESTES || []), c.geste)
      );
    }
    return (
      curseur('distance', 'Distance (ultrasons)', 2, 400, 1, c.distance, 'cm') +
      choix(
        'ligne',
        'Suiveur de ligne',
        [
          ['noir sous les deux capteurs (0)', 0],
          ['noir à gauche seulement (1)', 1],
          ['noir à droite seulement (2)', 2],
          ['blanc sous les deux capteurs (3)', 3],
        ],
        c.ligne,
      ) +
      curseur('lumiere', 'Lumière', 0, 1023, 1, c.lumiere, '')
    );
  }

  const sensMoteur = (v) => (!v ? 'arrêté' : `${Math.abs(v)} % ${v > 0 ? 'en avant' : 'en arrière'}`);

  // Partie « carte » de la vue : micro:bit (écran, boutons, logo) ou mBot (moteurs, LED, bouton), et ses capteurs.
  function vueCarte(racine, carte, rappels, avecMatrice) {
    const zone = racine.querySelector('.simu-carte');
    zone.innerHTML = `<div class="simu-carte-dessin simu-${carte}">${carte === 'microbit' ? htmlMicrobit() : htmlMbot(avecMatrice)}</div>`;
    for (const vieux of racine.querySelectorAll('.simu-capteurs')) vieux.remove();
    const capteurs = A.capteursDepart ? A.capteursDepart(carte) : {};
    const panneau = document.createElement('details');
    panneau.className = 'simu-capteurs';
    panneau.open = true;
    panneau.innerHTML = `<summary>Capteurs de la carte <span class="capteurs-aide">à régler à la main pendant la simulation</span></summary><div class="capteurs-liste">${htmlCapteurs(carte, capteurs)}</div>`;
    zone.insertAdjacentElement('afterend', panneau);
    panneau.addEventListener('input', (e) => {
      const nom = e.target.dataset.capteur;
      if (!nom) return;
      capteurs[nom] = Number(e.target.value);
      const sortie = panneau.querySelector(`[data-valeur="${nom}"]`);
      if (sortie) sortie.textContent = sortie.textContent.replace(/^-?[\d.]+/, e.target.value);
    });
    const appuyes = {};
    for (const b of zone.querySelectorAll('.poussoir-carte')) {
      poussoir(b, (valeur) => {
        appuyes[b.dataset.entree] = valeur;
        b.setAttribute('aria-pressed', valeur ? 'true' : 'false');
        rappels.appuyerBouton(b.dataset.entree, valeur);
      });
    }

    const points = [...zone.querySelectorAll('.mb-point')];
    const pointsMatrice = [...zone.querySelectorAll('.matrice-point')];
    let ecranAvant = '';
    function son(sim, nom) {
      const note = sim && sim.journal.filter((e) => e.type === 'son' && e.broche === nom).pop();
      return note && note.valeur && sim.t < note.t + note.duree ? `♪ ${Math.round(note.valeur)} Hz` : '';
    }
    function afficher(sim) {
      if (carte === 'microbit') {
        const ecran = sim && sim.carte ? A.ecranA(sim.carte, sim.t) : new Array(25).fill(0);
        const cle = ecran.join('');
        if (cle !== ecranAvant) {
          ecranAvant = cle;
          ecran.forEach((v, i) => points[i].style.setProperty('--allume', String(v / 9)));
          const n = ecran.filter(Boolean).length;
          zone.querySelector('.mb-ecran').setAttribute('aria-label', n ? `Écran de la micro:bit : ${n} point${n > 1 ? 's' : ''} allumé${n > 1 ? 's' : ''}` : 'Écran de la micro:bit : éteint');
        }
        zone.querySelector('.mb-son').textContent = son(sim, 'haut-parleur');
      } else {
        const sorties = (sim && sim.sorties) || {};
        for (const cote of ['gauche', 'droite']) {
          const moteur = cote === 'gauche' ? 'moteur gauche' : 'moteur droit';
          const v = sorties[moteur] || 0;
          zone.querySelector(`[data-etat="${moteur}"]`).textContent = sensMoteur(v);
          zone.querySelector(`[data-roue="${cote}"] .mbot-fleche`).textContent = v > 0 ? '▲' : v < 0 ? '▼' : '';
          const rgb = sorties['LED ' + cote] || 0;
          zone.querySelector(`[data-etat="LED ${cote}"]`).textContent = A.nomCouleur ? A.nomCouleur(rgb) : String(rgb);
          zone.querySelector(`[data-led="${cote}"]`).setAttribute('fill', rgb ? '#' + rgb.toString(16).padStart(6, '0') : '#EEF3F6');
        }
        zone.querySelector('.mbot-son').textContent = son(sim, 'D8');
        if (pointsMatrice.length) {
          const colonnes = sim && sim.carte && A.matriceA ? A.matriceA(sim.carte, sim.t) : new Array(16).fill(0);
          const cle = colonnes.join(',');
          if (cle !== ecranAvant) {
            ecranAvant = cle;
            let n = 0;
            pointsMatrice.forEach((p, i) => {
              const allume = (colonnes[i % 16] >> Math.floor(i / 16)) & 1;
              n += allume;
              p.classList.toggle('allume', !!allume);
            });
            zone.querySelector('.matrice-points').setAttribute('aria-label', n ? `Afficheur : ${n} point${n > 1 ? 's' : ''} allumé${n > 1 ? 's' : ''}` : 'Afficheur : éteint');
          }
        }
      }
      // Curseurs des capteurs : suivent les valeurs changées par un test rejoué.
      for (const champ of panneau.querySelectorAll('[data-capteur]')) {
        const v = capteurs[champ.dataset.capteur];
        if (document.activeElement === champ || String(v) === champ.value) continue;
        champ.value = v;
        const sortie = panneau.querySelector(`[data-valeur="${champ.dataset.capteur}"]`);
        if (sortie) sortie.textContent = sortie.textContent.replace(/^-?[\d.]+/, String(v));
      }
      // Boutons de la carte : appuyés tant qu'on les tient (ou dans un test rejoué).
      for (const b of zone.querySelectorAll('.poussoir-carte')) {
        const v = sim ? sim.entrees[b.dataset.entree] : appuyes[b.dataset.entree];
        b.setAttribute('aria-pressed', v ? 'true' : 'false');
      }
    }
    // En direct, les capteurs sont ceux de la vraie carte : les curseurs montrent leurs valeurs sans se régler.
    function verrouillerCapteurs(oui) {
      for (const champ of panneau.querySelectorAll('[data-capteur]')) champ.disabled = !!oui;
      const aide = panneau.querySelector('.capteurs-aide');
      if (aide) aide.textContent = oui ? 'valeurs lues sur la vraie carte' : 'à régler à la main pendant la simulation';
    }
    return { afficher, capteurs, verrouillerCapteurs };
  }

  // ---------- Vue complète ----------

  // Bouton poussoir : appuyé tant qu'on garde le clic (ou la touche Espace / Entrée), relâché dès qu'on lâche.
  function poussoir(el, appuyer) {
    let tenu = false;
    const lacher = () => {
      if (!tenu) return;
      tenu = false;
      appuyer(0);
    };
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      tenu = true;
      appuyer(1);
    });
    el.addEventListener('pointerup', lacher);
    el.addEventListener('pointercancel', lacher);
    el.addEventListener('lostpointercapture', lacher);
    el.addEventListener('keydown', (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (e.repeat || tenu) return;
      tenu = true;
      appuyer(1);
    });
    el.addEventListener('keyup', (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      lacher();
    });
    el.addEventListener('blur', lacher);
  }

  // Position (-100 à 100) d'un axe lu sur sa broche (0 à 1023), comme le bloc « position du joystick ».
  function positionAffichee(brut, inverse) {
    const p = Math.round(((Number(brut) - 512) * 100) / 512);
    return Math.max(-100, Math.min(100, inverse ? -p : p));
  }
  // Valeur brute d'une position (-100 à 100) : le contraire.
  const brutDe = (position, inverse) => Math.max(0, Math.min(1023, Math.round(512 + (inverse ? -position : position) * 5.11)));

  // Manche du joystick : tiré à la souris ou au doigt (lâché, il revient au centre, comme un vrai), ou aux flèches.
  function manche(el, c, rappels) {
    let tenu = false;
    let clavier = { x: 0, y: 0 };
    const regler = (x, y) => rappels.reglerJoystick && rappels.reglerJoystick(brutDe(x, c.inverserX), brutDe(y, c.inverserY));
    const suivre = (e) => {
      const r = el.getBoundingClientRect();
      const borne = (v) => Math.max(-100, Math.min(100, Math.round(v)));
      // Le cercle du plateau fait 34/48 de la case : son bord = 100.
      const rayon = (r.width * 17) / 48;
      regler(borne(((e.clientX - r.left - r.width / 2) / rayon) * 100), borne((-(e.clientY - r.top - r.height / 2) / rayon) * 100));
    };
    const lacher = () => {
      if (!tenu) return;
      tenu = false;
      regler(0, 0);
    };
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      el.focus();
      el.setPointerCapture(e.pointerId);
      tenu = true;
      suivre(e);
    });
    el.addEventListener('pointermove', (e) => tenu && suivre(e));
    el.addEventListener('pointerup', lacher);
    el.addEventListener('pointercancel', lacher);
    el.addEventListener('lostpointercapture', lacher);
    // Flèches : le manche est poussé à fond tant que la flèche est tenue (sans gêner les blocs « quand la touche »,
    // qui écoutent le clavier seulement quand le plateau n'a pas le focus).
    const FLECHES = { ArrowUp: ['y', 100], ArrowDown: ['y', -100], ArrowLeft: ['x', -100], ArrowRight: ['x', 100] };
    el.addEventListener('keydown', (e) => {
      const f = FLECHES[e.key];
      if (!f) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.repeat) return;
      clavier = Object.assign({}, clavier, { [f[0]]: f[1] });
      regler(clavier.x, clavier.y);
    });
    el.addEventListener('keyup', (e) => {
      const f = FLECHES[e.key];
      if (!f) return;
      e.preventDefault();
      e.stopPropagation();
      clavier = Object.assign({}, clavier, { [f[0]]: 0 });
      regler(clavier.x, clavier.y);
    });
    el.addEventListener('blur', () => {
      if (clavier.x || clavier.y) regler(0, 0);
      clavier = { x: 0, y: 0 };
    });
  }

  function creerVue(racine, exercice, rappels) {
    const composants = exercice.composants || [];
    const compact = composants.length > 4;
    const recadrer = composants.length > 4;
    const carte = exercice.carte === 'microbit' || exercice.carte === 'mbot' ? exercice.carte : 'uno';
    racine.classList.toggle('avec-carte', carte !== 'uno');
    for (const vieux of racine.querySelectorAll('.simu-capteurs')) vieux.remove();
    const avecMatrice = carte === 'mbot' && (exercice.blocsAutorises || []).some((t) => /^mbot_matrice_/.test(t));
    const vueDeCarte = carte === 'uno' ? null : vueCarte(racine, carte, rappels, avecMatrice);
    if (!vueDeCarte) racine.querySelector('.simu-carte').innerHTML = `<div class="simu-carte-dessin">${dessinCarte(composants, recadrer)}</div>`;
    // Illustration du projet (distributeur : exercices 8 et 13) : à droite des cartes des composants.
    const distributeur = exercice.illustration === 'distributeur';
    // Console Simon (illustration « simon ») : touches = LED et boutons des composants, dans leur ordre.
    const simon = exercice.illustration === 'simon';
    const ledsSimon = composants.filter((c) => c.type === 'led').slice(0, 4);
    const boutonsSimon = composants.filter((c) => c.type === 'bouton').slice(0, 4);
    const touches = simon ? [0, 1, 2, 3].map((k) => ({ led: (ledsSimon[k] || {}).broche, bouton: (boutonsSimon[k] || {}).broche })) : [];
    const buzzer = composants.find((c) => c.type === 'buzzer');
    racine.querySelector('.simu-distributeur').innerHTML = distributeur ? dessinDistributeur() : simon ? htmlSimon(touches, !!buzzer) : '';
    racine.querySelector('.simu-milieu').classList.toggle('avec-distributeur', distributeur);
    racine.querySelector('.simu-milieu').classList.toggle('avec-simon', simon);
    // Le son du buzzer : joué d'office avec la console Simon (bouton « Son » pour le couper).
    const son = buzzer ? creerSon() : null;
    let sonActif = simon;
    const boutonSon = racine.querySelector('.simon-son');
    if (boutonSon) {
      boutonSon.addEventListener('click', () => {
        sonActif = !sonActif;
        boutonSon.setAttribute('aria-pressed', sonActif ? 'true' : 'false');
        boutonSon.textContent = sonActif ? 'Son : activé' : 'Son : coupé';
        if (!sonActif) son.jouer(0);
      });
    }
    const touchesSimon = [...racine.querySelectorAll('.simon-touche')];
    for (const el of touchesSimon) {
      const t = touches[Number(el.dataset.k)];
      if (t.bouton) poussoir(el, (valeur) => rappels.appuyerBouton(t.bouton, valeur));
      else el.disabled = true;
    }
    const grille = racine.querySelector('.simu-composants');
    grille.classList.toggle('compact', compact);
    grille.innerHTML = composants.map((c) => carteComposant(c, compact)).join('');

    // Une carte par composant (dans un exercice libre, deux composants peuvent partager une broche : signalé).
    const cartes = [];
    for (const [k, el] of [...grille.querySelectorAll('.composant')].entries()) {
      const broche = el.dataset.broche;
      cartes[k] = el;
      if (composants[k] && composants[k].conflit) {
        el.classList.add('conflit');
        el.insertAdjacentHTML('beforeend', '<span class="composant-conflit" role="note">⚠ Broche partagée avec un autre composant</span>');
      }
      el.addEventListener('mouseenter', () => {
        surlignerBroche(racine, broche);
        el.classList.add('survol');
      });
      el.addEventListener('mouseleave', () => {
        surlignerBroche(racine, null);
        el.classList.remove('survol');
      });
      const b = el.querySelector('.bouton-poussoir');
      const c = composants[k];
      if (b && c && c.type === 'joystick') {
        poussoir(b, (valeur) => rappels.appuyerBouton(c.bouton, valeur));
        manche(el.querySelector('.joystick-plateau'), c, rappels);
      } else if (b) poussoir(b, (valeur) => rappels.appuyerBouton(broche, valeur));
    }

    const memoire = [];
    function maj(k, valeur, quoi) {
      if (memoire[k] === valeur) return;
      memoire[k] = valeur;
      const el = cartes[k];
      const c = composants[k];
      if (el && c) {
        const pastille = el.querySelector('.pastille-etat');
        if (c.type === 'led') {
          el.classList.toggle('actif', !!valeur);
          pastille.textContent = valeur ? '● Allumée (HAUT)' : '○ Éteinte (BAS)';
        } else if (c.type === 'bouton') {
          el.classList.toggle('actif', !!valeur);
          el.querySelector('.bouton-poussoir').setAttribute('aria-pressed', valeur ? 'true' : 'false');
          pastille.textContent = valeur ? 'ON' : 'OFF';
        } else if (c.type === 'buzzer') {
          el.classList.toggle('actif', !!valeur);
          pastille.textContent = valeur ? `♪ ${Math.round(valeur)} Hz` : 'Silence';
        } else if (c.type === 'joystick') {
          // « x,y,bouton » : valeurs brutes (0 à 1023) des deux axes, bouton 0/1.
          const [bx, by, bouton] = String(valeur || '512,512,0').split(',').map(Number);
          const x = positionAffichee(bx, c.inverserX);
          const y = positionAffichee(by, c.inverserY);
          el.querySelector('.joystick-manche').setAttribute('transform', `translate(${(x * 0.09).toFixed(1)} ${(-y * 0.09).toFixed(1)})`);
          el.querySelector('.joystick-plateau').setAttribute('aria-valuetext', `X ${x}, Y ${y}`);
          el.querySelector('.bouton-poussoir').setAttribute('aria-pressed', bouton ? 'true' : 'false');
          el.classList.toggle('actif', !!bouton);
          pastille.textContent = `X : ${x} · Y : ${y} · bouton ${bouton ? 'appuyé' : 'relâché'}`;
        } else if (c.type === 'servo') {
          el.querySelector('.servo-bras').style.transform = `rotate(${-valeur}deg)`;
          pastille.textContent = Math.round(valeur) + '°';
        }
      }
      if (quoi) quoi();
    }

    // Distributeur : voyants (LED nommées PetiteDose / GrandeDose / Trappe) et trappe.
    const distri = racine.querySelector('.distributeur');
    function majDistributeur(etats, enMarche) {
      if (!distri) return;
      for (const c of composants) {
        if (c.type !== 'led' || !COULEURS_LED[c.nom]) continue;
        const v = distri.querySelector(`[data-voyant="${c.nom}"] circle`);
        const on = !!etats[c.broche];
        v.setAttribute('fill', on ? COULEURS_LED[c.nom] : '#EEF3F6');
        v.setAttribute('stroke', on ? '#5B3A00' : '#7C8B94');
      }
      // Servo : 90° = trappe fermée, 0° = ouverte. Sans servo (exercice 8), la LED Trappe ouvre la trappe.
      const servo = composants.find((c) => c.type === 'servo');
      const ledTrappe = composants.find((c) => c.type === 'led' && c.nom === 'Trappe');
      let ouverture = 0; // 0 fermée, 1 ouverte
      if (servo) ouverture = Math.min(1, Math.max(0, (90 - (etats[servo.broche] || 0)) / 90));
      else if (ledTrappe) ouverture = etats[ledTrappe.broche] ? 1 : 0;
      distri.querySelector('.trappe').style.transform = `rotate(${ouverture * 80}deg)`;
      // Les céréales ne tombent que pendant la simulation.
      distri.classList.toggle('ouverte', ouverture > 0.6 && !!enMarche);
      distri.querySelector('.trappe-etat').textContent = ouverture > 0.6 ? 'Trappe ouverte' : 'Trappe fermée';
    }

    // etats : { broche: valeur } (LED 0/1, servo en degrés, boutons 0/1)
    // sim : le simulateur en cours (écran de la micro:bit, moteurs du mBot…), ou rien s'il est arrêté.
    function afficher(etats, enMarche, sim) {
      // État par « broche|sorte » s'il est donné (deux composants sur une broche), sinon par broche.
      composants.forEach((c, k) => {
        const cle = c.broche + '|' + c.type;
        maj(k, (cle in etats ? etats[cle] : etats[c.broche]) || 0);
      });
      majDistributeur(etats, enMarche);
      touchesSimon.forEach((el, k) => {
        const t = touches[k];
        const allumee = !!(t.led && etats[t.led]);
        const appuyee = !!(t.bouton && etats[t.bouton]);
        el.classList.toggle('allumee', allumee);
        el.setAttribute('aria-pressed', appuyee ? 'true' : 'false');
        el.querySelector('.simon-etat').textContent = allumee ? '●' : '';
      });
      if (son) son.jouer(sonActif && enMarche ? etats[buzzer.broche] : 0);
      if (vueDeCarte) vueDeCarte.afficher(sim || null);
    }

    // capteurs : valeurs réglées à la main, à passer au simulateur (creerSimulation({ capteurs })).
    return { afficher, carte, capteurs: vueDeCarte ? vueDeCarte.capteurs : null, verrouillerCapteurs: (oui) => vueDeCarte && vueDeCarte.verrouillerCapteurs(oui) };
  }

  Object.assign(A, { creerVueSimulateur: creerVue, couleurFil });
})(this);
