# Contexte projet - shop-api

API REST e-commerce fictive servant de support de formation sur la comprehension de legacy et la revue augmentee. Le depot contient volontairement de la dette technique et des bugs pedagogiques : ne pas les prendre automatiquement pour des conventions a reproduire.

## Stack technique

- Runtime cible : Node.js 20+.
- Framework : NestJS `^10.3.0`, avec `@nestjs/common`, `@nestjs/core` et `@nestjs/platform-fastify`.
- Serveur HTTP : Fastify via `FastifyAdapter` et `NestFastifyApplication` dans `src/main.ts`.
- Langage : TypeScript `^5.3.3`, compile en CommonJS, cible ES2021.
- ORM et acces aux donnees : Prisma `^5.10.0` et `@prisma/client` `^5.10.0`.
- Base de donnees : SQLite, configuree dans `prisma/schema.prisma` par `DATABASE_URL`.
- Validation : `class-validator` `^0.14.1` et `class-transformer` `^0.5.1`.
- Reactive support NestJS : `rxjs` `^7.8.1`.
- Decorateurs : `reflect-metadata` `^0.2.1`, avec `experimentalDecorators` et `emitDecoratorMetadata` actifs.
- Tests : Vitest `^1.3.0`, couverture V8 via `@vitest/coverage-v8` `^1.3.0`, support Nest via `@nestjs/testing` `^10.3.0`.
- Outillage : Nest CLI `^10.3.0`, `ts-node` `^10.9.2`, `unplugin-swc` `^1.4.3`, types Node `^20.11.0`.

Scripts disponibles :

- `npm run start:dev` : demarrage Nest en watch mode.
- `npm run build` : compilation Nest vers `dist`.
- `npm start` : execution de `dist/main`.
- `npm test`, `npm run test:watch`, `npm run test:coverage` : tests Vitest.
- `npm run prisma:migrate` : migration Prisma en mode dev.
- `npm run prisma:seed` : execution de `prisma/seed.ts`.
- `npm run prisma:studio` : ouverture de Prisma Studio.

## Architecture

### Pattern et decoupage

Le projet est un monolithe modulaire NestJS decoupe par domaine metier :

- `src/products` : catalogue et stock.
- `src/orders` : commandes, lignes de commande et orchestration du stock.
- `src/common` : services et exceptions partagees.
- `prisma` : schema, migrations et seed.
- `integration_tests` : collection de requetes Bruno.

Chaque domaine suit principalement le decoupage `module / controller / service / dto` :

- Les controllers exposent les routes REST et deleguent au service.
- Les services portent les acces Prisma et les regles metier.
- Les DTO portent la validation des payloads HTTP avec des decorateurs `class-validator`.
- Les modules enregistrent controllers et providers.

`ProductsModule` exporte `ProductsService`. `OrdersModule` importe `ProductsModule` et injecte `ProductsService` pour verifier les produits et modifier le stock. Les routes sont prefixees par `products` et `orders`.

### Initialisation et validation HTTP

`src/main.ts` cree une application Nest avec Fastify, ecoute sur `0.0.0.0:3000` et active globalement :

- `ValidationPipe({ whitelist: true, transform: true })`.
- Les proprietes absentes des DTO sont donc filtrees et les valeurs sont transformees selon les metadonnees disponibles.

### Persistance

`PrismaService` etend `PrismaClient` et implemente `OnModuleInit` / `OnModuleDestroy` pour connecter et deconnecter Prisma avec le cycle de vie Nest.

Le schema SQLite contient trois modeles : `Product`, `Order` et `OrderItem`. Les identifiants sont des `cuid()`. Les prix et totaux sont des `Float`, le stock et les quantites sont des `Int`, et les dates utilisent `createdAt` / `updatedAt`.

### API exposee

- `GET /products`, `GET /products/in-stock`, `GET /products/:id`.
- `POST /products`, `PUT /products/:id`, `DELETE /products/:id`.
- `GET /orders`, `GET /orders/:id`, `POST /orders`.
- `POST /orders/:id/items`, `POST /orders/:id/confirm`, `POST /orders/:id/cancel`.

## Conventions de code observees

- Classes Nest exportees et annotees avec `@Module`, `@Controller` ou `@Injectable`.
- Injection des dependances par constructeur. Les controllers utilisent `private readonly` pour leurs services ; les services existants utilisent surtout `private`.
- Noms de classes en PascalCase (`ProductsService`, `OrdersController`, `CreateProductDto`) et noms de fichiers en kebab-case.
- Les methodes de controller sont courtes et deleguent au service. Les controllers ne contiennent pas de requetes Prisma.
- Les operations Prisma utilisent les methodes du delegate (`findMany`, `findUnique`, `create`, `update`, `delete`) et les filtres `where` / `orderBy` / `include`.
- Les listes de produits sont triees par `createdAt` decroissant. Les commandes incluent leurs lignes et le produit associe quand le detail est demande.
- Les DTO sont des classes, avec proprietes obligatoires marquees `!`, proprietes facultatives marquees `?`, et validateurs explicites (`@IsString`, `@IsNumber`, `@IsInt`, `@Min`, `@IsOptional`).
- Les imports relatifs sont utilises ; aucun alias TypeScript n'est configure.
- Le style de formatage est actuellement mixte : fichiers recents en apostrophes sans point-virgule, controllers/services produits en guillemets doubles avec points-virgules. Conserver le style du fichier modifie plutot que reformater le depot.
- Les reponses retournent directement les objets Prisma ; aucun mapper ou DTO de sortie dedie n'est etabli.
- Les exceptions applicatives sont centralisees dans `AppException`, qui encapsule `code`, `message`, `status` et `details`. Toutefois, le code metier actuel utilise encore plusieurs `Error` generiques : c'est une dette a corriger, pas une convention cible.

## Contraintes specifiques pour un outil IA

- Lire les modules avant d'ajouter une dependance inter-domaine. Pour acceder aux produits depuis les commandes, utiliser l'export de `ProductsModule` et son injection Nest ; ne pas instancier `ProductsService` manuellement.
- Preserver le decoupage domaine : acces HTTP dans les controllers, validation dans les DTO, regles metier et Prisma dans les services.
- Respecter `ValidationPipe` : tout nouveau body HTTP doit avoir un DTO avec les decorateurs `class-validator`. Ne pas faire confiance a un cast TypeScript seul.
- Pour les erreurs HTTP, preferer une exception Nest appropriee ou `AppException` avec un code stable. Remplacer progressivement les `Error` generiques, qui donnent notamment des erreurs 500 pour des ressources absentes.
- Proteger les invariants metier : stock jamais negatif, quantites positives, total de commande egal a la somme `quantity * unitPrice`, transitions de statut valides. Les commentaires `DETTE`, `BUG INTENTIONNEL` et `DEAD CODE` signalent des problemes connus a traiter avec prudence.
- Les operations qui lisent puis modifient le stock doivent prendre en compte la concurrence et utiliser une mise a jour atomique ou une transaction Prisma lorsque le comportement est corrige.
- Ne pas introduire de pagination, d'authentification, de nouvelles routes ou de nouveaux modeles sans demande explicite : ils ne font pas partie du contrat actuel.
- Ne pas modifier le schema Prisma sans migration correspondante. Apres une modification du schema, regenerer le client et verifier le seed.
- Les tests unitaires sont absents volontairement selon le README ; ajouter des tests Vitest pour les corrections metier plutot que supposer que la collection Bruno couvre tous les cas.
- Verifier les changements avec `npm run build` et, lorsqu'ils concernent le comportement, `npm test` ou les requetes Bruno. La base locale et le serveur utilisent le port `3000`.
- Le seed efface les commandes, lignes de commande et produits avant de recreer des donnees de demonstration. Ne pas l'executer contre une base partagee ou a conserver.
