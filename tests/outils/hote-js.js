// Le simulateur JS (noyau/vm.js) dans la même boucle en temps virtuel que l'interpréteur C sur l'ordinateur
// (essais/vm/hote.c) : même entrée, même sortie texte, pour comparer les deux mot pour mot.
const { creerVM } = require('../../noyau/vm.js');

function executerTexte(octets, dureeMs, entrees, graine) {
  let maintenant = 0;
  let sortie = '';
  const sorties = {};
  const etat = {};
  let g = BigInt(graine || 12345);
  const fmt = (v) => (Number.isInteger(v) ? String(v) : String(Number(v.toPrecision(6))));
  const changer = (b, v, genre) => {
    if ((sorties[b] || 0) !== v) {
      sorties[b] = v;
      sortie += `${maintenant} ${b} ${fmt(v)} ${genre}\n`;
    }
  };
  const vm = creerVM({
    configurer() {},
    ecrireNum: (b, v) => changer(b, v, 'led'),
    ecrireAna: (b, v) => changer(b, v, 'pwm'),
    servo: (b, a) => changer(b, a, 'servo'),
    son: (b, f, ms) => (sortie += `${maintenant} ${b} ${f} son ${ms}\n`),
    silence: (b) => (sortie += `${maintenant} ${b} 0 son 0\n`),
    lireNum: (b) => etat[b] || 0,
    lireAna: (b) => etat[b] || 0,
    hasard(min, max) {
      g = (g * 1103515245n + 12345n) & 0xffffffffffffffffn; // comme « unsigned long » en C (64 bits)
      return min + Number((g >> 8n) % BigInt(max - min + 1));
    },
    ext(e, c, args) {
      sortie += `${maintenant} ext ${e} ${c}${args.map((a) => ' ' + fmt(a)).join('')}\n`;
      return 0;
    },
  });
  const liste = (entrees || []).slice().sort((a, b) => a.t - b.t || (a.apres ? 1 : 0) - (b.apres ? 1 : 0)).map((e) => ({ t: Math.round(e.t), broche: e.broche, valeur: e.valeur ? 1 : 0, apres: !!e.apres }));
  const e = vm.charger(octets);
  if (e) return `erreur ${e} 0\n`;
  vm.demarrer(0);
  let i = 0;
  const fin = Math.round(dureeMs);
  for (;;) {
    const t = maintenant;
    while (i < liste.length && liste[i].t <= t && !(liste[i].t === t && liste[i].apres)) etat[liste[i].broche] = liste[i++].valeur;
    const prochain = vm.avancer(t);
    while (i < liste.length && liste[i].t <= t) etat[liste[i].broche] = liste[i++].valeur;
    if (vm.erreur) return sortie + `erreur ${vm.erreur} ${t}\n`;
    if (t >= fin) break;
    let suivant = Math.min(prochain, fin);
    if (i < liste.length && liste[i].t < suivant) suivant = liste[i].t;
    if (suivant <= t) suivant = t + 1;
    maintenant = suivant;
  }
  return sortie + `fin ${maintenant}\n`;
}

module.exports = { executerTexte };
