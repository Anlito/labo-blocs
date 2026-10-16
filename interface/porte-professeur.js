// Code professeur : une page « Code professeur » devant l'accueil, l'éditeur de parcours, le suivi de classe et le mode
// enseignant de Labo Blocs. Le site est public et sans serveur : ce code arrête les élèves curieux, ce n'est pas une
// vraie sécurité (rien de secret n'est en ligne : pas de données d'élèves). Le dépôt ne contient qu'une empreinte du
// code (PBKDF2-SHA-256 avec un sel, site/code-professeur.js, créée par « npm run code-professeur »), jamais le code.
//
// Chargé dans <head>, juste avant code-professeur.js (definirCodeProfesseur({...})) : la page reste cachée tant que
// le code n'est pas donné. Une fois le
// bon code tapé, l'ordinateur s'en souvient (ou seulement pour cette fenêtre si la case est décochée).
//   <script src="../interface/porte-professeur.js" data-seulement="enseignant"></script> : seulement avec ?enseignant
(function (global) {
  'use strict';

  const CLE = 'labo-blocs-code-professeur';

  // Empreinte d'un code (hexadécimal) : aussi utilisée par tools/code-professeur.js sous Node.
  async function empreinteCode(code, sel, iterations, subtle) {
    const s = subtle || global.crypto.subtle;
    const enc = new TextEncoder();
    const cle = await s.importKey('raw', enc.encode(String(code).trim()), 'PBKDF2', false, ['deriveBits']);
    const bits = await s.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(sel), iterations }, cle, 256);
    return [...new Uint8Array(bits)].map((o) => o.toString(16).padStart(2, '0')).join('');
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { empreinteCode, CLE };
    return;
  }

  const doc = global.document;
  const script = doc.currentScript;
  if (script && script.dataset.seulement === 'enseignant' && !new URLSearchParams(global.location.search).has('enseignant')) {
    global.definirCodeProfesseur = () => {}; // page des élèves : pas de porte
    return;
  }
  let reglage = null;
  // Appelé par site/code-professeur.js. Sans ce fichier, aucune porte.
  global.definirCodeProfesseur = (r) => {
    reglage = r;
    if (reglage && reglage.empreinte) fermer();
  };

  const lire = (stock) => {
    try {
      return stock.getItem(CLE);
    } catch {
      return null;
    }
  };
  const ouvert = () => lire(global.localStorage) === reglage.empreinte || lire(global.sessionStorage) === reglage.empreinte;
  // Pour le bouton « Verrouiller » de l'accueil.
  global.LaboBlocsPorte = {
    verrouiller() {
      for (const stock of [global.localStorage, global.sessionStorage]) {
        try {
          stock.removeItem(CLE);
        } catch {
          // stockage indisponible : rien à effacer
        }
      }
      global.location.reload();
    },
  };
  function fermer() {
    if (ouvert()) return;

    // Page cachée jusqu'au bon code (la porte, elle, reste visible).
    doc.documentElement.classList.add('porte-fermee');
    const style = doc.createElement('style');
    style.textContent =
      'html.porte-fermee body > :not(.porte-professeur) { visibility: hidden !important; }' +
      '.porte-professeur { position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; background: #F3F5F9; font-family: "Atkinson Hyperlegible", system-ui, sans-serif; color: #14213D; }' +
      '.porte-boite { width: min(26rem, calc(100vw - 2rem)); background: #FFFFFF; border: 1px solid #D5DBE6; border-radius: 1rem; padding: 1.75rem; display: flex; flex-direction: column; gap: 0.875rem; box-shadow: 0 10px 30px rgba(20, 33, 61, 0.08); }' +
      '.porte-boite img { width: 2.5rem; height: 2.5rem; }' +
      '.porte-boite h1 { margin: 0; font-family: Lexend, system-ui, sans-serif; font-size: 1.5rem; }' +
      '.porte-boite p { margin: 0; font-size: 1rem; color: #4A5568; line-height: 1.45; }' +
      '.porte-boite label { display: flex; flex-direction: column; gap: 0.375rem; font-weight: 700; font-size: 0.9375rem; }' +
      '.porte-boite input[type=password] { font: inherit; font-size: 1.125rem; height: 2.75rem; padding: 0 0.75rem; border: 2px solid #A9B3C4; border-radius: 0.625rem; }' +
      '.porte-boite input[type=password]:focus { outline: 3px solid #2547D0; outline-offset: 1px; }' +
      '.porte-souvenir { flex-direction: row !important; align-items: center; font-weight: 400 !important; }' +
      '.porte-boite button { font: inherit; font-family: Lexend, system-ui, sans-serif; font-weight: 600; font-size: 1rem; height: 2.875rem; border: none; border-radius: 0.75rem; background: #2547D0; color: #FFFFFF; cursor: pointer; }' +
      '.porte-boite button:disabled { opacity: 0.6; cursor: wait; }' +
      '.porte-ecart { padding: 0.625rem 0.75rem; border-radius: 0.625rem; background: #FFF4DC; color: #6B4A00; font-weight: 700; font-size: 0.9375rem; }' +
      '.porte-ecart[hidden] { display: none; }';
    doc.head.append(style);

    function poser() {
      const porte = doc.createElement('div');
      porte.className = 'porte-professeur';
      porte.setAttribute('role', 'dialog');
      porte.setAttribute('aria-modal', 'true');
      porte.setAttribute('aria-labelledby', 'porte-titre');
      const logo = (doc.querySelector('link[rel=icon]') || {}).href || '';
      porte.innerHTML =
        '<form class="porte-boite" novalidate>' +
        (logo ? `<img src="${logo}" alt="">` : '') +
        '<h1 id="porte-titre">Espace professeur</h1>' +
        '<p>Labo Blocs · éditeur de parcours, suivi de classe et mode enseignant.</p>' +
        '<label>Code professeur<input type="password" class="porte-code" autocomplete="current-password" required></label>' +
        '<label class="porte-souvenir"><input type="checkbox" class="porte-garder" checked> Se souvenir sur cet ordinateur</label>' +
        '<p class="porte-ecart" role="alert" hidden></p>' +
        '<button type="submit">Entrer</button>' +
        '</form>';
      doc.body.append(porte);
      const champ = porte.querySelector('.porte-code');
      const ecart = porte.querySelector('.porte-ecart');
      const bouton = porte.querySelector('button');
      champ.focus();
      porte.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!champ.value.trim()) {
          ecart.textContent = 'Tape le code professeur.';
          ecart.hidden = false;
          return champ.focus();
        }
        bouton.disabled = true;
        bouton.textContent = 'Vérification…';
        let bon = false;
        try {
          bon = (await empreinteCode(champ.value, reglage.sel, reglage.iterations)) === reglage.empreinte;
        } catch {
          ecart.textContent = 'Ce navigateur ne sait pas vérifier le code : ouvre la page avec Chrome ou Edge.';
          ecart.hidden = false;
          bouton.disabled = false;
          bouton.textContent = 'Entrer';
          return;
        }
        bouton.disabled = false;
        bouton.textContent = 'Entrer';
        if (!bon) {
          ecart.textContent = 'Ce n’est pas le code professeur. Vérifie-le et recommence.';
          ecart.hidden = false;
          champ.select();
          return;
        }
        try {
          (porte.querySelector('.porte-garder').checked ? global.localStorage : global.sessionStorage).setItem(CLE, reglage.empreinte);
        } catch {
          // stockage indisponible : la page s'ouvre quand même pour cette fois
        }
        porte.remove();
        style.remove();
        doc.documentElement.classList.remove('porte-fermee');
      });
    }
    if (doc.body) poser();
    else doc.addEventListener('DOMContentLoaded', poser);
  }
})(this);
