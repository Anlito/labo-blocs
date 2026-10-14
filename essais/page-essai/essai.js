// Page d'essai du jalon 0 : installer le firmware Labo Blocs dans une vraie carte, y envoyer un programme
// venu de blocs, vérifier qu'il survit à une coupure, vider la carte, puis essayer le mode direct.
// Tout est noté dans un compte rendu à copier-coller.
(function (global) {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const A = global.Atelier;
  const C = global.CodeOctet;
  const DELAI_DEMARRAGE = 2000; // la carte redémarre quand on ouvre le port

  // ---------- Compte rendu ----------
  const rapport = [];
  function noter(texte, genre) {
    const heure = new Date().toLocaleTimeString('fr-FR');
    rapport.push(`[${heure}] ${texte}`);
    const li = document.createElement('li');
    li.className = genre || '';
    li.textContent = (genre === 'ok' ? '✔ ' : genre === 'ecart' ? '⚠ ' : '') + texte;
    $('#journal').appendChild(li);
    li.scrollIntoView({ block: 'nearest' });
    majRapport();
  }
  // Question posée dans le journal, avec « Oui » / « Non » : la réponse va dans le compte rendu.
  const reponses = [];
  function demander(question, uneFois) {
    if (uneFois && demander.posees.has(question)) return;
    demander.posees.add(question);
    const li = document.createElement('li');
    li.className = 'question';
    li.append(question + ' ');
    for (const [mot, genre] of [['Oui', 'ok'], ['Non', 'ecart']]) {
      const b = document.createElement('button');
      b.textContent = mot;
      b.className = 'second petit';
      b.addEventListener('click', () => {
        li.remove();
        reponses.push(`${question} → ${mot}`);
        noter(`${question} → ${mot}`, genre);
      });
      li.append(b);
    }
    $('#journal').appendChild(li);
    li.scrollIntoView({ block: 'nearest' });
  }
  demander.posees = new Set();

  function majRapport() {
    const info = port && port.getInfo ? port.getInfo() : {};
    $('#rapport').value = [
      'Compte rendu — essais Labo Blocs (jalon 0)',
      `Date : ${new Date().toLocaleString('fr-FR')}`,
      `Navigateur : ${navigator.userAgent}`,
      `Carte choisie : ${carte()}`,
      `Port USB : ${info.usbVendorId ? '0x' + info.usbVendorId.toString(16) + ':0x' + info.usbProductId.toString(16) : 'inconnu'}`,
      `Poste : ${$('#poste').value || '(non renseigné)'}`,
      '',
      'Ce que tu as vu :',
      ...(reponses.length ? reponses : ['(aucune question répondue)']),
      `Remarques : ${$('#remarques').value || ''}`,
      '',
      'Journal :',
      ...rapport,
    ].join('\n');
  }

  const carte = () => $('input[name=carte]:checked').value;

  // ---------- Liaison série (protocole v2) ----------
  let port = null;
  let liaison = null;

  function creerLiaison(p) {
    const encodeur = new TextEncoder();
    let lecteur = null;
    let tampon = '';
    const attentes = [];
    const l = {
      surEvenement: () => {},
      async ouvrir() {
        await p.open({ baudRate: 115200 });
        (async () => {
          const decodeur = new TextDecoder();
          lecteur = p.readable.getReader();
          try {
            for (;;) {
              const { value, done } = await lecteur.read();
              if (done) break;
              tampon += decodeur.decode(value, { stream: true });
              let i;
              while ((i = tampon.indexOf('\n')) >= 0) {
                const ligne = tampon.slice(0, i).replace(/\r$/, '');
                tampon = tampon.slice(i + 1);
                if (/^E /.test(ligne)) l.surEvenement(ligne);
                else if (attentes.length) attentes.shift()(ligne);
              }
            }
          } catch {
            // port fermé ou câble débranché
          } finally {
            lecteur.releaseLock();
          }
        })();
      },
      // Envoie une ligne et attend la réponse (texte), ou null après « delai » ms.
      commande(texte, delai) {
        return new Promise((resoudre) => {
          let fini = false;
          const minuteur = setTimeout(() => {
            fini = true;
            const k = attentes.indexOf(recevoir);
            if (k >= 0) attentes.splice(k, 1);
            resoudre(null);
          }, delai || 1000);
          function recevoir(ligne) {
            if (fini) return;
            clearTimeout(minuteur);
            resoudre(ligne);
          }
          attentes.push(recevoir);
          const w = p.writable.getWriter();
          w.write(encodeur.encode(texte + '\n')).finally(() => w.releaseLock());
        });
      },
      async fermer() {
        try {
          if (lecteur) await lecteur.cancel();
        } catch {}
        await new Promise((r) => setTimeout(r, 50));
        await p.close().catch(() => {});
      },
    };
    return l;
  }

  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

  async function choisirPort() {
    if (!navigator.serial) {
      noter('Ce navigateur ne permet pas l’accès USB (Web Serial). Ouvre la page dans Chrome ou Edge.', 'ecart');
      return false;
    }
    try {
      port = await navigator.serial.requestPort();
    } catch {
      return false; // fenêtre fermée
    }
    const i = port.getInfo();
    noter(`Carte choisie (USB ${i.usbVendorId ? '0x' + i.usbVendorId.toString(16) + ':0x' + i.usbProductId.toString(16) : 'inconnu'}).`);
    $('#etat-port').textContent = 'Carte choisie';
    return true;
  }

  async function connecter() {
    if (!port && !(await choisirPort())) return false;
    if (liaison) return true;
    liaison = creerLiaison(port);
    try {
      await liaison.ouvrir();
    } catch (e) {
      liaison = null;
      noter('La carte est déjà utilisée par un autre programme (IDE Arduino, mBlock, autre onglet…). Ferme-le, puis réessaie. (' + e.message + ')', 'ecart');
      return false;
    }
    liaison.surEvenement = (ligne) => {
      const [, broche, v] = ligne.split(' ');
      const texte = `Broche ${broche} : niveau ${v === '1' ? 'HAUT' : 'BAS'} (${new Date().toLocaleTimeString('fr-FR')})`;
      $('#evenements').textContent = texte;
      $('#evenements-mb').textContent = texte;
      noter(`Événement reçu : ${ligne}`);
    };
    await attendre(DELAI_DEMARRAGE);
    return true;
  }

  async function deconnecter() {
    arreterDirect();
    if (liaison) await liaison.fermer();
    liaison = null;
  }

  // ---------- 1. Installer le firmware ----------
  async function installer() {
    if (carte() === 'microbit') return installerMicrobit();
    if (!port && !(await choisirPort())) return;
    await deconnecter();
    const hex = global.firmwares && global.firmwares[carte()];
    if (!hex) return noter('Firmware introuvable dans la page (firmwares.js).', 'ecart');
    const barre = $('#progression');
    barre.hidden = false;
    const debut = performance.now();
    const r = await A.flasher.flashFirmware(port, A.flasher.parseHex(hex), {
      onProgress({ phase, fraction }) {
        barre.value = phase === 'connexion' ? 0 : phase === 'ecriture' ? fraction * 0.7 : phase === 'verification' ? 0.7 + fraction * 0.3 : 1;
      },
    });
    barre.hidden = true;
    const duree = ((performance.now() - debut) / 1000).toFixed(1);
    if (!r.ok) return noter(`Installation du firmware : échec après ${duree} s — ${r.error}`, 'ecart');
    noter(`Installation du firmware ${carte()} : réussie en ${duree} s (bootloader à ${r.baudRate} bauds).`, 'ok');
    await ping();
  }

  // micro:bit : pas d'envoi par le port série ; on enregistre le fichier, à glisser sur le lecteur MICROBIT.
  function installerMicrobit() {
    const hex = global.firmwares && global.firmwares.microbit;
    if (!hex) return noter('Fichier micro:bit introuvable dans la page (firmwares.js).', 'ecart');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([hex], { type: 'application/octet-stream' }));
    a.download = 'labo_blocs_microbit.hex';
    document.body.appendChild(a);
    a.click();
    a.remove();
    noter('Fichier « labo_blocs_microbit.hex » enregistré (Téléchargements). Glisse-le sur le lecteur MICROBIT : la LED jaune clignote pendant la copie, puis la carte redémarre.');
    demander('La copie s’est-elle terminée sans message d’erreur sur l’écran du micro:bit (pas de texte qui défile) ?');
  }

  // ---------- 2. Vérifier la carte ----------
  async function ping() {
    if (!(await connecter())) return;
    const debut = performance.now();
    const r = await liaison.commande('PING', 1500);
    const ms = Math.round(performance.now() - debut);
    if (!r) return noter('La carte ne répond pas. Installe le firmware (étape 1), ou débranche et rebranche le câble USB.', 'ecart');
    if (!/^PONG v2 /.test(r)) return noter(`Réponse inattendue : « ${r} » — la carte n’a pas le firmware Labo Blocs (étape 1).`, 'ecart');
    const [, , version, nom, octets, capacite] = r.split(' ');
    noter(`Carte prête : firmware ${version}, carte « ${nom} », programme gardé : ${octets === '0' ? 'aucun' : octets + ' octets'} (place : ${capacite} octets). Réponse en ${ms} ms.`, 'ok');
  }

  // ---------- 3. Envoyer un programme ----------
  const ext = (commande, args) => ({ bloc: 'ext', extension: 1, commande, arguments: args });
  const mb = (commande, args) => ({ bloc: 'ext', extension: 2, commande, arguments: args });
  const PROGRAMMES = {
    'microbit-coeur': {
      nom: 'micro:bit : cœur qui clignote sur l’écran',
      programme: { fils: [{ quand: 'boucle', corps: [mb(2, [3]), { bloc: 'attendre', duree: 0.5 }, mb(4, []), { bloc: 'attendre', duree: 0.5 }] }] },
    },
    'microbit-boutons': {
      nom: 'micro:bit : bouton A → 1, bouton B → 2, sinon écran vide',
      programme: {
        fils: [
          {
            quand: 'boucle',
            corps: [
              { bloc: 'si_sinon', condition: { bloc: 'comparaison', op: '=', a: mb(5, []), b: 1 }, alors: [mb(1, [1])], sinon: [
                { bloc: 'si_sinon', condition: { bloc: 'comparaison', op: '=', a: mb(6, []), b: 1 }, alors: [mb(1, [2])], sinon: [mb(4, [])] },
              ] },
              { bloc: 'attendre', duree: 0.05 },
            ],
          },
        ],
      },
    },
    'microbit-hasard': {
      nom: 'micro:bit : dé (nombre au hasard de 1 à 6 toutes les secondes) — hasard et variables',
      programme: { fils: [{ quand: 'boucle', corps: [{ bloc: 'affecter', variable: 'de', valeur: { bloc: 'hasard', min: 1, max: 6 } }, mb(1, [{ bloc: 'variable', variable: 'de' }]), { bloc: 'attendre', duree: 1 }] }] },
    },
    'uno-clignote': {
      nom: 'Clignoter la LED « L » de la carte (D13), sans câblage',
      programme: { fils: [{ quand: 'boucle', corps: [{ bloc: 'led_etat', broche: 'D13', etat: 1 }, { bloc: 'attendre', duree: 0.5 }, { bloc: 'led_etat', broche: 'D13', etat: 0 }, { bloc: 'attendre', duree: 0.5 }] }] },
    },
    'uno-bouton': {
      nom: 'Bouton entre D2 et GND : un appui allume la LED « L » 1 s',
      programme: { fils: [{ quand: 'appui', broche: 'D2', corps: [{ bloc: 'led_etat', broche: 'D13', etat: 1 }, { bloc: 'attendre', duree: 1 }, { bloc: 'led_etat', broche: 'D13', etat: 0 }] }] },
      composants: [{ type: 'bouton', broche: 'D2' }],
    },
    'uno-distributeur': {
      nom: 'Distributeur de céréales : solution 13B (maquette câblée)',
      exercice: '13B',
    },
    'mbot-led': {
      nom: 'mBot : LED vertes, bouton de la carte = LED rouges + bip',
      programme: {
        fils: [
          { quand: 'demarrage', corps: [{ bloc: 'son', broche: 'D8', frequence: 440, duree: 0.2 }] },
          {
            quand: 'boucle',
            corps: [
              {
                bloc: 'si_sinon',
                condition: { bloc: 'comparaison', op: '=', a: ext(4, []), b: 1 },
                alors: [ext(6, [0, 60, 0, 0]), { bloc: 'son', broche: 'D8', frequence: 880, duree: 0.1 }, { bloc: 'attendre', duree: 0.2 }],
                sinon: [ext(6, [0, 0, 60, 0]), { bloc: 'attendre', duree: 0.05 }],
              },
            ],
          },
        ],
      },
    },
    'mbot-avancer': {
      nom: 'mBot : attendre 3 s, avancer 1 s, s’arrêter (poser le robot par terre !)',
      programme: { fils: [{ quand: 'demarrage', corps: [{ bloc: 'attendre', duree: 3 }, ext(1, [50, 50]), { bloc: 'attendre', duree: 1 }, ext(1, [0, 0])] }] },
    },
  };

  function compilerChoisi() {
    const choix = PROGRAMMES[$('#programme').value];
    if (choix.exercice) {
      const ex = A.catalogue.exercices().find((e) => e.id === choix.exercice);
      return { nom: choix.nom, ...C.compiler(ex.solutionReference, { composants: ex.composants }) };
    }
    return { nom: choix.nom, ...C.compiler(choix.programme, { composants: choix.composants }) };
  }

  async function envoyer() {
    const { nom, octets, erreurs } = compilerChoisi();
    if (erreurs.length) return noter('Programme impossible à compiler : ' + erreurs.join(' ; '), 'ecart');
    if (!(await connecter())) return;
    arreterDirect();
    const debut = performance.now();
    const hex = Array.from(octets, (o) => o.toString(16).padStart(2, '0')).join('').toUpperCase();
    let r = await liaison.commande('PROG ' + octets.length, 1500);
    for (let i = 0; r === 'OK' && i < hex.length; i += 64) r = await liaison.commande('H ' + hex.slice(i, i + 64), 1500);
    if (r === 'OK') r = await liaison.commande('FIN', 3000);
    const ms = Math.round(performance.now() - debut);
    if (!r || !/^OK/.test(r)) return noter(`Envoi de « ${nom} » : échec (${r || 'pas de réponse'}). Débranche et rebranche le câble USB, puis réessaie.`, 'ecart');
    noter(`Envoi de « ${nom} » : ${octets.length} octets, réussi en ${ms} ms.`, 'ok');
    demander(`Le programme « ${nom} » tourne-t-il sur la carte ?`);
  }

  async function vider() {
    if (!(await connecter())) return;
    arreterDirect();
    const r = await liaison.commande('EFFACE', 2000);
    if (r === 'OK') {
      noter('Carte vidée : le programme est effacé.', 'ok');
      demander('Après « Vider la carte », tout est-il arrêté sur la carte ?');
    }
    else noter(`Vider la carte : échec (${r || 'pas de réponse'}).`, 'ecart');
  }

  // ---------- 4. Mode direct ----------
  let signeDeVie = null;
  function arreterDirect() {
    clearInterval(signeDeVie);
    signeDeVie = null;
    $('#direct-etat').textContent = 'Mode direct arrêté';
  }
  async function direct(texte, quoi) {
    if (!(await connecter())) return null;
    if (!signeDeVie) {
      // Un PING par seconde : sinon la carte éteint tout au bout de 3 s (sécurité).
      signeDeVie = setInterval(() => liaison && liaison.commande('PING', 800), 1000);
      $('#direct-etat').textContent = 'Mode direct en cours : garde le câble branché';
    }
    const r = await liaison.commande(texte, 1500);
    noter(`${quoi || texte} → ${r || 'pas de réponse'}`, r && !/^ERR/.test(r) ? '' : 'ecart');
    return r;
  }

  async function mesurerAllerRetour() {
    if (!(await connecter())) return;
    const temps = [];
    for (let i = 0; i < 20; i++) {
      const d = performance.now();
      if (!(await liaison.commande('PING', 1000))) break;
      temps.push(performance.now() - d);
    }
    if (!temps.length) return noter('Aller-retour : pas de réponse.', 'ecart');
    temps.sort((a, b) => a - b);
    noter(`Aller-retour ordinateur ↔ carte sur ${temps.length} essais : médiane ${Math.round(temps[temps.length >> 1])} ms, pire ${Math.round(temps[temps.length - 1])} ms.`, 'ok');
  }

  // ---------- Branchements ----------
  function afficherCarte() {
    const c = carte();
    document.querySelectorAll('[data-carte]').forEach((e) => (e.hidden = e.dataset.carte !== c));
    const select = $('#programme');
    select.innerHTML = '';
    for (const [id, p] of Object.entries(PROGRAMMES)) {
      if (!id.startsWith(c === 'mcore' ? 'mbot' : c === 'microbit' ? 'microbit' : 'uno')) continue;
      select.add(new Option(p.nom, id));
    }
    majRapport();
  }

  global.definirFirmwares = (f) => (global.firmwares = f);
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input[name=carte]').forEach((r) => r.addEventListener('change', afficherCarte));
    afficherCarte();
    if (!navigator.serial) $('#sans-usb').hidden = false;
    const action = (sel, f) =>
      $(sel).addEventListener('click', async (e) => {
        const b = e.currentTarget;
        b.disabled = true;
        try {
          await f();
        } catch (err) {
          noter('Erreur inattendue : ' + err.message, 'ecart');
        } finally {
          b.disabled = false;
        }
      });
    action('#btn-choisir', async () => {
      await deconnecter();
      port = null;
      await choisirPort();
    });
    action('#btn-installer', installer);
    action('#btn-ping', ping);
    action('#btn-envoyer', envoyer);
    action('#btn-vider', vider);
    action('#btn-deconnecter', async () => {
      await deconnecter();
      noter('Port fermé : tu peux débrancher la carte.');
    });
    action('#btn-led-on', async () => {
      await direct('D 13 1', 'LED D13 allumée');
      demander('La LED « L » s’est-elle allumée tout de suite ?', true);
    });
    action('#btn-led-off', () => direct('D 13 0', 'LED D13 éteinte'));
    action('#btn-surveiller', async () => {
      const b = Number($('#broche-entree').value);
      await direct(`M ${b} P`, `D${b} en entrée avec résistance interne`);
      await direct(`W ${b}`, `Surveiller D${b}`);
      noter('Appuie plusieurs fois sur le bouton : chaque appui et chaque relâchement doivent s’afficher.');
      setTimeout(() => demander('Chaque appui sur le bouton s’est-il affiché ?', true), 8000);
    });
    action('#btn-lire', () => direct(`R ${Number($('#broche-entree').value)}`, `Lire D${$('#broche-entree').value}`));
    action('#btn-servo', async () => {
      await direct(`S ${Number($('#broche-servo').value)} ${Number($('#angle').value)}`, `Servo D${$('#broche-servo').value} à ${$('#angle').value}°`);
      demander('Le servo a-t-il tourné à l’angle demandé ?', true);
    });
    action('#btn-off', () => direct('OFF', 'Tout éteindre'));
    action('#btn-balayage', async () => {
      const b = Number($('#broche-servo').value);
      for (const angle of [0, 180, 90]) {
        await direct(`S ${b} ${angle}`, `Servo D${b} à ${angle}°`);
        await attendre(1200);
      }
      demander('Pendant le balayage, le servo a-t-il tourné (0°, puis 180°, puis 90°) ?', true);
    });
    action('#btn-silence', async () => {
      if (!signeDeVie) return noter('Le mode direct n’est pas en cours : allume d’abord la LED ou tourne le servo.', 'ecart');
      arreterDirect();
      noter('Signe de vie arrêté : ne touche à rien, la carte doit tout éteindre d’elle-même dans 3 s…');
      await attendre(4500);
      demander('Sans signe de vie, la carte a-t-elle tout éteint (LED, servo relâché) au bout de 3 s ?');
    });
    action('#btn-coupure', async () => {
      await deconnecter();
      demander('Après la coupure, le programme est-il reparti tout seul, sans rien renvoyer ?');
    });
    action('#btn-aller-retour', mesurerAllerRetour);
    action('#btn-mbot-ultrason', () => direct('X 1 2 3', 'Ultrasons (port 3), en cm'));
    action('#btn-mbot-ligne', () => direct('X 1 3 2', 'Suiveur de ligne (port 2) : 0 = noir/noir … 3 = blanc/blanc'));
    action('#btn-mbot-bouton', () => direct('X 1 4', 'Bouton de la carte (1 = appuyé)'));
    action('#btn-mbot-lumiere', () => direct('X 1 5', 'Capteur de lumière'));
    action('#btn-mbot-rouge', () => direct('X 1 6 0 60 0 0', 'LED RGB rouges'));
    action('#btn-mbot-moteurs', async () => {
      await direct('X 1 1 40 40', 'Moteurs à 40 % (avancer)');
      await attendre(700);
      await direct('X 1 1 0 0', 'Moteurs arrêtés');
    });
    action('#btn-mbot-bip', () => direct('T 8 880 200', 'Bip du buzzer (D8)'));
    action('#btn-mb-coeur', async () => {
      await direct('X 2 2 3', 'Cœur sur l’écran');
      demander('Le cœur s’est-il affiché tout de suite ?', true);
    });
    action('#btn-mb-effacer', () => direct('X 2 4', 'Effacer l’écran'));
    action('#btn-mb-a', () => direct('X 2 5', 'Bouton A (1 = appuyé)'));
    action('#btn-mb-accel', () => direct('X 2 7 1', 'Accélération sur x (mg)'));
    action('#btn-mb-temp', () => direct('X 2 8', 'Température (°C)'));
    action('#btn-mb-p1', async () => {
      await direct('M 1 P', 'P1 en entrée avec résistance interne');
      await direct('W 1', 'Surveiller P1');
      noter('Appuie plusieurs fois sur le bouton : chaque appui et chaque relâchement doivent s’afficher.');
      setTimeout(() => demander('Chaque appui sur le bouton de P1 s’est-il affiché ?', true), 8000);
    });
    action('#btn-mb-p0-on', () => direct('D 0 1', 'Broche P0 à HAUT'));
    action('#btn-mb-p0-off', () => direct('D 0 0', 'Broche P0 à BAS'));
    action('#btn-copier', async () => {
      majRapport();
      await navigator.clipboard.writeText($('#rapport').value).catch(() => $('#rapport').select());
      noter('Compte rendu copié.');
    });
    document.querySelectorAll('#poste, #remarques').forEach((e) => e.addEventListener('input', majRapport));
    majRapport();
  });
})(this);
