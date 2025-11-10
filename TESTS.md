# Plan de Tests - Web2EPUB

## ✅ Vérifications Automatiques

- [x] **Syntaxe JavaScript** : Aucune erreur détectée dans background.js, content.js, server.js

## 📋 Tests Manuels à Effectuer

### 1. Test de Base - Ajout d'Article via Menu Contextuel

**Objectif** : Vérifier que le menu contextuel fonctionne et ajoute correctement un article

**Étapes** :
1. Ouvrir Firefox et charger l'extension (about:debugging -> Load Temporary Add-on)
2. Naviguer vers un article du Monde, Mediapart ou Liberation
3. Clic droit → "Ajouter à la compilation EPUB"
4. Vérifier :
   - ✅ Notification système "Article ajouté"
   - ✅ Alerte violette en haut à droite de la page
   - ✅ Texte "1 article(s) dans la compilation"

**Résultat attendu** : L'article est ajouté sans erreur

---

### 2. Test Raccourci Clavier

**Objectif** : Vérifier que Ctrl+Shift+E (ou Cmd+Shift+E sur Mac) fonctionne

**Étapes** :
1. Sur un article de presse
2. Appuyer sur **Ctrl+Shift+E** (Windows/Linux) ou **Cmd+Shift+E** (Mac)
3. Vérifier :
   - ✅ Notification système
   - ✅ Alerte sur la page
   - ✅ Compteur incrémenté

**Résultat attendu** : Même comportement que le menu contextuel

---

### 3. Test Extraction d'Images - Liberation.fr

**Objectif** : Vérifier que les images de liberation.fr sont bien téléchargées (nouveau fix)

**Étapes** :
1. Aller sur https://www.liberation.fr (n'importe quel article avec images)
2. Ajouter l'article à la compilation
3. Ouvrir la console du navigateur (F12 → Console)
4. Chercher les logs :
   ```
   Processing article 1: "..." - Found X images
   [1/X] Downloading: https://www.liberation.fr/resizer/...
   ✓ [1/X] Saved as image_1.jpg (image/jpeg, XX.XKB)
   ```

**Vérifications** :
- ✅ Les images sont détectées (`Found X images`)
- ✅ Les images sont téléchargées (messages `✓ Saved as...`)
- ❌ Pas de messages `✗ Failed`

**Résultat attendu** : Les images avec URL `/resizer/v2/` sont téléchargées

---

### 4. Test Génération EPUB Multi-Articles

**Objectif** : Vérifier que l'EPUB se génère correctement avec plusieurs articles

**Étapes** :
1. Ajouter 3 articles différents à la compilation
2. Cliquer sur l'icône de l'extension
3. Cliquer sur "Exporter la compilation (3 articles)"
4. Attendre la génération
5. Vérifier :
   - ✅ Notification "EPUB sauvegardé avec succès"
   - ✅ Fichier EPUB créé sur le serveur

**Console à surveiller** :
```
Processing article 1: "..." - Found X images
Processing article 2: "..." - Found Y images
Processing article 3: "..." - Found Z images
Creating cover with XX images
✓ Cover image created
EPUB uploaded: Compilation 3 articles
```

**Résultat attendu** : EPUB généré sans erreur

---

### 5. Test Couverture Mosaïque

**Objectif** : Vérifier que la couverture mosaïque se génère avec les images des articles

**Étapes** :
1. Générer un EPUB avec au moins 2-3 articles contenant des images
2. Télécharger l'EPUB depuis l'interface web
3. Ouvrir l'EPUB avec un lecteur (Calibre, Adobe Digital Editions, etc.)
4. Vérifier :
   - ✅ Page de couverture présente
   - ✅ Mosaïque d'images visible
   - ✅ Texte avec les sources et la date

**Résultat attendu** : Couverture mosaïque créée correctement

---

### 6. Test Gestion d'Erreurs

**Objectif** : Vérifier que les erreurs sont bien gérées et notifiées à l'utilisateur

**Scénario 1 - Article sans contenu** :
1. Essayer d'ajouter une page non-article (ex: page d'accueil)
2. Vérifier :
   - ✅ Notification d'erreur affichée
   - ✅ Message clair : "❌ Erreur Web2EPUB"
   - ✅ Pas de crash de l'extension

**Scénario 2 - Serveur inaccessible** :
1. Arrêter le serveur (Ctrl+C dans le terminal)
2. Essayer d'exporter un EPUB
3. Vérifier :
   - ✅ Notification d'erreur
   - ✅ Message explicite (fetch failed, etc.)

**Résultat attendu** : Erreurs capturées et affichées proprement

---

### 7. Test Extracteur Liberation.fr (Nouveau)

**Objectif** : Vérifier que l'extracteur spécifique Liberation fonctionne

**Étapes** :
1. Aller sur un article Liberation.fr
2. Ouvrir la console (F12)
3. Ajouter l'article
4. Chercher dans la console :
   ```
   Web2EPUB content script loaded
   Extracting article from: www.liberation.fr
   ```

**Vérifications** :
- ✅ Pas de log "Liberation extractor failed, trying generic..."
- ✅ Titre, auteur, date extraits correctement
- ✅ Contenu de l'article présent

**Si échec** : Le fallback vers l'extracteur générique doit fonctionner

**Résultat attendu** : Article extrait avec l'extracteur spécifique

---

### 8. Test Helper Functions (Refactoring)

**Objectif** : Vérifier que les nouvelles fonctions helper fonctionnent correctement

**À vérifier dans la console** :
```javascript
// Dans la console de débogage de l'extension (about:debugging)
// Pas d'erreurs de type :
// - "extractImageSource is not defined"
// - "downloadImage is not defined"
// - "processArticleImages is not defined"
// - "buildChapterXhtml is not defined"
```

**Résultat attendu** : Aucune erreur "is not defined"

---

### 9. Test Validation Serveur (Nouveau)

**Objectif** : Vérifier que la validation des données serveur fonctionne

**Scénario - Données invalides** :
1. Modifier temporairement `background.js` pour envoyer des données invalides :
   ```javascript
   // Dans sendToServer, ajouter des données incorrectes
   formData.append('title', 'x'.repeat(600)); // Titre trop long
   ```
2. Essayer d'exporter un EPUB
3. Vérifier :
   - ✅ Erreur retournée par le serveur
   - ✅ Message "Données invalides"

**Résultat attendu** : Validation bloque les données invalides

---

## 🔍 Checklist Finale

Avant de valider que tout fonctionne :

- [ ] **Aucune erreur dans la console** du navigateur
- [ ] **Aucune erreur dans la console** du serveur Node.js
- [ ] **Toutes les notifications** s'affichent correctement
- [ ] **Les images** sont bien téléchargées et intégrées
- [ ] **Les EPUB** s'ouvrent correctement dans un lecteur
- [ ] **La couverture** mosaïque est générée
- [ ] **Les erreurs** sont gérées gracieusement (pas de crash)

---

## 📊 Résultats des Tests

Remplis au fur et à mesure :

| Test | Statut | Commentaires |
|------|--------|--------------|
| 1. Menu contextuel | ⏳ | |
| 2. Raccourci clavier | ⏳ | |
| 3. Images Liberation.fr | ⏳ | |
| 4. EPUB multi-articles | ⏳ | |
| 5. Couverture mosaïque | ⏳ | |
| 6. Gestion erreurs | ⏳ | |
| 7. Extracteur Liberation | ⏳ | |
| 8. Helper functions | ⏳ | |
| 9. Validation serveur | ⏳ | |

Légende : ✅ Réussi | ❌ Échoué | ⏳ À tester

---

## 🐛 En cas de Problème

Si un test échoue :

1. **Ouvrir la console** (F12) et copier le message d'erreur
2. **Vérifier les logs** du serveur Node.js
3. **Reproduire** le problème pour confirmer
4. **Noter** : Quel test ? Quel navigateur ? Quel article ?

## 🔄 Retour Arrière

Si besoin de revenir en arrière :
```bash
git log --oneline -5
git checkout <commit-avant-refactor>
```

Commits récents :
- `f86c601` - Refactor: Amélioration bonnes pratiques (ACTUEL)
- `f4526be` - Fix: Images Liberation.fr
- `5ba88cf` - Fix: Couverture mosaïque
