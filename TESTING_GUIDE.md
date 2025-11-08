# 🧪 Guide de test Web2EPUB

## Vue d'ensemble

Ce guide vous explique comment tester complètement l'extension Web2EPUB.

## 📋 Prérequis

- ✅ Firefox installé
- ✅ Node.js installé (v18+)
- ✅ Repository cloné

## 🚀 Test local complet (15 minutes)

### Étape 1 : Installation (3 min)

```bash
# Dans le dossier web2epub
./install.sh
```

Vous devriez voir :
```
✅ Installation terminée avec succès !
```

### Étape 2 : Vérification (30 sec)

```bash
./verify.sh
```

Tout doit être ✅ vert.

### Étape 3 : Démarrer le serveur (30 sec)

```bash
cd server
npm start
```

Vous devriez voir :
```
Storage configuration:
- Root: /Users/.../web2epub/server
- Uploads: /Users/.../web2epub/server/uploads
- Metadata: /Users/.../web2epub/server/metadata.json
Web2EPUB server running on http://localhost:3000
```

✅ **Le serveur est démarré !**

### Étape 4 : Tester le serveur (1 min)

Ouvrez un nouvel onglet terminal et testez :

```bash
# Test de santé
curl http://localhost:3000/health

# Résultat attendu :
# {"status":"ok","timestamp":"2025-..."}
```

Ouvrez dans un navigateur : http://localhost:3000

Vous devriez voir :
```
┌─────────────────────────────────┐
│    📚 Mes EPUB                  │
│    Votre bibliothèque           │
│                                 │
│    📖                           │
│    Aucun EPUB pour le moment    │
│                                 │
│    Utilisez l'extension...      │
└─────────────────────────────────┘
```

✅ **L'interface web fonctionne !**

### Étape 5 : Installer l'extension Firefox (3 min)

1. **Ouvrez Firefox**

2. **Tapez dans la barre d'adresse :**
   ```
   about:debugging
   ```

3. **Cliquez sur "Ce Firefox"** (menu de gauche)

4. **Cliquez sur "Charger un module complémentaire temporaire"**

5. **Naviguez jusqu'au dossier web2epub**

6. **Sélectionnez le fichier :** `manifest.json`

7. **L'extension apparaît** :
   ```
   Web2EPUB
   Extension interne
   [Inspecter] [Retirer]
   ```

✅ **L'extension est installée !**

### Étape 6 : Vérifier l'icône de l'extension (30 sec)

Regardez la barre d'outils Firefox :
- Une nouvelle icône devrait apparaître (puzzle piece ou icône de l'extension)
- Si elle n'est pas visible, cliquez sur le bouton "Extensions" (puzzle)

### Étape 7 : Configurer l'extension (1 min)

1. **Cliquez droit sur l'icône de l'extension**
2. **Sélectionnez "Gérer l'extension"**
3. **Cliquez sur "Préférences" ou "Options"**

Vous devriez voir :
```
┌─────────────────────────────────┐
│ Web2EPUB - Configuration        │
│                                 │
│ URL du serveur                  │
│ [http://localhost:3000        ] │
│                                 │
│ Local : http://localhost:3000   │
│ Railway : https://...           │
│                                 │
│ [Enregistrer]                   │
└─────────────────────────────────┘
```

L'URL par défaut (`http://localhost:3000`) est déjà correcte ✅

Cliquez sur **Enregistrer** pour confirmer.

### Étape 8 : Test d'extraction (5 min)

#### Test 1 : Article du Monde

1. **Ouvrez un article** : https://www.lemonde.fr
   - Choisissez n'importe quel article

2. **Cliquez sur l'icône Web2EPUB** dans la barre d'outils

3. **Attendez la notification** (5-10 secondes) :
   ```
   Web2EPUB
   Article "..." sauvegardé en EPUB
   ```

4. **Vérifiez dans l'interface web** :
   - Ouvrez http://localhost:3000
   - Votre article devrait apparaître !

✅ **L'extraction fonctionne !**

#### Test 2 : Article Mediapart (si vous êtes abonné)

1. Ouvrez : https://www.mediapart.fr
2. Cliquez sur un article
3. Cliquez sur l'icône Web2EPUB
4. Vérifiez la notification et l'interface web

#### Test 3 : Site générique (Wikipedia)

1. Ouvrez : https://fr.wikipedia.org/wiki/EPUB
2. Cliquez sur l'icône Web2EPUB
3. Vérifiez que l'article est sauvegardé

### Étape 9 : Test de téléchargement (1 min)

Dans l'interface web (http://localhost:3000) :

1. **Cliquez sur "Télécharger"** sous un article
2. **Le fichier .epub est téléchargé**
3. **Ouvrez-le avec un lecteur EPUB** :
   - Mac : Books (iBooks)
   - Windows : Calibre, Edge
   - Linux : Foliate, Calibre

✅ **Le téléchargement fonctionne !**

### Étape 10 : Test de recherche (30 sec)

Dans l'interface web :

1. **Tapez dans la barre de recherche** : un mot du titre
2. **L'article est filtré en temps réel**

✅ **La recherche fonctionne !**

### Étape 11 : Test de suppression (30 sec)

1. **Cliquez sur "Supprimer"** sous un article
2. **Confirmez la suppression**
3. **L'article disparaît de la liste**

✅ **La suppression fonctionne !**

## 🌐 Test avec Railway (optionnel)

Si vous voulez tester le déploiement Railway :

### Étape 1 : Déployer sur Railway

Suivez : [RAILWAY_QUICKSTART.md](RAILWAY_QUICKSTART.md) (5-10 min)

### Étape 2 : Configurer l'extension

1. Options de l'extension
2. Changez l'URL : `https://votre-app.railway.app`
3. Enregistrez

### Étape 3 : Tester

1. Sauvegardez un article
2. Ouvrez l'URL Railway dans un navigateur
3. Vérifiez que l'article apparaît

✅ **Le déploiement Railway fonctionne !**

## 🧪 Tests avancés

### Test de persistance (après redémarrage serveur)

```bash
# Arrêter le serveur
# Ctrl+C dans le terminal du serveur

# Redémarrer
cd server && npm start

# Ouvrir http://localhost:3000
# ✅ Les articles sont toujours là
```

### Test avec plusieurs articles

1. Sauvegardez 5-10 articles différents
2. Vérifiez que tous apparaissent
3. Testez la recherche avec différents mots-clés
4. Vérifiez les statistiques (nombre d'articles, espace utilisé)

### Test d'erreur (connexion serveur)

1. Arrêtez le serveur (Ctrl+C)
2. Essayez de sauvegarder un article
3. ✅ Vous devriez voir une notification d'erreur

### Test de gros article

1. Ouvrez un article très long (ex: article Wikipedia détaillé)
2. Sauvegardez-le
3. Vérifiez qu'il se télécharge correctement
4. Ouvrez-le dans un lecteur EPUB

## 📱 Test sur liseuse (optionnel)

### Avec serveur local

1. **Trouvez l'IP de votre ordinateur** :
   ```bash
   # Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # Résultat : inet 192.168.1.42 (par exemple)
   ```

2. **Sur votre liseuse** (même WiFi) :
   - Ouvrez le navigateur
   - Allez à `http://192.168.1.42:3000`
   - Téléchargez un article
   - Ouvrez-le dans l'app de lecture

### Avec Railway

1. Sur votre liseuse (n'importe quel WiFi/4G)
2. Ouvrez `https://votre-app.railway.app`
3. Téléchargez et lisez

## 🐛 Débogage

### L'extension ne s'affiche pas

```bash
# Vérifiez dans about:debugging
# L'extension doit être listée sous "Extensions temporaires"
```

### Erreur "Impossible d'extraire l'article"

- Vérifiez que vous êtes sur une page d'article (pas page d'accueil)
- Essayez de rafraîchir la page
- Certains sites avec beaucoup de JavaScript peuvent ne pas fonctionner

### Erreur "Erreur lors de l'envoi au serveur"

```bash
# Vérifiez que le serveur tourne
curl http://localhost:3000/health

# Vérifiez l'URL dans les options de l'extension
# Doit être exactement : http://localhost:3000
```

### Les logs de l'extension

1. `about:debugging`
2. Cliquez sur "Inspecter" sous Web2EPUB
3. Ouvrez l'onglet "Console"
4. Vous verrez les logs en temps réel

### Les logs du serveur

Le terminal où vous avez lancé `npm start` affiche tous les événements :
```
POST /upload - Article sauvegardé
GET /api/epubs - Liste récupérée
GET /api/download/123 - Article téléchargé
```

## ✅ Checklist de test complet

- [ ] Installation réussie (`./install.sh`)
- [ ] Vérification OK (`./verify.sh`)
- [ ] Serveur démarre
- [ ] Health check répond
- [ ] Interface web accessible
- [ ] Extension installée dans Firefox
- [ ] Options configurées
- [ ] Article du Monde extrait et sauvegardé
- [ ] Article Wikipedia extrait
- [ ] Téléchargement EPUB fonctionne
- [ ] EPUB s'ouvre dans un lecteur
- [ ] Recherche fonctionne
- [ ] Suppression fonctionne
- [ ] Persistance après redémarrage serveur
- [ ] (Optionnel) Test sur liseuse
- [ ] (Optionnel) Déploiement Railway

## 🎓 Résumé rapide

**Installation :**
```bash
./install.sh
cd server && npm start
```

**Firefox :**
```
about:debugging → Ce Firefox → Charger manifest.json
```

**Test :**
```
1. Ouvrir lemonde.fr
2. Cliquer sur un article
3. Cliquer sur icône Web2EPUB
4. Vérifier sur http://localhost:3000
```

**Temps total :** 15 minutes

**Résultat attendu :**
- ✅ Articles sauvegardés en EPUB
- ✅ Accessibles via interface web
- ✅ Téléchargeables et lisibles

## 📊 Métriques de test

**Performance attendue :**
- Extraction : 500ms - 2s
- Génération EPUB : 200ms - 500ms
- Upload : 100ms - 500ms
- **Total** : < 3 secondes

**Si ça prend plus de 10 secondes**, vérifiez :
- La connexion réseau
- Les logs du serveur
- Les logs de l'extension (console)

## 🎉 Test réussi !

Si tous les tests passent, félicitations ! 🎊

Votre extension Web2EPUB fonctionne parfaitement.

**Prochaines étapes :**
- Déployez sur Railway pour un accès distant
- Partagez avec votre famille
- Ajoutez vos sites préférés dans les extracteurs

## ❓ Besoin d'aide ?

- **GitHub Issues** : https://github.com/Cyril5C/web2epub/issues
- **Documentation** : [README.md](README.md)
- **Exemples** : [EXAMPLES.md](EXAMPLES.md)

Bons tests ! 🚀
