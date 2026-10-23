# LIBIDOR — application Android

Application Android native (Kotlin + Jetpack Compose) pour la console LIBIDOR.
Elle consomme l’API NestJS du projet `LIBIDOR_Full_Source` (`apps/api`).

## Écrans
- **Accueil** — métriques (`GET /v1/dashboard/summary`) et transactions récentes
- **Transactions** — 100 dernières intentions (`GET /v1/transactions`), confirmation démo des intentions `PENDING`
- **Change** — cotation simulée XOF ⇄ CNY (`POST /v1/fx/quotes`)
- **Encaisser** — création d’une intention de paiement (`POST /v1/merchant/payment-intents`, en-têtes `x-api-key` + `idempotency-key`)
- **Réglages** — URL de l’API et clé marchand, enregistrées sur l’appareil

## Compiler
Prérequis : JDK 17+ et le SDK Android (platform 35).

```bash
echo "sdk.dir=/chemin/vers/android-sdk" > local.properties   # ou exporter ANDROID_HOME
./gradlew assembleDebug
# APK : app/build/outputs/apk/debug/app-debug.apk
```

Ou ouvrir le dossier dans Android Studio.

## Connexion à l’API
1. Démarrer l’API (`npm run dev:api` dans `LIBIDOR_Full_Source`), port 4000.
2. Émulateur : l’URL par défaut `http://10.0.2.2:4000` pointe vers la machine hôte.
3. Téléphone physique : dans **Réglages**, saisir `http://<IP-de-l’ordinateur>:4000` (même Wi-Fi).
   La clé par défaut est `local-demo-key` (`DEMO_MERCHANT_API_KEY`).

## Avertissement
Build de développement : le trafic HTTP en clair est autorisé
(`res/xml/network_security_config.xml`) pour joindre l’API locale. À retirer, avec
HTTPS obligatoire, avant toute mise en production. Aucun paiement réel n’est traité ;
les cotations FX sont simulées.
