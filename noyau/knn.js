// IA de la caméra (jalon 6) : reconnaître une image parmi les étiquettes apprises par l'élève.
// MobileNet (interface/camera.js) transforme chaque image en 1280 nombres ; ici, les k exemples les plus proches
// (cosinus) votent. Tout est calculé dans le navigateur : rien n'est envoyé.
//
//   const ia = creerReconnaissance();            ia.ajouter(n° étiquette, caracteristiques) ; ia.retirer(n°, i)
//   ia.reconnaitre(caracteristiques) → { etiquette, certitudes: { n°: 0..100 }, proche: { n, i, ressemblance } }
//     (étiquette 0 = rien appris ; « proche » : la photo apprise qui ressemble le plus, n° de l'étiquette, rang, 0..100)
//   const stable = creerStabilite({ seuil: 80, images: 5 }) ; stable.pousser(resultat) → n° vu de façon stable
(function (global) {
  'use strict';

  const K = 10;

  function normer(v) {
    let s = 0;
    for (let i = 0; i < v.length; i++) s += v[i] * v[i];
    const n = Math.sqrt(s) || 1;
    const r = new Float32Array(v.length);
    for (let i = 0; i < v.length; i++) r[i] = v[i] / n;
    return r;
  }

  function creerReconnaissance(options) {
    const k = (options && options.k) || K;
    const exemples = new Map(); // n° → [Float32Array normés]
    return {
      ajouter(n, caracteristiques) {
        if (!exemples.has(n)) exemples.set(n, []);
        exemples.get(n).push(normer(caracteristiques));
      },
      retirer(n, i) {
        const l = exemples.get(n);
        if (l) l.splice(i, 1);
      },
      vider(n) {
        if (n === undefined) exemples.clear();
        else exemples.delete(n);
      },
      nombre: (n) => (exemples.get(n) || []).length,
      reconnaitre(caracteristiques) {
        const q = normer(caracteristiques);
        const proches = [];
        for (const [n, liste] of exemples) {
          liste.forEach((e, rang) => {
            let s = 0;
            for (let i = 0; i < q.length; i++) s += q[i] * e[i];
            proches.push({ n, s, rang });
          });
        }
        if (!proches.length) return { etiquette: 0, certitudes: {} };
        proches.sort((a, b) => b.s - a.s);
        const votants = proches.slice(0, Math.min(k, proches.length));
        const votes = {};
        for (const v of votants) votes[v.n] = (votes[v.n] || 0) + 1;
        const certitudes = {};
        for (const n of exemples.keys()) certitudes[n] = Math.round(((votes[n] || 0) * 100) / votants.length);
        let etiquette = votants[0].n;
        for (const n of Object.keys(votes)) if (votes[n] > votes[etiquette]) etiquette = Number(n);
        const p = proches[0];
        return { etiquette: Number(etiquette), certitudes, proche: { n: p.n, i: p.rang, ressemblance: Math.max(0, Math.min(100, Math.round(p.s * 100))) } };
      },
    };
  }

  // Une étiquette n'est « vue » qu'après plusieurs images de suite au-dessus du seuil : pas de clignotement.
  function creerStabilite(options) {
    const seuil = (options && options.seuil) || 80;
    const images = (options && options.images) || 5;
    let candidat = 0;
    let suite = 0;
    let vue = 0;
    return {
      pousser(r) {
        const n = r && r.certitudes && r.certitudes[r.etiquette] >= seuil ? r.etiquette : null;
        if (n === null) return vue;
        if (n === candidat) suite++;
        else {
          candidat = n;
          suite = 1;
        }
        if (suite >= images) vue = candidat;
        return vue;
      },
      get vue() {
        return vue;
      },
      // Pour montrer la « réflexion » : l'étiquette en train de gagner et depuis combien d'images (sur « images »).
      get candidat() {
        return candidat;
      },
      get suite() {
        return Math.min(suite, images);
      },
      images,
      seuil,
      remettre() {
        candidat = 0;
        suite = 0;
        vue = 0;
      },
    };
  }

  // Caractéristiques ↔ texte (sauvegarde de l'équipe) : Float32 en base64.
  function versTexte(caracteristiques) {
    const octets = new Uint8Array(Float32Array.from(caracteristiques).buffer);
    if (typeof Buffer !== 'undefined') return Buffer.from(octets).toString('base64');
    let s = '';
    for (let i = 0; i < octets.length; i++) s += String.fromCharCode(octets[i]);
    return btoa(s);
  }
  function depuisTexte(texte) {
    let octets;
    if (typeof Buffer !== 'undefined') octets = Uint8Array.from(Buffer.from(texte, 'base64'));
    else octets = Uint8Array.from(atob(texte), (c) => c.charCodeAt(0));
    return new Float32Array(octets.buffer);
  }

  const api = { creerReconnaissance, creerStabilite, versTexte, depuisTexte };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign((global.LaboBlocs = global.LaboBlocs || {}), api);
})(this);
