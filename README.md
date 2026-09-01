# GestaShop.sn

Plateforme de gestion de stock et de caisse pour les commerces sénégalais — boutiques, supérettes, quincailleries, magasins de mode, grossistes, restaurants, etc.

> « Votre caisse. Votre stock. Votre argent. Un seul outil. »

Ceci est une application **complète et fonctionnelle** (pas une maquette) : base de données réelle, comptes utilisateurs avec mots de passe, logique métier réelle (ventes, stock, trésorerie, dettes clients/fournisseurs). Elle est prête à être testée immédiatement et peut servir de base pour un déploiement en production.

## Fonctionnalités incluses

- **Tableau de bord** : CA du jour, marge brute, valeur du stock, trésorerie consolidée, évolution des ventes (7 jours), alertes de stock, top produits, paiements du jour, dernières ventes.
- **Caisse (POS)** : recherche produit, panier, remises, paiement multiple (Espèces, Wave, Orange Money, Carte, Crédit client), paiement mixte, ticket de vente, décrément automatique du stock.
- **Stock** : fiches produits complètes (SKU, code-barres, catégorie, prix d'achat/vente, marge, stock min), mouvements de stock (achat, retour, inventaire, perte, casse, consommation), alertes automatiques (stock critique/faible).
- **Achats & fournisseurs** : bons de commande → réception → paiement, historique par fournisseur.
- **Clients & carnet de dettes** : fiche client, historique d'achats, dettes, limite de crédit, enregistrement de paiement, relance WhatsApp en un clic.
- **Trésorerie** : comptes Caisse / Wave / Orange Money / Banque, recettes et dépenses manuelles, résultat estimé (CA − coût marchandises − dépenses).
- **Rapports** : top produits, produits à faible rotation/marge, stock dormant, CA par vendeur, panier moyen — filtrable par jour/semaine/mois/trimestre/année.
- **Multi-boutiques** : dashboard consolidé, transfert de stock entre boutiques avec traçabilité.
- **Employés** : rôles (Propriétaire, Manager, Caissier, Magasinier) avec permissions différenciées, journal d'audit de toutes les actions sensibles.
- **Authentification réelle** : sessions signées (JWT en cookie httpOnly), mots de passe hashés (bcrypt).
- **PWA de base** : manifest + icônes installables sur mobile.

## Stack technique

- **Framework** : Next.js 16 (App Router, Server Actions, Turbopack)
- **UI** : React 19, Tailwind CSS 4, Recharts, Lucide Icons
- **Base de données** : SQLite (fichier local, via `better-sqlite3`) — voir la section Déploiement pour la production
- **Auth** : sessions JWT (bibliothèque `jose`) + `bcryptjs` pour les mots de passe

Aucun ORM externe n'est utilisé : le schéma SQL est dans `src/lib/schema.sql` et les accès aux données sont regroupés dans `src/lib/repositories/*.ts` (une fonction = une opération métier). C'est un choix délibéré pour rester simple, rapide et sans dépendance à un service externe.

## Démarrage rapide

```bash
npm install
npm run seed     # crée la base de données et les données de démonstration
npm run dev      # démarre le serveur de développement sur http://localhost:3000
```

Ouvrez [http://localhost:3000](http://localhost:3000) — vous serez redirigé vers la page de connexion.

### Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Propriétaire | yade@gestashop.sn | demo1234 |
| Manager | fatou@gestashop.sn | demo1234 |
| Caissier | moussa@gestashop.sn | demo1234 |
| Magasinier | ibou@gestashop.sn | demo1234 |

Le script de seed crée une boutique principale (Dakar) avec 15 produits, 5 clients, 3 fournisseurs, plusieurs commandes fournisseurs, 14 jours d'historique de ventes réalistes, et une deuxième boutique (Thiès) pour tester le multi-boutiques.

Pour repartir de zéro à tout moment : `npm run seed` (cela réinitialise complètement la base).

## Build de production

```bash
npm run build
npm run start
```

## Structure du projet

```
src/
  app/
    login/                  Page de connexion + action serveur
    (app)/                  Toutes les pages authentifiées (sidebar + garde de rôle)
      dashboard/
      caisse/
      stock/
      achats/
      clients/
      tresorerie/
      rapports/
      boutiques/
      employes/
      parametres/
    proxy.ts                Garde d'authentification (ex-"middleware", renommé en Next 16)
  components/                Composants partagés (Sidebar, StatCard, graphiques...)
  lib/
    schema.sql               Schéma complet de la base (14 tables)
    db.ts                    Connexion SQLite (singleton)
    repositories/            Toute la logique métier, une fonction = une opération
    session.ts, auth.ts, guard.ts   Authentification et permissions
scripts/
  seed.ts                     Génère des données de démonstration réalistes
```

Chaque module (`caisse`, `stock`, `achats`, etc.) suit le même schéma : `page.tsx` (Server Component qui charge les données), `actions.ts` (Server Actions qui valident la session et exécutent les mutations), et un composant client (`*Client.tsx`) pour l'interactivité.

## Rôles et permissions

| Rôle | Accès |
|---|---|
| Propriétaire | Tout, y compris employés, boutiques et paramètres |
| Manager | Tableau de bord, caisse, stock, achats, clients, rapports |
| Caissier | Caisse, clients |
| Magasinier | Stock, achats |

## Déploiement en production — points d'attention

Cette base utilise SQLite (`better-sqlite3`) avec un fichier local (`data/gestashop.db`). C'est idéal pour développer et démontrer rapidement, mais **une plateforme serverless à disque éphémère (Vercel Functions, par exemple) ne convient pas** : le fichier serait perdu à chaque redéploiement/réveil de fonction.

Deux options pour la production :

1. **Le plus simple** : déployer sur une plateforme avec disque persistant (Fly.io, Railway, Render, un VPS classique avec `pm2` + Nginx). Le fichier SQLite suffit largement jusqu'à plusieurs dizaines de transactions/minute.
2. **Le plus robuste à terme** : remplacer `better-sqlite3` par un client PostgreSQL (`pg` ou Neon/Supabase). Le schéma SQL dans `src/lib/schema.sql` est déjà écrit en SQL standard et se porte facilement ; il faudrait adapter `src/lib/db.ts` et les appels `db.prepare(...).run/get/all` (la syntaxe change légèrement).

Autres points avant une mise en production réelle :

- **Paiements mobiles** : Wave et Orange Money sont actuellement enregistrés comme *méthodes de paiement* dans la caisse (l'argent est supposé déjà reçu). Une vraie intégration passerait par leurs API de paiement marchand (webhooks de confirmation).
- **Mode hors-ligne** : mentionné dans le cahier des charges initial comme fonctionnalité clé pour le Sénégal. La version actuelle nécessite une connexion active. Une PWA avec IndexedDB + synchronisation différée est un chantier à part entière.
- **Boutique en ligne / IA (JAAY AI)** : identifiées comme fonctionnalités de phase 2 dans le concept d'origine, non implémentées ici.
- **Secret de session** : `SESSION_SECRET` dans `.env` doit être remplacé par une valeur unique et confidentielle en production.

## Notes de conception

Le concept d'origine proposait le nom « JAAY ». Comme votre identité visuelle (logo, icône d'application) est déjà construite autour de **GestaShop.sn**, c'est ce nom qui a été utilisé dans toute l'application.
