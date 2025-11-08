# 🚀 Guide de démarrage rapide - Web2EPUB

## Deux options de déploiement

### Option A : Hébergement cloud Railway (Recommandé ⭐)

**Idéal pour :** Accès depuis n'importe où (liseuse, téléphone, etc.)

Temps : 10 minutes | Gratuit | Pas de configuration réseau

👉 **[Guide complet Railway](RAILWAY_DEPLOY.md)**

### Option B : Installation locale

**Idéal pour :** Tests rapides ou usage sur réseau local uniquement

## Installation locale en 3 minutes

### Étape 1 : Installation automatique

Ouvrez un terminal dans le dossier du projet et lancez :

```bash
./install.sh
```

Ce script va :
- Télécharger JSZip (bibliothèque pour générer les EPUB)
- Créer les icônes
- Installer les dépendances du serveur

### Étape 2 : Démarrer le serveur

```bash
cd server
npm start
```

Vous devriez voir :
```
Web2EPUB server running on http://localhost:3000
```

### Étape 3 : Installer l'extension dans Firefox

1. Ouvrez Firefox
2. Tapez `about:debugging` dans la barre d'adresse
3. Cliquez sur **"Ce Firefox"** dans le menu de gauche
4. Cliquez sur **"Charger un module complémentaire temporaire"**
5. Naviguez jusqu'au dossier du projet
6. Sélectionnez le fichier `manifest.json`

Voilà ! L'extension est installée 🎉

## Premier test

1. Ouvrez un article sur [lemonde.fr](https://www.lemonde.fr) ou [mediapart.fr](https://www.mediapart.fr)
2. Cliquez sur l'icône Web2EPUB dans la barre d'outils Firefox
3. Attendez la notification de confirmation
4. Ouvrez `http://localhost:3000` dans votre navigateur
5. Vous devriez voir votre article dans la liste !

## Accès depuis votre liseuse

### Sur le même réseau WiFi

1. Trouvez l'adresse IP de votre ordinateur :

**Mac/Linux :**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows :**
```bash
ipconfig
```

2. Sur votre liseuse, ouvrez le navigateur web
3. Accédez à `http://[VOTRE-IP]:3000`
4. Téléchargez vos articles !

### Exemple
Si votre IP est `192.168.1.42`, accédez à :
```
http://192.168.1.42:3000
```

## Configuration de l'extension

Si vous voulez changer l'URL du serveur :

1. Cliquez droit sur l'icône de l'extension
2. Sélectionnez **"Gérer l'extension"**
3. Allez dans l'onglet **"Préférences"**
4. Modifiez l'URL du serveur

## Dépannage rapide

### "Impossible d'extraire l'article"
- Vérifiez que vous êtes bien sur une page d'article (pas la page d'accueil)
- Essayez de rafraîchir la page
- L'article est peut-être derrière un paywall

### "Erreur lors de l'envoi au serveur"
- Vérifiez que le serveur est bien démarré
- Vérifiez l'URL dans les options de l'extension
- Vérifiez qu'il n'y a pas de pare-feu qui bloque

### La page web ne charge pas
- Vérifiez que le serveur est bien démarré
- Essayez d'accéder à `http://localhost:3000/health`
- Si ça marche, le serveur fonctionne !

### L'extension disparaît au redémarrage de Firefox
C'est normal pour une extension "temporaire". Pour la rendre permanente :
1. Lancez `./install.sh` si ce n'est pas déjà fait
2. Créez un fichier .xpi (voir README.md)
3. Installez-le de manière permanente

## Prochaines étapes

- Consultez le [README.md](README.md) pour la documentation complète
- Configurez un accès distant (ngrok, VPS)
- Personnalisez les extracteurs pour vos sites préférés

Besoin d'aide ? Ouvrez une issue sur GitHub !
