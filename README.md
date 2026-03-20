# Next.js Auth + Roles + Permissions + i18n

Application Next.js 16 avec authentification, gestion des utilisateurs, gestion des roles/permissions, multi-entites et journalisation des actions.

## Fonctionnalites principales

- Authentification email/mot de passe avec `better-auth`
- Session enrichie avec roles, permissions et entites utilisateur
- Gestion des utilisateurs (creation, edition, activation/desactivation, verification email)
- Gestion des roles (CRUD + attribution de permissions)
- Gestion des entites (CRUD avec protection des entites seedees)
- Permissions applicatives (ex: `user_read`, `role_edit`, `entity_edit`, `log_read`)
- Journal d'audit des actions metier
- Interface multilingue (`fr`, `en`) via `next-intl`
- Reset de base via endpoint cron protege par secret

## Stack technique

- `next` 16 (App Router)
- `react` 19
- `typescript`
- `prisma` + PostgreSQL (`@prisma/adapter-pg`)
- `better-auth`
- `next-safe-action`
- `tailwindcss` + composants UI Radix/shadcn
- `next-intl`

## Prerequis

- Node.js 20+
- pnpm, npm, yarn ou bun (les scripts du projet sont definis dans `package.json`)
- PostgreSQL 16+ (local ou Docker)

## Installation rapide

1. Installer les dependances

```bash
pnpm install
```

2. Configurer l'environnement

```bash
cp .env.example .env
```

3. Demarrer PostgreSQL (option Docker)

```bash
pnpm docker:up
```

4. Generer Prisma et appliquer les migrations

```bash
pnpm prisma:generate
pnpm prisma:deploy
```

5. Seeder les donnees initiales

```bash
pnpm prisma:seed
```

6. Lancer l'application

```bash
pnpm dev
```

Application disponible sur [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Fichier de reference: `.env.example`.

Variables essentielles:

- `DATABASE_URL` ou `DATABASE_USER`/`DATABASE_PASSWORD`/`DATABASE_HOST`/`DATABASE_PORT`/`DATABASE_NAME`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `JWT_SECRET`
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_NAME_APP`

## Donnees seedees

Le seed Prisma cree:

- Les permissions de base (`user_*`, `role_*`, `log_read`)
- Le role `Super Admin`
- Deux entites (`Entity 1`, `Entity 2`)
- Un compte administrateur

Identifiants admin de demonstration (affiches aussi sur l'ecran de connexion):

- Email: `admin@admin.com`
- Mot de passe: `Admin0123456789!`

## Scripts utiles

- `pnpm dev`: lance le serveur de developpement
- `pnpm build`: build de production (avec `prisma generate`)
- `pnpm start`: lance l'app en production
- `pnpm test`: execute les tests unitaires/integration avec Vitest
- `pnpm test:watch`: lance Vitest en mode watch
- `pnpm test:coverage`: genere un rapport de couverture
- `pnpm prettier`: formatage du code
- `pnpm docker:up` / `pnpm docker:down`: gestion du conteneur PostgreSQL
- `pnpm prisma:generate`: genere le client Prisma
- `pnpm prisma:migrate`: cree une migration (mode dev)
- `pnpm prisma:deploy`: applique les migrations
- `pnpm prisma:seed`: execute le seed
- `pnpm prisma:reset`: reset de la base
- `pnpm prisma:studio`: ouvre Prisma Studio

## Routes principales

- Auth:
  - `GET|POST /api/auth/[...all]`
  - `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`
- Application:
  - `/administration/users`
  - `/administration/roles`
  - `/administration/entities`
  - `/administration/log`
- Cron:
  - `GET /api/cron/reset-database`
  - Header requis: `Authorization: Bearer <CRON_SECRET>`

## Permissions et navigation

La navigation est construite dynamiquement selon les permissions de session:

- `role_read` -> menu roles
- `user_read` -> menu utilisateurs
- `entity_read` -> menu entites
- `log_read` -> menu logs

Les permissions sont dedupliquees depuis les roles utilisateur au moment de la creation de session.

## Internationalisation

- Locales implementees: `fr`, `en`
- Messages dans `i18n/messages/fr.json` et `i18n/messages/en.json`
- Detection via cookie `NEXT_LOCALE`, puis fallback `accept-language`

## Journalisation (audit)

Le projet enregistre les actions metier (utilisateur, role, entite) dans la table `log` avec:

- type d'action (`LogType`)
- details JSON
- auteur (user)
- entite cible (optionnelle)
- date d'action

## Arborescence simplifiee

- `app/`: pages App Router et routes API
- `actions/`: server actions
- `services/`: logique metier
- `lib/`: auth, prisma, utilitaires
- `components/`: UI et ecrans de gestion
- `prisma/`: schema, migrations, seed
- `i18n/`: config et messages de traduction

## Verification rapide apres installation

1. Connexion avec le compte admin seed
2. Acces aux ecrans `/administration/users`, `/administration/roles`, `/administration/log`
3. Creation d'un role puis attribution de permissions
4. Creation d'un utilisateur et envoi d'invitation (si SMTP configure)

## Tests automatises

- Framework: `Vitest` + `@testing-library/react` (`jsdom`)
- Fichier de configuration: `vitest.config.ts`
- Setup global: `vitest.setup.ts`
- Exemple de test composant: `components/card/sign-in.test.tsx`

Execution:

```bash
pnpm test
```

## Remarques

- L'endpoint cron de reset est utile uniquement pour une instance de test/démo.
- En production, definir des secrets robustes pour `BETTER_AUTH_SECRET` et `JWT_SECRET`.
- Pour l'envoi d'emails, configurer les variables SMTP (`MAIL_*`).
- Le compte et le role `Super Admin` sont proteges contre les modification (services).
