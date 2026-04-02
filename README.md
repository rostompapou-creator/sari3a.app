# Sari3a Delivery

Plateforme Next.js + React pour la Tunisie avec:

- splash screen bleu marine / or
- 4 portails: client, livreur, partenaire, admin
- suivi GPS Leaflet des colis et livreurs
- CRUD colis et utilisateurs
- timeline complete du retrait partenaire a la livraison finale
- base `libSQL` compatible Vercel

## Base de donnees

Le projet utilise maintenant `libSQL`:

- en local: fichier `data/sari3a.sqlite`
- sur Vercel: base distante `Turso/libSQL`

Le meme code fonctionne dans les deux cas.

## Lancement local

1. Creer un fichier `.env.local` a partir de `.env.example`
2. Laisser par exemple:

```env
LIBSQL_URL=file:./data/sari3a.sqlite
LIBSQL_AUTH_TOKEN=
SARI3A_ENABLE_DEMO_DATA=true
```

3. Installer et lancer:

```bash
npm install
npm run build
npm run start
```

Ouvrir ensuite:

```text
http://localhost:3000
```

## Publication propre sans donnees de test

Variables importantes:

- `LIBSQL_URL`
- `LIBSQL_AUTH_TOKEN`
- `SARI3A_SESSION_SECRET`
- `SARI3A_ENABLE_DEMO_DATA=false`
- `SARI3A_FORCE_ADMIN_SYNC=false`
- `SARI3A_INITIAL_ADMIN_EMAIL`
- `SARI3A_INITIAL_ADMIN_PASSWORD`
- `SARI3A_DRIVER_ONBOARDING_PASSWORD`
- `SARI3A_PARTNER_ONBOARDING_PASSWORD`

Exemple minimal:

```env
LIBSQL_URL=libsql://your-db-name.turso.io
LIBSQL_AUTH_TOKEN=your-token
SARI3A_SESSION_SECRET=un-secret-fort
SARI3A_ENABLE_DEMO_DATA=false
SARI3A_FORCE_ADMIN_SYNC=false
SARI3A_INITIAL_ADMIN_EMAIL=admin@votre-domaine.tn
SARI3A_INITIAL_ADMIN_PASSWORD=un-mot-de-passe-fort
SARI3A_DRIVER_ONBOARDING_PASSWORD=un-mot-de-passe-livreur
SARI3A_PARTNER_ONBOARDING_PASSWORD=un-mot-de-passe-partenaire
```

## Supprimer les donnees de test locales

Pour repartir d'une base locale propre:

```bash
npm run reset:db
```

Puis relancer l'application:

```bash
npm run start
```

Si `SARI3A_ENABLE_DEMO_DATA=false`, la base sera recreee sans colis ni comptes de demonstration.
Seul l'admin initial sera cree a partir des variables d'environnement.

## Publication sur Vercel

### Etapes conseillees

1. Creer une base Turso/libSQL.
2. Recuperer:
   - `LIBSQL_URL`
   - `LIBSQL_AUTH_TOKEN`
3. Dans Vercel, ajouter les variables d'environnement de `.env.example`.
4. Mettre `SARI3A_ENABLE_DEMO_DATA=false`.
5. Definir l'admin initial:
   - `SARI3A_INITIAL_ADMIN_EMAIL`
   - `SARI3A_INITIAL_ADMIN_PASSWORD`
6. Si un ancien admin existe deja dans la base distante et que vous voulez l'ecraser au prochain deploiement:
   - mettre `SARI3A_FORCE_ADMIN_SYNC=true`
   - redeployer
   - tester la connexion admin
   - remettre ensuite `SARI3A_FORCE_ADMIN_SYNC=false`
7. Deployer le projet sur Vercel.

### Resultat

Au premier lancement en production:

- les tables sont creees automatiquement
- aucun jeu de donnees de demonstration n'est insere
- l'admin initial est cree automatiquement

## Base locale

- Base locale `libSQL`: `data/sari3a.sqlite`
