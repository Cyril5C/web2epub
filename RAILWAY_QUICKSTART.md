# ⚡ Railway - Démarrage ultra-rapide

## En 5 minutes chrono

### 1️⃣ Créer un compte Railway (2 min)

1. Allez sur **https://railway.app**
2. Cliquez sur **"Start a New Project"**
3. Connectez-vous avec votre compte GitHub
4. Autorisez Railway

### 2️⃣ Déployer le projet (2 min)

1. Dans Railway, cliquez sur **"New Project"**
2. Sélectionnez **"Deploy from GitHub repo"**
3. Cherchez et sélectionnez **`Cyril5C/web2epub`**
4. Railway commence automatiquement le build et le déploiement

Attendez 1-2 minutes que le build se termine ✅

### 3️⃣ Ajouter le stockage persistant (1 min)

**Important !** Sans volume, vos EPUB disparaîtront au redémarrage.

1. Dans votre projet Railway, cliquez sur **"Settings"**
2. Section **"Volumes"** → **"New Volume"**
3. Configurez :
   - **Mount Path** : `/data`
   - **Size** : 1 GB (ou plus)
4. Cliquez sur **"Add"**
5. Railway redémarre automatiquement

### 4️⃣ Obtenir l'URL publique (30 sec)

1. Dans **"Settings"** → **"Networking"**
2. Cliquez sur **"Generate Domain"**
3. Railway génère une URL type : `https://web2epub-production.up.railway.app`

**📋 Copiez cette URL !**

### 5️⃣ Tester (30 sec)

Ouvrez l'URL dans votre navigateur :

```
https://votre-app.up.railway.app
```

Vous devriez voir la page Web2EPUB vide (c'est normal, pas d'articles encore) ✅

### 6️⃣ Configurer l'extension Firefox (1 min)

1. Ouvrez Firefox
2. Cliquez sur l'icône Web2EPUB
3. Allez dans **Options**
4. Collez votre URL Railway :
   ```
   https://votre-app.up.railway.app
   ```
5. **Enregistrer**

## ✅ C'est tout !

Vous pouvez maintenant :

- 📱 Sauvegarder des articles depuis n'importe quel ordinateur avec Firefox
- 📚 Accéder à vos EPUB depuis votre liseuse (WiFi, 4G, partout !)
- 🌍 Partager l'URL avec votre famille

## 🧪 Premier test

1. Ouvrez un article du Monde : https://www.lemonde.fr
2. Cliquez sur l'icône Web2EPUB
3. Attendez la notification de confirmation
4. Ouvrez votre URL Railway dans un navigateur
5. Votre article apparaît ! 🎉

## 📊 Vérifier l'utilisation

Dans Railway → **Metrics** :
- Utilisation CPU/RAM
- Temps d'exécution (500h/mois gratuit)
- Bande passante

## ⚙️ Variables d'environnement (optionnel)

Railway configure automatiquement `PORT`, mais vous pouvez ajouter :

Dans Railway → **Variables** :

```
MAX_FILE_SIZE=52428800
NODE_ENV=production
```

## 🔍 Voir les logs

Railway → **Deployments** → Cliquez sur le déploiement actif

Vous verrez :
```
Storage configuration:
- Root: /data
- Uploads: /data/uploads
- Metadata: /data/metadata.json
Created uploads directory
Web2EPUB server running on http://0.0.0.0:XXXX
```

## 🚨 Problèmes courants

### "502 Bad Gateway"
- Le serveur démarre (cold start)
- Attendez 10-20 secondes et rafraîchissez

### Les EPUB disparaissent
- Vous n'avez pas ajouté le volume
- Retournez à l'étape 3

### L'extension ne peut pas envoyer
- Vérifiez l'URL dans les options
- Testez l'URL dans un navigateur d'abord

## 📱 Accès depuis votre liseuse

Sur votre Kobo, Kindle, PocketBook, etc. :

1. Ouvrez le navigateur web intégré
2. Tapez votre URL Railway :
   ```
   https://votre-app.up.railway.app
   ```
3. Naviguez dans vos articles
4. Téléchargez et lisez !

## 💰 Coûts

**Plan gratuit** :
- 500 heures/mois (≈ 20 jours 24/7)
- 500 MB RAM
- 1 GB stockage (avec volume)
- 100 GB bande passante

**Si besoin de plus** :
- ~5€/mois pour usage illimité

**Astuce** : Le serveur dort quand il n'est pas utilisé, donc 500h/mois est très généreux !

## 🎯 Prochaines étapes

- [ ] Configurez un domaine personnalisé (optionnel)
- [ ] Activez les backups (via l'API Railway)
- [ ] Partagez l'URL avec votre famille

## 📚 Documentation complète

Pour plus de détails : [RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md)

---

**Temps total : 5-10 minutes** ⚡

**Résultat : Serveur EPUB accessible partout dans le monde** 🌍

Bon déploiement ! 🚀
