# Consignes pour Claude Code — Labo Blocs

## À lire avant de travailler
1. `docs/BRIEF-CLAUDE-CODE-labo-blocs.md` — contraintes non négociables, décisions, jalons.
2. `docs/PLAN.md` — plan validé : arborescence, formats, découpage.
3. `docs/BRIEF-CLAUDE-DESIGN-labo-blocs.md` et la maquette https://claude.ai/artifact/NUiEuKMzsMxzubE188MAoH
4. `docs/CAHIER-DES-CHARGES-outil-blocs.md` (v5) quand il est présent : §4.10, §6, §10 (R1–R8).

## Règles
- Tout en **français** : interface, messages, commentaires, noms de fichiers et de fonctions (comme l'atelier).
- Le site doit marcher en **`file://`** : scripts classiques (pas de modules ES au chargement), données en
  `definirXxx({...})`, aucune ressource en ligne, Blockly copié dans le dépôt.
- Aucun compte, aucune donnée envoyée ailleurs. Sauvegarde = un `.json` par équipe, rubrique `programmation`
  versionnée, jamais d'écrasement, anciennes sauvegardes lisibles.
- Messages : décrire ce que le programme fait, jamais « tu as faux » ; un seul écart ; écart en **ambre**, jamais en
  rouge ; erreurs USB en français avec la prochaine action. Jamais la couleur seule ; texte ≥ 13 px.
- Les blocs de la palette ne donnent jamais la réponse (broche par défaut D2). Un bloc ne dépend jamais d'un projet.
- Ne rien supposer sur le matériel : demander à Thomas.
- Tests `node:test` du moteur à chaque jalon ; recette manuelle dans `RECETTE.md`.
- S'arrêter après chaque jalon pour une recette avec Thomas.
