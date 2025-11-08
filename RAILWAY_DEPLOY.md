# 🚂 Déploiement sur Railway

Ce guide explique comment déployer le serveur Web2EPUB sur Railway.

## Pourquoi Railway ?

- ✅ Gratuit jusqu'à 500h/mois (largement suffisant)
- ✅ Déploiement automatique depuis GitHub
- ✅ HTTPS automatique
- ✅ URL publique accessible depuis n'importe où
- ✅ Stockage persistant disponible
- ✅ Variables d'environnement faciles à configurer

## Prérequis

1. Un compte GitHub (déjà fait ✓)
2. Un compte Railway (gratuit) : https://railway.app

## Étapes de déploiement

### 1. Créer un compte Railway

1. Allez sur https://railway.app
2. Cliquez sur "Start a New Project"
3. Connectez-vous avec GitHub
4. Autorisez Railway à accéder à vos dépôts

### 2. Déployer depuis GitHub

1. Dans Railway, cliquez sur **"New Project"**
2. Sélectionnez **"Deploy from GitHub repo"**
3. Choisissez le dépôt **`Cyril5C/web2epub`**
4. Railway détecte automatiquement Node.js et démarre le build

### 3. Configuration

#### Variables d'environnement

Railway configure automatiquement `PORT`, mais vous pouvez ajouter :

1. Dans Railway, cliquez sur votre projet
2. Allez dans l'onglet **"Variables"**
3. Ajoutez (optionnel) :

```
MAX_FILE_SIZE=52428800
NODE_ENV=production
```

#### Stockage persistant (Important !)

Par défaut, Railway utilise un stockage éphémère. Pour conserver vos EPUB :

1. Dans votre projet Railway, allez dans **"Settings"**
2. Cliquez sur **"Volumes"**
3. Créez un nouveau volume :
   - **Mount Path** : `/data`
   - **Size** : 1 GB (ou plus selon vos besoins)
4. Redéployez le projet

Le serveur utilisera automatiquement ce volume grâce à la variable `RAILWAY_VOLUME_MOUNT_PATH`.

### 4. Obtenir l'URL publique

1. Dans Railway, allez dans **"Settings"**
2. Section **"Domains"**
3. Cliquez sur **"Generate Domain"**
4. Railway génère une URL comme : `https://web2epub-production.up.railway.app`

**Notez cette URL**, vous en aurez besoin pour configurer l'extension !

### 5. Vérifier le déploiement

Testez que tout fonctionne :

```bash
# Remplacez par votre URL Railway
curl https://votre-app.up.railway.app/health
```

Vous devriez recevoir :
```json
{"status":"ok","timestamp":"2025-..."}
```

Ouvrez l'URL dans un navigateur pour voir l'interface web.

## Configuration de l'extension Firefox

Maintenant que le serveur est déployé, configurez l'extension :

1. Dans Firefox, ouvrez l'extension Web2EPUB
2. Allez dans **Options/Préférences**
3. Changez l'URL du serveur :
   ```
   https://votre-app.up.railway.app
   ```
4. Enregistrez

**C'est tout !** Vous pouvez maintenant :
- Sauvegarder des articles depuis n'importe quel ordinateur avec Firefox
- Accéder à vos EPUB depuis votre liseuse n'importe où (WiFi, 4G, etc.)

## Accès depuis votre liseuse

### Méthode 1 : Directement via l'URL Railway

```
https://votre-app.up.railway.app
```

Avantages :
- ✅ Accessible partout (WiFi, 4G)
- ✅ HTTPS sécurisé
- ✅ Pas de configuration réseau

### Méthode 2 : Domaine personnalisé (optionnel)

Si vous avez un domaine :

1. Dans Railway → **Settings** → **Domains**
2. Cliquez sur **"Custom Domain"**
3. Ajoutez votre domaine (ex: `epub.mondomaine.com`)
4. Configurez le DNS selon les instructions Railway
5. Railway configure automatiquement HTTPS

## Limites du plan gratuit Railway

- **500 heures/mois** d'exécution
- **500 MB RAM**
- **1 GB de stockage** (avec volume)
- **100 GB de bande passante**

Pour un usage personnel, c'est largement suffisant !

## Gestion des EPUB

### Voir les logs

Dans Railway :
1. Cliquez sur votre projet
2. Onglet **"Deployments"**
3. Cliquez sur le déploiement actif
4. Vous verrez les logs en temps réel

### Télécharger tous les EPUB

Via l'API :

```bash
# Récupérer la liste
curl https://votre-app.up.railway.app/api/epubs > epubs.json

# Télécharger chaque EPUB
jq -r '.[].id' epubs.json | while read id; do
  curl -O https://votre-app.up.railway.app/api/download/$id
done
```

### Backup automatique

Créez un script cron pour sauvegarder vos EPUB :

```bash
#!/bin/bash
# backup-railway.sh

URL="https://votre-app.up.railway.app"
BACKUP_DIR=~/backups/web2epub
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR

# Récupérer tous les EPUB
curl $URL/api/epubs | jq -r '.[].id' | while read id; do
  curl -s $URL/api/download/$id -o "$BACKUP_DIR/${id}.epub"
done

echo "Backup terminé: $BACKUP_DIR"
```

## Monitoring

### Vérifier l'état du serveur

```bash
# Depuis n'importe où
curl https://votre-app.up.railway.app/health
```

### Statistiques Railway

Dans Railway :
- **Metrics** : CPU, RAM, Réseau
- **Logs** : Tous les événements
- **Deployments** : Historique des déploiements

## Dépannage

### Le serveur ne démarre pas

1. Vérifiez les logs dans Railway
2. Vérifiez que `server/package.json` existe
3. Vérifiez que les dépendances sont installées

### Les EPUB disparaissent au redémarrage

Vous n'avez pas configuré le volume persistant :
1. Créez un volume (voir étape 3)
2. Redéployez le projet

### Erreur 502 Bad Gateway

Le serveur met du temps à démarrer (cold start) :
- Attendez 10-20 secondes
- Rafraîchissez la page

### L'extension ne peut pas envoyer les EPUB

1. Vérifiez l'URL dans les options de l'extension
2. Vérifiez que le serveur est accessible :
   ```bash
   curl https://votre-app.up.railway.app/health
   ```
3. Vérifiez les logs Railway pour les erreurs CORS

## Sécurité

### HTTPS

Railway fournit automatiquement HTTPS, vos données sont chiffrées.

### Authentification (optionnel)

Pour ajouter une authentification basique :

1. Ajoutez une variable d'environnement dans Railway :
   ```
   AUTH_TOKEN=votre-token-secret
   ```

2. Modifiez `server.js` pour vérifier le token (voir section avancée)

### Limiter les uploads

Railway n'a pas de protection DDoS native. Pour limiter :

```bash
# Dans Railway → Variables
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW=900000
```

## Mise à jour du serveur

Railway redéploie automatiquement quand vous pushez sur GitHub :

```bash
# Sur votre ordinateur
git add .
git commit -m "Amélioration du serveur"
git push origin main
```

Railway détecte le push et redéploie automatiquement ! 🚀

## Migration vers un autre service

Si vous voulez migrer vers un autre service plus tard :

### Télécharger vos données

```bash
# Backup des EPUB
curl https://votre-app.up.railway.app/api/epubs | \
  jq -r '.[].id' | \
  xargs -I {} curl -O https://votre-app.up.railway.app/api/download/{}

# Backup des métadonnées
curl https://votre-app.up.railway.app/api/epubs > metadata.json
```

### Déployer ailleurs

Le même code fonctionne sur :
- **Render** (similaire à Railway)
- **Fly.io** (plus technique)
- **Heroku** (payant maintenant)
- **Votre propre VPS** (DigitalOcean, etc.)

## Coûts

**Plan gratuit Railway :**
- 0€/mois pour usage personnel
- 500h/mois (suffisant pour 1 serveur 24/7 pendant ~20 jours)

**Si vous dépassez :**
- ~5€/mois pour usage illimité
- Paiement à l'usage

**Alternative gratuite illimitée :**
- Hébergez sur votre propre Raspberry Pi à la maison
- Utilisez ngrok pour l'exposer (gratuit)

## Support

- **Railway Docs** : https://docs.railway.app
- **Discord Railway** : https://discord.gg/railway
- **Issues GitHub** : https://github.com/Cyril5C/web2epub/issues

## Résumé : Checklist de déploiement

- [ ] Créer un compte Railway
- [ ] Connecter GitHub à Railway
- [ ] Déployer le projet web2epub
- [ ] Créer un volume persistant (1GB)
- [ ] Générer un domaine public
- [ ] Tester l'URL : `/health`
- [ ] Configurer l'extension Firefox avec la nouvelle URL
- [ ] Tester l'envoi d'un EPUB
- [ ] Vérifier l'accès depuis la liseuse

Temps estimé : **10 minutes** ⚡

---

**Prêt à déployer ?** Suivez les étapes ci-dessus et votre serveur sera en ligne en quelques minutes !
