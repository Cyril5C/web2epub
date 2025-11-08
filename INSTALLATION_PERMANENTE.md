# 🔧 Installation permanente de Web2EPUB

## Pourquoi l'extension "temporaire" disparaît ?

Les extensions temporaires dans Firefox normal :
- ❌ Disparaissent au redémarrage de Firefox
- ❌ Doivent être rechargées à chaque session
- ✅ Parfaites pour le développement

## Solutions pour une installation permanente

### ⭐ Option 1 : Firefox Developer Edition (RECOMMANDÉ)

**Avantages :**
- ✅ Simple
- ✅ Garde l'extension installée après redémarrage
- ✅ Parfait pour le développement
- ✅ Pas besoin de signature

**Installation :**

1. **Téléchargez Firefox Developer Edition :**
   ```
   https://www.mozilla.org/fr/firefox/developer/
   ```

2. **Installez-le** (peut coexister avec Firefox normal)

3. **Lancez Firefox Developer Edition**

4. **Chargez l'extension :**
   - Tapez : `about:debugging#/runtime/this-firefox`
   - Cliquez "Charger un module complémentaire temporaire"
   - Sélectionnez `manifest.json`

5. **✅ L'extension reste installée** même après redémarrage !

---

### Option 2 : Désactiver la vérification des signatures (Risqué)

⚠️ **Pas recommandé** - Désactive la sécurité de Firefox

**Dans Firefox normal :**

1. Tapez : `about:config`
2. Acceptez le risque
3. Cherchez : `xpinstall.signatures.required`
4. Double-cliquez pour passer à `false`
5. Installez le fichier `web2epub.xpi`

**Problème :** Désactive la sécurité pour TOUTES les extensions.

---

### Option 3 : Signer l'extension via Mozilla (Pour publication)

**Pour publier sur addons.mozilla.org :**

1. **Créez un compte développeur Mozilla**
   - https://addons.mozilla.org/developers/

2. **Obtenez vos clés API**
   - https://addons.mozilla.org/developers/addon/api/key/

3. **Installez web-ext :**
   ```bash
   npm install -g web-ext
   ```

4. **Signez l'extension :**
   ```bash
   web-ext sign \
     --api-key=VOTRE_CLE_API \
     --api-secret=VOTRE_SECRET_API
   ```

5. **Installez le .xpi signé** dans Firefox

**Temps estimé :** 30-60 minutes

**Guide complet :**
https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/

---

### Option 4 : Installation manuelle du .xpi (Temporaire aussi)

Le fichier `web2epub.xpi` a été créé, mais :

**Dans Firefox normal :**
- ❌ Nécessite une signature Mozilla
- ❌ Firefox bloquera l'installation

**Dans Firefox Developer Edition :**
- ✅ Peut être installé sans signature
- ✅ Reste après redémarrage

**Installation :**
1. Ouvrez Firefox Developer Edition
2. Glissez-déposez `web2epub.xpi` dans Firefox
3. Cliquez "Ajouter"

---

## 🎯 Quelle option choisir ?

### Pour le développement / usage personnel :
→ **Firefox Developer Edition** (Option 1)
- Gratuit, simple, sécurisé
- 5 minutes d'installation

### Pour partager avec d'autres :
→ **Publier sur addons.mozilla.org** (Option 3)
- Prend du temps mais accessible à tous
- Signature automatique par Mozilla

### Pour un usage temporaire :
→ **Extension temporaire** (ce que vous avez maintenant)
- Rechargez à chaque session
- about:debugging → Charger

---

## 📦 Fichier web2epub.xpi créé

Le fichier `web2epub.xpi` est déjà créé dans le dossier du projet.

**Utilisation :**

### Avec Firefox Developer Edition :
```bash
# Ouvrir directement dans Firefox Dev Edition
open -a "Firefox Developer Edition" web2epub.xpi
```

### Avec Firefox ESR (Extended Support Release) :
Firefox ESR permet aussi d'installer des extensions non signées.

### Avec Firefox normal :
Ne fonctionnera pas sans signature Mozilla.

---

## 🔄 Mettre à jour l'extension

### Avec extension temporaire :
1. Modifiez le code
2. about:debugging → Recharger

### Avec Firefox Developer Edition :
1. Modifiez le code
2. Recréez le .xpi :
   ```bash
   zip -r web2epub.xpi manifest.json background.js content.js options.html options.js icons/ lib/jszip.min.js
   ```
3. Glissez-déposez le nouveau .xpi dans Firefox

---

## 🚀 Automatiser avec web-ext

Pour le développement, utilisez `web-ext` :

**Installation :**
```bash
npm install -g web-ext
```

**Lancer l'extension :**
```bash
web-ext run
```

Cela ouvre Firefox avec l'extension automatiquement chargée.

**Avantages :**
- ✅ Rechargement automatique
- ✅ Pas besoin de recharger manuellement
- ✅ Console intégrée

**Avec Firefox Developer Edition :**
```bash
web-ext run --firefox="/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox"
```

---

## 📝 Résumé : Installation permanente en 5 minutes

**Méthode la plus simple :**

1. **Téléchargez Firefox Developer Edition**
   ```
   https://www.mozilla.org/fr/firefox/developer/
   ```

2. **Installez et lancez-le**

3. **Glissez-déposez le fichier dans Firefox :**
   ```bash
   open -a "Firefox Developer Edition" web2epub.xpi
   ```

4. **Cliquez "Ajouter"**

✅ **Terminé !** L'extension reste installée de façon permanente.

---

## 🔍 Vérifier l'installation

Dans Firefox Developer Edition :

1. Tapez : `about:addons`
2. Cherchez "Web2EPUB"
3. Elle devrait être listée comme "Extension"

L'icône devrait maintenant apparaître dans la barre d'outils !

---

## 🛠️ Développement continu

Pour développer confortablement :

**Terminal 1 :** Serveur
```bash
cd server && npm start
```

**Terminal 2 :** web-ext (auto-reload)
```bash
web-ext run --firefox="/path/to/firefox-dev"
```

Modifiez le code → Sauvegardez → Extension rechargée automatiquement !

---

## 📚 Ressources

- **Firefox Developer Edition :** https://www.mozilla.org/firefox/developer/
- **web-ext :** https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/
- **Signature :** https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/
- **Publication :** https://addons.mozilla.org/developers/

---

## ❓ Questions fréquentes

**Q : Puis-je installer dans Firefox normal sans signer ?**
R : Non, sauf si vous désactivez la vérification (non recommandé).

**Q : Firefox Developer Edition est-il gratuit ?**
R : Oui, totalement gratuit et open source.

**Q : L'extension fonctionnera sur tous mes ordinateurs ?**
R : Si vous la publiez sur addons.mozilla.org, oui. Sinon, installez sur chaque machine.

**Q : Puis-je avoir Firefox normal ET Developer Edition ?**
R : Oui, ils coexistent sans problème.

**Q : Comment partager avec ma famille ?**
R : Publiez sur addons.mozilla.org ou donnez-leur le .xpi + Firefox Developer Edition.

---

**Prochaine étape recommandée :**

👉 **Téléchargez Firefox Developer Edition et installez web2epub.xpi**

C'est la solution la plus simple et rapide ! 🚀
