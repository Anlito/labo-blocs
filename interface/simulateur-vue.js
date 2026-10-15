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
  const FAMILLES = { led: '#FAB22B', bouton: '#1A6E8E', servo: '#C2185B', buzzer: '#6D4C41' };
  const COULEURS_LED = { PetiteDose: '#F5B800', GrandeDose: '#2F80ED', Trappe: '#E53935' };

  const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function couleurFil(broche) {
    return FILS[broche] || '#455A64';
  }
  function couleurLed(c) {
    return c.couleur || COULEURS_LED[c.nom] || '#E53935';
  }
  function libelle(c) {
    const type = { led: 'LED', bouton: 'BOUTON', servo: 'Servomoteur', buzzer: 'Buzzer' }[c.type] || c.type;
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
    const utilises = [{ broche: 'GND' }].concat(composants).filter((c) => XS[c.broche] !== undefined);
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

  function carteComposant(c, compact) {
    const fam = FAMILLES[c.type];
    let dessin;
    if (c.type === 'led') dessin = `<div class="composant-dessin">${dessinLed(couleurLed(c))}</div>`;
    else if (c.type === 'bouton')
      dessin =
        `<button type="button" class="composant-dessin bouton-poussoir" aria-pressed="false" ` +
        `aria-label="Appuyer ou relâcher ${echapper(libelle(c))} ${c.broche}">${dessinBouton()}</button>`;
    else if (c.type === 'buzzer') dessin = `<div class="composant-dessin">${dessinBuzzer()}</div>`;
    else dessin = `<div class="composant-dessin">${dessinServo()}</div>`;
    const aide = c.type === 'bouton' && !compact ? '<span class="composant-aide">Clique pour appuyer ou relâcher</span>' : '';
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

  // ---------- Vue complète ----------

  function creerVue(racine, exercice, rappels) {
    const composants = exercice.composants || [];
    const compact = composants.length > 4;
    const recadrer = composants.length > 4;
    racine.querySelector('.simu-carte').innerHTML = `<div class="simu-carte-dessin">${dessinCarte(composants, recadrer)}</div>`;
    // Illustration du projet (distributeur : exercices 8 et 13) : à droite des cartes des composants.
    const distributeur = exercice.illustration === 'distributeur';
    racine.querySelector('.simu-distributeur').innerHTML = distributeur ? dessinDistributeur() : '';
    racine.querySelector('.simu-milieu').classList.toggle('avec-distributeur', distributeur);
    const grille = racine.querySelector('.simu-composants');
    grille.classList.toggle('compact', compact);
    grille.innerHTML = composants.map((c) => carteComposant(c, compact)).join('');

    const cartes = {};
    for (const el of grille.querySelectorAll('.composant')) {
      const broche = el.dataset.broche;
      cartes[broche] = el;
      el.addEventListener('mouseenter', () => {
        surlignerBroche(racine, broche);
        el.classList.add('survol');
      });
      el.addEventListener('mouseleave', () => {
        surlignerBroche(racine, null);
        el.classList.remove('survol');
      });
      const b = el.querySelector('.bouton-poussoir');
      if (b) b.addEventListener('click', () => rappels.basculerBouton(broche));
    }

    const memoire = {};
    function maj(broche, valeur, quoi) {
      if (memoire[broche] === valeur) return;
      memoire[broche] = valeur;
      const el = cartes[broche];
      const c = composants.find((x) => x.broche === broche);
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
    function afficher(etats, enMarche) {
      for (const c of composants) maj(c.broche, etats[c.broche] || 0);
      majDistributeur(etats, enMarche);
    }

    return { afficher };
  }

  Object.assign(A, { creerVueSimulateur: creerVue, couleurFil });
})(this);
