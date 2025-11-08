# 🌐 Options de déploiement Web2EPUB

Ce document compare les différentes options pour héberger le serveur Web2EPUB.

## Comparaison rapide

| Option | Difficulté | Coût | Accessible | HTTPS | Recommandé pour |
|--------|-----------|------|-----------|-------|-----------------|
| **Railway** ⭐ | Facile | Gratuit* | Partout | ✅ | Tout le monde |
| Local + ngrok | Facile | Gratuit* | Partout | ✅ | Tests temporaires |
| Local uniquement | Très facile | Gratuit | Réseau local | ❌ | Tests rapides |
| VPS (DigitalOcean, etc.) | Moyen | ~5€/mois | Partout | ✅ | Utilisateurs avancés |
| Raspberry Pi | Moyen | ~40€ one-time | Réseau local** | ❌ | Geeks DIY |

\* Limites d'utilisation gratuite
\** Peut être exposé avec ngrok ou port forwarding

## 1. Railway (Recommandé) ⭐

### Avantages
- ✅ Déploiement en 5 minutes
- ✅ Gratuit jusqu'à 500h/mois
- ✅ HTTPS automatique
- ✅ URL publique permanente
- ✅ Stockage persistant (avec volume)
- ✅ Redémarrage automatique
- ✅ Mise à jour automatique depuis GitHub

### Inconvénients
- ⚠️ Limite de 500h/mois (gratuit)
- ⚠️ Cold start (10-20s si inactif)
- ⚠️ Dépendant d'un service tiers

### Quand l'utiliser
- Vous voulez un accès depuis n'importe où
- Vous ne voulez pas gérer de serveur
- Usage personnel/familial

### Guide
📖 [RAILWAY_QUICKSTART.md](RAILWAY_QUICKSTART.md) (5 min)
📖 [RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md) (Guide complet)

---

## 2. Installation locale

### Avantages
- ✅ Gratuit et illimité
- ✅ Contrôle total
- ✅ Pas de limite de stockage
- ✅ Pas de dépendance externe

### Inconvénients
- ❌ Accessible uniquement sur le réseau local
- ❌ Pas de HTTPS
- ❌ Ordinateur doit être allumé
- ❌ Configuration réseau nécessaire pour liseuse

### Quand l'utiliser
- Tests rapides
- Usage uniquement à la maison
- Vous avez un ordinateur toujours allumé

### Guide
📖 [QUICKSTART.md](QUICKSTART.md)

```bash
./install.sh
cd server && npm start
```

---

## 3. Local + ngrok

### Avantages
- ✅ Accessible depuis partout
- ✅ HTTPS automatique
- ✅ Simple à configurer
- ✅ Gratuit (avec limites)

### Inconvénients
- ⚠️ URL change à chaque redémarrage (gratuit)
- ⚠️ Limite de requêtes (gratuit)
- ❌ Ordinateur doit être allumé

### Quand l'utiliser
- Tests d'accès distant
- Démo temporaire
- Avant de déployer sur Railway

### Guide

```bash
# Installer ngrok
brew install ngrok  # macOS
# ou télécharger depuis https://ngrok.com

# Démarrer le serveur
cd server && npm start

# Dans un autre terminal
ngrok http 3000

# Utiliser l'URL fournie (ex: https://abc123.ngrok.io)
```

---

## 4. VPS (DigitalOcean, AWS, etc.)

### Avantages
- ✅ Contrôle total
- ✅ Pas de limite d'utilisation
- ✅ Performances garanties
- ✅ Peut héberger d'autres services

### Inconvénients
- ❌ Payant (~5-10€/mois)
- ❌ Configuration technique
- ❌ Maintenance nécessaire

### Quand l'utiliser
- Usage intensif
- Beaucoup d'utilisateurs
- Vous avez déjà un VPS

### Guide

```bash
# Sur votre VPS
git clone https://github.com/Cyril5C/web2epub.git
cd web2epub
./install.sh

# Installer PM2 pour garder le serveur actif
npm install -g pm2
cd server
pm2 start server.js --name web2epub
pm2 startup
pm2 save

# Configurer nginx comme reverse proxy
# + Certificat SSL avec Let's Encrypt
```

📖 Voir [README.md](README.md) section "Option 2: Serveur avec IP publique"

---

## 5. Raspberry Pi

### Avantages
- ✅ Coût unique (~40€)
- ✅ Faible consommation électrique
- ✅ Contrôle total
- ✅ Peut tourner 24/7

### Inconvénients
- ❌ Configuration technique
- ❌ Accessible uniquement réseau local*
- ❌ Performances limitées
- ❌ Maintenance physique

\* Sauf avec port forwarding ou ngrok

### Quand l'utiliser
- Projet DIY
- Vous avez déjà un Raspberry Pi
- Vous aimez bricoler

### Guide

```bash
# Sur le Raspberry Pi
git clone https://github.com/Cyril5C/web2epub.git
cd web2epub
./install.sh

cd server
npm start

# Optionnel: Exposer avec ngrok
ngrok http 3000
```

---

## Tableau de décision

### Je veux juste tester rapidement
→ **Installation locale** (3 min)
📖 [QUICKSTART.md](QUICKSTART.md)

### Je veux y accéder depuis ma liseuse à la maison
→ **Installation locale** + IP locale (5 min)
📖 [QUICKSTART.md](QUICKSTART.md) section "Accès depuis votre liseuse"

### Je veux y accéder depuis n'importe où (WiFi, 4G)
→ **Railway** (5-10 min)
📖 [RAILWAY_QUICKSTART.md](RAILWAY_QUICKSTART.md)

### J'ai déjà un serveur/VPS
→ **VPS** (20 min)
📖 [README.md](README.md) section "Déploiement VPS"

### Je veux un projet DIY
→ **Raspberry Pi** + ngrok (30 min)
📖 README.md + Guide Raspberry Pi

---

## Migration entre options

### De Local → Railway
1. Déployez sur Railway
2. Téléchargez vos EPUB locaux
3. Uploadez-les manuellement via l'interface web Railway

### De Railway → VPS
1. Backup des EPUB via l'API
2. Déployez sur VPS
3. Uploadez les EPUB

### Backup général

```bash
# Sauvegarder tous les EPUB
curl https://votre-serveur/api/epubs | \
  jq -r '.[].id' | \
  xargs -I {} curl -O https://votre-serveur/api/download/{}
```

---

## Recommandation finale

Pour **99% des utilisateurs** :

1. **Commencez avec Railway** 🚂
   - 5 minutes de setup
   - Gratuit
   - Fonctionne partout

2. **Si besoin de plus**, migrez vers un VPS

**Pourquoi pas local ?**
- Votre liseuse doit être sur le même WiFi
- Votre ordinateur doit être allumé
- Configuration réseau nécessaire

**Railway c'est :**
- Zéro configuration
- Accessible depuis le WiFi du café, de l'hôtel, partout
- HTTPS sécurisé
- Gratuit pour usage personnel

---

## Questions fréquentes

### Puis-je utiliser plusieurs options en même temps ?
Oui ! Vous pouvez avoir :
- Railway pour accès distant
- Local pour tests

Changez simplement l'URL dans l'extension selon vos besoins.

### Combien d'EPUB puis-je stocker ?
- **Railway gratuit** : 1 GB (volume) = ~5000-20000 articles
- **Local/VPS** : Illimité (selon votre disque)

### Est-ce sécurisé ?
- **Railway** : HTTPS automatique ✅
- **ngrok** : HTTPS automatique ✅
- **Local** : HTTP seulement (OK pour réseau privé)
- **VPS** : Ajoutez Let's Encrypt pour HTTPS

### Que se passe-t-il si je dépasse 500h/mois sur Railway ?
Deux options :
1. Passer au plan payant (~5€/mois illimité)
2. Le serveur s'arrête jusqu'au mois suivant

**Astuce** : 500h = ~20 jours 24/7, largement suffisant car Railway dort quand le serveur est inactif !

---

**Choix recommandé : Railway** ⭐

**Temps de setup : 5 minutes**

**Commencez maintenant :** [RAILWAY_QUICKSTART.md](RAILWAY_QUICKSTART.md)
