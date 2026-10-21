// Caméra et IA (jalon 6) : panneau de l'exercice. L'élève allume la webcam, fait apprendre à l'IA les étiquettes de
// l'exercice (« Loup », « Roi »… et « Rien » : la caméra sans rien devant) en prenant des photos, puis l'IA dit au
// programme ce qu'elle reconnaît : capteurs.camera (n° de l'étiquette, 0 = rien) et capteurs.certitudes.
// Sans webcam (ou avant d'avoir appris), des boutons « Faire comme si la caméra voyait… » règlent la même valeur.
//
// L'IA : MobileNet (vendor/vision, chargé seulement quand on allume la caméra) transforme l'image en 1280 nombres,
// les exemples les plus proches votent (noyau/knn.js). Tout reste dans l'ordinateur : rien n'est envoyé.
//
//   const p = A.creerPanneauCamera(racine, { lecture, donnees() → { modele, exemples, etiquettes? }, enregistrer(camera),
//     surEtiquettes(noms) })
//   p.ouvrir(exercice, capteurs)   (exercice.camera : { etiquettes: ['Loup', 'Roi'], etiquettesLibres? })   p.fermer()
// etiquettesLibres : l'équipe crée, renomme et supprime (la dernière) ses étiquettes ; celles de l'exercice sont le départ.
(function (global) {
  'use strict';

  const A = (global.LaboBlocs = global.LaboBlocs || {});
  const $ = (sel, racine) => racine.querySelector(sel);
  const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const MODELE = 'mobilenet_v2_050_224';
  const PHOTOS_CONSEILLEES = 10;
  const IMAGES_PAR_SECONDE = 10;

  // Dossier de l'IA : à côté du module (projets : vendor/labo-blocs/vision/) ou dans le site (vendor/vision/).
  const ICI = (global.document && global.document.currentScript && global.document.currentScript.src) || '';
  if (!A.cheminVision) A.cheminVision = /labo-blocs-interface\.js/.test(ICI) ? ICI.replace(/[^/]*$/, '') + 'vision/' : 'vendor/vision/';

  global.definirModeleVision = (m) => {
    A.modeleVision = m;
  };

  function chargerScript(src) {
    return new Promise((ok, ko) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = ok;
      s.onerror = () => ko(new Error('fichier introuvable : ' + src));
      document.head.appendChild(s);
    });
  }

  // MobileNet, chargé une seule fois (une dizaine de secondes la première fois).
  let chargement = null;
  function chargerIA() {
    if (A.extraireCaracteristiques) return Promise.resolve();
    if (!chargement) {
      chargement = (async () => {
        const base = A.cheminVision;
        if (!global.tf) await chargerScript(base + 'tf.min.js');
        if (!global.mobilenet) await chargerScript(base + 'mobilenet.min.js');
        if (!A.modeleVision) await chargerScript(base + 'modele-mobilenet.js');
        const m = A.modeleVision;
        const binaire = atob(m.donnees);
        const octets = new Uint8Array(binaire.length);
        for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
        const lecteur = { load: async () => ({ modelTopology: m.topologie, weightSpecs: m.poids, weightData: octets.buffer, format: m.format }) };
        await global.tf.ready();
        const modele = await global.mobilenet.load({ version: 2, alpha: 0.5, modelUrl: lecteur, inputRange: [0, 1] });
        A.extraireCaracteristiques = async (video) => {
          const t = modele.infer(video, true);
          const d = await t.data();
          t.dispose();
          return d;
        };
      })();
      chargement.catch(() => (chargement = null));
    }
    return chargement;
  }

  function vignette(video) {
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 72;
    c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.7);
  }

  const ETIQUETTES_MAX = 8;
  // Nom d'une étiquette créée par l'élève : 20 caractères au plus, pas « Rien », pas déjà pris.
  //   → { ok, nom } ou { ok: false, message }
  function nomEtiquette(texte, existantes) {
    const nom = String(texte || '').trim().replace(/\s+/g, ' ');
    if (!nom) return { ok: false, message: 'Écris un nom pour ton étiquette (par exemple : Loup).' };
    if (nom.length > 20) return { ok: false, message: 'Ce nom est trop long : 20 caractères au plus.' };
    const pris = (existantes || []).concat(['Rien']).some((x) => x.toLowerCase() === nom.toLowerCase());
    if (pris) return { ok: false, message: `L’étiquette « ${nom} » existe déjà.` };
    return { ok: true, nom };
  }

  function creerPanneauCamera(racine, options) {
    const o = options || {};
    racine.innerHTML = `
      <div class="cam-titre"><strong>Caméra et IA</strong>
        <button type="button" class="btn-secondaire cam-allumer">Allumer la caméra</button></div>
      <div class="cam-video" hidden><video playsinline muted></video><p class="cam-vu" aria-live="polite"></p></div>
      <details class="cam-reflexion" open hidden>
        <summary>Ce que pense l’IA, en direct</summary>
        <ul class="cam-barres"></ul>
        <p class="cam-seuil-aide">Le programme voit une étiquette quand l’IA en est sûre à <strong>${A.creerStabilite().seuil} %</strong> au moins, pendant <strong>${A.creerStabilite().images} images</strong> de suite.</p>
        <p class="cam-suite"></p>
        <div class="cam-proche"></div>
      </details>
      <p class="cam-message" role="status" hidden></p>
      <p class="cam-aide">Pour chaque étiquette, montre-la à la caméra et prends des photos (${PHOTOS_CONSEILLEES} au moins, sous plusieurs angles).
        Chaque clic en ajoute 10 : si l’IA hésite, ajoute des photos. L’étiquette « Rien » est déjà créée : elle représente le fond vide, sans personnage. Ne la crée pas une deuxième fois.
        ${o.lecture ? 'Mode enseignant : les photos ne sont pas enregistrées.' : 'Ce que tu apprends à l’IA est gardé dans le fichier de ton équipe.'}</p>
      <ul class="cam-etiquettes"></ul>
      <form class="cam-nouvelle" hidden>
        <label>Nouvelle étiquette<input class="cam-nouveau-nom" maxlength="20" autocomplete="off" placeholder="ex. Loup"></label>
        <button type="submit" class="btn-secondaire">Ajouter</button>
      </form>
      <p class="cam-ecart" role="status" hidden></p>
      <div class="cam-sans"><span>Sans caméra, faire comme si elle voyait :</span><span class="cam-sans-boutons"></span></div>`;
    const video = $('video', racine);
    const ia = A.creerReconnaissance();
    let stable = A.creerStabilite();
    let flux = null;
    let boucle = null;
    let exercice = null;
    let capteurs = {};
    let camera = { modele: MODELE, exemples: {} };
    let noms = []; // 0 = « Rien », puis les étiquettes de l'exercice (ou celles créées par l'équipe)
    let libres = false;
    let manuel = 0;

    const message = (texte) => {
      const m = $('.cam-message', racine);
      m.textContent = texte || '';
      m.hidden = !texte;
    };
    const ecart = (texte) => {
      const m = $('.cam-ecart', racine);
      m.textContent = texte || '';
      m.hidden = !texte;
    };

    // Les exemples gardés pour les étiquettes de cet exercice → l'IA.
    function apprendreTout() {
      ia.vider();
      noms.forEach((nom, n) => {
        for (const e of camera.exemples[nom] || []) ia.ajouter(n, A.depuisTexte(e.f));
      });
    }

    function dessiner() {
      const dernier = noms.length - 1;
      $('.cam-etiquettes', racine).innerHTML = noms
        .map((nom, n) => {
          const ex = camera.exemples[nom] || [];
          const peu = ex.length < PHOTOS_CONSEILLEES;
          const modifiable = libres && n > 0;
          return `<li class="cam-etiquette" data-n="${n}">
            <span class="cam-nom">${echapper(nom)}</span>
            <span class="cam-nb${peu ? ' cam-peu' : ''}">${ex.length} photo${ex.length > 1 ? 's' : ''}${peu ? ` · ${PHOTOS_CONSEILLEES} conseillées` : ''}</span>
            <span class="cam-vignettes">${ex.slice(-4).map((e) => `<img src="${e.v}" alt="" width="48" height="36">`).join('')}</span>
            <span class="cam-actions">
              <button type="button" class="btn-principal cam-photo" ${flux ? '' : 'disabled'}>+ 10 photos</button>
              <button type="button" class="btn-secondaire cam-effacer" ${ex.length ? '' : 'disabled'}>Effacer les photos</button>
              ${modifiable ? '<button type="button" class="btn-secondaire cam-renommer">Renommer</button>' : ''}
              ${modifiable && n === dernier ? '<button type="button" class="btn-secondaire cam-supprimer">Supprimer</button>' : ''}
            </span></li>`;
        })
        .join('');
      $('.cam-nouvelle', racine).hidden = !libres || noms.length - 1 >= ETIQUETTES_MAX;
      $('.cam-sans-boutons', racine).innerHTML = noms
        .map((nom, n) => `<button type="button" class="btn-secondaire cam-comme" data-n="${n}" aria-pressed="${!flux && manuel === n}">${echapper(nom)}</button>`)
        .join('');
      $('.cam-sans', racine).hidden = !!flux;
      $('.cam-reflexion', racine).hidden = !flux;
      $('.cam-allumer', racine).textContent = flux ? 'Éteindre la caméra' : 'Allumer la caméra';
    }

    // « Ce que pense l'IA » : une barre par étiquette (votes des photos les plus proches), le seuil, la photo la plus
    // ressemblante et l'étiquette en train de gagner.
    function dessinerReflexion(r, vu) {
      const seuil = stable.seuil;
      $('.cam-barres', racine).innerHTML = noms
        .map((nom, n) => {
          const c = r.certitudes[n] || 0;
          const etat = n === vu ? ' cam-barre-vue' : c >= seuil ? ' cam-barre-sure' : '';
          return `<li class="cam-barre${etat}"><span class="cam-barre-nom">${echapper(nom)}${n === vu ? ' · vu par le programme' : ''}</span>` +
            `<span class="cam-barre-fond" style="--seuil:${seuil}%"><span class="cam-barre-valeur" style="width:${c}%"></span></span>` +
            `<span class="cam-barre-pc">${c} %</span></li>`;
        })
        .join('');
      const candidat = noms[stable.candidat];
      $('.cam-suite', racine).textContent = r.certitudes[r.etiquette] >= seuil && candidat
        ? `« ${candidat} » : ${stable.suite} image${stable.suite > 1 ? 's' : ''} sur ${stable.images} de suite.`
        : 'L’IA hésite : aucune étiquette n’atteint le seuil.';
      const p = r.proche;
      const photo = p && (camera.exemples[noms[p.n]] || [])[p.i];
      $('.cam-proche', racine).innerHTML = photo
        ? `<img src="${photo.v}" alt="" width="64" height="48"><span>Photo apprise qui ressemble le plus : <strong>${echapper(noms[p.n])}</strong> (ressemblance ${p.ressemblance} %)</span>`
        : '';
    }

    function regler(n, certitudes) {
      capteurs.camera = n;
      capteurs.certitudes = certitudes || null;
    }

    function enregistrer() {
      if (libres) camera.etiquettes = noms.slice(1);
      if (!o.lecture && o.enregistrer) o.enregistrer(camera);
    }

    // Les noms ont changé (étiquettes de l'équipe) : menus des blocs et page.
    function etiquettesChangees() {
      A.etiquettesCamera = noms;
      apprendreTout();
      enregistrer();
      dessiner();
      if (o.surEtiquettes) o.surEtiquettes(noms);
    }

    // ----- Webcam et reconnaissance -----

    async function allumer() {
      message('Chargement de l’IA… (quelques secondes la première fois)');
      try {
        await chargerIA();
      } catch {
        message('L’IA n’a pas pu se charger : vérifie que le dossier « vision » est bien à côté de Labo Blocs, puis réessaie.');
        return;
      }
      try {
        flux = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
      } catch {
        flux = null;
        message('La caméra ne s’allume pas : autorise la caméra dans le navigateur (icône à gauche de l’adresse), vérifie qu’une webcam est branchée, puis réessaie.');
        return;
      }
      video.srcObject = flux;
      await video.play().catch(() => {});
      $('.cam-video', racine).hidden = false;
      message('');
      stable = A.creerStabilite();
      dessiner();
      let occupe = false;
      boucle = setInterval(async () => {
        if (occupe || !flux || video.readyState < 2) return;
        occupe = true;
        try {
          const r = ia.reconnaitre(await A.extraireCaracteristiques(video));
          const vu = stable.pousser(r);
          regler(vu, r.certitudes);
          const appris = Object.keys(r.certitudes).length;
          $('.cam-vu', racine).textContent = appris
            ? `L’IA reconnaît : ${noms[vu] || noms[0]} (${r.certitudes[vu] || 0} %)`
            : 'Prends d’abord des photos pour chaque étiquette.';
          if (appris) dessinerReflexion(r, vu);
        } finally {
          occupe = false;
        }
      }, 1000 / IMAGES_PAR_SECONDE);
    }

    function eteindre() {
      clearInterval(boucle);
      boucle = null;
      if (flux) for (const piste of flux.getTracks()) piste.stop();
      flux = null;
      video.srcObject = null;
      $('.cam-video', racine).hidden = true;
      regler(manuel, null);
      dessiner();
    }

    // 10 photos de plus pour cette étiquette (elles s'ajoutent aux précédentes).
    async function photographier(n, bouton) {
      const nom = noms[n];
      bouton.disabled = true;
      for (let i = 0; i < 10 && flux; i++) {
        bouton.textContent = `Photo ${i + 1} sur 10…`;
        const f = await A.extraireCaracteristiques(video);
        ia.ajouter(n, f);
        (camera.exemples[nom] = camera.exemples[nom] || []).push({ f: A.versTexte(f), v: vignette(video) });
        await new Promise((ok) => setTimeout(ok, 150));
      }
      camera.modele = MODELE;
      enregistrer();
      dessiner();
    }

    racine.addEventListener('submit', (e) => {
      e.preventDefault();
      const champ = $('.cam-nouveau-nom', racine);
      const r = nomEtiquette(champ.value, noms.slice(1));
      if (!r.ok) return ecart(r.message);
      ecart('');
      champ.value = '';
      noms.push(r.nom);
      etiquettesChangees();
    });

    racine.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.type === 'submit') return;
      if (b.classList.contains('cam-allumer')) return flux ? eteindre() : allumer();
      if (b.classList.contains('cam-comme')) {
        manuel = Number(b.dataset.n);
        regler(manuel, null);
        return dessiner();
      }
      const ligne = b.closest('.cam-etiquette');
      if (!ligne) return;
      const n = Number(ligne.dataset.n);
      if (b.classList.contains('cam-photo')) photographier(n, b);
      if (b.classList.contains('cam-effacer')) {
        delete camera.exemples[noms[n]];
        apprendreTout();
        enregistrer();
        dessiner();
      }
      if (b.classList.contains('cam-renommer')) {
        const ancien = noms[n];
        const texte = global.prompt(`Nouveau nom pour « ${ancien} » :`, ancien);
        if (texte === null) return;
        const r = nomEtiquette(texte, noms.slice(1).filter((x) => x !== ancien));
        if (!r.ok) return ecart(r.message);
        ecart('');
        if (camera.exemples[ancien]) {
          camera.exemples[r.nom] = camera.exemples[ancien];
          delete camera.exemples[ancien];
        }
        noms[n] = r.nom;
        etiquettesChangees();
      }
      // Seulement la dernière : les numéros des autres étiquettes (utilisés par les blocs) ne changent pas.
      if (b.classList.contains('cam-supprimer') && n === noms.length - 1) {
        if (!global.confirm(`Supprimer l’étiquette « ${noms[n]} » et ses photos ?`)) return;
        delete camera.exemples[noms[n]];
        noms.pop();
        if (manuel >= noms.length) manuel = 0;
        etiquettesChangees();
      }
    });

    return {
      // Un exercice avec caméra : ses étiquettes (ou celles créées par l'équipe) ; le panneau est caché pour les autres.
      ouvrir(ex, c) {
        exercice = ex;
        capteurs = c || {};
        const reglage = ex && ex.camera;
        racine.hidden = !reglage;
        if (!reglage) return eteindre();
        const lues = (o.donnees && o.donnees()) || {};
        libres = !!reglage.etiquettesLibres;
        const depart = libres && Array.isArray(lues.etiquettes) && lues.etiquettes.length ? lues.etiquettes : reglage.etiquettes || [];
        noms = ['Rien'].concat(A.etiquettesPersonnages(depart));
        A.etiquettesCamera = noms;
        // Un autre modèle d'IA : les anciennes photos ne servent plus (les nombres ne se comparent pas).
        camera = { modele: MODELE, exemples: lues.modele && lues.modele !== MODELE ? {} : Object.assign({}, lues.exemples) };
        if (Array.isArray(lues.etiquettes)) camera.etiquettes = A.etiquettesPersonnages(lues.etiquettes);
        apprendreTout();
        manuel = 0;
        ecart('');
        regler(0, null);
        dessiner();
      },
      // Les capteurs du simulateur ouvert (créés après le chargement des blocs).
      relier(c) {
        capteurs = c || {};
        regler(capteurs === c && flux ? capteurs.camera || 0 : manuel, null);
      },
      fermer: () => eteindre(),
      get allumee() {
        return !!flux;
      },
      exercice: () => exercice,
    };
  }

  Object.assign(A, { creerPanneauCamera, chargerIA, nomEtiquette });
})(this);
