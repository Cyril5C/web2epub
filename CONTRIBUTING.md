# Contribuer à Web2EPUB

Merci de votre intérêt pour contribuer à Web2EPUB !

## Comment contribuer

### Signaler un bug

1. Vérifiez que le bug n'a pas déjà été signalé
2. Ouvrez une nouvelle issue avec :
   - Description claire du problème
   - Étapes pour reproduire
   - Comportement attendu vs comportement actuel
   - Version de Firefox
   - Captures d'écran si pertinent

### Proposer une fonctionnalité

1. Ouvrez une issue pour discuter de la fonctionnalité
2. Expliquez le cas d'usage
3. Attendez les retours avant de commencer à coder

### Soumettre du code

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalite`)
3. Committez vos changements (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Poussez vers la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

## Ajouter un extracteur de site

Pour ajouter un extracteur spécifique pour un nouveau site :

1. Ouvrez [content.js](content.js)
2. Ajoutez votre fonction d'extraction :

```javascript
// Votre nouveau site
function extractVotreSite() {
  const article = {
    title: '',
    author: '',
    date: '',
    content: ''
  };

  // Sélecteurs CSS spécifiques à votre site
  const titleEl = document.querySelector('.votre-selecteur-titre');
  if (titleEl) {
    article.title = titleEl.textContent.trim();
  }

  // ... autres champs

  return article;
}
```

3. Ajoutez la détection dans `extractArticle()` :

```javascript
if (domain.includes('votresite.com')) {
  article = extractVotreSite();
}
```

4. Testez sur plusieurs articles du site
5. Soumettez une PR avec des exemples d'URLs de test

## Standards de code

### JavaScript
- Utilisez ES6+ (const/let, arrow functions, async/await)
- Commentez le code complexe
- Nommage explicite des variables
- Pas de console.log en production (sauf erreurs)

### Commits
- Messages en français ou anglais
- Format : `Type: Description courte`
- Types : `Feature`, `Fix`, `Refactor`, `Docs`, `Style`, `Test`

Exemples :
```
Feature: Ajout extracteur pour lefigaro.fr
Fix: Correction du bug d'upload pour les gros fichiers
Docs: Mise à jour du README avec infos déploiement
```

## Architecture

Consultez [ARCHITECTURE.md](ARCHITECTURE.md) pour comprendre la structure du projet.

## Tests

Avant de soumettre :

```bash
# Vérifier l'installation
./verify.sh

# Tester le serveur
cd server
npm test

# Tester l'extension manuellement
# (pas de tests automatisés pour l'instant)
```

## License

En contribuant, vous acceptez que vos contributions soient sous licence MIT.

## Questions

N'hésitez pas à ouvrir une issue pour toute question !
