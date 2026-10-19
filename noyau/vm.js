// Interpréteur du code octet de Labo Blocs, dans le navigateur : la traduction ligne à ligne de
// firmware/labo_blocs/vm.c (Uno, mBot) et de microbit/main.py. Mêmes instructions, mêmes fils, mêmes arrondis :
// le simulateur fait exactement ce que fera la carte (tests/vm.test.js le vérifie contre l'interpréteur C).
//
// La carte (réelle ou simulée) est donnée par « materiel » :
//   { configurer(b, type), ecrireNum(b, v), ecrireAna(b, v), servo(b, angle), son(b, frequence, ms), silence(b),
//     lireNum(b, type) → 0/1 (bouton : 1 = appuyé), lireAna(b), hasard(min, max), ext(extension, commande, args) }

(function (global) {
  'use strict';

  const FORMAT = 1;
  // fils : 6 dans la carte (vm.c) ; 16 ici, pour les programmes qui restent dans l'ordinateur (clavier, caméra :
  // noyau/code-octet.js garde la limite de 6 pour tous les autres).
  const MAX = { fils: 16, pile: 12, appels: 6, variables: 24, listes: 4, elements: 48, broches: 16 };
  const TRANCHE = 200;
  const ERREUR = { ok: 0, marque: 1, format: 2, crc: 3, tropGrand: 4, pile: 5, code: 6 };
  const FIL = { demarrage: 0, boucle: 1, appui: 2, relache: 3 };

  function crc16(crc, o) {
    crc ^= o << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    return crc;
  }

  const arrondi = (x) => (x >= 0 ? Math.floor(x + 0.5) : -Math.floor(-x + 0.5));

  function egal(a, b) {
    const m = Math.max(Math.abs(a), Math.abs(b), 1);
    return Math.abs(a - b) <= 1e-5 * m;
  }

  function creerVM(materiel) {
    const h = materiel;
    let P = new Uint8Array(0);
    let fils = [];
    let variables = [];
    let listes = []; // { capacite, elements }
    let types = new Map();
    let longueur = 0;
    let erreur = ERREUR.marque;
    let enMarche = false;
    let demarrageFini = false;
    let origine = 0;
    const vf = new DataView(new ArrayBuffer(4));

    const o8 = (a) => (a < P.length ? P[a] : 0);
    const u16 = (a) => o8(a) | (o8(a + 1) << 8);
    function f32(a) {
      for (let i = 0; i < 4; i++) vf.setUint8(i, o8(a + i));
      return vf.getFloat32(0, true);
    }
    const typeBroche = (b) => (types.has(b) ? types.get(b) : 1);

    function charger(octets) {
      P = octets instanceof Uint8Array ? octets : Uint8Array.from(octets || []);
      enMarche = false;
      fils = [];
      if (o8(0) !== 0x4c || o8(1) !== 0x42) return (erreur = ERREUR.marque);
      if (o8(2) !== FORMAT) return (erreur = ERREUR.format);
      longueur = u16(3);
      if (longueur < 11 || longueur > P.length) return (erreur = ERREUR.crc);
      let crc = 0xffff;
      for (let a = 7; a < longueur; a++) crc = crc16(crc, P[a]);
      if (crc !== u16(5)) return (erreur = ERREUR.crc);
      let a = 7;
      const nbVariables = o8(a++);
      const nbListes = o8(a++);
      if (nbVariables > MAX.variables || nbListes > MAX.listes) return (erreur = ERREUR.tropGrand);
      variables = new Array(nbVariables).fill(0);
      listes = [];
      let place = 0;
      for (let i = 0; i < nbListes; i++) {
        const capacite = o8(a++);
        place += capacite;
        listes.push({ capacite, elements: [] });
      }
      if (place > MAX.elements) return (erreur = ERREUR.tropGrand);
      const nbBroches = o8(a++);
      if (nbBroches > MAX.broches) return (erreur = ERREUR.tropGrand);
      types = new Map();
      for (let i = 0; i < nbBroches; i++) {
        types.set(o8(a), o8(a + 1));
        a += 2;
      }
      const nbFils = o8(a++);
      if (nbFils > MAX.fils) return (erreur = ERREUR.tropGrand);
      for (let i = 0; i < nbFils; i++) {
        fils.push({ type: o8(a), broche: o8(a + 1), debut: u16(a + 2), actif: false, pc: 0, ici: null, reveil: 0, tour: 0, pile: [], appels: [], dernier: 0 });
        a += 4;
      }
      return (erreur = ERREUR.ok);
    }

    function lancer(f, t) {
      f.actif = true;
      f.pc = f.debut;
      f.ici = null;
      f.pile = [];
      f.appels = [];
      f.reveil = t;
      f.tour = t;
    }

    function demarrer(t) {
      if (erreur !== ERREUR.ok) return;
      origine = t;
      variables.fill(0);
      for (const l of listes) l.elements = [];
      for (const [b, type] of types) h.configurer(b, type);
      demarrageFini = false;
      for (const f of fils) {
        f.actif = false;
        if (f.type === FIL.demarrage) lancer(f, t);
      }
      enMarche = true;
    }

    function arreter() {
      enMarche = false;
      for (const f of fils) f.actif = false;
    }

    function apresDemarrage(t) {
      demarrageFini = true;
      for (const f of fils) {
        if (f.type === FIL.boucle) lancer(f, t);
        else if (f.type === FIL.appui || f.type === FIL.relache) f.dernier = h.lireNum(f.broche, typeBroche(f.broche)) ? 1 : 0;
      }
    }

    // Exécute un fil jusqu'à ce qu'il rende la main. limite : nombre d'instructions au plus (pas à pas).
    // Renvoie 'ok', 'limite' (arrêté par la limite, rien d'autre ne change) ou 'erreur'.
    function courir(f, t, limite) {
      const s = f.pile;
      const pop = () => {
        if (!s.length) throw new Error('pile');
        return s.pop();
      };
      const push = (v) => {
        if (s.length >= MAX.pile) throw new Error('pile');
        s.push(v);
      };
      const max = limite || TRANCHE;
      try {
        for (let n = 0; n < max; n++) {
          let pc = f.pc;
          f.ici = pc; // début de la dernière instruction exécutée (bloc à surligner)
          const op = o8(pc++);
          let a;
          let b;
          let x;
          switch (op) {
            case 0x00:
            case 0x29:
              if (f.type === FIL.boucle || op === 0x29) {
                if (op === 0x00) {
                  pc = f.debut;
                  f.pile = [];
                  f.appels = [];
                }
                f.pc = pc;
                f.reveil = t === f.tour ? t + 1 : t;
                f.tour = f.reveil;
                return 'ok';
              }
              f.actif = false;
              return 'ok';
            case 0x01:
              push(f32(pc));
              pc += 4;
              break;
            case 0x02:
              x = o8(pc++);
              push(x > 127 ? x - 256 : x);
              break;
            case 0x03:
              x = o8(pc++);
              push(x < variables.length ? variables[x] : 0);
              break;
            case 0x04:
              x = o8(pc++);
              a = pop();
              if (x < variables.length) variables[x] = a;
              break;
            case 0x05: b = pop(); a = pop(); push(a + b); break;
            case 0x06: b = pop(); a = pop(); push(a - b); break;
            case 0x07: b = pop(); a = pop(); push(a * b); break;
            case 0x08: b = pop(); a = pop(); push(b === 0 ? 0 : a / b); break;
            case 0x09: {
              b = pop();
              a = pop();
              if (b === 0) push(0);
              else {
                let r = a - b * Math.trunc(a / b);
                if (r !== 0 && r < 0 !== b < 0) r += b; // comme Scratch : le reste a le signe du diviseur
                push(r);
              }
              break;
            }
            case 0x0a: b = pop(); a = pop(); push(egal(a, b) ? 1 : 0); break;
            case 0x0b: b = pop(); a = pop(); push(egal(a, b) ? 0 : 1); break;
            case 0x0c: b = pop(); a = pop(); push(a < b && !egal(a, b) ? 1 : 0); break;
            case 0x0d: b = pop(); a = pop(); push(a < b || egal(a, b) ? 1 : 0); break;
            case 0x0e: b = pop(); a = pop(); push(a > b && !egal(a, b) ? 1 : 0); break;
            case 0x0f: b = pop(); a = pop(); push(a > b || egal(a, b) ? 1 : 0); break;
            case 0x10: b = pop(); a = pop(); push(a !== 0 && b !== 0 ? 1 : 0); break;
            case 0x11: b = pop(); a = pop(); push(a !== 0 || b !== 0 ? 1 : 0); break;
            case 0x12: push(pop() === 0 ? 1 : 0); break;
            case 0x13: push(-pop()); break;
            case 0x14:
              pc = u16(pc);
              break;
            case 0x15: {
              const cible = u16(pc);
              pc += 2;
              if (pop() === 0) pc = cible;
              break;
            }
            case 0x16:
              x = o8(pc++);
              push(h.lireNum(x, typeBroche(x)) ? 1 : 0);
              break;
            case 0x17:
              x = o8(pc++);
              push(h.lireAna(x));
              break;
            case 0x18:
              x = o8(pc++);
              h.ecrireNum(x, pop() !== 0 ? 1 : 0);
              break;
            case 0x19:
              x = o8(pc++);
              a = pop();
              h.ecrireAna(x, a < 0 ? 0 : a > 255 ? 255 : Math.floor(a + 0.5));
              break;
            case 0x1a:
              x = o8(pc++);
              a = pop();
              h.servo(x, a < 0 ? 0 : a > 180 ? 180 : Math.floor(a + 0.5));
              break;
            case 0x1b:
              x = o8(pc++);
              b = pop();
              a = pop();
              h.son(x, Math.trunc(a < 31 ? 31 : a > 20000 ? 20000 : a), b < 0 ? 0 : Math.floor(b * 1000 + 0.5));
              break;
            case 0x1c:
              h.silence(o8(pc++));
              break;
            case 0x1d: {
              a = pop();
              const ms = a > 0 ? Math.floor(a * 1000 + 0.5) : 0;
              if (ms > 0) {
                f.pc = pc;
                f.reveil = t + ms;
                return 'ok';
              }
              break;
            }
            case 0x1e:
              b = pop();
              a = pop();
              push(h.hasard(arrondi(Math.min(a, b)), arrondi(Math.max(a, b))));
              break;
            case 0x1f:
              if (f.appels.length >= MAX.appels) throw new Error('pile');
              f.appels.push(pc + 2);
              pc = u16(pc);
              break;
            case 0x20:
              if (!f.appels.length) throw new Error('pile');
              pc = f.appels.pop();
              break;
            case 0x21: case 0x22: case 0x23: case 0x24: case 0x25: {
              x = o8(pc++);
              const l = listes[x];
              if (op === 0x21) {
                const i = arrondi(pop());
                push(l && i >= 1 && i <= l.elements.length ? l.elements[i - 1] : 0);
              } else if (op === 0x22) {
                const v = pop();
                const i = arrondi(pop());
                if (l && i >= 1 && i <= l.elements.length) l.elements[i - 1] = v;
              } else if (op === 0x23) {
                const v = pop();
                if (l && l.elements.length < l.capacite) l.elements.push(v);
              } else if (op === 0x24) push(l ? l.elements.length : 0);
              else if (l) l.elements = [];
              break;
            }
            case 0x26:
              push((t - origine) / 1000);
              break;
            case 0x27:
              pop();
              break;
            case 0x28: {
              const e = o8(pc);
              const c = o8(pc + 1);
              const k = o8(pc + 2);
              pc += 3;
              if (k > 4 || k > s.length) throw new Error('pile');
              const args = s.splice(s.length - k, k);
              push(h.ext(e, c, args));
              break;
            }
            default:
              erreur = ERREUR.code;
              return 'erreur';
          }
          f.pc = pc;
        }
      } catch (e) {
        erreur = ERREUR.pile;
        return 'erreur';
      }
      if (limite) return 'limite';
      // Trop longtemps sans attente : on laisse la main, reprise 1 ms plus tard.
      f.reveil = t + 1;
      return 'ok';
    }

    function detecterEvenements(t) {
      for (const f of fils) {
        if (f.type !== FIL.appui && f.type !== FIL.relache) continue;
        const v = h.lireNum(f.broche, typeBroche(f.broche)) ? 1 : 0;
        if (v !== f.dernier) {
          f.dernier = v;
          if (!f.actif && v === (f.type === FIL.appui ? 1 : 0)) lancer(f, t);
        }
      }
    }

    function finDuDemarrage(t) {
      if (demarrageFini) return false;
      if (fils.some((f) => f.type === FIL.demarrage && f.actif)) return false;
      apresDemarrage(t);
      return true;
    }

    function prochainReveil() {
      let r = Infinity;
      for (const f of fils) if (f.actif && f.reveil < r) r = f.reveil;
      return r;
    }

    // Exécute tout ce qui peut l'être à l'instant t. Renvoie l'instant du prochain réveil (Infinity : plus rien).
    function avancer(t) {
      if (!enMarche || erreur !== ERREUR.ok) return Infinity;
      for (let garde = 0; garde < 50; garde++) {
        let travail = false;
        if (demarrageFini) detecterEvenements(t);
        for (const f of fils) {
          if (!f.actif || f.reveil > t) continue;
          if (courir(f, t) === 'erreur') {
            arreter();
            return Infinity;
          }
          travail = true;
        }
        if (finDuDemarrage(t)) travail = true;
        if (!travail) break;
      }
      return prochainReveil();
    }

    // Pas à pas. filPret(t) : le premier fil prêt à l'instant t (sans rien exécuter), ou null s'il faut avancer
    // l'horloge. unPas(t) : exécute une seule instruction de ce fil et le renvoie.
    function filPret(t) {
      if (!enMarche || erreur !== ERREUR.ok) return null;
      if (demarrageFini) detecterEvenements(t);
      finDuDemarrage(t);
      return fils.find((x) => x.actif && x.reveil <= t) || null;
    }
    function unPas(t) {
      const f = filPret(t);
      if (!f) return null;
      if (courir(f, t, 1) === 'erreur') {
        arreter();
        return null;
      }
      finDuDemarrage(t);
      return f;
    }

    return {
      charger,
      demarrer,
      avancer,
      filPret,
      unPas,
      arreter,
      prochainReveil,
      get enMarche() {
        return enMarche;
      },
      get erreur() {
        return erreur;
      },
      get longueur() {
        return erreur === ERREUR.ok ? longueur : 0;
      },
      get fils() {
        return fils;
      },
      get variables() {
        return variables;
      },
    };
  }

  const api = { creerVM, ERREUR_VM: ERREUR, FIL };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign((global.LaboBlocs = global.LaboBlocs || {}), api);
})(this);
