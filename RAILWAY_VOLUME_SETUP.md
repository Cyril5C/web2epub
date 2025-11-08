# 💾 Configuration du volume persistant Railway

## Pourquoi un volume persistant ?

Par défaut, Railway utilise un **système de fichiers éphémère**. Cela signifie que :
- ❌ Vos EPUB seront **supprimés** à chaque redémarrage/redéploiement
- ❌ Vous perdrez tous vos articles sauvegardés

Avec un volume persistant :
- ✅ Vos EPUB sont **conservés** même après redémarrage
- ✅ Les données survivent aux mises à jour
- ✅ Stockage permanent et fiable

## 📋 Prérequis

- Avoir déployé le projet sur Railway
- Être connecté à votre tableau de bord Railway

## 🎯 Méthode 1 : Via l'interface Railway (Recommandé)

### Étape 1 : Accéder à votre projet

```
1. Allez sur https://railway.app
2. Connectez-vous
3. Cliquez sur votre projet "web2epub"
```

### Étape 2 : Sélectionner le service

```
┌─────────────────────────────────────┐
│  web2epub                           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  web2epub (service)         │ ← Cliquez ici
│  │  Node.js                    │
│  │  ● Running                  │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Étape 3 : Aller dans Settings

```
Onglets en haut :
┌──────────┬──────────┬──────────┬───────────┐
│ Overview │ Metrics  │ Settings │ Variables │
└──────────┴──────────┴──────────┴───────────┘
                         ↑ Cliquez ici
```

### Étape 4 : Trouver la section Volumes

Scrollez jusqu'à voir :

```
┌─────────────────────────────────────┐
│ 💾 Volumes                          │
│                                     │
│ Add persistent storage to your      │
│ service                             │
│                                     │
│ ┌─────────────────────────────┐    │
│ │  + New Volume               │ ← Cliquez ici
│ └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Étape 5 : Configurer le volume

Un formulaire apparaît :

```
┌─────────────────────────────────────┐
│ Create Volume                       │
├─────────────────────────────────────┤
│                                     │
│ Mount Path *                        │
│ ┌─────────────────────────────┐    │
│ │ /data                       │ ← Tapez "/data"
│ └─────────────────────────────┘    │
│                                     │
│ Size (GB) *                         │
│ ┌─────────────────────────────┐    │
│ │ 1                           │ ← Mettez 1 (ou plus)
│ └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────┐    │
│ │      Add Volume             │ ← Cliquez ici
│ └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Étape 6 : Redémarrage automatique

Railway va :
1. ✅ Créer le volume
2. ✅ Redémarrer le service
3. ✅ Monter le volume sur `/data`

Vous verrez :

```
┌─────────────────────────────────────┐
│ 💾 Volumes                          │
├─────────────────────────────────────┤
│ ✅ /data (1 GB)                     │
│    Created just now                 │
│    0% used                          │
└─────────────────────────────────────┘
```

### Étape 7 : Vérifier dans les logs

Allez dans **Deployments** → Cliquez sur le déploiement actif

Vous devriez voir dans les logs :

```
Storage configuration:
- Root: /data
- Uploads: /data/uploads
- Metadata: /data/metadata.json
Created uploads directory
Web2EPUB server running on http://0.0.0.0:XXXX
```

✅ **Parfait ! Le volume est configuré.**

## 🎯 Méthode 2 : Via railway.toml (Automatique)

Le fichier `railway.toml` a déjà été ajouté au projet. Railway le détecte automatiquement.

### Vérification

1. Après le prochain déploiement, allez dans **Settings** → **Volumes**
2. Le volume devrait apparaître automatiquement

Si ce n'est pas le cas, utilisez la Méthode 1.

## 📊 Gestion du volume

### Voir l'utilisation

Dans **Settings** → **Volumes** :

```
/data (1 GB)
├─ Used: 45.2 MB (4.5%)
└─ Available: 954.8 MB
```

### Augmenter la taille

1. Cliquez sur le volume existant
2. Modifiez la taille
3. Railway redimensionne automatiquement (sans perte de données)

### Supprimer un volume

⚠️ **Attention** : Supprime TOUS les EPUB !

1. Cliquez sur le volume
2. Cliquez sur "Delete Volume"
3. Confirmez

## 🔧 Tailles de volume recommandées

| Usage | Taille recommandée | Capacité approximative |
|-------|-------------------|----------------------|
| **Tests** | 500 MB | ~2500-10000 articles |
| **Personnel** | 1 GB | ~5000-20000 articles |
| **Familial** | 2-5 GB | ~10000-100000 articles |
| **Intensif** | 10+ GB | 200000+ articles |

**Note** : Un article EPUB = 50-200 KB en moyenne

## ✅ Vérifier que ça fonctionne

### Test 1 : Sauvegarder un article

1. Configurez l'extension avec votre URL Railway
2. Sauvegardez un article
3. Vérifiez qu'il apparaît dans l'interface web

### Test 2 : Redémarrer le service

1. Dans Railway, allez dans **Deployments**
2. Cliquez sur "⋯" → **Restart**
3. Attendez que le service redémarre
4. Ouvrez l'interface web
5. ✅ Votre article est toujours là !

### Test 3 : Redéployer le projet

1. Faites un changement et poussez sur GitHub
2. Railway redéploie automatiquement
3. Ouvrez l'interface web
4. ✅ Vos articles sont conservés !

## 🐛 Dépannage

### Le volume n'apparaît pas

1. Vérifiez que vous êtes dans **Settings** du bon service
2. Rafraîchissez la page
3. Utilisez la Méthode 1 pour créer manuellement

### Les EPUB disparaissent toujours

Vérifiez les logs pour voir si le volume est monté :

```bash
# Devrait afficher "/data" et non le répertoire du projet
Storage configuration:
- Root: /data  ← Doit être /data
```

Si ça affiche autre chose, le volume n'est pas monté. Recréez-le.

### Erreur "Cannot write to /data"

Permissions incorrectes. Dans Railway :
1. Supprimez le volume
2. Recréez-le avec Mount Path : `/data`

### Le volume est plein

1. Téléchargez tous les EPUB (backup)
2. Supprimez les anciens articles via l'interface web
3. Ou augmentez la taille du volume

## 💰 Coûts

| Plan | Stockage inclus | Coût supplémentaire |
|------|----------------|-------------------|
| **Gratuit** | 1 GB | - |
| **Developer** | 100 GB | ~0.25€/GB/mois |

**1 GB gratuit** est largement suffisant pour un usage personnel !

## 📦 Backup des données du volume

### Via l'API

```bash
# Backup de tous les EPUB
RAILWAY_URL="https://votre-app.railway.app"

# Créer un dossier de backup
mkdir -p backup-$(date +%Y%m%d)

# Récupérer les métadonnées
curl $RAILWAY_URL/api/epubs > backup-$(date +%Y%m%d)/metadata.json

# Télécharger tous les EPUB
cat backup-$(date +%Y%m%d)/metadata.json | \
  jq -r '.[].id' | \
  while read id; do
    curl -o "backup-$(date +%Y%m%d)/${id}.epub" \
         "$RAILWAY_URL/api/download/${id}"
  done

echo "Backup terminé dans backup-$(date +%Y%m%d)/"
```

### Automatiser le backup (optionnel)

Créez un cron job sur votre ordinateur :

```bash
# Éditer crontab
crontab -e

# Ajouter (backup tous les dimanches à 2h du matin)
0 2 * * 0 /chemin/vers/backup-script.sh
```

## 🎓 En résumé

1. **Méthode simple** : Settings → Volumes → New Volume → `/data` → 1 GB
2. **Vérification** : Logs doivent afficher "Root: /data"
3. **Test** : Sauvegardez un article → Redémarrez → Article toujours présent

**Durée** : 2 minutes

**Sans volume** = Perte de données ❌
**Avec volume** = Données permanentes ✅

---

**Besoin d'aide ?** Ouvrez une issue : https://github.com/Cyril5C/web2epub/issues
