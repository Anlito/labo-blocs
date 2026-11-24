// La course aux portes au vidéoprojecteur (site/course.html), pilotée par le professeur. Moteur : noyau/course.js.
//   1. les équipes du jour et le format (pistes, manches, finales), avec la durée estimée ;
//   2. le programme des départs ; 3. chaque départ : « Top départ » (Espace), un chrono par piste, les portes passées,
//      les malus, « Arrivée » (touches 1 à 3) ou « Abandon » ; 4. le classement des manches, puis les finales par niveau ;
//   5. le podium, le record.
// La course en cours est gardée dans ce navigateur (une page rechargée reprend où elle en était) ; « Enregistrer »
// télécharge course-portes.json (rouvrable ici) et « Tableur » le fichier CSV. Rien n'est envoyé ailleurs.
(function () {
  'use strict';

  const C = window.LaboCourse;
  const racine = document.getElementById('app');
  const CLE = 'labo-blocs-course-portes';
  const DEMO = ['Les Éclairs', 'Turbo Team', 'RoboFous', 'Les Castors', 'Mach 3', 'Pixel', 'Les Fusées', 'Zigzag'];

  let etat = null; // la course (noyau/course.js) + { etape, depart }
  let brouillon = { equipes: '', reglages: Object.assign({}, C.REGLAGES), minutes: 40 };
  let actions = {};
  let tic = null;
  let chrono = null; // départ en cours : { debut, pistes: [{ equipe, portes, touches, fin, arrive }] }

  const ech = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const nomDe = (id) => (etat.equipes.find((e) => e.id === id) || { nom: id }).nom;
  const nb = C.nombre;

  function garder() {
    try {
      if (etat) localStorage.setItem(CLE, JSON.stringify(etat));
    } catch {}
  }
  function relire() {
    try {
      const e = JSON.parse(localStorage.getItem(CLE) || 'null');
      return e && e.format === 'labo-blocs/course-portes' ? e : null;
    } catch {
      return null;
    }
  }

  // ---------- Affichage ----------

  function afficher(nom, html, acts) {
    clearInterval(tic);
    racine.innerHTML = `<div class="co-ecran" data-ecran="${nom}">${html}</div>`;
    actions = acts || {};
    if (etat) {
      etat.etape = nom;
      garder();
    }
  }
  racine.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (b && !b.disabled && actions[b.dataset.action]) actions[b.dataset.action](b);
  });
  for (const type of ['change', 'input'])
    racine.addEventListener(type, (e) => {
      const c = e.target.closest('[data-champ]');
      if (c && actions.champ && (type === 'change' || c.tagName === 'TEXTAREA')) actions.champ(c);
    });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if (/^[1-3]$/.test(e.key) && actions.arrivee) {
      const b = racine.querySelector(`[data-action="arrivee"][data-piste="${Number(e.key) - 1}"]`);
      if (b && !b.disabled) actions.arrivee(b);
    } else if (e.key === ' ' && actions['top-depart'] && racine.querySelector('[data-action="top-depart"]:not([disabled])')) {
      e.preventDefault();
      actions['top-depart']();
    }
  });

  const haut = (titre, sous, droite) =>
    `<header class="co-haut"><div><div class="co-sur-titre">${ech(sous || 'La course aux portes')}</div><h1>${ech(titre)}</h1></div><div class="espace"></div>${droite || ''}</header>`;
  const bas = (gauche, droite) => `<footer class="co-bas"><div class="co-groupe">${gauche || ''}</div><div class="co-groupe">${droite || ''}</div></footer>`;
  const bouton = (action, texte, classe, attrs) => `<button type="button" class="co-btn ${classe || ''}" data-action="${action}" ${attrs || ''}>${ech(texte)}</button>`;
  const principal = (action, texte, attrs) => bouton(action, texte, 'co-principal', attrs);
  const choix = (champ, valeur, actuel, texte) =>
    `<button type="button" class="co-choix" data-action="regler" data-champ-nom="${champ}" data-valeur="${valeur}" aria-pressed="${String(actuel) === String(valeur)}">${ech(texte == null ? valeur : texte)}</button>`;

  function message(texte) {
    const m = document.createElement('div');
    m.className = 'co-message';
    m.textContent = texte;
    document.body.append(m);
    setTimeout(() => m.remove(), 4000);
  }

  function telecharger(nom, contenu, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([contenu], { type }));
    a.download = nom;
    document.body.append(a);
    a.click();
    setTimeout(() => (URL.revokeObjectURL(a.href), a.remove()), 1000);
  }
  const enregistrer = () => telecharger('course-portes.json', JSON.stringify(etat, null, 2), 'application/json');
  const tableur = () => telecharger('course-portes.csv', C.csv(C.lignesCsv(etat)), 'text/csv;charset=utf-8');
  const outils = () => bouton('enregistrer', 'Enregistrer') + bouton('tableur', 'Tableur (.csv)');
  const actionsOutils = { enregistrer, tableur };

  // Résultat d'un essai, jamais avec la couleur seule : « 46,5 s » ou une pastille ambre « 4 portes sur 6 ».
  function resultat(essai) {
    if (!essai) return '<span class="co-attente">à courir</span>';
    if (C.arrive(essai)) return `<strong>${nb(C.tempsTotal(essai, etat.reglages))} s</strong>${essai.touches ? ` <small>dont ${essai.touches} malus</small>` : ''}`;
    return `<span class="co-pastille-ecart">Pas arrivé · ${C.texteEssai(essai, etat.reglages)}</span>`;
  }

  // ---------- 1. Accueil ----------

  function ecranAccueil() {
    etat = null;
    const reprise = relire();
    afficher(
      'accueil',
      `<div class="co-accueil">
        <div class="co-logo" aria-hidden="true">🏁</div>
        <div class="co-sur-titre">Labo Blocs · mBot et caméra</div>
        <h1 class="co-grand">La course aux portes</h1>
        <div class="co-cartes">
          ${bouton('nouvelle', 'Nouvelle course', 'co-carte co-principal')}
          ${reprise ? bouton('reprendre', `Reprendre la course (${reprise.equipes.length} équipes)`, 'co-carte') : ''}
          <label class="co-btn co-carte">Ouvrir une course enregistrée<input type="file" accept=".json,application/json" data-champ="fichier" hidden></label>
          ${bouton('demo', 'Démonstration (8 équipes)', 'co-carte')}
        </div>
      </div>`,
      {
        nouvelle: () => ecranReglages(),
        demo: () => {
          brouillon.equipes = DEMO.join('\n');
          ecranReglages();
        },
        reprendre: () => {
          etat = reprise;
          aller();
        },
        champ: (c) => {
          const f = c.files && c.files[0];
          if (!f) return;
          f.text().then((t) => {
            try {
              const e = JSON.parse(t);
              if (e.format !== 'labo-blocs/course-portes') throw new Error();
              etat = e;
              aller();
            } catch {
              message('Ce fichier n’est pas une course enregistrée par cette page (course-portes.json).');
            }
          });
        },
      }
    );
  }

  function aller() {
    if (!etat.departs.length) return ecranReglages();
    if (etat.etape === 'podium' && C.finalesFinies(etat)) return ecranPodium();
    if (etat.etape === 'classement') return ecranClassement();
    return ecranProgramme();
  }

  // ---------- 2. Les équipes et le format ----------

  const listeEquipes = () =>
    brouillon.equipes
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s, i, t) => t.indexOf(s) === i);

  function ecranReglages() {
    const R = brouillon.reglages;
    const n = listeEquipes().length;
    afficher(
      'reglages',
      haut('Les équipes et le format', 'Nouvelle course', `<span class="co-compte">${n} équipe${n > 1 ? 's' : ''}</span>`).replace('class="co-compte"', 'class="co-compte" data-compte') +
        `<div class="co-milieu co-deux">
          <section class="co-panneau">
            <h2>Les équipes du jour</h2>
            <p class="co-aide">Un nom d’équipe par ligne. Retirez les équipes absentes.</p>
            <textarea class="co-equipes" data-champ="equipes" rows="12" spellcheck="false" placeholder="Les Éclairs&#10;Turbo Team&#10;…">${ech(brouillon.equipes)}</textarea>
          </section>
          <section class="co-panneau">
            <h2>Le format</h2>
            <div class="co-ligne"><span>Pistes côte à côte</span><div class="co-choix-groupe">${[1, 2, 3].map((v) => choix('pistes', v, R.pistes)).join('')}</div></div>
            <div class="co-ligne"><span>Portes sur la piste</span><input type="number" min="1" max="20" value="${R.portes}" data-champ="portes"></div>
            <div class="co-ligne"><span>Malus (porte touchée, robot replacé)</span><span><input type="number" min="0" max="60" value="${R.malus}" data-champ="malus"> s</span></div>
            <div class="co-ligne"><span>Temps maximum d’un essai</span><span><input type="number" min="30" max="600" step="10" value="${R.tempsMax}" data-champ="tempsMax"> s</span></div>
            <div class="co-ligne"><span>Manches de qualification</span><div class="co-choix-groupe">${[1, 2, 3].map((v) => choix('manches', v, R.manches)).join('')}</div></div>
            <div class="co-ligne"><span>Finales par niveau</span><div class="co-choix-groupe">${choix('finales', 'true', R.finales, 'Oui')}${choix('finales', 'false', R.finales, 'Non')}</div></div>
            ${R.finales ? `<div class="co-ligne"><span>Équipes par finale (au plus)</span><div class="co-choix-groupe">${[2, 3, 4, 5, 6].map((v) => choix('tailleFinale', v, R.tailleFinale)).join('')}</div></div>` : ''}
            <div class="co-estimation">
              <div data-estimation>${estimation()}</div>
              <div class="co-ligne co-proposer"><span>Temps pour la course :</span><span><input type="number" min="10" max="120" step="5" value="${brouillon.minutes}" data-champ="minutes"> min</span>${bouton('proposer', 'Proposer un format', '', n ? '' : 'disabled')}</div>
            </div>
          </section>
        </div>` +
        bas(bouton('accueil', 'Accueil'), principal('lancer', 'Lancer la course', n < 2 ? 'disabled' : '')),
      {
        accueil: () => ecranAccueil(),
        regler: (b) => {
          const v = b.dataset.valeur;
          R[b.dataset.champNom] = v === 'true' ? true : v === 'false' ? false : Number(v);
          ecranReglages();
        },
        champ: (c) => {
          const nom = c.dataset.champ;
          if (nom === 'equipes') brouillon.equipes = c.value;
          else if (nom === 'minutes') brouillon.minutes = Math.max(10, Number(c.value) || 40);
          else R[nom] = Number(c.value) >= 0 && c.value !== '' ? Number(c.value) : C.REGLAGES[nom];
          majEstimation();
        },
        proposer: () => {
          Object.assign(R, C.proposerFormat(listeEquipes().length, brouillon.minutes, R));
          ecranReglages();
          message(`Format proposé : ${R.manches} manche${R.manches > 1 ? 's' : ''}${R.finales ? ' et des finales' : ', sans finales'}.`);
        },
        lancer: () => {
          etat = C.creerCourse(listeEquipes(), R);
          ecranProgramme();
        },
      }
    );
  }

  function estimation() {
    const R = brouillon.reglages;
    const n = listeEquipes().length;
    if (!n) return 'Écrivez les équipes pour voir la durée de la course.';
    return `<strong>${C.nombreDeparts(n, R)}</strong> départs · chaque équipe court <strong>${R.manches + (R.finales ? 1 : 0)}</strong> fois · environ <strong>${C.dureeEstimee(n, R)} min</strong>
      <small>(${nb(R.minutesParDepart)} min par départ, réglage compris)</small>`;
  }
  function majEstimation() {
    const n = listeEquipes().length;
    const el = racine.querySelector('[data-estimation]');
    if (el) el.innerHTML = estimation();
    const compte = racine.querySelector('[data-compte]');
    if (compte) compte.textContent = `${n} équipe${n > 1 ? 's' : ''}`;
    for (const [action, actif] of [['lancer', n >= 2], ['proposer', n >= 1]]) {
      const b = racine.querySelector(`[data-action="${action}"]`);
      if (b) b.disabled = !actif;
    }
  }

  // ---------- 3. Le programme des départs ----------

  function ecranProgramme() {
    const prochain = C.prochainDepart(etat);
    const qualifsFinies = C.qualifsFinies(etat);
    const sections = [];
    const parPhase = (titre, departs) =>
      departs.length &&
      sections.push(
        `<section class="co-phase"><h2>${ech(titre)}</h2>${departs
          .map(
            (d) => `<button type="button" class="co-depart${C.departFini(d) ? ' fini' : ''}${d === prochain ? ' prochain' : ''}" data-action="ouvrir" data-id="${d.id}">
              <span class="co-depart-nom">${C.departFini(d) ? '✓ ' : d === prochain ? '▶ ' : ''}${ech(d.nom)}</span>
              ${d.equipes.map((id) => `<span class="co-depart-equipe"><span>${ech(nomDe(id))}</span>${resultat(d.resultats[id])}</span>`).join('')}
            </button>`
          )
          .join('')}</section>`
      );
    for (let m = 1; m <= etat.reglages.manches; m++) parPhase(`Manche ${m}`, etat.departs.filter((d) => d.manche === m));
    parPhase('Finales', etat.departs.filter((d) => d.phase === 'finale'));
    const suite = prochain
      ? principal('ouvrir', `Départ suivant : ${prochain.nom}`, `data-id="${prochain.id}"`)
      : qualifsFinies && etat.reglages.finales && !etat.finales.length
        ? principal('classement', 'Classement des manches')
        : principal('podium', 'Le podium');
    afficher(
      'programme',
      haut('Le programme', `${etat.equipes.length} équipes · ${etat.reglages.pistes} piste${etat.reglages.pistes > 1 ? 's' : ''} · ${etat.reglages.portes} portes`, bouton('classement', 'Classement')) +
        `<div class="co-milieu co-programme">${sections.join('')}</div>` +
        bas(bouton('accueil', 'Accueil') + outils(), suite),
      Object.assign({}, actionsOutils, {
        accueil: () => ecranAccueil(),
        ouvrir: (b) => ecranDepart(etat.departs.find((d) => d.id === b.dataset.id)),
        classement: () => ecranClassement(),
        podium: () => ecranPodium(),
      })
    );
  }

  // ---------- 4. Un départ ----------

  const secondes = (ms) => Math.max(0, Math.round(ms / 100) / 10);
  const tempsPiste = (p) => (chrono.debut ? secondes((p.fin || performance.now()) - chrono.debut) : 0);

  function ecranDepart(depart) {
    const R = etat.reglages;
    chrono = {
      debut: null,
      pistes: depart.equipes.map((id) => {
        const e = depart.resultats[id];
        return { equipe: id, portes: e ? e.portes : 0, touches: e ? e.touches : 0, temps: e ? e.temps : 0, fin: null, arrive: e ? e.arrive : null, fait: !!e };
      }),
    };
    dessinerDepart(depart);
  }

  function dessinerDepart(depart) {
    const R = etat.reglages;
    const lance = !!chrono.debut;
    const tousFaits = chrono.pistes.every((p) => p.fait);
    const piste = (p, i) => {
      const statut = p.fait ? (p.arrive ? `<span class="co-pastille-ok">✓ Arrivé · ${nb(p.temps)} s</span>` : `<span class="co-pastille-ecart">Pas arrivé · ${nb(p.temps)} s</span>`) : '';
      const total = p.fait ? C.tempsTotal(p, R) : null;
      return `<section class="co-piste${p.fait ? ' faite' : ''}">
        <div class="co-piste-tete"><span class="co-num">Piste ${i + 1}</span><h2>${ech(nomDe(p.equipe))}</h2></div>
        <div class="co-chrono" data-chrono="${i}">${nb(p.fait ? p.temps : tempsPiste(p))}<small> s</small></div>
        <div class="co-compteurs">
          <div class="co-compteur"><span>Portes passées</span><div>${bouton('portes-moins', '−', 'co-rond', `data-piste="${i}" aria-label="Une porte de moins"`)}<strong>${p.portes} / ${R.portes}</strong>${bouton('portes-plus', '+', 'co-rond', `data-piste="${i}" aria-label="Une porte de plus"`)}</div></div>
          <div class="co-compteur"><span>Malus (+${R.malus} s)</span><div>${bouton('malus-moins', '−', 'co-rond', `data-piste="${i}" aria-label="Un malus de moins"`)}<strong>${p.touches}</strong>${bouton('malus-plus', '+', 'co-rond', `data-piste="${i}" aria-label="Un malus de plus"`)}</div></div>
        </div>
        ${statut}${total != null && p.arrive ? `<div class="co-total">Temps total : <strong>${nb(total)} s</strong></div>` : ''}
        <div class="co-groupe co-piste-actions">
          ${p.fait ? bouton('corriger', 'Corriger', '', `data-piste="${i}"`) : bouton('arrivee', `Arrivée (touche ${i + 1})`, 'co-principal co-gros', `data-piste="${i}"${lance ? '' : ' disabled'}`) + bouton('abandon', 'Abandon', '', `data-piste="${i}"${lance ? '' : ' disabled'}`)}
        </div>
      </section>`;
    };
    afficher(
      'depart',
      haut(depart.nom, `Temps maximum ${R.tempsMax} s · malus ${R.malus} s`) +
        `<div class="co-milieu co-pistes co-pistes-${chrono.pistes.length}">${chrono.pistes.map(piste).join('')}</div>` +
        bas(
          bouton('retour', 'Programme') + (lance && !tousFaits ? bouton('faux-depart', 'Faux départ : recommencer') : ''),
          tousFaits ? principal('valider', 'Valider le départ') : principal('top-depart', 'Top départ (Espace)', lance ? 'disabled' : '')
        ),
      {
        retour: () => ecranProgramme(),
        'top-depart': () => {
          chrono.debut = performance.now();
          dessinerDepart(depart);
        },
        'faux-depart': () => ecranDepart(depart),
        arrivee: (b) => finir(depart, Number(b.dataset.piste), true),
        abandon: (b) => finir(depart, Number(b.dataset.piste), false),
        corriger: (b) => {
          const p = chrono.pistes[Number(b.dataset.piste)];
          const t = prompt(`Temps de « ${nomDe(p.equipe)} » en secondes :`, nb(p.temps));
          if (t == null) return;
          const v = Number(String(t).replace(',', '.'));
          if (!(v >= 0)) return message('Écrire un nombre de secondes, par exemple 42,5.');
          p.temps = Math.round(v * 10) / 10;
          p.arrive = confirm(`« ${nomDe(p.equipe)} » est-il arrivé (toutes les portes passées) ?\nOK = arrivé · Annuler = pas arrivé`);
          if (p.arrive) p.portes = R.portes;
          dessinerDepart(depart);
        },
        'portes-plus': (b) => compter(depart, b, 'portes', 1),
        'portes-moins': (b) => compter(depart, b, 'portes', -1),
        'malus-plus': (b) => compter(depart, b, 'touches', 1),
        'malus-moins': (b) => compter(depart, b, 'touches', -1),
        valider: () => {
          for (const p of chrono.pistes) depart.resultats[p.equipe] = { arrive: !!p.arrive, portes: p.portes, temps: p.temps, touches: p.touches };
          chrono = null;
          garder();
          const finManche = depart.phase === 'qualif' && etat.departs.filter((d) => d.manche === depart.manche).every(C.departFini);
          if (finManche) return ecranClassement(`Fin de la manche ${depart.manche}`);
          if (C.finalesFinies(etat) || (!etat.reglages.finales && C.qualifsFinies(etat))) return ecranPodium();
          ecranProgramme();
        },
      }
    );
    if (lance && !tousFaits)
      tic = setInterval(() => {
        chrono.pistes.forEach((p, i) => {
          if (p.fait) return;
          const t = tempsPiste(p);
          if (t >= R.tempsMax) return finir(depart, i, false, R.tempsMax);
          const el = racine.querySelector(`[data-chrono="${i}"]`);
          if (el) el.firstChild.nodeValue = nb(t.toFixed(1));
        });
      }, 100);
  }

  function compter(depart, b, champ, pas) {
    const p = chrono.pistes[Number(b.dataset.piste)];
    const max = champ === 'portes' ? etat.reglages.portes : 99;
    p[champ] = Math.min(max, Math.max(0, p[champ] + pas));
    if (champ === 'portes' && p.fait && p.arrive && p.portes < max) p.arrive = false;
    dessinerDepart(depart);
  }

  function finir(depart, i, estArrive, temps) {
    const p = chrono.pistes[i];
    if (p.fait) return;
    p.fin = performance.now();
    p.temps = temps != null ? temps : tempsPiste(p);
    p.arrive = estArrive;
    if (estArrive) p.portes = etat.reglages.portes;
    p.fait = true;
    if (temps != null) message(`Temps écoulé pour « ${nomDe(p.equipe)} » : ${p.portes} porte${p.portes > 1 ? 's' : ''} passée${p.portes > 1 ? 's' : ''}.`);
    dessinerDepart(depart);
  }

  // ---------- 5. Les classements ----------

  function tableau(lignes, avecEssais) {
    return `<table class="co-tableau"><thead><tr><th>Place</th><th>Équipe</th><th>Résultat</th>${avecEssais ? '<th>Essais</th>' : ''}</tr></thead><tbody>${lignes
      .map((l) => `<tr${l.rang <= 3 ? ' class="podium"' : ''}><td>${l.essai ? C.ordinal(l.rang) : '—'}</td><td>${ech(nomDe(l.equipe))}</td><td>${resultat(l.essai)}</td>${avecEssais ? `<td>${l.essais}</td>` : ''}</tr>`)
      .join('')}</tbody></table>`;
  }

  function ecranClassement(sousTitre) {
    const avecFinales = etat.finales.length > 0;
    const qualifsFinies = C.qualifsFinies(etat);
    let corps;
    if (avecFinales) {
      corps = etat.finales.map((f) => `<section class="co-panneau"><h2>${ech(f.nom)}</h2>${tableau(C.classementFinale(etat, f.id))}</section>`).join('');
    } else {
      const qualifs = C.classementQualifications(etat);
      corps = `<section class="co-panneau co-large"><h2>Classement des manches <small>(le meilleur essai de chaque équipe)</small></h2>${tableau(qualifs, true)}</section>`;
      if (qualifsFinies && etat.reglages.finales) {
        const groupes = C.parGroupes(qualifs.map((l) => l.equipe), etat.reglages.tailleFinale);
        corps += `<section class="co-panneau"><h2>Les finales</h2><p class="co-aide">Personne n’est éliminé : chaque équipe court une finale avec des équipes de son niveau.</p>${groupes
          .map((g, i) => `<p><strong>${ech(groupes.length === 1 ? 'Finale' : ['Finale principale', 'Finale secondaire', 'Finale tertiaire'][i] || `Finale ${i + 1}`)}</strong> : ${g.map((id) => ech(nomDe(id))).join(' · ')}</p>`)
          .join('')}</section>`;
      }
    }
    const suite =
      qualifsFinies && etat.reglages.finales && !avecFinales
        ? principal('finales', 'Lancer les finales')
        : (avecFinales && C.finalesFinies(etat)) || (!etat.reglages.finales && qualifsFinies)
          ? principal('podium', 'Le podium')
          : principal('programme', 'Départ suivant');
    afficher(
      'classement',
      haut('Classement', sousTitre || (avecFinales ? 'Les finales' : 'Les manches')) + `<div class="co-milieu co-classements">${corps}</div>` + bas(bouton('programme', 'Programme') + outils(), suite),
      Object.assign({}, actionsOutils, {
        programme: () => ecranProgramme(),
        podium: () => ecranPodium(),
        finales: () => {
          C.composerFinales(etat);
          ecranProgramme();
        },
      })
    );
  }

  function ecranPodium() {
    const general = C.classementGeneral(etat);
    const rec = C.record(etat);
    const marche = (rang) => {
      const l = general.filter((x) => x.rang === rang && x.essai);
      return `<div class="co-marche co-marche-${rang}"><div class="co-marche-noms">${l.map((x) => `<div><strong>${ech(nomDe(x.equipe))}</strong><br>${resultat(x.essai)}</div>`).join('') || '&nbsp;'}</div><div class="co-marche-socle">${C.ordinal(rang)}</div></div>`;
    };
    afficher(
      'podium',
      haut('Le podium', etat.finales.length ? 'Après les finales' : 'Après les manches') +
        `<div class="co-milieu co-fin">
          <div class="co-podium">${marche(2)}${marche(1)}${marche(3)}</div>
          ${rec ? `<p class="co-record">⏱ Record de la course : <strong>${ech(nomDe(rec.equipe))}</strong>, ${nb(rec.temps)} s (${ech(rec.depart)})</p>` : ''}
          <p class="co-bravo">Bravo à toutes les équipes !</p>
          <details class="co-panneau"><summary>Classement complet</summary>${tableau(general)}</details>
        </div>` +
        bas(bouton('programme', 'Programme') + bouton('classement', 'Classements') + outils(), bouton('accueil', 'Terminer', 'co-principal')),
      Object.assign({}, actionsOutils, {
        programme: () => ecranProgramme(),
        classement: () => ecranClassement(),
        accueil: () => ecranAccueil(),
      })
    );
  }

  ecranAccueil();
})();
