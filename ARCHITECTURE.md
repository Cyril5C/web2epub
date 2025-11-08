# Architecture de Web2EPUB

## Vue d'ensemble

Web2EPUB est composé de deux parties principales :
1. **Extension Firefox** : Capture et convertit les articles en EPUB
2. **Serveur Node.js** : Stocke et sert les fichiers EPUB

```
┌─────────────────────────────────────────────────────────────┐
│                        NAVIGATEUR                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Extension Firefox                       │   │
│  │                                                      │   │
│  │  ┌──────────────┐      ┌──────────────┐            │   │
│  │  │  Content     │      │  Background  │            │   │
│  │  │  Script      │─────▶│  Script      │            │   │
│  │  │              │      │              │            │   │
│  │  │  - Extrait   │      │  - Génère    │            │   │
│  │  │    contenu   │      │    EPUB      │            │   │
│  │  │              │      │  - Envoie    │            │   │
│  │  └──────────────┘      └──────┬───────┘            │   │
│  │                               │                     │   │
│  └───────────────────────────────┼─────────────────────┘   │
└─────────────────────────────────┼─────────────────────────┘
                                  │ HTTP POST /upload
                                  ▼
                    ┌─────────────────────────────┐
                    │      Serveur Node.js         │
                    │                              │
                    │  ┌────────────────────────┐ │
                    │  │   Express Server       │ │
                    │  │                        │ │
                    │  │  - Reçoit EPUB         │ │
                    │  │  - Stocke fichiers     │ │
                    │  │  - Sert page web       │ │
                    │  └────────────────────────┘ │
                    │                              │
                    │  ┌────────────────────────┐ │
                    │  │   Stockage             │ │
                    │  │                        │ │
                    │  │  uploads/              │ │
                    │  │  metadata.json         │ │
                    │  └────────────────────────┘ │
                    └─────────────────────────────┘
                                  │
                                  │ HTTP GET /
                                  ▼
                    ┌─────────────────────────────┐
                    │     Page Web (Liseuse)       │
                    │                              │
                    │  - Liste des EPUB            │
                    │  - Téléchargement            │
                    │  - Recherche                 │
                    └─────────────────────────────┘
```

## Composants de l'extension

### 1. Content Script ([content.js](content.js))

**Rôle** : S'exécute dans le contexte de la page web visitée

**Fonctions principales** :
- Écoute les messages du background script
- Extrait le contenu de l'article via différentes stratégies :
  - Extracteurs spécifiques (Le Monde, Mediapart)
  - Extracteur générique basé sur les patterns communs
  - Algorithme de détection du contenu principal
- Nettoie le HTML (supprime pub, scripts, etc.)
- Convertit les URLs relatives en absolues

**Communication** :
```javascript
browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'extractArticle') {
    return { article: extractedData };
  }
});
```

### 2. Background Script ([background.js](background.js))

**Rôle** : S'exécute en arrière-plan, gère la logique métier

**Fonctions principales** :
- Écoute les clics sur l'icône de l'extension
- Demande l'extraction au content script
- Génère le fichier EPUB avec JSZip
- Envoie l'EPUB au serveur
- Affiche les notifications

**Dépendances** :
- JSZip (chargé via manifest)

**Structure EPUB générée** :
```
epub.epub
├── mimetype
├── META-INF/
│   └── container.xml
└── OEBPS/
    ├── content.opf
    ├── toc.ncx
    └── content.xhtml
```

### 3. Options UI ([options.html](options.html), [options.js](options.js))

**Rôle** : Interface de configuration

**Paramètres** :
- URL du serveur
- (Extensible pour futurs paramètres)

**Stockage** :
- Utilise `browser.storage.sync` pour synchroniser entre appareils

## Composants du serveur

### 1. Serveur Express ([server/server.js](server/server.js))

**Rôle** : API REST et serveur de fichiers statiques

**Routes** :

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/upload` | Upload d'un fichier EPUB |
| GET | `/api/epubs` | Liste de tous les EPUB |
| GET | `/api/download/:id` | Télécharge un EPUB spécifique |
| DELETE | `/api/epubs/:id` | Supprime un EPUB |
| GET | `/health` | Health check |
| GET | `/` | Page web principale |

**Middleware** :
- `multer` : Gestion des uploads de fichiers
- `cors` : Activation du CORS pour l'extension
- `express.static` : Servir les fichiers statiques

**Stockage** :
```
server/
├── uploads/           # Fichiers EPUB
│   └── timestamp_filename.epub
└── metadata.json      # Index des fichiers
```

### 2. Page Web ([server/public/index.html](server/public/index.html))

**Rôle** : Interface utilisateur pour consulter les EPUB

**Fonctionnalités** :
- Affichage en grille des EPUB
- Recherche en temps réel
- Statistiques (nombre, taille totale)
- Téléchargement direct
- Suppression
- Design responsive

**Technologies** :
- HTML5/CSS3
- JavaScript vanilla (pas de framework)
- Fetch API pour communiquer avec le serveur

## Flux de données

### 1. Sauvegarde d'un article

```
1. Utilisateur clique sur l'icône
   │
2. Background → Content Script : "extractArticle"
   │
3. Content Script extrait le contenu
   │
4. Content Script → Background : données de l'article
   │
5. Background génère EPUB avec JSZip
   │
6. Background envoie EPUB au serveur (POST /upload)
   │
7. Serveur stocke le fichier et met à jour metadata.json
   │
8. Serveur → Background : confirmation
   │
9. Background affiche notification de succès
```

### 2. Consultation sur la liseuse

```
1. Utilisateur accède à http://serveur:3000
   │
2. Serveur sert index.html
   │
3. JavaScript charge la liste (GET /api/epubs)
   │
4. Serveur renvoie metadata.json
   │
5. Interface affiche les EPUB
   │
6. Utilisateur clique sur "Télécharger"
   │
7. Navigateur télécharge (GET /api/download/:id)
   │
8. Liseuse ouvre le fichier EPUB
```

## Format de données

### Article extrait

```javascript
{
  title: "Titre de l'article",
  author: "Auteur",
  date: "Date de publication",
  content: "<html>...</html>",
  url: "https://...",
  domain: "lemonde.fr",
  extractedAt: "2025-01-08T..."
}
```

### Métadonnées EPUB (metadata.json)

```javascript
[
  {
    id: "1234567890",
    filename: "1234567890_article.epub",
    originalName: "article.epub",
    title: "Titre de l'article",
    size: 12345,
    uploadedAt: "2025-01-08T...",
    path: "/path/to/uploads/1234567890_article.epub"
  }
]
```

## Sécurité

### Considérations actuelles

⚠️ **Version de développement** - Non sécurisé pour production

**Risques** :
- Pas d'authentification
- Pas de validation stricte des fichiers
- CORS ouvert à tous
- Pas de rate limiting

### Recommandations pour la production

1. **Authentification** :
```javascript
// Exemple avec JWT
app.use('/api', authenticateJWT);
```

2. **Validation des fichiers** :
```javascript
// Vérifier que c'est vraiment un EPUB
const isValidEpub = await validateEpubStructure(file);
```

3. **CORS restrictif** :
```javascript
app.use(cors({
  origin: ['chrome-extension://...', 'https://votredomaine.com']
}));
```

4. **Rate limiting** :
```javascript
const rateLimit = require('express-rate-limit');
app.use('/upload', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));
```

5. **HTTPS obligatoire**

## Évolutions possibles

### Court terme
- [ ] Support des images dans les EPUB
- [ ] Extraction multi-pages
- [ ] Collections/tags
- [ ] Mode sombre

### Moyen terme
- [ ] Authentification multi-utilisateurs
- [ ] Synchronisation cloud
- [ ] API publique
- [ ] Application mobile

### Long terme
- [ ] Annotations
- [ ] Partage social
- [ ] IA pour résumés
- [ ] Support d'autres formats (PDF, MOBI)

## Performance

### Métriques actuelles
- Extraction : ~500ms
- Génération EPUB : ~200ms
- Upload : ~100ms (réseau local)
- **Total** : ~800ms

### Optimisations possibles
- Cache des extracteurs
- Compression des EPUB
- CDN pour la distribution
- Service worker pour offline

## Tests

### Tests manuels recommandés
1. Extraction sur différents sites
2. Upload avec fichiers volumineux
3. Téléchargement sur différentes liseuses
4. Recherche avec beaucoup d'EPUB
5. Suppression et récupération

### Tests automatisés à implémenter
```bash
npm test  # Test du serveur
```

Futurs tests :
- Tests unitaires (Jest)
- Tests d'intégration (Supertest)
- Tests E2E de l'extension (web-ext)
