# Guide de prise en main & scénario de démonstration

Durée conseillée : **8 à 10 minutes**. Ouvre deux onglets côte à côte :
- **A** : la boutique, `http://localhost:8080`
- **B** : le CRM, `http://localhost:8080/admin.html` (code `glowmie-admin`)

Avant de commencer : dans le CRM, clique sur **↺ Réinitialiser la démo**.

---

## Acte 1 — L'expérience immersive (2 min) · onglet A
1. **Accueil** : laisse le sérum 3D flotter, puis **attrape-le à la souris** pour le faire tourner.
2. **Fais défiler** : le flacon pivote, le titre s'efface et les **nouveautés** apparaissent avec le bouton *Find your glow*. Continue : parallaxe du podium, bandeaux, apparition des cartes.
3. Survole une carte produit : elle s'incline en 3D. Clique sur ♥ et montre qu'il faut un compte pour les favoris.
4. *Accessibilité* : en bas de page, **« Réduire les animations »** fige la 3D et coupe les mouvements. Réactive-les ensuite.

## Acte 2 — Le quiz (1 min 30)
1. **Find your glow** : réponds aux 10 questions (une par écran, barre de progression). Montre les questions à choix multiples (jusqu’à 3 ou 4 choix, bouton Continuer) et le résultat : diagnostic, explication de chaque produit, conseils perso.
2. Le résultat affiche un profil, une routine par étapes et le total.
3. Montre la mention « sans valeur médicale » et le **consentement explicite** pour recevoir sa routine par email.
4. Clique sur **« Ajouter la routine au panier »** : un cœur vole vers le panier.

## Acte 3 — L'achat (2 min) · le test d'acceptation
1. Ouvre une fiche, par exemple **Glow Drops** : vraie photo du produit, puis photos texture et application dans la galerie. Choisis le format 50 ml, puis **Ajouter au panier**.
2. Dans le tiroir panier : applique le code **HELLOGLOW** et montre la jauge « livraison offerte ».
3. **Passer commande** : remplis le formulaire, crée un mot de passe et coche la newsletter.
   - Carte `4000 0000 0000 0002` → paiement refusé (gestion d'erreur).
   - Carte `4242 4242 4242 4242`, date `12/29`, CVC `123` → paiement accepté, confettis.
4. **Suivre ma commande** : la commande apparaît dans *Mon compte* avec le statut « Payée », les points Glow Club et la frise de suivi.

## Acte 4 — Le CRM (3 min) · onglet B
1. **Dashboard** : la commande vient d'apparaître dans « Dernières commandes » et les indicateurs ont bougé. Change la période (7 j / 30 j / 90 j / 6 mois) et survole le graphique.
2. Clique sur la commande, passe-la en **Expédiée**, puis reviens dans l'onglet A : *Mon compte* affiche « Expédiée » avec un numéro de suivi.
3. **Clients** : ouvre la fiche de la nouvelle cliente. Montre ses consentements, son parcours (compte créé → newsletter → commande) et les emails automatiques (bienvenue envoyé, J+7 et J+45 planifiés). Ajoute une note interne.
4. **Automatisations** : clique sur **Simuler +7 jours**, l'email de conseils passe à « envoyé ». Montre qu'une cliente sans consentement est ignorée.
5. **Produits** : passe le prix de *Sun Sunny* en promo (prix barré). Recharge la boutique : le badge « -X % » apparaît. Modère l'avis en attente.
6. **Segments** puis **Reporting** : VIP, inactifs, ventes par produit, export CSV.

## Acte 5 — Conclusion (30 s)
- Les données sont partagées entre site et CRM, les autorisations sont pensées dès le départ (`supabase/schema.sql`, RLS) et le RGPD est intégré (consentements, export, suppression).
- Les prochaines étapes (V2) sont décrites dans le README : Next.js, Supabase Auth, Stripe Checkout réel en mode test, Resend et modèles 3D `.glb`.

---

### Aide-mémoire
| Élément | Valeur |
|---|---|
| Code CRM | `glowmie-admin` |
| Compte cliente démo | `lea@glowmie.fr` · mot de passe `glowmie2026` |
| Codes promo | `HELLOGLOW` (-10 %), `GLOWCLUB` (-15 %), `FREESHIP` (livraison offerte) |
| Carte test acceptée | `4242 4242 4242 4242` |
| Carte test refusée | `4000 0000 0000 0002` |
| Points | 1 € = 10 points · Glow < 2 000 · Shine < 5 000 · Superstar |
| Segments | Prospect 0 cmd · Primo 1 · Fidèle 2–3 · VIP 4+ ou 150 €+ · Inactif > 90 j |

### En cas de souci
- **Page blanche ou sans style** : passe par `lancer.command` ou `http://localhost:8080`, pas par un double-clic sur `index.html`, et vérifie la connexion internet (CDN).
- **Pas de 3D** : le navigateur n'a pas WebGL, un packshot illustré s'affiche à la place, c'est voulu.
- **Données bizarres** : CRM › Réinitialiser la démo.
