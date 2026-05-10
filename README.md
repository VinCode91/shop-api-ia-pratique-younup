# shop-api

Codebase fil rouge du module pratique "Développeur Augmenté — GitHub Copilot".

API REST e-commerce fictive construite avec NestJS + Prisma. Contient intentionnellement de la dette technique pour les exercices de legacy comprehension et de review augmentée.

## Prérequis

- Node.js 20+
- GitHub Copilot Free activé sur votre compte GitHub

## Installation

```bash
npm install

# Configurer la base de données
cp .env.example .env

# Migrations et seed de la base (SQLite dans dev.db)
npx prisma migrate dev
npm run prisma:seed
```

## Démarrage

```bash
npm run start:dev
```

L'API est disponible sur `http://localhost:3000`.

## Routes disponibles

### Produits

- `GET /products` — liste tous les produits
- `GET /products/in-stock` — liste les produits en stock
- `GET /products/:id` — détail d'un produit
- `POST /products` — créer un produit
- `PUT /products/:id` — modifier un produit
- `DELETE /products/:id` — supprimer un produit

### Commandes

- `GET /orders` — liste toutes les commandes
- `GET /orders/:id` — détail d'une commande
- `POST /orders` — créer une commande
- `POST /orders/:id/items` — ajouter un article
- `POST /orders/:id/confirm` — confirmer une commande
- `POST /orders/:id/cancel` — annuler une commande

## Tests

### Unitaire

> Les tests unitaires sont volontairement absent, ils sont à générer lors du Lab 2.

Pour les lancer:

```bash
npm test
npm run test:coverage
```

### Intégration

Une collection de requête Bruno est disponible dans `integration_tests`
