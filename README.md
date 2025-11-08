# Web2EPUB - Extension Firefox

Extension Firefox pour extraire le contenu d'articles web et les convertir en fichiers EPUB, avec un serveur pour stocker et accéder à vos articles depuis n'importe quel appareil.

## 📋 Fonctionnalités

- ✅ Extraction intelligente du contenu d'articles web
- ✅ Support spécifique pour Le Monde et Mediapart
- ✅ Extraction générique pour tous les autres sites
- ✅ Conversion automatique en format EPUB
- ✅ Envoi automatique vers un serveur
- ✅ Interface web pour consulter et télécharger vos articles
- ✅ Recherche dans votre bibliothèque
- ✅ Compatible avec toutes les liseuses EPUB

## 🚀 Installation

### 1. Installation du serveur

```bash
cd server
npm install
npm start
```

Le serveur démarre sur `http://localhost:3000`

Pour le lancer en mode développement avec auto-reload :
```bash
npm run dev
```

### 2. Installation de l'extension Firefox

#### Option A : Installation temporaire (développement)

1. Ouvrez Firefox et accédez à `about:debugging`
2. Cliquez sur "Ce Firefox" dans le menu de gauche
3. Cliquez sur "Charger un module complémentaire temporaire"
4. Sélectionnez le fichier `manifest.json` dans le dossier de l'extension

#### Option B : Installation permanente

1. Téléchargez la bibliothèque JSZip :
```bash
curl -o lib/jszip.min.js https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
```

2. Créez un fichier .xpi (archive ZIP) :
```bash
zip -r web2epub.xpi manifest.json background.js content.js options.html options.js icons/ lib/
```

3. Dans Firefox, allez à `about:addons`
4. Cliquez sur l'icône d'engrenage et sélectionnez "Installer un module depuis un fichier"
5. Sélectionnez le fichier `web2epub.xpi`

### 3. Configuration de l'extension

1. Cliquez sur l'icône de l'extension dans la barre d'outils
2. Sélectionnez "Préférences" ou "Options"
3. Configurez l'URL du serveur (par défaut : `http://localhost:3000`)

## 📖 Utilisation

### Sur votre ordinateur

1. Accédez à un article web (par exemple sur lemonde.fr ou mediapart.fr)
2. Cliquez sur l'icône de l'extension Web2EPUB dans la barre d'outils
3. L'article est automatiquement extrait, converti en EPUB et envoyé au serveur
4. Une notification confirme la sauvegarde

### Sur votre liseuse

1. Ouvrez le navigateur de votre liseuse
2. Accédez à `http://[adresse-serveur]:3000`
3. Vous verrez la liste de tous vos articles sauvegardés
4. Cliquez sur un article pour le télécharger
5. Ouvrez le fichier EPUB téléchargé dans votre application de lecture

## 🌐 Accès distant

Pour accéder à vos EPUB depuis votre liseuse en dehors de votre réseau local :

### Option 1 : Tunnel ngrok (simple, temporaire)

```bash
# Installez ngrok : https://ngrok.com/
ngrok http 3000
```

Utilisez l'URL fournie par ngrok dans votre liseuse.

### Option 2 : Serveur avec IP publique

1. Déployez le serveur sur un VPS (DigitalOcean, AWS, etc.)
2. Configurez un nom de domaine
3. Utilisez nginx comme reverse proxy
4. Ajoutez HTTPS avec Let's Encrypt

Exemple de configuration nginx :

```nginx
server {
    listen 80;
    server_name epub.votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 3 : Réseau local uniquement

Si votre liseuse est sur le même réseau WiFi :

1. Trouvez l'adresse IP de votre ordinateur :
```bash
# Sur macOS/Linux
ifconfig | grep "inet "
# Sur Windows
ipconfig
```

2. Accédez à `http://[votre-ip]:3000` depuis votre liseuse

## 🔧 Configuration avancée

### Variables d'environnement du serveur

Créez un fichier `.env` dans le dossier `server/` :

```env
PORT=3000
UPLOADS_DIR=./uploads
MAX_FILE_SIZE=52428800
```

### Personnalisation de l'extraction

Vous pouvez ajouter des extracteurs spécifiques pour d'autres sites en modifiant [content.js:46-88](content.js#L46-L88) :

```javascript
if (domain.includes('votresite.com')) {
  article = extractVotreSite();
}
```

## 🐛 Dépannage

### L'extension ne trouve pas le contenu

- Vérifiez que vous êtes sur une page d'article (pas la page d'accueil)
- Certains sites avec paywall ou JavaScript complexe peuvent ne pas fonctionner
- L'extracteur générique devrait fonctionner dans la plupart des cas

### Erreur d'envoi au serveur

- Vérifiez que le serveur est bien démarré
- Vérifiez l'URL du serveur dans les options de l'extension
- Vérifiez que le CORS est activé (déjà fait dans le serveur)

### Les EPUB ne s'affichent pas sur la liseuse

- Assurez-vous d'être sur le même réseau que le serveur
- Vérifiez l'adresse IP dans le navigateur de la liseuse
- Certaines liseuses anciennes peuvent avoir des problèmes avec les sites modernes

## 📝 Structure du projet

```
web2epub/
├── manifest.json          # Configuration de l'extension
├── background.js          # Script d'arrière-plan (génération EPUB)
├── content.js            # Script d'extraction du contenu
├── options.html          # Page de configuration
├── options.js            # Script de configuration
├── icons/                # Icônes de l'extension
├── lib/                  # Bibliothèques tierces (JSZip)
└── server/               # Serveur Node.js
    ├── package.json
    ├── server.js         # Serveur Express
    ├── metadata.json     # Métadonnées des EPUB
    ├── uploads/          # Fichiers EPUB stockés
    └── public/
        └── index.html    # Interface web de consultation
```

## 🔐 Sécurité

**Important** : Par défaut, le serveur accepte les uploads sans authentification. Pour un usage en production :

1. Ajoutez une authentification (JWT, session, etc.)
2. Limitez les uploads à des IPs spécifiques
3. Utilisez HTTPS
4. Ajoutez un rate limiting

## 📄 Licence

MIT

## 🤝 Contributions

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir des issues ou des pull requests.

## 💡 Améliorations futures

- [ ] Support d'images dans les EPUB
- [ ] Support de plus de sites spécifiques
- [ ] Interface d'administration
- [ ] Authentification utilisateur
- [ ] Synchronisation entre appareils
- [ ] Export en PDF
- [ ] Mode sombre
- [ ] Collections/tags
