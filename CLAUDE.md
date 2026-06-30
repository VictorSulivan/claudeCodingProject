@AGENTS.md

# Règles de qualité — Highlands

## TypeScript

- `strict: true` est activé — **zéro `as any`** sauf l'exception documentée ci-dessous.
- Exception autorisée : `new PrismaClient({ adapter } as any)` dans les scripts prisma/ — uniquement là.
- Toujours importer les enums et types Prisma depuis `@/app/generated/prisma/client`. Ne jamais les redéfinir à la main.
- Après toute modification de `prisma/schema.prisma`, lancer `npm run generate` avant un `tsc --noEmit`.
- Typer explicitement les retours de fonction dès que ce n'est pas trivial. Pas de `any` implicite.

## Taille des fichiers et des fonctions

- **Composant server (RSC)** : max 150 lignes. Au-delà, extraire des sous-composants.
- **Composant client** : max 200 lignes. Au-delà, extraire des hooks ou des sous-composants dans `components/`.
- **Route API** : max 100 lignes. Si ça grandit, extraire une fonction métier dans `lib/`.
- **Fonction / handler** : max 30 lignes de corps. Pas plus de 3 niveaux d'imbrication.
- Un seul composant exporté par fichier dans `components/`.

## Découpage serveur / client

- Les Server Components (RSC) font deux choses : fetch Prisma + vérification de permission. Rien d'autre.
- Les Client Components (`"use client"`) gèrent l'état et les interactions. Ils ne font pas de fetch Prisma directement.
- **Ne jamais passer un objet Prisma brut à un Client Component.** Toujours sérialiser : `JSON.parse(JSON.stringify(obj))`.
- Les objets `Date` ne se sérialisent pas en JSON — les convertir en string ISO ou utiliser `formatParisDateTime()` avant de les passer.

## Routes API — pattern obligatoire

Ordre fixe dans chaque handler :

```
1. auth()            → 401 si absent
2. can(role, perm)   → 403 si refusé
3. findUnique/first  → 404 si introuvable
4. vérif propriété   → 403 si pas le bon user
5. logique métier
6. réponse JSON
```

- Retourner `{ error: string }` pour toutes les erreurs. Jamais de message interne (stack trace, message Prisma).
- Utiliser `parseParisDateTime()` de `lib/date-paris.ts` pour **tout** champ `datetime-local`. Jamais `new Date(string)` directement sur une entrée utilisateur.

## Permissions

- Vérifier les permissions dans la **route API**, pas uniquement dans l'UI.
- Ne jamais déduire la propriété d'un objet depuis un ID fourni par le client — toujours re-fetcher depuis la base.
- Utiliser `can(role, permission)` de `lib/permissions.ts`. Ne pas écrire `role === "MAIRE" || role === "ADMIN"` en dur.

## Dates

- Affichage côté **serveur** (RSC, Vercel = UTC) : toujours passer `timeZone: "Europe/Paris"` à `toLocaleDateString` / `toLocaleTimeString`.
- Affichage côté **client** : locale `"fr-FR"` suffit (le navigateur utilise le fuseau du user).
- Stockage : les dates viennent toutes de `parseParisDateTime()` — ne pas contourner.

## Base de données

- Pas de SQL brut sauf cas exceptionnel avec `prisma.$queryRaw`, à justifier en commentaire.
- Toujours inclure uniquement les champs nécessaires dans `select` / `include` — pas de `select: *` implicite.
- Ne pas appeler Prisma dans un composant client. Passer par une route API ou un RSC parent.

## Styles

- Tailwind uniquement. Pas de `style={{}}` sauf pour des valeurs dynamiques impossibles en Tailwind (ex: hauteur calculée en JS).
- Patterns à réutiliser systématiquement :
  - Card : `bg-white rounded-xl border border-slate-200 p-6`
  - Input : `w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`
  - Bouton primaire : `px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors`
- Ajouter `transition-colors` sur tous les éléments interactifs.

## Avant de livrer

Deux commandes, zéro erreur, zéro warning :

```bash
npx tsc --noEmit
npm run lint
```

Tester manuellement le flux complet de la feature : créer → lire → modifier → supprimer.
