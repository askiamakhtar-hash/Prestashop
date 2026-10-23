# LIBIDOR — application Android du site libidor.tech

Application Android (Kotlin, WebView) qui affiche le site https://www.libidor.tech en plein
écran. Le contenu est chargé en direct : toute mise à jour du site apparaît dans l’app
sans nouvelle version.

## Fonctionnement
- Écran de démarrage au logo LIBIDOR, affiché jusqu’au chargement de la page.
- Navigation interne pour `libidor.tech` / `*.libidor.tech` ; les autres liens (WhatsApp,
  téléphone, e-mail, sites externes) s’ouvrent dans l’application adaptée.
- Bouton retour = page précédente, tirer vers le bas = actualiser.
- Écran « Pas de connexion » avec bouton Réessayer ; page en cache si hors ligne.
- Les liens `https://libidor.tech/...` peuvent s’ouvrir directement dans l’app.
- Sélection de fichiers prise en charge si le site ajoute des champs d’envoi.

## Compiler
Prérequis : JDK 17+ et SDK Android (platform 35).

```bash
echo "sdk.dir=/chemin/vers/android-sdk" > local.properties
./gradlew assembleDebug     # app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleRelease   # app/build/outputs/apk/release/app-release.apk (signé)
./gradlew bundleRelease     # app/build/outputs/bundle/release/app-release.aab (Google Play)
```

La signature release lit `keystore.properties` (ignoré par git), ou les variables
`LIBIDOR_KEYSTORE`, `LIBIDOR_KEYSTORE_PASSWORD`, `LIBIDOR_KEY_ALIAS`, `LIBIDOR_KEY_PASSWORD` —
même clé que `libidor-android/`.

## Backend du site
Les formulaires du site appellent l’API indiquée dans `libidor-config.json`
(`{"apiBase": "https://..."}`) servi à côté de la page. Tant que ce fichier n’est pas
publié sur www.libidor.tech, le site — et donc l’app — reste en mode démo
(`http://localhost:4100`). Une fois publié, l’app fonctionne sans mise à jour.
