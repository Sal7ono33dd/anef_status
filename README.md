<h1>Installation </h1>

<h2>Nouveautés v2.9.24</h2>

<ul>
  <li>Synchronisation automatique en arrière-plan (toutes les 15 minutes).</li>
  <li>Notification quotidienne de suivi.</li>
  <li>Notification immédiate quand un changement de statut est détecté.</li>
  <li>Notification dédiée quand la session ANEF expire, puis confirmation quand la session est reconnectée.</li>
  <li>Détection renforcée de session expirée (même si ANEF répond en page login/HTML).</li>
  <li>Fallback visuel sur l'icône de l'extension en cas de session expirée ou erreur de synchro.</li>
  <li>Bouton <strong>Tester notification</strong> dans le popup de l'extension (utile sur Brave).</li>
  <li>Icônes de statut dans la frise plus lisibles et plus explicatives.</li>
  <li>Recréation automatique de l'onglet de suivi naturalisation quand l'ANEF ne l'affiche plus.</li>
  <li>Icônes intégrées pour chaque étape de la frise recréée.</li>
  <li>Affichage immédiat de l'onglet Suivi naturalisation au chargement de la page.</li>
  <li>Réinsertion automatique de l'onglet si l'application ANEF remplace le DOM au démarrage.</li>
  <li>Onglet Suivi naturalisation injecté à côté des onglets ANEF.</li>
  <li>Nouveau menu popup ANEF Status sans bloc authentification.</li>
  <li>L'onglet Suivi remplace le contenu courant puis se masque quand un autre onglet ANEF est choisi.</li>
  <li>Correction: les onglets ANEF natifs ne sont plus masqués ni modifiés par l'extension.</li>
  <li>Le panneau Suivi prend la place du bloc de contenu actif et l'onglet garde le style natif cloné.</li>
  <li>Correction d'urgence: l'extension ne masque plus le contenu ANEF automatiquement.</li>
  <li>Correction: l'onglet Suivi naturalisation est inséré avant Demande de changement de situation sans l'écraser.</li>
  <li>Correction: le panneau Suivi naturalisation disparaît immédiatement quand un autre onglet ANEF est sélectionné.</li>
  <li>Restauration des 13 étapes de l'ancienne frise de suivi naturalisation.</li>
  <li>Ajout des sous-détails dans la frise: dates, plateforme masquée, statut décret, numéro de décret et lien Légifrance.</li>
  <li>Ajout du bloc "Suivi de ma demande" avec numéro de demande, type, timbre fiscal, dernière sauvegarde et affichage masqué par icône œil.</li>
  <li>Correction: si l'onglet ANEF "Accès à la Nationalité Française" existe, l'extension le remplace au lieu d'ajouter un doublon.</li>
  <li>Ajout de l'œil afficher/masquer sur la préfecture de l'entretien d'assimilation.</li>
  <li>Sécurité: suppression des identifiants FranceConnect codés en dur et désactivation de l'auto-login par défaut.</li>
</ul>

Vidéo tutorielle sur YouTube (je ne suis pas le propriétaire des chaînes) : 

FR : <a href="https://www.youtube.com/watch?v=WhW91uf_bVI">https://www.youtube.com/watch?v=WhW91uf_bVI</a>

AR : <a href="https://www.youtube.com/watch?v=vaitOnjyNFQ">https://www.youtube.com/watch?v=vaitOnjyNFQ</a>

1. Télécharger le <a href="https://github.com/Sal7ono33dd/anef_status/releases/tag/2.9.24"> fichier ZIP </a> , décompress le zip pour obtenir le dossier


2. Rend-toi sur : chrome://extensions


3. En haut à droite, clique pour activer le "Mode Développeur"
   
![image](https://github.com/user-attachments/assets/1c26f75b-963f-473b-a898-0c44e82eba9e)


4. En haut à gauche, clique sur "Charger l'extension non empaquetée" puis sélectionne ton dossier d'extension


![image](https://github.com/user-attachments/assets/6f13ef5b-e365-449d-94f1-d541449855c5)


Et voilà, l'extension est installé et utilisable sur ton Chrome 🎉

![image](https://github.com/Sal7ono33dd/anef_status/blob/main/icons/nat.png?raw=true)
