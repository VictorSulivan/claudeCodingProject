# Skill : Ajout d'un nouveau module Highlands

Utilise ce skill quand on ajoute une nouvelle fonctionnalité/entité à la plateforme Highlands.

## Ce que fait ce skill

Guide l'ajout complet d'un module métier en respectant toutes les règles de CLAUDE.md.

## Étapes obligatoires (dans cet ordre)

### 1. Schéma Prisma
- Identifier les modèles nécessaires
- Les ajouter dans `prisma/schema.prisma`
- Lancer `npm run generate` avant tout autre fichier TypeScript

### 2. Route API (`app/api/<nom>/route.ts`)
Respecter le pattern obligatoire dans cet ordre exact :
```
1. auth()         → 401 si absent
2. can(role, perm) → 403 si refusé
3. findUnique/first → 404 si introuvable
4. vérif propriété → 403 si pas le bon user
5. logique métier
6. réponse JSON
```
- Retourner `{ error: string }` pour toutes les erreurs
- Utiliser `parseParisDateTime()` de `lib/date-paris.ts` pour tout champ date
- Utiliser `can(role, perm)` de `lib/permissions.ts` — jamais de `role === "MAIRE"` en dur
- Max 100 lignes par fichier de route

### 3. Server Component RSC (`app/(dashboard)/dashboard/<nom>/page.tsx`)
- Deux responsabilités seulement : fetch Prisma + vérification de permission
- Sérialiser avant de passer au client : `JSON.parse(JSON.stringify(obj))`
- Convertir les `Date` en string ISO avant de passer au client
- Max 150 lignes

### 4. Composants client (`components/<nom>/`)
- Un seul composant exporté par fichier
- Gérer l'état et les interactions, pas le fetch Prisma
- Max 200 lignes par composant client
- Utiliser les patterns Tailwind définis dans CLAUDE.md

### 5. Navigation
- Ajouter le lien dans le layout dashboard si pertinent

### 6. Vérification finale
Lancer dans cet ordre, zéro erreur autorisée :
```bash
npx tsc --noEmit
npm run lint
npx tsx scripts/validate-api.ts
```

## Pièges à éviter

- Ne jamais passer un objet Prisma brut à un Client Component
- Ne jamais faire `new Date(body.xxx)` — toujours `parseParisDateTime(body.xxx)`
- Ne jamais vérifier les permissions côté UI seulement
- Ne jamais récupérer un ID depuis le client pour déduire la propriété — toujours re-fetcher depuis la DB
