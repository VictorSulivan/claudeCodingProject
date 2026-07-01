# Skill : Quality gates

Skill transverse — utilisable sur n'importe quel projet Next.js/TypeScript.

Lance les vérifications qualité et corrige les erreurs avant de livrer.

## Étapes

### 1. TypeScript — zéro erreur

```bash
npx tsc --noEmit
```

- Lire chaque erreur
- Corriger une par une sans utiliser `as any` (sauf l'exception documentée dans CLAUDE.md)
- Relancer jusqu'à zéro erreur

### 2. Lint — zéro warning

```bash
npm run lint
```

- Corriger chaque avertissement
- Ne pas désactiver les règles eslint sans justification

### 3. Validation API (spécifique Highlands)

```bash
npx tsx scripts/validate-api.ts
```

- Corrige chaque violation signalée
- Ce script vérifie les patterns de CLAUDE.md que TypeScript ne vérifie pas

### 4. Test manuel du flux complet

Pour chaque fonctionnalité modifiée :
- Créer → Lire → Modifier → Supprimer
- Vérifier les cas limites : champ vide, mauvaise saisie, permission refusée
- Vérifier les messages d'erreur côté UI

## Critère de succès

Toutes les commandes passent. Chaque modification a été testée manuellement.

## Notes

Ce skill ne remplace pas les tests automatisés — il vérifie les invariants structurels
du projet (types, lint, patterns de sécurité) que les tests ne couvrent pas.
