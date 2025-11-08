# Web2EPUB sur Railway

Bienvenue ! Vous êtes en train de déployer **Web2EPUB** sur Railway.

## 📚 Qu'est-ce que Web2EPUB ?

Une extension Firefox qui convertit des articles web en fichiers EPUB pour les lire sur votre liseuse.

Ce serveur :
- ✅ Reçoit les EPUB générés par l'extension
- ✅ Les stocke de manière persistante
- ✅ Propose une interface web pour les télécharger
- ✅ Accessible depuis n'importe quelle liseuse

## 🚀 Configuration Railway

### Étape 1 : Ajouter un volume persistant (Important !)

Sans volume, vos EPUB seront perdus à chaque redémarrage.

1. Dans Railway, allez dans **Settings** → **Volumes**
2. Créez un nouveau volume :
   - **Mount Path** : `/data`
   - **Size** : 1 GB minimum (ajustez selon vos besoins)

### Étape 2 : Générer un domaine public

1. Allez dans **Settings** → **Networking**
2. Cliquez sur **Generate Domain**
3. Notez l'URL générée (ex: `https://web2epub-production.up.railway.app`)

### Étape 3 : Variables d'environnement (optionnel)

Railway configure automatiquement `PORT`, mais vous pouvez ajouter :

```env
MAX_FILE_SIZE=52428800
NODE_ENV=production
```

## 🔧 Après le déploiement

1. **Testez le serveur** : Ouvrez l'URL Railway dans un navigateur
2. **Configurez l'extension** :
   - Installez l'extension Firefox depuis : https://github.com/Cyril5C/web2epub
   - Dans les options, configurez l'URL de votre serveur Railway

## 📖 Documentation

- **Guide rapide** : [RAILWAY_QUICKSTART.md](../RAILWAY_QUICKSTART.md)
- **Guide complet** : [RAILWAY_DEPLOY.md](../RAILWAY_DEPLOY.md)
- **README principal** : [README.md](../README.md)

## 🧪 Tester que tout fonctionne

```bash
# Remplacez par votre URL
curl https://votre-app.up.railway.app/health
```

Réponse attendue :
```json
{"status":"ok","timestamp":"2025-..."}
```

## 📊 Logs

Pour voir ce qui se passe :

Railway → **Deployments** → Cliquez sur le déploiement actif

Vous devriez voir :
```
Storage configuration:
- Root: /data
- Uploads: /data/uploads
- Metadata: /data/metadata.json
Web2EPUB server running on http://0.0.0.0:XXXX
```

## 💡 Besoin d'aide ?

- **GitHub** : https://github.com/Cyril5C/web2epub
- **Issues** : https://github.com/Cyril5C/web2epub/issues

Bon déploiement ! 🚂✨
