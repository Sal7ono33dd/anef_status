# Android - Suivi Naturalisation

Application Android native (Kotlin) avec:

- synchro en arriere-plan toutes les 15 minutes (WorkManager),
- notification quotidienne,
- notification sur changement de statut,
- detection session ANEF expiree + alerte,
- alerte session reconnectee,
- IHM mobile en 2 modes:
  - vue non connectee (connexion ANEF),
  - vue connectee redesign avec statut + phase + chatbot,
- bouton pour acceder au site ANEF depuis la vue connectee,
- chatbot procedure naturalisation base sur l'API Perplexity.

## Structure

- `app/src/main/java/com/naturalisation/tracker/MainActivity.kt`: UI mobile (non connecte/connecte) + WebView + chatbot.
- `StatusSyncWorker.kt`: tache de synchro en background.
- `StatusRepository.kt`: logique metier des alertes.
- `AnefApiClient.kt`: appels API ANEF.
- `StatusDecryptor.kt`: decryption du statut (RSA OAEP SHA-256, BouncyCastle).
- `StatusMapper.kt`: description lisible + phase.
- `PerplexityClient.kt`: appels API chatbot Perplexity.

## Build

1. Ouvre `android_app_naturalisation` dans Android Studio.
2. Laisse Android Studio synchroniser Gradle.
3. Lance sur un appareil Android (API 26+).

## Usage

1. Ouvre l'app.
2. Connecte-toi sur ANEF dans le WebView.
3. Appuie sur `Synchroniser maintenant` pour valider la session.
4. Quand la session est OK, la vue connectee s'affiche avec le chatbot.

## Notes

- Si la session ANEF expire, l'app envoie une alerte et ne peut plus suivre le statut tant que tu ne te reconnectes pas.
- Les notifications Android doivent etre autorisees (Android 13+ demande une permission explicite).
- La cle API Perplexity est configuree via `BuildConfig.PPLX_API_KEY` (surcharge possible avec la propriete Gradle `PPLX_API_KEY`).
