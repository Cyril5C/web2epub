# 🐛 Guide de débogage - Extension ne fonctionne pas

## ✅ Le serveur fonctionne

Le serveur est OK : http://localhost:3000

## 🔍 Étapes de diagnostic

### Étape 1 : Vérifier les erreurs dans la console de l'extension

**Ouvrir la console de l'extension :**

1. Firefox : `about:debugging#/runtime/this-firefox`
2. Trouvez "Web2EPUB"
3. Cliquez "Inspecter" (bouton à droite)
4. Une fenêtre DevTools s'ouvre
5. Regardez l'onglet "Console"

**Que chercher :**

```
✅ "Web2EPUB extension loaded" → Extension chargée
❌ Messages ROUGES → Erreurs
```

**Erreurs communes :**

| Erreur | Cause | Solution |
|--------|-------|----------|
| `JSZip is not defined` | JSZip ne charge pas | `./install.sh` puis recharger |
| `Failed to load resource: icons/icon-48.png` | Icône manquante | Les icônes existent, recharger |
| `browser is not defined` | Mauvais contexte | Vérifier manifest.json |

### Étape 2 : Tester le content script

**Sur la page de l'article du Monde :**

1. Appuyez sur `F12` (ouvre DevTools de la PAGE)
2. Onglet "Console"
3. Tapez :

```javascript
typeof browser
```

**Résultat attendu :** `"object"`

**Si "undefined" :** Le content script ne se charge pas sur cette page.

### Étape 3 : Test manuel complet

**Dans la console de l'extension (about:debugging → Inspecter) :**

Tapez cette commande complète :

```javascript
browser.tabs.query({active: true, currentWindow: true}).then(async (tabs) => {
  console.log('Onglet actif:', tabs[0].url);

  try {
    const response = await browser.tabs.sendMessage(tabs[0].id, {action: 'extractArticle'});
    console.log('✅ Extraction réussie:', response);
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
});
```

**Résultats possibles :**

1. **✅ "Extraction réussie"** → Extension fonctionne ! Le problème est juste l'icône.
2. **❌ "Could not establish connection"** → Content script ne s'injecte pas.
3. **❌ "Impossible d'extraire"** → Extraction échoue pour ce site.
4. **❌ Autre erreur** → Voir le message pour diagnostiquer.

### Étape 4 : Vérifier les fichiers

```bash
# Vérifier que tous les fichiers existent
ls -la manifest.json background.js content.js lib/jszip.min.js icons/icon-48.png

# Vérifier la taille de JSZip (doit être > 90KB)
ls -lh lib/jszip.min.js
```

**Tailles attendues :**
- `jszip.min.js` : ~95-100 KB
- `icon-48.png` : ~1-2 KB

## 🔧 Solutions selon l'erreur

### Si "JSZip is not defined"

```bash
# Retélécharger JSZip
curl -o lib/jszip.min.js https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js

# Recharger l'extension dans Firefox
# about:debugging → Recharger
```

### Si "Content script ne s'injecte pas"

Le content script ne se charge peut-être pas sur certaines pages.

**Test sur Wikipedia (fonctionne toujours) :**

1. Ouvrez : https://fr.wikipedia.org/wiki/EPUB
2. F12 → Console
3. Tapez : `typeof browser`
4. Devrait retourner `"object"`

Si ça fonctionne sur Wikipedia mais pas Le Monde → Problème de permissions.

### Si "browser is not defined" dans content script

Vérifier le manifest.json :

```json
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }
]
```

### Si l'extraction échoue

L'article du Monde peut avoir changé de structure HTML.

**Test sur un site simple :**
1. Ouvrez : https://fr.wikipedia.org/wiki/EPUB
2. Testez l'extraction
3. Si ça marche → Le problème est spécifique au Monde

## 🧪 Test de base complet

**Commande tout-en-un pour tester :**

```bash
# Vérifier les fichiers
echo "=== Fichiers ===" && \
ls -lh manifest.json background.js content.js lib/jszip.min.js icons/icon-48.png && \
echo "" && \
echo "=== Serveur ===" && \
curl -s http://localhost:3000/health && \
echo "" && \
echo "Si tout est ✅, le problème vient de l'injection du content script"
```

## 📝 Checklist

Cochez ce qui fonctionne :

- [ ] Serveur répond à http://localhost:3000/health
- [ ] Extension visible dans about:debugging
- [ ] Aucune erreur rouge dans console extension
- [ ] JSZip se charge (vérifier console extension)
- [ ] Content script s'injecte (`typeof browser` → "object")
- [ ] Extraction manuelle fonctionne (voir Étape 3)

## 🎯 Prochaine étape

**Faites l'Étape 1** (console de l'extension) et dites-moi :

1. Y a-t-il des erreurs ROUGES ?
2. Si oui, copiez le message exact
3. Si non, passez à l'Étape 3 (test manuel)

Avec ces informations, je pourrai identifier le problème exact ! 🔍
