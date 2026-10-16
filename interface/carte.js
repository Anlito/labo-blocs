// Envoi du programme de l'élève dans la carte (mode « Dans la carte », écran A6 de la maquette).
// Arduino Uno, mBot (carte mCore) et micro:bit V2 : la carte a un programme de base (cartes/, « programme de la
// carte », installé une fois) qui reçoit le code octet de l'élève par le câble USB (Web Serial, Chrome et Edge) et
// le garde : il redémarre seul, même câble débranché. « Vider la carte » l'efface (fin de séance).
//
// Protocole v2 (une ligne par commande, une ligne de réponse) :
//   PING → PONG v2 <version> <carte> <octets gardés> <place>
//   PROG <n> → OK · H <hexadécimal> → OK (64 caractères au plus) · FIN → OK <n> · EFFACE → OK
//   erreurs : ERR CMD, ERR PIN, ERR TAILLE, ERR CRC, ERR FORMAT
(function (global) {
  'use strict';

  const A = (global.LaboBlocs = global.LaboBlocs || {});
  const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));

  // Fichier des programmes de carte (cartes/firmwares.js), chargé seulement quand il faut installer.
  const CHEMIN_FIRMWARES = '../cartes/firmwares.js';
  const ICI = global.document && global.document.currentScript ? global.document.currentScript.src : '';

  const DEMARRAGE_CARTE = 1800; // ms : la Uno et le mCore redémarrent quand on ouvre le port
  const TAILLE_LIGNE_HEX = 64;

  // ---------- Liaison série : une commande, une réponse ----------
  function creerLiaison(port) {
    const encodeur = new TextEncoder();
    let lecteur = null;
    let tampon = '';
    let attentes = [];
    let fermee = false;
    const l = {
      async ouvrir() {
        await port.open({ baudRate: 115200 });
        (async () => {
          const decodeur = new TextDecoder();
          lecteur = port.readable.getReader();
          try {
            for (;;) {
              const { value, done } = await lecteur.read();
              if (done) break;
              tampon += decodeur.decode(value, { stream: true });
              let i;
              while ((i = tampon.indexOf('\n')) >= 0) {
                // Sans les caractères invisibles : au redémarrage, la carte envoie quelques octets parasites.
                const ligne = tampon.slice(0, i).replace(/[^\x20-\x7e]/g, '').trim();
                tampon = tampon.slice(i + 1);
                if (!ligne || /^E /.test(ligne)) continue; // événements du mode direct : pas ici
                if (attentes.length) attentes.shift()(ligne);
              }
            }
          } catch {
            // port fermé ou câble débranché
          } finally {
            lecteur.releaseLock();
            fermee = true;
            for (const a of attentes) a(null);
            attentes = [];
          }
        })();
      },
      // Envoie une ligne et attend la réponse, ou null après « delai » ms.
      commande(texte, delai) {
        if (fermee) return Promise.resolve(null);
        return new Promise((resoudre) => {
          let fini = false;
          const minuteur = setTimeout(() => {
            fini = true;
            attentes = attentes.filter((a) => a !== recevoir);
            resoudre(null);
          }, delai || 1000);
          function recevoir(ligne) {
            if (fini) return;
            clearTimeout(minuteur);
            resoudre(ligne);
          }
          attentes.push(recevoir);
          const w = port.writable.getWriter();
          w.write(encodeur.encode(texte + '\n'))
            .catch(() => {})
            .finally(() => w.releaseLock());
        });
      },
      vider() {
        tampon = '';
      },
      async fermer() {
        try {
          if (lecteur) await lecteur.cancel();
        } catch {
          // déjà fermé
        }
        await pause(50);
        await port.close().catch(() => {});
      },
    };
    return l;
  }

  // « PONG v2 0.2 uno 120 1012 » → { version, nom, octets, place }
  function lirePong(ligne) {
    const m = /PONG v2 (\S+) (\S+) (\d+) (\d+)/.exec(ligne || '');
    return m ? { version: m[1], nom: m[2], octets: Number(m[3]), place: Number(m[4]) } : null;
  }

  // Nom de la carte qui a répondu (« PONG … mcore … »), pour les messages.
  const NOMS_REPONSE = { uno: 'Arduino Uno', mcore: 'mBot (carte mCore)', 'microbit-v2': 'micro:bit V2', 'microbit-v1': 'micro:bit V1' };

  // ---------- Connexion à la carte (une seule pour toute la page) ----------
  //   etat.cle : 'sans-usb' | 'aucune' | 'choisir' | 'connexion' | 'a-installer' | 'installation' | 'connectee' |
  //              'envoi' | 'envoye' | 'vide' | 'occupee' | 'pas-a-jour' | 'mauvaise-carte' | 'erreur' | 'programme'
  function creerConnexion() {
    const serie = global.navigator && global.navigator.serial;
    const ecouteurs = new Set();
    let port = null;
    let liaison = null;
    let occupe = false;
    const c = {
      etat: { cle: serie ? 'aucune' : 'sans-usb' },
      profil: A.profil ? A.profil('uno') : { id: 'uno', nom: 'Arduino Uno', reponse: 'uno', installation: 'serie', firmware: 'uno' },
      carte: null, // réponse au dernier PING
      ecouter(f) {
        ecouteurs.add(f);
        f(c.etat);
        return () => ecouteurs.delete(f);
      },
      // Carte de l'exercice ouvert : la connexion vérifiera que c'est bien elle.
      choisirProfil(profil) {
        const change = c.profil.id !== profil.id;
        c.profil = profil;
        if (change && ['connectee', 'envoye', 'vide', 'mauvaise-carte', 'pas-a-jour', 'a-installer'].includes(c.etat.cle)) verifier();
        else if (change) changer(c.etat.cle === 'sans-usb' ? c.etat : { cle: port ? c.etat.cle : 'aucune' });
      },
      // (installer, envoyer… sont définis plus bas)
      connecter: (...a) => connecter(...a),
      installer: (...a) => installer(...a),
      envoyer: (...a) => envoyer(...a),
      vider: (...a) => vider(...a),
      deconnecter: (...a) => deconnecter(...a),
      reprendre: () => changer({ cle: c.carte ? 'connectee' : 'aucune', carte: c.carte }),
      signaler: (etat) => changer(etat),
    };

    function changer(etat) {
      c.etat = etat;
      for (const f of ecouteurs) f(etat);
    }

    if (serie) {
      serie.addEventListener('disconnect', (e) => {
        if (port && e.target === port) {
          liaison = null;
          port = null;
          c.carte = null;
          if (!occupe) changer({ cle: 'aucune', debranchee: true });
        }
      });
    }

    async function fermerLiaison() {
      if (liaison) await liaison.fermer();
      liaison = null;
    }

    // Une action à la fois (un clic de plus pendant un envoi ne fait rien).
    function action(f) {
      return async (...args) => {
        if (occupe) return null;
        occupe = true;
        try {
          return await f(...args);
        } catch (e) {
          changer({ cle: 'erreur', message: 'Erreur inattendue : ' + (e && e.message ? e.message : e) + '. Débranche et rebranche le câble USB, puis réessaie.' });
          return null;
        } finally {
          occupe = false;
        }
      };
    }

    // Choisir la carte : une carte déjà autorisée sur ce poste est reprise sans fenêtre.
    async function choisirPort(nouvelle) {
      if (port && !nouvelle) return true;
      if (!nouvelle) {
        const connus = await serie.getPorts().catch(() => []);
        if (connus.length === 1) {
          port = connus[0];
          return true;
        }
      }
      changer({ cle: 'choisir' });
      try {
        port = await serie.requestPort();
        return true;
      } catch {
        changer({ cle: 'aucune' }); // fenêtre fermée sans choisir
        return false;
      }
    }

    // Ouvre le port si besoin et demande à la carte qui elle est.
    async function ouvrirEtDemander() {
      if (!liaison) {
        liaison = creerLiaison(port);
        try {
          await liaison.ouvrir();
        } catch {
          liaison = null;
          changer({ cle: 'occupee' });
          return null;
        }
        if (c.profil.installation === 'serie') await pause(DEMARRAGE_CARTE);
      }
      // Jusqu'à 3 essais : juste après l'ouverture, la réponse peut être brouillée.
      for (let essai = 0; essai < 3; essai++) {
        const r = await liaison.commande('PING', 900);
        const pong = lirePong(r);
        if (pong) return pong;
        await pause(250);
        liaison.vider();
      }
      return false;
    }

    // Décide de l'état d'après la réponse au PING.
    function constater(pong) {
      if (pong === null) return false; // déjà dit (carte occupée)
      c.carte = null;
      if (pong === false) {
        changer({ cle: 'a-installer' });
        return false;
      }
      const attendue = c.profil.reponse;
      const microbitAttendue = /^microbit/.test(attendue);
      const microbitBranchee = /^microbit/.test(pong.nom);
      if (pong.nom !== attendue && microbitAttendue !== microbitBranchee) {
        changer({ cle: 'mauvaise-carte', branchee: NOMS_REPONSE[pong.nom] || pong.nom });
        return false;
      }
      if (pong.nom !== attendue || pong.version !== (A.VERSION_FIRMWARE || pong.version)) {
        changer({ cle: 'pas-a-jour', branchee: NOMS_REPONSE[pong.nom] || pong.nom, version: pong.version });
        return false;
      }
      c.carte = pong;
      return true;
    }

    async function verifierCarte() {
      changer({ cle: 'connexion' });
      const ok = constater(await ouvrirEtDemander());
      if (ok) changer({ cle: 'connectee', carte: c.carte });
      return ok;
    }
    const verifier = action(verifierCarte);

    async function connecter(nouvelle) {
      if (!serie) return changer({ cle: 'sans-usb' });
      if (occupe) return null;
      if (nouvelle) await fermerLiaison();
      if (!(await choisirPort(nouvelle))) return null;
      return verifier();
    }

    // Programme de la carte (cartes/firmwares.js), chargé à la demande.
    function chargerFirmwares() {
      if (A.firmwares) return Promise.resolve(A.firmwares);
      return new Promise((resoudre) => {
        global.definirFirmwares = (f) => (A.firmwares = f);
        const s = global.document.createElement('script');
        s.src = ICI ? new URL(CHEMIN_FIRMWARES, ICI).href : CHEMIN_FIRMWARES;
        s.onload = () => resoudre(A.firmwares || null);
        s.onerror = () => resoudre(null);
        global.document.head.appendChild(s);
      });
    }

    const installer = action(async () => {
      const f = await chargerFirmwares();
      const hex = f && f[c.profil.firmware];
      if (!hex) return changer({ cle: 'erreur', message: A.televersement.MESSAGES.fichierAbime });
      if (c.profil.installation === 'fichier') {
        // micro:bit : le fichier se copie sur le lecteur MICROBIT (le navigateur ne peut pas l'y écrire lui-même).
        const lien = global.document.createElement('a');
        lien.href = URL.createObjectURL(new Blob([hex], { type: 'application/octet-stream' }));
        lien.download = `labo-blocs-${c.profil.id}-${f.version}.hex`;
        global.document.body.appendChild(lien);
        lien.click();
        lien.remove();
        await fermerLiaison(); // la micro:bit redémarre après la copie : il faudra rouvrir le port
        return changer({ cle: 'a-installer', fichier: lien.download });
      }
      if (!port && !(await choisirPort(false))) return null;
      await fermerLiaison();
      changer({ cle: 'installation', fraction: 0 });
      const r = await A.televersement.installerProgrammeCarte(port, A.televersement.lireHex(hex), {
        progression({ phase, fraction }) {
          const f2 = phase === 'connexion' ? 0 : phase === 'ecriture' ? fraction * 0.7 : phase === 'verification' ? 0.7 + fraction * 0.3 : 1;
          changer({ cle: 'installation', fraction: f2 });
        },
      });
      if (!r.ok) return changer({ cle: /déjà utilisée/.test(r.message) ? 'occupee' : 'erreur', message: r.message });
      return verifierCarte();
    });

    const MESSAGES_ENVOI = {
      'ERR TAILLE': 'Le programme n’est pas arrivé en entier. Réessaie, sans débrancher le câble.',
      'ERR CRC': 'Le programme est arrivé abîmé. Réessaie, sans débrancher le câble.',
      'ERR FORMAT': 'La carte ne comprend pas ce programme : son programme de base n’est pas à jour. Installe-le à nouveau.',
    };

    // octets : code octet du programme de l'élève (compilé par le noyau).
    const envoyer = action(async (octets) => {
      if (!(await verifierCarte())) return { ok: false };
      if (octets.length > c.carte.place) {
        changer({ cle: 'programme', message: `Ton programme est trop grand pour cette carte (${octets.length} octets pour ${c.carte.place} de place). Essaie de le raccourcir.` });
        return { ok: false };
      }
      changer({ cle: 'envoi', fraction: 0 });
      const hex = Array.from(octets, (o) => o.toString(16).padStart(2, '0')).join('').toUpperCase();
      let r = await liaison.commande('PROG ' + octets.length, 1500);
      const morceaux = Math.ceil(hex.length / TAILLE_LIGNE_HEX);
      for (let i = 0; r === 'OK' && i < morceaux; i++) {
        r = await liaison.commande('H ' + hex.slice(i * TAILLE_LIGNE_HEX, (i + 1) * TAILLE_LIGNE_HEX), 1500);
        changer({ cle: 'envoi', fraction: (i + 1) / (morceaux + 1) });
      }
      if (r === 'OK') r = await liaison.commande('FIN', 3000);
      if (!r || !/^OK/.test(r)) {
        const message = MESSAGES_ENVOI[r] || 'La carte ne répond plus. Débranche et rebranche le câble USB, puis réessaie.';
        changer({ cle: r === 'ERR FORMAT' ? 'pas-a-jour' : 'erreur', message });
        return { ok: false, message };
      }
      c.carte = Object.assign({}, c.carte, { octets: octets.length });
      changer({ cle: 'envoye', octets: octets.length });
      return { ok: true };
    });

    const vider = action(async () => {
      if (!(await verifierCarte())) return { ok: false };
      let r = await liaison.commande('EFFACE', 2000);
      if (r !== 'OK') r = await liaison.commande('EFFACE', 2000); // la 1re réponse peut être brouillée
      if (r !== 'OK') {
        changer({ cle: 'erreur', message: 'La carte n’a pas été vidée : elle ne répond plus. Débranche et rebranche le câble USB, puis réessaie.' });
        return { ok: false };
      }
      c.carte = Object.assign({}, c.carte, { octets: 0 });
      changer({ cle: 'vide' });
      return { ok: true };
    });

    const deconnecter = action(async () => {
      await fermerLiaison();
      c.carte = null;
      changer({ cle: 'aucune', deconnectee: true });
    });

    return c;
  }

  let connexion = null;
  A.connexionCarte = () => connexion || (connexion = creerConnexion());

  // ---------- Panneau « Dans la carte » (A6) ----------

  // Textes des états : titre, statut (avec pictogramme : jamais la couleur seule), message, ton.
  // seulementVider : fenêtre « Vider la carte » (fin de séance), sans programme à envoyer.
  function decrire(e, profil, seulementVider) {
    const nom = profil.nom;
    const microbit = profil.installation === 'fichier';
    switch (e.cle) {
      case 'sans-usb':
        return { ton: 'blocage', titre: 'Accès USB impossible', statut: 'Navigateur sans accès USB', message: 'Ce navigateur ne peut pas envoyer de programme dans la carte. Ouvre Labo Blocs dans Chrome ou Edge.' };
      case 'aucune':
        return {
          ton: 'neutre',
          titre: e.debranchee ? 'Carte débranchée' : 'Aucune carte connectée',
          statut: 'En attente de la carte',
          message: `${e.debranchee ? 'Le câble a été débranché. ' : ''}Branche la carte (${nom}) avec le câble USB, puis clique sur « Connecter la carte ».`,
          boutons: [{ cle: 'connecter', texte: 'Connecter la carte', principal: true }],
        };
      case 'choisir':
        return { ton: 'neutre', titre: 'Choisir la carte', statut: 'Une fenêtre est ouverte', message: 'Choisis la ligne qui parle de ta carte, puis clique sur « Connexion ». Si tu ne vois rien, demande au professeur.' };
      case 'connexion':
        return { ton: 'neutre', titre: 'Connexion…', statut: 'La carte démarre', message: 'Ne débranche pas le câble.' };
      case 'a-installer':
        if (microbit) {
          return {
            ton: 'neutre',
            titre: 'Installer le programme de la carte',
            statut: 'Étape faite une seule fois',
            message: e.fichier
              ? `Le fichier « ${e.fichier} » est dans tes téléchargements. Glisse-le sur le lecteur MICROBIT : la lumière de la carte clignote pendant la copie. Quand elle s’arrête, clique sur « Connecter la carte ».`
              : 'La micro:bit n’a pas encore le programme de base de Labo Blocs. Clique sur « Enregistrer le fichier », puis glisse-le sur le lecteur MICROBIT (une seule fois).',
            boutons: [
              { cle: 'installer', texte: 'Enregistrer le fichier', principal: !e.fichier },
              { cle: 'reconnecter', texte: 'Connecter la carte', principal: !!e.fichier },
            ],
          };
        }
        return {
          ton: 'neutre',
          titre: 'Installer le programme de la carte',
          statut: 'Étape faite une seule fois',
          message: 'La carte n’a pas encore le programme de base de Labo Blocs (ou elle a servi avec mBlock ou l’IDE Arduino). Installe-le : c’est fait une fois pour toutes.',
          boutons: [{ cle: 'installer', texte: 'Installer le programme de la carte', principal: true }],
        };
      case 'installation':
        return { ton: 'neutre', titre: 'Installer le programme de la carte', statut: 'Étape faite une seule fois', message: 'La carte reçoit son programme de base. Ne débranche pas le câble.', progression: e.fraction, libelle: 'Installation' };
      case 'connectee':
        if (seulementVider) {
          return {
            ton: 'reussi',
            titre: 'Carte connectée',
            statut: `${nom} · prête`,
            message: 'Clique sur « Vider la carte » : son programme sera effacé et elle ne commandera plus rien.',
            boutons: [
              { cle: 'vider', texte: 'Vider la carte', principal: true },
              { cle: 'deconnecter', texte: 'Déconnecter' },
            ],
          };
        }
        return {
          ton: 'reussi',
          titre: 'Carte connectée',
          statut: `${nom} · prête`,
          message: `La carte répond. Tu peux lui envoyer ton programme.${e.carte && e.carte.octets ? ' Elle garde déjà un programme : il sera remplacé.' : ''}`,
          boutons: [
            { cle: 'envoyer', texte: 'Envoyer mon programme', principal: true },
            { cle: 'vider', texte: 'Vider la carte' },
            { cle: 'deconnecter', texte: 'Déconnecter' },
          ],
        };
      case 'envoi':
        return { ton: 'neutre', titre: 'Envoi en cours', statut: 'Programme en route', message: 'Ne débranche pas le câble avant la fin.', progression: e.fraction, libelle: 'Envoi' };
      case 'envoye':
        return {
          ton: 'reussi',
          titre: 'Programme envoyé',
          statut: 'Dans la carte',
          message: 'Le programme est dans la carte. Tu peux débrancher le câble : la carte le garde et redémarre avec lui.',
          boutons: [
            { cle: 'terminer', texte: 'Terminé', principal: true },
            { cle: 'vider', texte: 'Vider la carte' },
          ],
        };
      case 'vide':
        return {
          ton: 'reussi',
          titre: 'Carte vidée',
          statut: 'Plus aucun programme',
          message: 'Le programme est effacé : la carte ne commande plus rien. Vérifie que le robot (ou la maquette) est bien arrêté avant de ranger.',
          boutons: [{ cle: 'terminer', texte: 'Terminé', principal: true }],
        };
      case 'occupee':
        return {
          ton: 'blocage',
          titre: 'Carte déjà utilisée',
          statut: 'Connexion impossible',
          message: 'La carte est déjà utilisée par un autre programme (IDE Arduino, mBlock, autre onglet…). Ferme-le, puis réessaie.',
          boutons: [{ cle: 'reconnecter', texte: 'Réessayer', principal: true }],
        };
      case 'pas-a-jour':
        return {
          ton: 'blocage',
          titre: 'Carte pas à jour',
          statut: 'Mauvais programme de base',
          message: microbit
            ? 'La micro:bit a un ancien programme de base. Clique sur « Enregistrer le fichier », puis glisse-le sur le lecteur MICROBIT ; si ça recommence, demande au professeur.'
            : 'La carte a sans doute servi à un autre projet. Clique sur « Installer le programme de la carte » ; si ça recommence, demande au professeur.',
          boutons: [{ cle: 'installer', texte: microbit ? 'Enregistrer le fichier' : 'Installer le programme de la carte', principal: true }],
        };
      case 'mauvaise-carte':
        return {
          ton: 'blocage',
          titre: 'Ce n’est pas la bonne carte',
          statut: `Carte branchée : ${e.branchee}`,
          message: `Cet exercice se fait avec : ${nom}. Branche la bonne carte, puis clique sur « Réessayer ».`,
          boutons: [{ cle: 'changer', texte: 'Réessayer', principal: true }],
        };
      case 'programme':
        return { ton: 'ecart', titre: 'Programme à revoir', statut: 'Pas envoyé', message: e.message, boutons: [{ cle: 'terminer', texte: 'Retour' }] };
      default:
        return {
          ton: 'blocage',
          titre: 'La carte ne répond pas',
          statut: 'Connexion perdue',
          message: e.message || 'Débranche et rebranche le câble USB, puis clique sur « Réessayer ».',
          boutons: [{ cle: 'reconnecter', texte: 'Réessayer', principal: true }],
        };
    }
  }

  const ICONES_TON = { reussi: 'coche', blocage: 'alerte', ecart: 'alerte', neutre: 'info' };

  // racine : élément qui reçoit le panneau. options : { programme() → { octets, erreurs }, surEnvoi(r), surVidage(r) }
  function creerPanneauCarte(racine, options) {
    const o = options || {};
    const connexion = A.connexionCarte();
    function dessiner(e) {
      const d = decrire(e, connexion.profil, !!o.seulementVider);
      const icone = A.icone ? A.icone(ICONES_TON[d.ton] || 'info', { epaisseur: 2.6 }) : '';
      let h = `<div class="pc-tete"><span class="pc-carte" aria-hidden="true">${dessinUsb()}</span><div class="pc-titres"><strong class="pc-titre">${echapper(d.titre)}</strong>`;
      h += `<span class="pc-statut">${icone}<span>${echapper(d.statut)}</span></span></div></div>`;
      if (d.progression !== undefined) {
        const p = Math.round((d.progression || 0) * 100);
        h += `<div class="pc-barre" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}" aria-label="${d.libelle} : ${p} %"><div style="width:${p}%"></div></div>`;
        h += `<div class="pc-avance">${d.libelle} : ${p} %</div>`;
      }
      h += `<p class="pc-message">${echapper(d.message)}</p>`;
      if (d.boutons && d.boutons.length) {
        h += '<div class="pc-actions">' + d.boutons.map((b) => `<button type="button" class="${b.principal ? 'btn-principal' : 'btn-secondaire'}" data-action="${b.cle}">${echapper(b.texte)}</button>`).join('') + '</div>';
      }
      racine.className = `panneau-carte pc-${d.ton}`;
      racine.dataset.etat = e.cle;
      racine.innerHTML = h;
    }
    const arreter = connexion.ecouter(dessiner);
    racine.addEventListener('click', async (evt) => {
      const b = evt.target.closest('button[data-action]');
      if (!b) return;
      switch (b.dataset.action) {
        case 'connecter':
          return connexion.connecter(false);
        case 'reconnecter':
          return connexion.connecter(false);
        case 'changer':
          return connexion.connecter(true);
        case 'installer':
          return connexion.installer();
        case 'deconnecter':
          return connexion.deconnecter();
        case 'terminer':
          return connexion.reprendre();
        case 'envoyer': {
          const p = o.programme ? o.programme() : null;
          if (!p || (p.erreurs && p.erreurs.length)) {
            return connexion.signaler({ cle: 'programme', message: 'Ton programme a un bloc incomplet ou inconnu : complète-le, puis réessaie.' });
          }
          const r = await connexion.envoyer(p.octets);
          if (r && o.surEnvoi) o.surEnvoi(Object.assign({ octets: p.octets.length }, r));
          return r;
        }
        case 'vider': {
          const r = await connexion.vider();
          if (r && o.surVidage) o.surVidage(r);
          return r;
        }
        default:
          return null;
      }
    });
    return { choisirProfil: (p) => connexion.choisirProfil(p), arreter, connexion };
  }

  function dessinUsb() {
    return (
      '<svg width="46" height="34" viewBox="0 0 46 34"><rect x="2" y="4" width="34" height="26" rx="5" fill="#3F4E66"/>' +
      '<rect x="36" y="12" width="8" height="10" rx="2" fill="#A9B6CC"/><circle cx="12" cy="14" r="3" fill="#F5C45E"/><circle cx="22" cy="14" r="3" fill="#55B0F0"/></svg>'
    );
  }

  // Fenêtre autonome (ex. « Vider la carte » en fin de séance, depuis une page du projet).
  //   options : { carte ('uno' | 'mbot' | 'microbit'), titre, intro, seulementVider, programme(), surEnvoi(r), surVidage(r) }
  function ouvrirDialogueCarte(options) {
    const o = options || {};
    const d = global.document.createElement('dialog');
    d.className = 'dialogue-carte-hote';
    d.setAttribute('aria-label', o.titre || 'Carte');
    d.style.cssText = 'border:none;border-radius:16px;padding:0;width:min(34rem, calc(100% - 2rem));background:transparent';
    d.innerHTML =
      '<div class="labo-blocs"><div class="dialogue-carte">' +
      `<div class="dialogue-entete"><strong>${echapper(o.titre || 'Carte')}</strong><button type="button" class="btn-fermer-carte" aria-label="Fermer">×</button></div>` +
      (o.intro ? `<p class="dc-intro">${echapper(o.intro)}</p>` : '') +
      '<div class="panneau-carte" aria-live="polite"></div></div></div>';
    global.document.body.append(d);
    const panneau = creerPanneauCarte(d.querySelector('.panneau-carte'), o);
    panneau.choisirProfil(A.profil ? A.profil(o.carte || 'uno') : connexion.profil);
    if (['envoye', 'vide', 'programme'].includes(panneau.connexion.etat.cle)) panneau.connexion.reprendre();
    d.querySelector('.btn-fermer-carte').addEventListener('click', () => d.close());
    d.addEventListener('close', () => {
      panneau.arreter();
      d.remove();
    });
    d.showModal();
    return d;
  }

  Object.assign(A, { creerPanneauCarte, ouvrirDialogueCarte, lirePong, decrireEtatCarte: decrire });
})(this);
