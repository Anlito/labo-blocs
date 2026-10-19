// Aides pédagogiques (reprises de l'atelier) : indices (3 niveaux), fiches « À savoir » (avec schéma), lexique.
// Les textes viennent du paquet de parcours (exercices, fiches, lexique).
(function (global) {
  'use strict';

  const A = global.LaboBlocs;
  const C = () => A.COULEURS_BLOCS;
  const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ---------- Petits blocs (même allure que l'éditeur), pour les fiches et la silhouette ----------

  // trous : true → chaque valeur (broche, HAUT/BAS, nombre, symbole) devient une case « ? ».
  function blocsHtml(programme, options) {
    const o = options || {};
    const trous = !!o.trous;
    const trou = '<span class="pb-trou" aria-label="à compléter">?</span>';
    const pastille = (texte) => (trous ? trou : `<span class="pb-champ">${echapper(texte)}</span>`);
    const image = (nom) => `<img class="pb-icone" alt="" src="${A.imageIcone(nom, '#1F2A30', 2.6)}">`;
    const hautBas = (v) => (v ? 'HAUT (1)' : 'BAS (0)');
    const hautBasLed = (v) => (A.aideLed ? (v ? 'HAUT (1) : allumée' : 'BAS (0) : éteinte') : hautBas(v));

    // Bloc d'une carte (mBot, micro:bit) : dessiné d'après sa description (noyau/cartes.js), en lilas avec le puzzle.
    function blocCarte(b) {
      const d = A.BLOCS_CARTES && A.BLOCS_CARTES[b.bloc];
      if (!d) return null;
      const texte = echapper(d.texte).replace(/%([A-Z]+)/g, (_, nom) => {
        const cle = nom.toLowerCase();
        const champ = (d.champs || {})[nom];
        if (champ === 'texte') return pastille(b[cle] !== undefined ? b[cle] : (d.defauts || {})[nom] || '');
        if (champ) {
          const option = champ.find((o) => String(o[1]) === String(b[cle])) || champ[0];
          return pastille(option[0]);
        }
        return expression(b[cle] !== undefined ? b[cle] : (d.entrees || {})[nom]);
      });
      const fond = `background:${C().extension}`;
      if (d.sorte === 'instruction') return `<div class="pb-bloc" style="${fond}">${image('puzzle')} ${texte}</div>`;
      return `<span class="${d.sorte === 'condition' ? 'pb-hexa' : 'pb-rond'} pb-grand" style="${fond}">${texte}</span>`;
    }

    function expression(e) {
      if (e === null || e === undefined) return '<span class="pb-vide" aria-label="case vide"></span>';
      if (typeof e === 'number') return pastille(String(e));
      switch (e.bloc) {
        case 'nombre':
          return pastille(String(e.valeur));
        case 'variable':
          return `<span class="pb-rond" style="background:${C().variable}">${echapper(e.variable || 'CHOIX')}</span>`;
        case 'operation':
          return `<span class="pb-rond pb-grand" style="background:${C().bleu}">${expression(e.a)} ${trous ? trou : echapper(e.op === 'mod' ? 'reste de ÷' : e.op)} ${expression(e.b)}</span>`;
        case 'hasard':
          return `<span class="pb-rond pb-grand" style="background:${C().bleu}">nombre au hasard entre ${expression(e.min)} et ${expression(e.max)}</span>`;
        case 'reetalonner':
          return `<span class="pb-rond pb-grand" style="background:${C().bleu}">ré-étalonner ${expression(e.valeur)} depuis ( ${expression(e.de1)} , ${expression(e.de2)} ) vers ( ${expression(e.vers1)} , ${expression(e.vers2)} )</span>`;
        case 'joystick_position':
          return `<span class="pb-rond" style="background:${C().valeur}">${image('joystick')} position du joystick sur ${pastille(e.axe === 'y' ? 'Y' : 'X')}</span>`;
        case 'joystick_valeur':
          return `<span class="pb-rond" style="background:${C().valeur}">${image('joystick')} valeur du joystick sur ${pastille(e.axe === 'y' ? 'Y' : 'X')} (0 à 1023)</span>`;
        case 'joystick_direction': {
          const d = (A.DIRECTIONS_JOYSTICK || []).find((x) => x[1] === e.direction);
          return `<span class="pb-hexa" style="background:${C().valeur}">${image('joystick')} le joystick est ${pastille(d ? (e.direction === 'centre' ? d[0] : 'poussé ' + d[0]) : e.direction || '')}</span>`;
        }
        case 'joystick_bouton':
          return `<span class="pb-hexa" style="background:${C().valeur}">${image('joystick')} le bouton du joystick est appuyé</span>`;
        case 'logique':
          return `<span class="pb-hexa pb-grand" style="background:${C().bleu}">${expression(e.a)} ${trous ? trou : e.op} ${expression(e.b)}</span>`;
        case 'non':
          return `<span class="pb-hexa pb-grand" style="background:${C().bleu}">non ${expression(e.a)}</span>`;
        case 'bouton_etat':
          return `<span class="pb-hexa" style="background:${C().valeur}">${image('bouton')} état sur la broche ${pastille(e.broche)}</span>`;
        case 'valeur_haut_bas':
          return `<span class="pb-hexa" style="background:${C().valeur}">${trous ? trou : hautBas(e.valeur)}</span>`;
        case 'comparaison':
          return `<span class="pb-hexa pb-grand" style="background:${C().bleu}">${expression(e.a)} ${trous ? trou : e.op} ${expression(e.b)}</span>`;
        default:
          return blocCarte(e) || '';
      }
    }

    function instruction(i) {
      const style = (c) => `style="background:${c}"`;
      switch (i.bloc) {
        case 'led_etat':
          return `<div class="pb-bloc" ${style(C().lumiere)}>${image('lumiere')} contrôler la LED à l’état ${pastille(hautBasLed(i.etat))} sur la broche ${pastille(i.broche)}</div>`;
        case 'attendre':
          return `<div class="pb-bloc" ${style(C().bleu)}>attendre ${expression(i.duree)} seconde(s)</div>`;
        case 'servo_angle':
          return `<div class="pb-bloc" ${style(C().servo)}>${image('moteur')} contrôler l’angle à ${expression(i.angle)} ° sur la broche ${pastille(i.broche)}</div>`;
        case 'affecter':
          return `<div class="pb-bloc" ${style(C().variable)}>affecter à <span class="pb-champ">${echapper(i.variable || 'CHOIX')}</span> la valeur ${expression(i.valeur)}</div>`;
        case 'ajouter_a':
          return `<div class="pb-bloc" ${style(C().variable)}>ajouter à <span class="pb-champ">${echapper(i.variable || 'CHOIX')}</span> la valeur ${expression(i.valeur)}</div>`;
        case 'son':
          return `<div class="pb-bloc" ${style(C().lumiere)}>${image('son')} jouer la note ${expression(i.frequence)} Hz pendant ${expression(i.duree)} s sur la broche ${pastille(i.broche)}</div>`;
        case 'repeter_n':
        case 'tant_que':
        case 'repeter_jusqua': {
          const tete = i.bloc === 'repeter_n' ? `répéter ${expression(i.fois)} fois` : i.bloc === 'tant_que' ? `tant que ${expression(i.condition)} répéter` : `répéter jusqu’à ${expression(i.condition)}`;
          return `<div class="pb-c" style="--c:${C().decision}"><div class="pb-tete">${tete}</div><div class="pb-corps">${pile(i.corps)}</div><div class="pb-pied"></div></div>`;
        }
        case 'si_alors':
        case 'si_sinon': {
          const c = C().decision;
          let h = `<div class="pb-c" style="--c:${c}"><div class="pb-tete">si ${expression(i.condition)} alors</div>`;
          h += `<div class="pb-corps">${pile(i.alors)}</div>`;
          if (i.bloc === 'si_sinon') h += `<div class="pb-tete pb-milieu">sinon</div><div class="pb-corps">${pile(i.sinon)}</div>`;
          return h + '<div class="pb-pied"></div></div>';
        }
        default:
          return blocCarte(i) || '';
      }
    }

    function pile(liste) {
      if (!liste || !liste.length) return '<div class="pb-emplacement"></div>';
      return liste.map(instruction).join('');
    }

    const chapeau = (titre, liste) =>
      `<div class="pb-c pb-chapeau" style="--c:${C().debut}"><div class="pb-tete">${titre}</div>` +
      `<div class="pb-corps">${pile(liste)}</div><div class="pb-pied"></div></div>`;

    // Programme v1 (fils) ou programme de l'atelier ({ demarrage, boucle }).
    const fils = A.versV1(programme || {}).fils;
    const fil = (q) => fils.find((f) => f.quand === q);
    let h = '<div class="petits-blocs">';
    const demarrage = fil('demarrage');
    if (demarrage && (demarrage.corps.length || o.avecVides)) h += chapeau('Au démarrage', demarrage.corps);
    if (fil('boucle')) h += chapeau('Répéter indéfiniment', fil('boucle').corps);
    for (const f of fils.filter((x) => x.quand === 'appui' || x.quand === 'relache')) {
      h += chapeau(`${image('bouton')} quand le bouton de la broche ${pastille(f.broche)} est ${f.quand === 'appui' ? 'appuyé' : 'relâché'}`, f.corps);
    }
    return h + '</div>';
  }

  // ---------- Schémas des fiches ----------

  function chronogramme(series) {
    const total = Math.max(...series.map((s) => s.etats.reduce((t, e) => t + e[0], 0)));
    const largeur = 300;
    const gauche = 92;
    const hLigne = 44;
    const ech = (largeur - gauche - 8) / total;
    let svg = `<svg class="schema-svg" viewBox="0 0 ${largeur} ${series.length * hLigne + 26}" role="img" aria-label="Chronogramme">`;
    series.forEach((s, i) => {
      const y0 = 10 + i * hLigne;
      svg += `<text x="0" y="${y0 + 20}" class="schema-texte">${echapper(s.nom)}</text>`;
      let x = gauche;
      for (const [duree, etat] of s.etats) {
        const w = duree * ech;
        const haut = etat === 'HAUT' || /^9|^18/.test(etat);
        const y = haut ? y0 + 2 : y0 + 22;
        svg += `<rect x="${x}" y="${y}" width="${w}" height="${haut ? 28 : 8}" rx="3" fill="${haut ? '#FAB22B' : '#D5DEE3'}" stroke="#1F2A30" stroke-width="1.2"/>`;
        if (w > 22) svg += `<text x="${x + w / 2}" y="${haut ? y + 18 : y - 4}" text-anchor="middle" class="schema-petit">${echapper(etat)}</text>`;
        x += w;
      }
    });
    // Axe du temps, en secondes
    const yAxe = series.length * hLigne + 12;
    svg += `<line x1="${gauche}" y1="${yAxe}" x2="${largeur - 8}" y2="${yAxe}" stroke="#4F5D66" stroke-width="1.2"/>`;
    for (let t = 0; t <= total; t += total > 4 ? 2 : 1) {
      const x = gauche + t * ech;
      svg += `<line x1="${x}" y1="${yAxe - 3}" x2="${x}" y2="${yAxe + 3}" stroke="#4F5D66"/>`;
      svg += `<text x="${x}" y="${yAxe + 13}" text-anchor="middle" class="schema-petit">${t} s</text>`;
    }
    return svg + '</svg>';
  }

  function ledSchema() {
    const led = (x, on) =>
      `<g transform="translate(${x},0)">` +
      (on ? '<circle cx="24" cy="30" r="22" fill="#FAB22B" opacity=".3"/>' : '') +
      `<path d="M12 46V30a12 12 0 0 1 24 0v16z" fill="${on ? '#FAB22B' : '#EEF3F6'}" stroke="${on ? '#5B3A00' : '#7C8B94'}" stroke-width="2.5"/>` +
      '<path d="M20 46v14M28 46v10" stroke="#7C8B94" stroke-width="3" stroke-linecap="round"/>' +
      `<text x="24" y="78" text-anchor="middle" class="schema-texte">${on ? 'HAUT (1)' : 'BAS (0)'}</text>` +
      `<text x="24" y="92" text-anchor="middle" class="schema-petit">${on ? 'allumée' : 'éteinte'}</text></g>`;
    return `<svg class="schema-svg schema-etroit" viewBox="0 0 200 96" role="img" aria-label="LED éteinte et LED allumée">${led(30, false)}${led(122, true)}</svg>`;
  }

  function servoSchema(angles) {
    const cadran = (cx, angle, legende) => {
      const r = (angle * Math.PI) / 180;
      return (
        `<g><path d="M${cx - 30} 50A30 30 0 0 1 ${cx + 30} 50" fill="none" stroke="#9AA8B0" stroke-width="2"/>` +
        `<line x1="${cx}" y1="50" x2="${cx + 24 * Math.cos(r)}" y2="${50 - 24 * Math.sin(r)}" stroke="#1F2A30" stroke-width="6" stroke-linecap="round"/>` +
        `<line x1="${cx}" y1="50" x2="${cx + 24 * Math.cos(r)}" y2="${50 - 24 * Math.sin(r)}" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>` +
        `<circle cx="${cx}" cy="50" r="4" fill="#FFFFFF" stroke="#1F2A30" stroke-width="2"/>` +
        `<text x="${cx}" y="68" text-anchor="middle" class="schema-texte">${angle}°</text>` +
        (legende ? `<text x="${cx}" y="82" text-anchor="middle" class="schema-petit">${legende}</text>` : '') +
        '</g>'
      );
    };
    if (!angles) {
      return (
        '<svg class="schema-svg" viewBox="0 0 300 90" role="img" aria-label="Servo-moteur à 0°, 90° et 180°">' +
        cadran(50, 0, 'bras à droite') + cadran(150, 90, 'bras en haut') + cadran(250, 180, 'bras à gauche') + '</svg>'
      );
    }
    const pas = 300 / angles.length;
    let svg = `<svg class="schema-svg" viewBox="0 0 300 90" role="img" aria-label="Suite de positions du servo-moteur">`;
    angles.forEach((a, i) => {
      svg += cadran(pas / 2 + i * pas, a, '');
      if (i < angles.length - 1) svg += `<text x="${pas * (i + 1)}" y="44" text-anchor="middle" class="schema-texte">›</text>`;
    });
    return svg + '</svg>';
  }

  function fourche() {
    return (
      '<svg class="schema-svg" viewBox="0 0 300 120" role="img" aria-label="Fourche si alors sinon">' +
      '<rect x="95" y="4" width="110" height="30" rx="8" fill="#78B5D6" stroke="#1F2A30" stroke-width="1.5"/>' +
      '<text x="150" y="24" text-anchor="middle" class="schema-texte">bouton appuyé ?</text>' +
      '<path d="M150 34v14M150 48H70v18M150 48h80v18" fill="none" stroke="#1F2A30" stroke-width="2"/>' +
      '<text x="96" y="62" class="schema-petit">oui</text><text x="186" y="62" class="schema-petit">non</text>' +
      '<rect x="10" y="68" width="120" height="44" rx="8" fill="#F7AE5E" stroke="#1F2A30" stroke-width="1.5"/>' +
      '<text x="70" y="86" text-anchor="middle" class="schema-texte">alors</text><text x="70" y="102" text-anchor="middle" class="schema-petit">LED allumée</text>' +
      '<rect x="170" y="68" width="120" height="44" rx="8" fill="#F7AE5E" stroke="#1F2A30" stroke-width="1.5"/>' +
      '<text x="230" y="86" text-anchor="middle" class="schema-texte">sinon</text><text x="230" y="102" text-anchor="middle" class="schema-petit">LED éteinte</text>' +
      '</svg>'
    );
  }

  function capteurActionneur() {
    const boite = (x, couleur, titre, sous) =>
      `<rect x="${x}" y="20" width="84" height="48" rx="8" fill="${couleur}" stroke="#1F2A30" stroke-width="1.5"/>` +
      `<text x="${x + 42}" y="40" text-anchor="middle" class="schema-texte">${titre}</text>` +
      `<text x="${x + 42}" y="56" text-anchor="middle" class="schema-petit">${sous}</text>`;
    const fleche = (x) => `<path d="M${x} 44h20m-6-6 6 6-6 6" fill="none" stroke="#1F2A30" stroke-width="2" stroke-linecap="round"/>`;
    return (
      '<svg class="schema-svg" viewBox="0 0 300 88" role="img" aria-label="Le capteur commande l’actionneur">' +
      boite(0, '#78B5D6', 'Bouton', 'capteur') + fleche(88) + boite(108, '#BCDAEB', 'Carte', 'programme') + fleche(196) +
      boite(216, '#E78AB3', 'Moteur', 'actionneur') + '</svg>'
    );
  }

  function variableSchema(nom, valeur) {
    return (
      '<svg class="schema-svg schema-etroit" viewBox="0 0 200 100" role="img" aria-label="Une variable est une boîte avec une étiquette">' +
      '<path d="M40 40h120v52H40z" fill="#FFF4DD" stroke="#1F2A30" stroke-width="2"/>' +
      '<path d="M40 40l14-16h92l14 16" fill="#F0D9A8" stroke="#1F2A30" stroke-width="2" stroke-linejoin="round"/>' +
      `<rect x="62" y="6" width="76" height="22" rx="6" fill="#EC8780" stroke="#1F2A30" stroke-width="1.5"/>` +
      `<text x="100" y="22" text-anchor="middle" class="schema-texte">${echapper(nom)}</text>` +
      `<text x="100" y="76" text-anchor="middle" class="schema-grand">${echapper(valeur)}</text>` +
      '</svg>'
    );
  }

  // Au démarrage (une fois), puis Répéter indéfiniment (sans fin).
  function deroulement() {
    return (
      '<svg class="schema-svg" viewBox="0 0 300 116" role="img" aria-label="Au démarrage une fois, puis Répéter indéfiniment sans fin">' +
      '<rect x="4" y="34" width="112" height="44" rx="14" fill="#86C595" stroke="#1F2A30" stroke-width="1.5"/>' +
      '<text x="60" y="54" text-anchor="middle" class="schema-texte">Au démarrage</text>' +
      '<text x="60" y="69" text-anchor="middle" class="schema-petit">une seule fois</text>' +
      '<path d="M118 56h40m-7-7 7 7-7 7" fill="none" stroke="#1F2A30" stroke-width="2.2" stroke-linecap="round"/>' +
      '<rect x="162" y="34" width="134" height="44" rx="14" fill="#86C595" stroke="#1F2A30" stroke-width="1.5"/>' +
      '<text x="229" y="54" text-anchor="middle" class="schema-texte">Répéter indéfiniment</text>' +
      '<text x="229" y="69" text-anchor="middle" class="schema-petit">puis sans fin</text>' +
      '<path d="M270 80c0 26-82 26-82 0" fill="none" stroke="#1A6E8E" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M182 86l6-7 6 7" fill="none" stroke="#1A6E8E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<text x="229" y="112" text-anchor="middle" class="schema-petit">on recommence au début</text>' +
      '<text x="60" y="22" text-anchor="middle" class="schema-petit">la carte s’allume</text>' +
      '</svg>'
    );
  }

  function schemaHtml(s) {
    if (!s) return '';
    switch (s.type) {
      case 'led':
        return ledSchema();
      case 'chronogramme':
        return chronogramme(s.series);
      case 'blocs':
        return blocsHtml(s.programme, {});
      case 'fourche':
        return fourche();
      case 'servo':
        return servoSchema();
      case 'angles':
        return servoSchema(s.angles);
      case 'capteur-actionneur':
        return capteurActionneur();
      case 'deroulement':
        return deroulement();
      case 'variable':
        return variableSchema(s.nom || 'CHOIX', s.valeur === undefined ? 3 : s.valeur);
      default:
        return '';
    }
  }

  // ---------- Panneau qui glisse par-dessus l'éditeur ----------

  function creerAides(rappels) {
    const panneau = document.querySelector('.panneau-aide');
    const titre = panneau.querySelector('.panneau-aide-titre');
    const corps = panneau.querySelector('.panneau-aide-corps');
    const icone = panneau.querySelector('.panneau-aide-icone');
    let ouvert = null; // 'fiche' | 'indice'
    let exercice = null;

    function ouvrir(sorte, nomIcone, texteTitre, html) {
      ouvert = sorte;
      icone.innerHTML = A.icone(nomIcone, { couleur: '#1A6E8E' });
      titre.textContent = texteTitre;
      corps.innerHTML = html;
      panneau.hidden = false;
      panneau.querySelector('.panneau-aide-fermer').focus();
      for (const b of document.querySelectorAll('[data-aide]')) b.setAttribute('aria-expanded', String(b.dataset.aide === sorte));
    }
    function fermer() {
      ouvert = null;
      panneau.hidden = true;
      for (const b of document.querySelectorAll('[data-aide]')) b.setAttribute('aria-expanded', 'false');
    }
    panneau.querySelector('.panneau-aide-fermer').addEventListener('click', fermer);

    // ----- Fiche « À savoir » -----

    // Fiche choisie par sa clé (ex. l'explication des blocs « Au démarrage » et « Répéter indéfiniment »).
    function explication(cle) {
      const f = (A.fiches || {})[cle];
      if (!f) return;
      ouvrir('explication', 'info', f.titre,
        '<ul class="fiche-lignes">' + f.lignes.map((l) => `<li>${echapper(l)}</li>`).join('') + '</ul>' +
          `<div class="fiche-schema">${schemaHtml(f.schema)}</div>`);
    }

    function fiche() {
      if (ouvert === 'fiche') return fermer();
      const f = (A.fiches || {})[exercice.aSavoir];
      if (!f) return ouvrir('fiche', 'info', 'À savoir', '<p>Pas de fiche pour cet exercice.</p>');
      let html = '<ul class="fiche-lignes">' + f.lignes.map((l) => `<li>${echapper(l)}</li>`).join('') + '</ul>';
      if (f.etapes) {
        html += '<div class="fiche-etapes" aria-live="polite"></div>' +
          '<div class="fiche-navigation"><button type="button" class="btn-secondaire btn-etape-prec">Précédent</button>' +
          '<span class="etape-numero"></span>' +
          '<button type="button" class="btn-principal btn-etape-suiv">Suivant</button></div>';
      } else html += `<div class="fiche-schema">${schemaHtml(f.schema)}</div>`;
      ouvrir('fiche', 'info', f.titre, html);
      if (f.etapes) {
        let n = 0;
        const montrer = () => {
          const e = f.etapes[n];
          corps.querySelector('.fiche-etapes').innerHTML = `<p class="etape-texte">${echapper(e.texte)}</p>${blocsHtml(e.programme, {})}`;
          corps.querySelector('.etape-numero').textContent = `Étape ${n + 1} sur ${f.etapes.length}`;
          corps.querySelector('.btn-etape-prec').disabled = n === 0;
          corps.querySelector('.btn-etape-suiv').disabled = n === f.etapes.length - 1;
        };
        corps.querySelector('.btn-etape-prec').addEventListener('click', () => {
          n = Math.max(0, n - 1);
          montrer();
        });
        corps.querySelector('.btn-etape-suiv').addEventListener('click', () => {
          n = Math.min(f.etapes.length - 1, n + 1);
          montrer();
        });
        montrer();
      }
    }

    // ----- Indices : révélés un par un, jamais la solution complète -----

    const NOMS = ['La consigne en une phrase', 'Les blocs à utiliser', 'La silhouette du programme'];
    function indiceHtml(niveau) {
      if (niveau === 3) {
        const solution = exercice.silhouette || exercice.solutionReference;
        return '<p>Les cases « ? » sont à compléter : à toi de trouver les broches et les valeurs.</p>' + blocsHtml(solution, { trous: true });
      }
      return `<p>${echapper((exercice.indices || [])[niveau - 1] || '')}</p>`;
    }
    function dessinerIndices() {
      const vus = rappels.indicesOuverts();
      let html = '';
      for (let n = 1; n <= vus; n++) {
        html += `<section class="indice"><h3><span class="indice-niveau">${n}</span>${NOMS[n - 1]}</h3>${indiceHtml(n)}</section>`;
      }
      if (vus < 3) {
        html +=
          (vus ? '' : '<p class="indice-intro">Trois indices, du plus léger au plus fort. Ouvre-les un par un.</p>') +
          '<p class="indice-note">Les indices s’ouvrent un par un. Ton professeur voit combien tu en as utilisé : essaie d’abord sans !</p>' +
          `<button type="button" class="btn-principal btn-indice-suivant">${A.icone('ampoule')}Voir l’indice ${vus + 1}</button>`;
      } else html += '<p class="indice-intro">Tu as vu les trois indices. La solution complète n’est jamais montrée : à toi de jouer !</p>';
      ouvrir('indice', 'ampoule', `Indices (${vus}/3)`, html);
      const b = corps.querySelector('.btn-indice-suivant');
      if (b) {
        b.addEventListener('click', () => {
          rappels.ouvrirIndice(vus + 1);
          dessinerIndices();
          const dernier = corps.querySelectorAll('.indice');
          if (dernier.length) dernier[dernier.length - 1].scrollIntoView({ block: 'nearest' });
        });
      }
    }
    function indice() {
      if (ouvert === 'indice') return fermer();
      dessinerIndices();
    }

    return {
      changerExercice(ex) {
        exercice = ex;
        fermer();
      },
      fiche,
      indice,
      explication,
      fermer,
    };
  }

  // ---------- Lexique : toutes les définitions, avec recherche ----------

  function creerLexique(motsVus) {
    const dialogue = document.querySelector('.dialogue-lexique');
    const recherche = dialogue.querySelector('.lexique-recherche');
    const filtre = dialogue.querySelector('.lexique-vus');
    const grille = dialogue.querySelector('.lexique-grille');
    const simple = (s) => A.simplifierNom(s);

    function dessiner() {
      const q = simple(recherche.value);
      const vus = motsVus();
      const entrees = (A.lexique || []).map((e, i) => ({ e, i })).filter(({ e, i }) => {
        if (filtre.checked && !vus.has(i)) return false;
        return !q || simple(e.mot).includes(q) || simple(e.definition).includes(q) || (e.formes || []).some((f) => simple(f).includes(q));
      });
      if (!entrees.length) {
        grille.innerHTML = `<p class="lexique-vide">Aucun mot ne correspond${recherche.value ? ` à « ${echapper(recherche.value)} »` : ''}.</p>`;
        return;
      }
      grille.innerHTML = entrees
        .map(
          ({ e, i }) =>
            `<article class="lexique-carte${vus.has(i) ? ' vu' : ''}">` +
            `<div class="lexique-picto">${A.icone(e.icone || 'livre', { couleur: '#1A6E8E', epaisseur: 2.4 })}</div>` +
            `<div><h3>${echapper(e.mot)}${vus.has(i) ? '<span class="lexique-badge">déjà vu</span>' : ''}</h3>` +
            `<p>${echapper(e.definition)}</p></div></article>`,
        )
        .join('');
    }
    recherche.addEventListener('input', dessiner);
    filtre.addEventListener('change', dessiner);
    dialogue.querySelector('.btn-fermer-lexique').addEventListener('click', () => dialogue.close());

    return {
      ouvrir() {
        recherche.value = '';
        dessiner();
        dialogue.showModal();
        recherche.focus();
      },
    };
  }

  // Le mot apparaît-il tel quel dans le texte (pas au milieu d'un autre mot) ?
  function contientMot(texte, mot) {
    const echappe = mot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(?<![\\p{L}\\d])' + echappe + '(?![\\p{L}\\d])', 'u').test(texte);
  }

  Object.assign(A, { blocsHtml, schemaHtml, creerAides, creerLexique, contientMot });
})(this);
