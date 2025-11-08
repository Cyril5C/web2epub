# Exemples d'utilisation de Web2EPUB

## Scénarios d'usage

### Scénario 1 : Lecture hors ligne sur liseuse Kobo

**Situation** : Vous lisez régulièrement des articles du Monde et souhaitez les lire sur votre liseuse Kobo pendant vos trajets en métro.

**Solution** :

1. Sur votre ordinateur, installez Web2EPUB et démarrez le serveur
2. Parcourez lemonde.fr et cliquez sur l'icône Web2EPUB pour chaque article intéressant
3. Le soir, sur votre liseuse Kobo :
   - Connectez-vous au même WiFi que votre ordinateur
   - Ouvrez le navigateur intégré
   - Accédez à `http://192.168.1.X:3000` (remplacez X par l'IP de votre PC)
   - Téléchargez les articles
4. Dans le métro, lisez vos articles sans connexion

### Scénario 2 : Veille technologique avec Kindle

**Situation** : Vous faites de la veille sur plusieurs sites tech et voulez les lire sur votre Kindle.

**Solution** :

1. Configurez le serveur sur un Raspberry Pi chez vous (toujours accessible)
2. Utilisez l'extension sur votre PC de travail
3. Le soir sur votre Kindle :
   - Connectez-vous au WiFi
   - Accédez à votre serveur domestique
   - Téléchargez tous les articles du jour
   - Lisez confortablement dans votre canapé

### Scénario 3 : Archivage d'articles Mediapart

**Situation** : Vous êtes abonné à Mediapart et souhaitez archiver certains articles importants.

**Solution** :

1. Installez Web2EPUB
2. Pour chaque article à archiver, cliquez sur l'icône
3. Les EPUB sont automatiquement stockés dans `server/uploads/`
4. Sauvegardez ce dossier dans votre cloud (Nextcloud, Dropbox, etc.)
5. Vous conservez vos articles même après résiliation de l'abonnement

## Sites testés

### ✅ Fonctionnels avec extracteur spécifique

| Site | URL | Notes |
|------|-----|-------|
| Le Monde | lemonde.fr | Extrait titre, auteur, date, contenu |
| Mediapart | mediapart.fr | Extrait titre, auteur, date, contenu |

### ✅ Fonctionnels avec extracteur générique

| Site | URL | Notes |
|------|-----|-------|
| Medium | medium.com | Fonctionne bien |
| Dev.to | dev.to | Bon résultat |
| Substack | *.substack.com | Variable selon le thème |
| Wikipedia | wikipedia.org | Très bon résultat |
| Blog personnel | Divers | 80% de réussite |

### ⚠️ Partiellement fonctionnels

| Site | URL | Problème |
|------|-----|----------|
| Twitter/X | twitter.com | Contenu dynamique, résultat partiel |
| Sites avec paywall | Divers | Ne contourne pas le paywall |
| Sites avec infinite scroll | Divers | Seule la partie visible est extraite |

### ❌ Non fonctionnels

| Site | URL | Raison |
|------|-----|--------|
| Instagram | instagram.com | Trop de JavaScript |
| Facebook | facebook.com | Contenu dynamique complexe |
| YouTube | youtube.com | Pas adapté pour du texte |

## Exemples de commandes

### Installation complète

```bash
# Cloner le projet
git clone https://github.com/yourusername/web2epub.git
cd web2epub

# Installation automatique
./install.sh

# Vérification
./verify.sh

# Démarrage
cd server && npm start
```

### Configuration avancée

#### Changer le port du serveur

```bash
# Créer le fichier de configuration
cp server/.env.example server/.env

# Éditer le fichier
echo "PORT=8080" >> server/.env

# Redémarrer le serveur
cd server && npm start
```

#### Accès distant avec ngrok

```bash
# Installer ngrok (macOS)
brew install ngrok

# Lancer le tunnel
ngrok http 3000

# Copier l'URL fournie (ex: https://abc123.ngrok.io)
# La configurer dans l'extension Firefox
```

#### Déploiement sur un VPS

```bash
# Sur votre VPS (Ubuntu/Debian)
git clone https://github.com/yourusername/web2epub.git
cd web2epub

# Installation
./install.sh

# Installation de PM2 pour garder le serveur actif
npm install -g pm2

# Démarrage avec PM2
cd server
pm2 start server.js --name web2epub

# Démarrage automatique au boot
pm2 startup
pm2 save
```

### Utilisation avancée

#### Extraction manuelle via curl

```bash
# Uploader un EPUB manuellement
curl -X POST http://localhost:3000/upload \
  -F "epub=@mon-article.epub" \
  -F "title=Mon Article" \
  -F "timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

#### Lister les EPUB via API

```bash
# Récupérer la liste des EPUB
curl http://localhost:3000/api/epubs | jq

# Télécharger un EPUB spécifique
curl -O http://localhost:3000/api/download/1234567890
```

#### Script de backup automatique

```bash
#!/bin/bash
# backup-epubs.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR=~/backups/web2epub
SOURCE_DIR=~/web2epub/server/uploads

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/epubs-$DATE.tar.gz $SOURCE_DIR
echo "Backup créé: epubs-$DATE.tar.gz"
```

## Cas d'usage créatifs

### 1. Newsletter personnalisée

Créez un script qui envoie quotidiennement vos nouveaux EPUB sur votre Kindle :

```bash
#!/bin/bash
# send-to-kindle.sh

# Récupérer les EPUB du jour
EPUBS=$(find server/uploads -name "*.epub" -mtime -1)

# Envoyer par email à votre adresse Kindle
for epub in $EPUBS; do
  echo "Envoi de $epub..."
  # Utiliser send_kindle ou un service similaire
done
```

### 2. Lecture collaborative

Partagez vos EPUB avec votre famille :

```bash
# Configurez plusieurs utilisateurs dans le serveur
# Ajoutez l'authentification
# Chacun a accès à tous les articles sauvegardés
```

### 3. Archivage thématique

Organisez vos EPUB par thème :

```javascript
// Modifiez server.js pour ajouter des tags
// Puis filtrez dans l'interface web
```

## Débogage

### Activer les logs détaillés

Dans [background.js](background.js:2), la première ligne active déjà `console.log`.

Pour voir les logs :

1. Ouvrez `about:debugging` dans Firefox
2. Cliquez sur "Inspecter" sous Web2EPUB
3. Ouvrez l'onglet Console

### Tester l'extraction sans sauvegarder

Modifiez temporairement [background.js](background.js:16-19) :

```javascript
// Commentez l'envoi au serveur
// await sendToServer(epub, response.article.title);
console.log('EPUB généré:', epub);
```

### Logs du serveur

```bash
# Lancer avec logs détaillés
DEBUG=* node server/server.js

# Ou avec nodemon
cd server && npm run dev
```

## Performance

### Optimisation pour grand volume

Si vous sauvegardez beaucoup d'articles :

```javascript
// Dans server.js, ajoutez de la pagination
app.get('/api/epubs', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const start = (page - 1) * limit;
  const end = start + limit;

  const metadata = readMetadata();
  const paged = metadata.slice(start, end);

  res.json({
    data: paged,
    page,
    total: metadata.length
  });
});
```

### Compression des EPUB

```javascript
// Dans background.js, ajoutez compression: DEFLATE
const blob = await zip.generateAsync({
  type: 'blob',
  mimeType: 'application/epub+zip',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 }
});
```

## Intégrations tierces

### Avec Calibre

```bash
# Importer automatiquement dans Calibre
calibredb add server/uploads/*.epub --library-path ~/Calibre
```

### Avec Pocket

Utilisez Pocket pour marquer les articles, puis un script pour les extraire avec Web2EPUB.

### Avec IFTTT

Créez une automatisation : "Nouvel article sauvé dans Pocket → Webhook vers votre serveur → Extraction automatique"

## Support

Pour plus d'exemples, consultez :
- [Issues GitHub](https://github.com/yourusername/web2epub/issues)
- [Wiki du projet](https://github.com/yourusername/web2epub/wiki)
