# 📚 Web2EPUB - Résumé du projet

## Qu'est-ce que Web2EPUB ?

Une extension Firefox qui transforme n'importe quel article web en fichier EPUB, avec un serveur pour y accéder depuis votre liseuse.

## ✨ Fonctionnalités principales

✅ Extraction intelligente du contenu des articles
✅ Conversion automatique en EPUB
✅ Support spécifique pour Le Monde et Mediapart
✅ Extracteur générique pour tous les autres sites
✅ Serveur Node.js pour stocker vos EPUB
✅ Interface web élégante pour parcourir vos articles
✅ Recherche et filtrage
✅ Compatible avec toutes les liseuses

## 🚀 Installation rapide

```bash
./install.sh
cd server && npm start
```

Puis chargez `manifest.json` dans Firefox (about:debugging).

## 📖 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Démarrage en 3 minutes
- **[README.md](README.md)** - Documentation complète
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architecture technique
- **[EXAMPLES.md](EXAMPLES.md)** - Exemples d'utilisation
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guide de contribution

## 📂 Structure

```
web2epub/
├── Extension Firefox (manifest.json, *.js, *.html)
├── Serveur Node.js (server/)
├── Documentation (*.md)
└── Scripts d'installation (*.sh)
```

## 🎯 Parcours utilisateur

1. **Sur ordinateur** : Visite un article → Clic sur l'icône → Article sauvegardé
2. **Sur liseuse** : Ouvre http://serveur:3000 → Télécharge l'EPUB → Lit l'article

## 🔧 Technologies

- **Frontend** : JavaScript ES6+, WebExtensions API
- **Backend** : Node.js, Express, Multer
- **Format** : EPUB (via JSZip)

## 📊 État du projet

✅ **Fonctionnel** - Prêt à être utilisé
⚠️  **Développement** - Non sécurisé pour production publique

## 🤝 Contribution

Ouvrez une issue ou une PR sur GitHub !

## 📜 Licence

MIT License - Libre d'utilisation

---

**Créé avec ❤️ pour les amateurs de lecture**
