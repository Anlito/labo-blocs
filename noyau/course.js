// Moteur du mini-championnat de la course aux portes (site/course.html), utilisable dans le navigateur et dans Node.
// Sur le modèle de la course des voitures à ballon (SEGPA) : personne n'est éliminé, chaque équipe court au moins deux
// fois (des manches de qualification, puis des finales par niveau : principale, secondaire…).
//
// Une course aux portes : le mBot part du départ, passe toutes les portes dans l'ordre et va à l'arrivée.
//   Essai : { temps (s, chrono), portes (portes passées), touches (malus : porte touchée, robot replacé…) }
//   Arrivé = toutes les portes passées et la ligne d'arrivée franchie (arrive: true).
//   Classement d'un essai : les arrivés d'abord, au temps total (temps + touches × malus) ; puis les autres, au nombre
//   de portes passées, puis au temps total. Les égalités gardent la même place.
// Un départ : 1 à 3 équipes en même temps (une par piste). Les équipes d'un même départ ne se gênent pas : chacune a sa
// piste ; le classement se fait sur le résultat, pas sur l'ordre d'arrivée.
(function (global) {
  'use strict';

  const REGLAGES = { portes: 6, pistes: 1, malus: 5, tempsMax: 180, manches: 2, finales: true, tailleFinale: 4, minutesParDepart: 2 };
  const NOMS_FINALES = ['Finale principale', 'Finale secondaire', 'Finale tertiaire'];
  const nomFinale = (i, n) => (n === 1 ? 'Finale' : NOMS_FINALES[i] || `Finale ${i + 1}`);

  const reglagesDe = (r) => Object.assign({}, REGLAGES, r || {});

  // Découpe une liste en n groupes dans l'ordre, les premiers un peu plus grands (7 en 3 → 3, 2, 2).
  function decouper(liste, n) {
    const groupes = [];
    let debut = 0;
    for (let i = 0; i < n; i++) {
      const taille = Math.floor(liste.length / n) + (i < liste.length % n ? 1 : 0);
      groupes.push(liste.slice(debut, debut + taille));
      debut += taille;
    }
    return groupes.filter((g) => g.length);
  }
  // Groupes d'au plus « taille » éléments, de tailles voisines.
  const parGroupes = (liste, taille) => decouper(liste, Math.max(1, Math.ceil(liste.length / Math.max(1, taille | 0))));

  // ---------- Un essai ----------

  const arrive = (e) => !!(e && e.arrive);
  const tempsTotal = (e, r) => Math.round(((Number(e.temps) || 0) + (Number(e.touches) || 0) * reglagesDe(r).malus) * 10) / 10;

  // < 0 si a est meilleur que b, 0 si égalité.
  function comparer(a, b, r) {
    if (!a || !b) return a ? -1 : b ? 1 : 0;
    if (arrive(a) !== arrive(b)) return arrive(a) ? -1 : 1;
    if (!arrive(a) && (b.portes || 0) !== (a.portes || 0)) return (b.portes || 0) - (a.portes || 0);
    return tempsTotal(a, r) - tempsTotal(b, r);
  }

  // Rangs avec égalités : [{ equipe, essai, rang }] triés.
  function classer(lignes, r) {
    const tries = lignes.slice().sort((x, y) => comparer(x.essai, y.essai, r));
    tries.forEach((l, i) => (l.rang = i > 0 && comparer(l.essai, tries[i - 1].essai, r) === 0 ? tries[i - 1].rang : i + 1));
    return tries;
  }

  // ---------- Le programme des départs ----------

  // Manches de qualification : à chaque manche, chaque équipe court une fois. L'ordre tourne d'une manche à l'autre
  // pour que les équipes ne partent pas toujours avec les mêmes voisines ni en premier.
  function departsQualifications(ids, r) {
    const R = reglagesDe(r);
    const departs = [];
    const n = ids.length;
    const pas = Math.max(1, Math.round(n / Math.max(1, R.manches)));
    for (let m = 0; m < R.manches; m++) {
      const decal = (m * pas) % Math.max(1, n);
      const ordre = ids.slice(decal).concat(ids.slice(0, decal));
      parGroupes(ordre, R.pistes).forEach((g, i) =>
        departs.push({ id: `q${m + 1}-${i + 1}`, phase: 'qualif', manche: m + 1, nom: `Manche ${m + 1} · départ ${i + 1}`, equipes: g, resultats: {} })
      );
    }
    return departs;
  }

  function creerCourse(equipes, reglages) {
    const R = reglagesDe(reglages);
    const liste = equipes.map((e, i) => (typeof e === 'string' ? { id: 'e' + (i + 1), nom: e } : e)).filter((e) => e && e.nom);
    return { format: 'labo-blocs/course-portes', version: 1, reglages: R, equipes: liste, departs: departsQualifications(liste.map((e) => e.id), R), finales: [] };
  }

  const departFini = (d) => d.equipes.length > 0 && d.equipes.every((id) => d.resultats[id]);
  const qualifications = (etat) => etat.departs.filter((d) => d.phase === 'qualif');
  const qualifsFinies = (etat) => qualifications(etat).every(departFini);
  const finalesFinies = (etat) => etat.finales.length > 0 && etat.departs.filter((d) => d.phase === 'finale').every(departFini);
  const prochainDepart = (etat) => etat.departs.find((d) => !departFini(d)) || null;

  // Classement des qualifications : le meilleur essai de chaque équipe.
  function classementQualifications(etat) {
    const lignes = etat.equipes.map((e) => {
      const essais = qualifications(etat).map((d) => d.resultats[e.id]).filter(Boolean);
      const meilleur = essais.slice().sort((a, b) => comparer(a, b, etat.reglages))[0] || null;
      return { equipe: e.id, essai: meilleur, essais: essais.length };
    });
    return classer(lignes, etat.reglages);
  }

  // Finales par niveau : les meilleures en finale principale. Elles se courent de la dernière à la principale.
  function composerFinales(etat) {
    const R = etat.reglages;
    const ordre = classementQualifications(etat).map((l) => l.equipe);
    const groupes = parGroupes(ordre, R.tailleFinale);
    etat.finales = groupes.map((g, i) => ({ id: 'f' + (i + 1), nom: nomFinale(i, groupes.length), equipes: g }));
    etat.departs = etat.departs.filter((d) => d.phase !== 'finale');
    for (const f of etat.finales.slice().reverse()) {
      parGroupes(f.equipes, R.pistes).forEach((g, i, tous) =>
        etat.departs.push({ id: `${f.id}-${i + 1}`, phase: 'finale', finale: f.id, nom: tous.length > 1 ? `${f.nom} · départ ${i + 1}` : f.nom, equipes: g, resultats: {} })
      );
    }
    return etat.finales;
  }

  // Classement d'une finale : l'essai couru en finale.
  function classementFinale(etat, idFinale) {
    const f = etat.finales.find((x) => x.id === idFinale);
    if (!f) return [];
    const essai = (id) => {
      const d = etat.departs.find((x) => x.finale === idFinale && x.equipes.includes(id));
      return d ? d.resultats[id] || null : null;
    };
    return classer(f.equipes.map((id) => ({ equipe: id, essai: essai(id) })), etat.reglages);
  }

  // Classement général : sans finales, celui des qualifications ; avec, finale principale d'abord, puis la suivante…
  function classementGeneral(etat) {
    if (!etat.reglages.finales || !etat.finales.length) return classementQualifications(etat);
    const tous = [];
    for (const f of etat.finales) {
      const base = tous.length;
      for (const l of classementFinale(etat, f.id)) tous.push(Object.assign({}, l, { rang: base + l.rang, finale: f.nom }));
    }
    return tous;
  }

  // Le meilleur temps total d'un mBot arrivé, sur toute la course : { equipe, temps, depart } ou null.
  function record(etat) {
    let r = null;
    for (const d of etat.departs)
      for (const id of d.equipes) {
        const e = d.resultats[id];
        if (arrive(e) && (!r || tempsTotal(e, etat.reglages) < r.temps)) r = { equipe: id, temps: tempsTotal(e, etat.reglages), depart: d.nom };
      }
    return r;
  }

  // ---------- Selon le nombre d'équipes ----------

  function nombreDeparts(nbEquipes, r) {
    const R = reglagesDe(r);
    const parManche = Math.ceil(nbEquipes / Math.max(1, R.pistes));
    const finales = R.finales ? parGroupes(Array.from({ length: nbEquipes }), R.tailleFinale).reduce((s, g) => s + Math.ceil(g.length / Math.max(1, R.pistes)), 0) : 0;
    return parManche * R.manches + finales;
  }
  const dureeEstimee = (nbEquipes, r) => nombreDeparts(nbEquipes, r) * reglagesDe(r).minutesParDepart;

  // Le format proposé pour tenir dans le temps de course : le plus de manches possible (3 au plus, une par rôle),
  // avec des finales dès 3 équipes ; sinon deux manches, puis une seule, sans finales.
  function proposerFormat(nbEquipes, minutes, r) {
    const R = reglagesDe(r);
    const essais = [];
    for (const manches of [3, 2, 1]) essais.push({ manches, finales: nbEquipes >= 3 });
    essais.push({ manches: 2, finales: false }, { manches: 1, finales: false });
    for (const f of essais) {
      const avec = Object.assign({}, R, f);
      if (dureeEstimee(nbEquipes, avec) <= minutes) return f;
    }
    return { manches: 1, finales: false };
  }

  // ---------- Textes et export ----------

  const nombre = (n) => String(n).replace('.', ',');
  const ordinal = (n) => (n === 1 ? '1re' : n + 'e');

  function texteEssai(e, r) {
    if (!e) return '—';
    const R = reglagesDe(r);
    const malus = e.touches ? ` (dont ${e.touches} malus)` : '';
    return arrive(e) ? `${nombre(tempsTotal(e, R))} s${malus}` : `${e.portes || 0} porte${(e.portes || 0) > 1 ? 's' : ''} sur ${R.portes}`;
  }

  function lignesCsv(etat, nomDe) {
    const nom = nomDe || ((id) => (etat.equipes.find((e) => e.id === id) || { nom: id }).nom);
    const lignes = [['Départ', 'Piste', 'Équipe', 'Arrivé', 'Portes', 'Temps (s)', 'Malus', 'Temps total (s)']];
    for (const d of etat.departs)
      d.equipes.forEach((id, i) => {
        const e = d.resultats[id];
        lignes.push([d.nom, i + 1, nom(id), e ? (arrive(e) ? 'oui' : 'non') : '', e ? e.portes || 0 : '', e ? nombre(e.temps || 0) : '', e ? e.touches || 0 : '', e ? nombre(tempsTotal(e, etat.reglages)) : '']);
      });
    lignes.push([]);
    lignes.push(['Classement général', '', 'Équipe', 'Résultat']);
    for (const l of classementGeneral(etat)) lignes.push([ordinal(l.rang), '', nom(l.equipe), texteEssai(l.essai, etat.reglages)]);
    return lignes;
  }
  const csv = (lignes) => '﻿' + lignes.map((l) => l.map((c) => (/[;"\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : c)).join(';')).join('\r\n');

  const API = {
    REGLAGES,
    reglagesDe,
    decouper,
    parGroupes,
    arrive,
    tempsTotal,
    comparer,
    classer,
    departsQualifications,
    creerCourse,
    departFini,
    qualifsFinies,
    finalesFinies,
    prochainDepart,
    classementQualifications,
    composerFinales,
    classementFinale,
    classementGeneral,
    record,
    nombreDeparts,
    dureeEstimee,
    proposerFormat,
    texteEssai,
    ordinal,
    nombre,
    lignesCsv,
    csv,
  };
  if (typeof module === 'object' && module.exports) module.exports = API;
  else global.LaboCourse = API;
})(typeof window !== 'undefined' ? window : globalThis);
