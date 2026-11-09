# glowmie. — Site e-commerce immersif 3D + CRM connecté

> *Your skin. Your mood. Your glow.* — Marque fictive, projet scolaire. Prix, produits, clients et paiements sont fictifs.

Ce dossier contient la **V1 fonctionnelle** décrite dans le cahier des charges :
- une boutique publique en 3D et animée ;
- un CRM privé qui partage **la même base de données**.

On peut la lancer sans rien installer. Le dossier fournit aussi le **schéma Supabase cible** (`supabase/schema.sql`) pour passer à l'architecture Next.js + Supabase + Stripe + Resend.

---

## 1. Lancer le projet

**Option la plus simple** : double-clique sur `lancer.command`. Il démarre un petit serveur local et ouvre `http://localhost:8080`.
La première fois, macOS peut demander une confirmation : clic droit › Ouvrir.

**Ou dans un terminal**, depuis ce dossier :

```bash
ruby -run -e httpd . -p 8080
```

(ou `python3 -m http.server 8080` si Python est installé), puis ouvre :

| Espace | URL |
|---|---|
| Boutique | http://localhost:8080 |
| CRM | http://localhost:8080/admin.html |

**Code d'accès CRM (démo)** : `glowmie-admin`
**Compte cliente (démo)** : `lea@glowmie.fr`, mot de passe `glowmie2026`

Une connexion internet est nécessaire pour les polices Google Fonts et les librairies (Three.js, GSAP), chargées depuis le CDN cdnjs.

> Les données sont stockées dans le navigateur (localStorage) : la boutique et le CRM, ouverts dans deux onglets, se mettent à jour **en temps réel**. Le bouton **« Réinitialiser la démo »** du CRM recharge le jeu de données fictives (150 clients, environ 190 commandes sur 6 mois).

## 2. Ce qui est livré (correspondance avec le cahier des charges)

### Boutique — `index.html`
| Exigence | Où |
|---|---|
| Hero 3D : sérum géant, bulles, cœurs et étoiles flottants, rotation au scroll, puis révélation des nouveautés et du bouton « Find your glow » | Accueil (`js/scene3d.js` › `hero`) |
| Galerie produit : vrai packshot sur fond rose, photo texture, photo application | Fiches produits |
| Animations au scroll : parallaxe, apparition des sections, bandeaux défilants | Accueil (GSAP + ScrollTrigger) |
| Micro-interactions : boutons « 3D », cartes inclinables, cœur qui vole vers le panier, confettis, toasts | Partout |
| Shop : catalogue, recherche, filtres (catégorie, besoin, prix), tri | `#/shop` |
| Fiche produit : rendu 3D, prix, variantes, stock, composition, conseils, avis modérés, favoris | `#/produit/:id` |
| Quiz « Find your glow » : 10 questions dont 4 à choix multiples (besoins, soucis, textures, mode de vie), une par écran, progression, recommandations déterministes, « Ajouter la routine au panier », consentement explicite | `#/quiz` |
| Our Story, Glow Club (paliers + points), Glow Journal (4 articles) | `#/story`, `#/club`, `#/journal` |
| Panier persistant, code promo (`HELLOGLOW`, `GLOWCLUB`, `FREESHIP`), livraison offerte dès 35 € | Tiroir panier + `#/panier` |
| Checkout Stripe **simulé en mode test** : carte `4242 4242 4242 4242` acceptée, `4000 0000 0000 0002` refusée | `#/checkout` |
| Comptes : inscription, connexion, commandes avec suivi, favoris, profil, consentements, export JSON, suppression | `#/compte` |
| RGPD : bannière cookies (refus possible), pages CGV, confidentialité, cookies, mentions légales | `#/legal/...` |
| Accessibilité : navigation clavier, lien d'évitement, contrastes, `prefers-reduced-motion` respecté, bouton « Réduire les animations », image de repli si WebGL indisponible | Pied de page |

### CRM — `admin.html`
| Module | Fonctions |
|---|---|
| Dashboard | CA, commandes, panier moyen, nouveaux clients, conversion (avec évolution vs période précédente), graphique du CA, segments, dernières commandes, alertes de stock |
| Clients | Recherche, filtre par segment, fiche complète (coordonnées, commandes, consentements, points, notes internes, résultats du quiz, parcours, emails reçus), export JSON, anonymisation |
| Commandes | Liste filtrable, détail, changement de statut (visible tout de suite dans le compte client), paiement et expédition simulés |
| Produits | Création et modification : prix, prix barré (promotion), variantes, stock, couleurs du packshot, mise en ligne. Modération des avis |
| Segments | Prospects, primo-acheteurs, fidèles, VIP, inactifs, avec action suggérée et export CSV |
| Automatisations | Bienvenue, résultat du quiz, panier abandonné, J+7, J+45, invitation VIP. Activation et désactivation, journal des envois, simulation « +7 / +45 jours » |
| Reporting | Filtre par période, ventes par produit et par catégorie, codes promo, résultats des scénarios, exports CSV |

## 3. Structure

```
Glowmie/
├── index.html          Boutique (SPA, routes en #/…)
├── admin.html          CRM privé
├── css/site.css        Design system boutique (palette, typos, composants)
├── css/crm.css         Interface CRM
├── js/data.js          Jeu de données fictives (généré de façon déterministe)
├── js/store.js         Couche données partagée (= futur client Supabase)
├── js/art.js           Packshots SVG générés (aucune image externe)
├── js/scene3d.js       Scène Three.js du hero (produit 3D, bulles, cœurs, étoiles)
├── js/app.js           Routeur et vues de la boutique
├── js/crm.js           Routeur et vues du CRM
├── supabase/schema.sql Schéma PostgreSQL + règles RLS de la version cible
├── .env.example        Variables d'environnement de la version cible
├── DEMO.md             Guide de prise en main + scénario de présentation
└── lancer.command      Lanceur macOS
```

## 4. Passer à la stack cible (V2)

Le prototype est organisé pour que la migration soit mécanique : chaque méthode de `js/store.js` correspond à une requête Supabase ou à une route serveur.

| Prototype | Version cible |
|---|---|
| `index.html` + `js/app.js` | Next.js (App Router) + Tailwind, pages `app/(shop)/…` |
| `admin.html` + `js/crm.js` | `app/admin/…`, protégé par middleware + rôle `admin` |
| `js/store.js` (localStorage) | Supabase PostgreSQL : tables et RLS dans `supabase/schema.sql` |
| `login` / `signup` (hash de démo) | Supabase Auth (email + mot de passe, liens magiques) |
| `placeOrder` (paiement simulé) | Route API → Stripe Checkout (clés `sk_test_…`), puis webhook `checkout.session.completed` qui crée la commande |
| `runTriggers` / `runScheduled` | Table `automation_logs` + cron Vercel quotidien + envoi via Resend |
| `js/scene3d.js` (géométries procédurales) | React Three Fiber + `useGLTF` (modèles `.glb` compressés Draco, chargés à la demande) |
| GSAP / ScrollTrigger | Identique (`@gsap/react`) |

Variables d'environnement : voir `.env.example`.

**Sécurité dans la version cible** :
- contrôles d'accès côté serveur : RLS et vérification du rôle admin dans le middleware ;
- validation des entrées avec Zod dans les Server Actions ;
- le webhook Stripe vérifie la signature ;
- sauvegardes automatiques Supabase (Point-in-Time Recovery).

> ⚠️ Dans le prototype, l'« authentification » et le code admin sont **simulés côté navigateur** : ils servent la démonstration, pas la sécurité. Ne jamais mettre en ligne cette version avec de vraies données.

## 5. Visuels

- **Packshots produits** (`js/art.js`) : flacons, pots et tubes dessinés en SVG avec un éclairage studio (volume, reflets, ombre portée), dans un style soft-touch minimaliste. Ils ne pèsent rien et s'adaptent automatiquement quand on modifie couleurs ou packaging dans le CRM.
- **Modèles 3D** (`js/scene3d.js`) : mêmes formes en 3D (pot carré arrondi, flacon rectangulaire, sérum dépoli, tube), matière mate et éclairage neutre type packshot sur les fiches produits.
- **Photos lifestyle** : textures, swatches, application, nettoyage. Ce sont des photos réelles issues d'[Unsplash](https://unsplash.com/license) (licence libre, usage commercial autorisé, sans attribution obligatoire), chargées directement depuis leur CDN. Leurs identifiants sont listés dans `js/data.js` (`photos`). Pour utiliser tes propres photos, remplace l'`id` ou adapte `GlowArt.photo()`.
- Aucune photo de marque réelle n'est utilisée.

### Vrais packshots produits
Dépose tes photos produit (fond blanc, format PNG ou WebP) dans `assets/packshots/`, puis indique le chemin dans `js/data.js` via le champ `packshot` du produit :
`packshot: "assets/packshots/glow-drops.png"`.
Fresh Start, Glow Drops et Daily Cloud utilisent déjà leurs vraies photos. Pour les autres produits, tant qu'aucune photo n'est fournie, le site affiche automatiquement le packshot dessiné, au même design. Le fond blanc de la photo se fond dans le décor grâce à `mix-blend-mode: multiply`.

### 3D du hero à partir de la vraie photo
Le produit 3D du hero de l'accueil (Glow Drops) est construit à partir de sa vraie photo. Les fiches produits affichent, elles, la photo du produit sans 3D. `js/scene3d.js` (`photoMesh`) :
1. mesure la silhouette du produit ligne par ligne sur la photo ;
2. en fait un volume de révolution (aplati pour un tube) ;
3. projette la vraie photo sur la face avant ;
4. reprend la même face au dos, en miroir, pour que l'étiquette se lise aussi vue de derrière.

Si la photo manque, le modèle dessiné reprend la main automatiquement.

### Photos des 10 autres produits
Les autres produits utilisent les PNG détourés fournis par la marque (recadrés et allégés à 900 px). Seul Tone & Glow est encore un détourage manuel, fait à partir de sa photo HD. Tous se posent sur le fond rose du site.

## 6. Direction artistique « studio 3D » (site public)
Inspirée de sites de marque primés : typographies géantes, compositions éditoriales, produits stars. Le CRM n'est pas concerné.

- **`css/da.css`** : palette crème, fuchsia, lilas, beurre, avec du prune foncé pour le contraste. Typographies Unbounded (titres), Fredoka (wordmark), Instrument Serif (accents en italique) et Manrope (texte). Menu plein écran, shop en liste éditoriale, fiches produits en « univers » colorés.
- **`js/stage3d.js`** : une scène Three.js plein écran pour la page d'accueil. Les vrais produits (modèles construits à partir des packshots) et les décors (bulles glossy, nuages, soleil, cœurs, étoiles) sont pilotés par la progression de scroll de chaque section `[data-scene]` et par la souris. Le canvas est placé entre deux couches de texte : les produits passent devant la typographie pleine et derrière la typographie en contour.
- **Accueil** : hero « GLOWMIE » avec entrée cinématographique, manifeste (texte qui traverse l'écran), 4 univers épinglés au scroll (Glow Drops, Daily Cloud, Clear Crush, Sun Sunny) avec changement de couleur de fond, quiz, « C'est dans le sac », index de la collection avec aperçu au survol, journal, newsletter.
- **Accessibilité** : avec « Réduire les animations » ou sans WebGL, l'accueil passe en mise en page statique avec les packshots. Les animations sont simplifiées sur mobile.
