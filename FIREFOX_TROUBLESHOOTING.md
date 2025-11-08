# 🔧 Dépannage Firefox - Web2EPUB

## L'icône n'apparaît pas dans la barre d'outils

### Solution 1 : Épingler l'extension

1. **Cliquez sur l'icône "Extensions"** (puzzle 🧩) dans la barre d'outils Firefox
   - Généralement en haut à droite, à côté de l'icône de profil

2. **Vous voyez la liste de vos extensions**
   - Web2EPUB devrait être dans la liste

3. **Cliquez sur l'icône d'engrenage** ⚙️ à côté de "Web2EPUB"

4. **Sélectionnez "Épingler à la barre d'outils"**

✅ L'icône apparaît maintenant !

### Solution 2 : Utiliser le menu Extensions

Même sans icône épinglée, vous pouvez utiliser l'extension :

1. **Allez sur un article** (lemonde.fr, etc.)
2. **Cliquez sur l'icône Extensions** (puzzle 🧩)
3. **Cliquez sur "Web2EPUB"** dans la liste
4. L'extraction démarre !

### Solution 3 : Vérifier que l'extension est chargée

1. **Ouvrez :** `about:debugging#/runtime/this-firefox`

2. **Cherchez dans "Extensions temporaires" :**
   ```
   📦 Web2EPUB
   Extension interne
   Manifest Version: 2

   [Inspecter] [Recharger] [Retirer]
   ```

3. **Si l'extension n'apparaît PAS :**
   - Cliquez sur **"Charger un module complémentaire temporaire"**
   - Naviguez jusqu'au dossier web2epub
   - Sélectionnez `manifest.json`
   - Cliquez sur "Ouvrir"

### Solution 4 : Recharger l'extension

Si l'extension est chargée mais ne fonctionne pas :

1. Dans `about:debugging#/runtime/this-firefox`
2. Trouvez Web2EPUB
3. Cliquez sur **"Recharger"**
4. Essayez à nouveau sur un article

### Solution 5 : Vérifier les erreurs

1. Dans `about:debugging#/runtime/this-firefox`
2. Trouvez Web2EPUB
3. Cliquez sur **"Inspecter"**
4. Ouvrez l'onglet **"Console"**
5. Vérifiez s'il y a des erreurs en rouge

**Erreurs courantes :**

#### Erreur : "JSZip is not defined"
JSZip n'est pas chargé.

**Solution :**
```bash
# Télécharger JSZip
curl -o lib/jszip.min.js https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js

# Ou relancer l'installation
./install.sh
```

#### Erreur : "Failed to fetch"
Le serveur n'est pas accessible.

**Solution :**
```bash
# Vérifier que le serveur tourne
curl http://localhost:3000/health

# Si ça ne répond pas, démarrer le serveur
cd server && npm start
```

## L'extension ne s'exécute pas

### Cas 1 : Rien ne se passe au clic

**Vérifications :**

1. **Vous êtes sur une page d'article ?**
   - ❌ Page d'accueil / liste d'articles
   - ✅ Page d'un article spécifique

2. **Le serveur tourne ?**
   ```bash
   curl http://localhost:3000/health
   # Devrait répondre : {"status":"ok","timestamp":"..."}
   ```

3. **L'URL est configurée ?**
   - Clic droit sur l'icône → "Gérer l'extension" → "Préférences"
   - Vérifier : `http://localhost:3000`

### Cas 2 : Erreur dans la notification

**"Impossible d'extraire l'article"**

Causes possibles :
- Vous n'êtes pas sur une page d'article
- Le site utilise beaucoup de JavaScript dynamique
- Le contenu est derrière un paywall non contournable

**Solution :**
- Essayez sur un autre article
- Testez sur Wikipedia (fonctionne toujours)
- Vérifiez les logs : `about:debugging` → Inspecter → Console

**"Erreur lors de l'envoi au serveur"**

Causes possibles :
- Le serveur n'est pas démarré
- L'URL dans les options est incorrecte
- Problème de CORS

**Solution :**
```bash
# 1. Vérifier le serveur
curl http://localhost:3000/health

# 2. Vérifier les logs du serveur
# Dans le terminal où tourne npm start, vous devriez voir les requêtes

# 3. Vérifier l'URL dans les options
# Doit être exactement : http://localhost:3000
```

## Options de l'extension

### Accéder aux options

**Méthode 1 :**
1. Clic droit sur l'icône Web2EPUB
2. "Gérer l'extension"
3. Onglet "Préférences"

**Méthode 2 :**
1. `about:addons`
2. Cherchez Web2EPUB
3. Cliquez dessus
4. Onglet "Préférences"

**Méthode 3 :**
1. `about:debugging#/runtime/this-firefox`
2. Trouvez Web2EPUB
3. Cliquez sur "Inspecter"
4. Dans la console, tapez :
   ```javascript
   browser.runtime.openOptionsPage()
   ```

### Valeurs recommandées

**URL du serveur :**
- Local : `http://localhost:3000`
- Railway : `https://votre-app.railway.app`

⚠️ Pas de `/` à la fin !
✅ `http://localhost:3000`
❌ `http://localhost:3000/`

## Problèmes de permissions

### Erreur : "Extension doesn't have permission to access this page"

Certains sites sont protégés par Firefox :

Sites interdits :
- `about:*` pages
- `addons.mozilla.org`
- Pages Firefox internes

**Solution :** Testez sur un site normal (lemonde.fr, wikipedia.org, etc.)

### Erreur : "Content Security Policy"

Le site bloque les extensions.

**Solution :** Testez sur un autre site. Certains sites très sécurisés bloquent toutes les extensions.

## Logs et débogage

### Voir les logs de l'extension

**Background script (génération EPUB) :**
1. `about:debugging#/runtime/this-firefox`
2. Web2EPUB → "Inspecter"
3. Onglet "Console"

Vous verrez :
```
Web2EPUB extension loaded
Article extracted: "Titre de l'article"
EPUB generated
Upload successful
```

**Content script (extraction contenu) :**
1. Sur une page d'article
2. F12 (Outils développeur)
3. Onglet "Console"

Filtrez par "Web2EPUB" pour voir uniquement les logs de l'extension.

### Tester l'extraction manuellement

Dans la console de la page (F12) :

```javascript
// Envoyer un message au content script
browser.runtime.sendMessage({action: 'extractArticle'})
  .then(response => console.log(response))
  .catch(error => console.error(error));
```

## Réinstaller l'extension

Si rien ne fonctionne :

1. **Supprimer l'extension :**
   - `about:debugging#/runtime/this-firefox`
   - Web2EPUB → "Retirer"

2. **Vérifier les fichiers :**
   ```bash
   ./verify.sh
   ```

3. **Recharger l'extension :**
   - "Charger un module complémentaire temporaire"
   - Sélectionner `manifest.json`

4. **Tester :**
   ```bash
   ./test.sh
   ```

## Créer des icônes PNG (si SVG ne fonctionne pas)

Si Firefox ne charge pas l'icône SVG :

```bash
# Ouvrir le générateur d'icônes dans un navigateur
open icons/create-icon.html

# Ou avec Firefox
firefox icons/create-icon.html
```

Puis :
1. Cliquez sur les liens pour télécharger les PNG
2. Déplacez-les dans le dossier `icons/`
3. Rechargez l'extension

## Extension temporaire vs permanente

**Extension temporaire :**
- ✅ Facile à installer
- ❌ Disparaît au redémarrage de Firefox
- ❌ Doit être rechargée à chaque session

**Extension permanente :**
- ✅ Reste installée
- ❌ Plus complexe (nécessite signature ou Firefox Developer Edition)

**Pour rendre l'extension permanente :**

Option 1 : Firefox Developer Edition
1. Téléchargez Firefox Developer Edition
2. Dans `about:config`, activez `xpinstall.signatures.required` → `false`
3. Installez normalement

Option 2 : Créer un .xpi signé
1. Créez un compte développeur Mozilla
2. Soumettez l'extension pour signature
3. Installez le .xpi signé

## Raccourcis clavier (optionnel)

Vous pouvez ajouter un raccourci clavier dans `manifest.json` :

```json
"commands": {
  "_execute_browser_action": {
    "suggested_key": {
      "default": "Ctrl+Shift+E"
    }
  }
}
```

Puis rechargez l'extension.

## Questions fréquentes

**Q : L'extension fonctionne-t-elle en navigation privée ?**
A : Par défaut non. Pour activer :
- `about:addons` → Web2EPUB → "Autoriser en navigation privée"

**Q : Peut-on avoir plusieurs instances ?**
A : Non, une seule instance par profil Firefox.

**Q : Fonctionne sur Firefox Android ?**
A : Oui, mais l'interface est différente. Suivez le guide Firefox Android.

**Q : Combien de temps l'extraction prend-elle ?**
A : 2-5 secondes en moyenne :
- Extraction : ~500ms
- Génération EPUB : ~200ms
- Upload : ~100ms

## Besoin d'aide ?

1. **Vérifiez les logs** (Console)
2. **Relancez le serveur** (`cd server && npm start`)
3. **Rechargez l'extension** (`about:debugging` → Recharger)
4. **Testez sur Wikipedia** (toujours fonctionnel)
5. **Ouvrez une issue** : https://github.com/Cyril5C/web2epub/issues

---

**Checklist de dépannage rapide :**

- [ ] Serveur démarré (`curl http://localhost:3000/health`)
- [ ] Extension chargée (`about:debugging`)
- [ ] Options configurées (URL correcte)
- [ ] Sur une page d'article (pas la page d'accueil)
- [ ] Pas d'erreurs dans la console
- [ ] JSZip téléchargé (`ls lib/jszip.min.js`)

Si tout est ✅, l'extension devrait fonctionner !
