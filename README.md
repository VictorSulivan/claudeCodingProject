# Highlands — Plateforme de gestion événementielle

Application de gestion d'événements, d'équipes et de ressources pour la structure Highlands (Mairie + prestataires + associations).

## Ce que fait l'application

- **Calendrier global** : visualisation de tous les événements publics
- **Agenda personnel** : chaque membre gère ses créneaux et ses participations
- **Gestion d'événements** : création, partage ciblé par utilisateur, gestion des ressources associées
- **Tâches Kanban** : suivi des tâches liées aux événements (TODO / IN_PROGRESS / DONE / CANCELLED)
- **Ressources** : suivi des besoins matériels (quantité requise vs approvisionné, qui apporte quoi)
- **Contrats** : rédaction et workflow de validation des contrats employés et contractants (PDF)
- **Administration** : gestion des utilisateurs et des rôles (ADMIN / MAIRE / ADJOINTE / EMPLOYEE / CONTRACTANT)

## Stack

- **Next.js 16** (App Router, React 19)
- **TypeScript** (strict mode)
- **Prisma 7** + **Neon PostgreSQL**
- **Auth.js v5** (authentification par credentials)
- **Tailwind CSS v4**

## Lancer le projet

```bash
# Installation
npm install

# Variables d'environnement (copier et remplir)
cp .env.example .env

# Générer le client Prisma
npm run generate

# Démarrer en développement
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

## Variables d'environnement requises

```env
DATABASE_URL=          # URL Neon PostgreSQL (pooled)
DATABASE_URL_UNPOOLED= # URL directe pour les migrations Prisma
AUTH_SECRET=           # Secret Auth.js (générer avec: openssl rand -base64 32)
```

## Scripts utiles

```bash
npm run dev          # Serveur de développement
npm run build        # Build production
npm run lint         # ESLint
npx tsc --noEmit     # Vérification TypeScript
npm run validate     # Validation des patterns API (CLAUDE.md)
npm run seed         # Données de test
```

## Architecture

```
app/
  (auth)/          # Pages login
  (dashboard)/     # Pages protégées (dashboard)
  api/             # Routes API REST
  generated/       # Client Prisma (auto-généré)
components/        # Composants React réutilisables
lib/               # Logique métier partagée
  auth.ts          # Configuration Auth.js
  permissions.ts   # Système RBAC can(role, perm)
  date-paris.ts    # Utilitaires dates (fuseau Europe/Paris)
  prisma.ts        # Client Prisma (adapter Neon)
prisma/
  schema.prisma    # Schéma de base de données
  seed.ts          # Données de démonstration
scripts/
  validate-api.ts  # Script déterministe de validation des routes API
.claude/
  skills/
    new-module.md  # Skill : ajouter un module Highlands
    quality.md     # Skill : quality gates avant livraison
```

## Ce que j'ai appris

- L'IA génère du code qui compile mais ne respecte pas forcément les invariants métier (permissions, patterns d'API). Un script déterministe comme `validate-api.ts` attrape ces violations systématiquement, là où un prompt "vérifie si mon code est correct" donne des réponses différentes à chaque fois.
- Le découpage RSC / Client Component doit être décidé dès le départ, pas refactorisé après. Les bugs de sérialisation Prisma → Date → JSON se retrouvent partout si on ne pose pas la règle tôt.
- Un `CLAUDE.md` avec des règles concrètes et vérifiables (longueur de fichier, pattern d'ordre des handlers) est plus efficace qu'un `CLAUDE.md` avec des principes généraux.
