// Installation du programme de la carte (cartes/firmwares.js) dans une Arduino Uno ou un mBot (carte mCore),
// depuis le navigateur (Chrome, Edge : Web Serial). Repris de l'atelier du distributeur (flasher.js) et de la page
// d'essai du jalon 0. On parle au « bootloader » de la carte (le petit programme qui écoute pendant une seconde après
// chaque redémarrage) avec le protocole STK500, comme l'IDE Arduino :
//   - Uno et mCore (optiboot) : 115200 bauds ; anciens bootloaders (clones) : 57600 bauds.
(function (global) {
  'use strict';

  const A = (global.LaboBlocs = global.LaboBlocs || {});

  const VITESSES_BOOTLOADER = [115200, 57600];
  const TAILLE_PAGE = 128; // octets par page de mémoire flash (ATmega328P)
  const TAILLE_MAX = 32256; // place pour le programme (32 Ko moins le bootloader)

  // Codes du protocole STK500.
  const STK = {
    OK: 0x10,
    INSYNC: 0x14,
    EOP: 0x20,
    GET_SYNC: 0x30,
    ENTER_PROGMODE: 0x50,
    LEAVE_PROGMODE: 0x51,
    LOAD_ADDRESS: 0x55,
    PROG_PAGE: 0x64,
    READ_PAGE: 0x74,
    READ_SIGN: 0x75,
  };

  // Messages en français, avec la prochaine action.
  const MESSAGES = {
    pasDeBootloader: 'La carte ne se laisse pas programmer. Débranche et rebranche le câble USB, puis réessaie. Si ça recommence, demande au professeur.',
    mauvaisePuce: 'Cette carte n’est ni une Arduino Uno ni un mBot : impossible d’y installer le programme. Demande au professeur.',
    verificationRatee: 'L’installation n’a pas été vérifiée correctement. Réessaie, sans débrancher le câble.',
    portOccupe: 'La carte est déjà utilisée par un autre programme (IDE Arduino, mBlock, autre onglet…). Ferme-le, puis réessaie.',
    fichierAbime: 'Le programme de la carte est introuvable ou abîmé. Recharge la page, puis réessaie.',
  };

  class ErreurTeleversement extends Error {}

  // ---------- Fichier .hex (Intel HEX) → image de la mémoire flash ----------
  function lireHex(texte) {
    const octets = new Uint8Array(TAILLE_MAX).fill(0xff);
    let taille = 0;
    let base = 0;
    for (const brut of String(texte).split(/\r?\n/)) {
      const ligne = brut.trim();
      if (!ligne) continue;
      if (ligne[0] !== ':' || ligne.length < 11) throw new ErreurTeleversement(MESSAGES.fichierAbime);
      const enr = [];
      for (let i = 1; i < ligne.length; i += 2) enr.push(parseInt(ligne.slice(i, i + 2), 16));
      if (enr.some(Number.isNaN) || enr.reduce((a, b) => a + b, 0) % 256 !== 0) throw new ErreurTeleversement(MESSAGES.fichierAbime);
      const [longueur, haut, bas, type] = enr;
      const donnees = enr.slice(4, 4 + longueur);
      if (type === 0x00) {
        const adresse = base + (haut << 8) + bas;
        if (adresse + longueur > TAILLE_MAX) throw new ErreurTeleversement(MESSAGES.fichierAbime);
        octets.set(donnees, adresse);
        taille = Math.max(taille, adresse + longueur);
      } else if (type === 0x01) break;
      else if (type === 0x02) base = ((donnees[0] << 8) + donnees[1]) * 16;
      else if (type === 0x04) base = ((donnees[0] << 8) + donnees[1]) * 65536;
    }
    if (taille === 0) throw new ErreurTeleversement(MESSAGES.fichierAbime);
    return octets.slice(0, taille);
  }

  // ---------- Lecture des octets reçus, avec délai maximal ----------
  class Lecteur {
    constructor(flux) {
      this.tampon = [];
      this.reveil = null;
      this.lecteur = flux.getReader();
      this.fini = this.boucle();
    }
    async boucle() {
      try {
        for (;;) {
          const { value, done } = await this.lecteur.read();
          if (done) break;
          for (const o of value) this.tampon.push(o);
          if (this.reveil) this.reveil();
        }
      } catch {
        // port fermé ou câble arraché
      } finally {
        this.lecteur.releaseLock();
        if (this.reveil) this.reveil();
      }
    }
    // n octets, ou null si rien n'arrive à temps.
    async lire(n, ms) {
      const fin = Date.now() + ms;
      while (this.tampon.length < n) {
        const reste = fin - Date.now();
        if (reste <= 0) return null;
        await new Promise((r) => {
          const t = setTimeout(r, reste);
          this.reveil = () => {
            clearTimeout(t);
            r();
          };
        });
        this.reveil = null;
      }
      return this.tampon.splice(0, n);
    }
    vider() {
      this.tampon.length = 0;
    }
    async arreter() {
      await this.lecteur.cancel().catch(() => {});
      await this.fini;
    }
  }

  const pause = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- Une séance avec le bootloader, à une vitesse donnée ----------
  class Seance {
    constructor(port) {
      this.port = port;
    }
    async ouvrir(bauds) {
      try {
        await this.port.open({ baudRate: bauds });
      } catch (e) {
        throw new ErreurTeleversement(e && e.name === 'InvalidStateError' ? MESSAGES.portOccupe : MESSAGES.pasDeBootloader);
      }
      this.entree = new Lecteur(this.port.readable);
      this.sortie = this.port.writable.getWriter();
    }
    async fermer() {
      if (this.entree) await this.entree.arreter();
      try {
        if (this.sortie) this.sortie.releaseLock();
      } catch {
        // déjà libéré
      }
      await this.port.close().catch(() => {});
      this.entree = this.sortie = null;
    }
    // Redémarre la carte (comme l'IDE Arduino) : le bootloader écoute pendant environ une seconde.
    async redemarrer() {
      await this.port.setSignals({ dataTerminalReady: false, requestToSend: false });
      await pause(250);
      await this.port.setSignals({ dataTerminalReady: true, requestToSend: true });
      await pause(50);
      this.entree.vider();
    }
    async envoyer(octets) {
      await this.sortie.write(Uint8Array.from(octets));
    }
    // Envoie une commande, attend INSYNC, « extra » octets de données, puis OK.
    async commande(octets, extra, ms) {
      await this.envoyer([...octets, STK.EOP]);
      const r = await this.entree.lire((extra || 0) + 2, ms || 500);
      if (!r || r[0] !== STK.INSYNC || r[r.length - 1] !== STK.OK) return null;
      return r.slice(1, -1);
    }
    // Juste après le redémarrage, le bootloader fait clignoter la LED L sans lire : une demande à la fois.
    async synchroniser() {
      for (let i = 0; i < 5; i++) {
        if (await this.commande([STK.GET_SYNC], 0, i === 0 ? 800 : 300)) {
          await pause(50);
          this.entree.vider();
          if (await this.commande([STK.GET_SYNC], 0, 300)) return true;
        }
      }
      return false;
    }
    adresse(octet) {
      const mot = octet >> 1; // le bootloader compte en mots de 2 octets
      return this.commande([STK.LOAD_ADDRESS, mot & 0xff, mot >> 8]);
    }
  }

  // ---------- Installation complète ----------
  // port : SerialPort fermé ; image : octets (lireHex) ; progression({ phase, fraction }) avec phase
  // 'connexion' | 'ecriture' | 'verification' | 'fin'. Renvoie { ok: true, bauds } ou { ok: false, message }.
  async function installerProgrammeCarte(port, image, options) {
    const o = options || {};
    const progression = o.progression || (() => {});
    const s = new Seance(port);
    try {
      progression({ phase: 'connexion', fraction: 0 });
      let bauds = null;
      for (const b of o.vitesses || VITESSES_BOOTLOADER) {
        await s.ouvrir(b);
        await s.redemarrer();
        if (await s.synchroniser()) {
          bauds = b;
          break;
        }
        await s.fermer();
        await pause(200);
      }
      if (!bauds) throw new ErreurTeleversement(MESSAGES.pasDeBootloader);

      // Signature du microcontrôleur : 1E 95 xx = ATmega328 / 328P (Uno, mCore).
      const signature = await s.commande([STK.READ_SIGN], 3);
      if (!signature || signature[0] !== 0x1e || signature[1] !== 0x95) throw new ErreurTeleversement(MESSAGES.mauvaisePuce);
      if (!(await s.commande([STK.ENTER_PROGMODE]))) throw new ErreurTeleversement(MESSAGES.pasDeBootloader);

      const pages = Math.ceil(image.length / TAILLE_PAGE);
      const page = (i) => {
        const p = new Uint8Array(TAILLE_PAGE).fill(0xff);
        p.set(image.subarray(i * TAILLE_PAGE, (i + 1) * TAILLE_PAGE));
        return p;
      };
      for (let i = 0; i < pages; i++) {
        const ok = (await s.adresse(i * TAILLE_PAGE)) && (await s.commande([STK.PROG_PAGE, 0, TAILLE_PAGE, 0x46, ...page(i)], 0, 1000));
        if (!ok) throw new ErreurTeleversement(MESSAGES.pasDeBootloader);
        progression({ phase: 'ecriture', fraction: (i + 1) / pages });
      }
      for (let i = 0; i < pages; i++) {
        const lu = (await s.adresse(i * TAILLE_PAGE)) && (await s.commande([STK.READ_PAGE, 0, TAILLE_PAGE, 0x46], TAILLE_PAGE, 1000));
        if (!lu) throw new ErreurTeleversement(MESSAGES.pasDeBootloader);
        const attendu = page(i);
        if (lu.some((b, k) => b !== attendu[k])) throw new ErreurTeleversement(MESSAGES.verificationRatee);
        progression({ phase: 'verification', fraction: (i + 1) / pages });
      }
      await s.commande([STK.LEAVE_PROGMODE]); // la carte démarre son nouveau programme
      progression({ phase: 'fin', fraction: 1 });
      return { ok: true, bauds };
    } catch (e) {
      return { ok: false, message: e instanceof ErreurTeleversement ? e.message : MESSAGES.pasDeBootloader };
    } finally {
      await s.fermer();
    }
  }

  A.televersement = { lireHex, installerProgrammeCarte, MESSAGES, STK };
})(this);
