# Sécurité Web2EPUB

## Résumé de l'audit de sécurité

Date : 2025-11-08

### Protections mises en place

#### 1. Authentification HTTP Basic pour l'interface web
- La page publique `/` et tous les endpoints `/api/*` sont protégés par HTTP Basic Authentication
- Identifiants par défaut : `admin` / `epub2024`
- **IMPORTANT** : Changez ces identifiants en production !

#### 2. Protection API Key pour l'upload
- L'endpoint `/upload` nécessite une clé API via le header `X-API-Key`
- Clé par défaut : `web2epub-secret-key-change-me`
- **IMPORTANT** : Changez cette clé en production !

#### 3. Rate Limiting
- Upload : Max 20 requêtes par 15 minutes
- API : Max 100 requêtes par 15 minutes
- Protection contre les attaques par force brute

#### 4. Headers de sécurité (Helmet)
- Protection XSS
- Clickjacking protection
- MIME type sniffing prevention
- Autres headers de sécurité standards

#### 5. Validation des fichiers
- Seuls les fichiers EPUB sont acceptés (vérification mimetype)
- Taille maximale : 50 MB
- Noms de fichiers sanitisés

## Configuration de Production

### Variables d'environnement Railway

```bash
# Authentification web interface
WEB_USERNAME=votre-nom-utilisateur
WEB_PASSWORD=votre-mot-de-passe-fort

# Clé API pour l'extension
API_KEY=votre-cle-api-secrete-tres-longue

# Configuration serveur
HOST=0.0.0.0
PORT=3000
```

### Configuration de l'extension Firefox

1. Ouvrez les options de l'extension (clic droit sur l'icône > Options)
2. Configurez :
   - **URL du serveur** : https://votre-app.railway.app
   - **Clé API** : La même que celle configurée sur le serveur (variable `API_KEY`)

## Vulnérabilités corrigées

### Avant l'audit
1. ❌ Aucune authentification
2. ❌ CORS ouvert à tous
3. ❌ Pas de rate limiting
4. ❌ Pas de headers de sécurité
5. ❌ Logs exposant des chemins sensibles

### Après correction
1. ✅ HTTP Basic Auth + API Key
2. ✅ CORS maintenu mais protégé par auth
3. ✅ Rate limiting actif
4. ✅ Helmet activé
5. ✅ Logs minimisés

## Recommandations supplémentaires

### Pour une sécurité maximale

1. **HTTPS obligatoire en production** : Railway le fournit automatiquement

2. **Mots de passe forts** :
   - Utilisateur : Au moins 12 caractères, alphanumériques + symboles
   - API Key : Au moins 32 caractères aléatoires

3. **Rotation des clés** :
   - Changez régulièrement l'API key
   - Changez le mot de passe tous les 3-6 mois

4. **Monitoring** :
   - Surveillez les logs Railway pour détecter les tentatives d'accès
   - Activez les alertes Railway si disponibles

5. **Backups** :
   - Les fichiers sont perdus à chaque redéploiement (pas de volume persistant)
   - Téléchargez régulièrement vos EPUBs importants

## Tests de sécurité effectués

### Test 1 : Accès sans authentification
```bash
curl http://localhost:3000/
# Résultat : 401 Unauthorized ✅
```

### Test 2 : Accès avec authentification
```bash
curl -u admin:epub2024 http://localhost:3000/
# Résultat : 200 OK ✅
```

### Test 3 : API sans authentification
```bash
curl http://localhost:3000/api/epubs
# Résultat : 401 Unauthorized ✅
```

### Test 4 : Upload sans API key
```bash
curl -X POST -F "epub=@test.epub" http://localhost:3000/upload
# Résultat : 401 Unauthorized ✅
```

### Test 5 : Upload avec API key
```bash
curl -X POST -H "X-API-Key: web2epub-secret-key-change-me" -F "epub=@test.epub" http://localhost:3000/upload
# Résultat : 200 OK ✅
```

### Test 6 : Rate limiting
```bash
# 25 requêtes successives
# Résultat : 20 OK puis "Trop de requêtes" ✅
```

## Architecture de sécurité

```
┌─────────────────────────────────────────────────────────┐
│                   Extension Firefox                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  API Key stockée dans browser.storage.sync       │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTPS (Railway)
                   │ Header: X-API-Key
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Serveur Node.js (Railway)                   │
│                                                           │
│  ┌────────────────────────────────────────────────┐    │
│  │ Rate Limiter (express-rate-limit)              │    │
│  │  - Upload: 20/15min                             │    │
│  │  - API: 100/15min                               │    │
│  └────────────────────────────────────────────────┘    │
│                      ▼                                   │
│  ┌────────────────────────────────────────────────┐    │
│  │ API Key Validation (X-API-Key header)          │    │
│  │  - /upload endpoint                             │    │
│  └────────────────────────────────────────────────┘    │
│                      ▼                                   │
│  ┌────────────────────────────────────────────────┐    │
│  │ HTTP Basic Auth (express-basic-auth)           │    │
│  │  - / (interface web)                            │    │
│  │  - /api/* (API endpoints)                       │    │
│  └────────────────────────────────────────────────┘    │
│                      ▼                                   │
│  ┌────────────────────────────────────────────────┐    │
│  │ Helmet (Headers de sécurité)                    │    │
│  └────────────────────────────────────────────────┘    │
│                      ▼                                   │
│  ┌────────────────────────────────────────────────┐    │
│  │ Routes Express                                  │    │
│  │  - POST /upload                                 │    │
│  │  - GET /api/epubs                               │    │
│  │  - GET /api/download/:id                        │    │
│  │  - DELETE /api/epubs/:id                        │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Support

En cas de problème de sécurité, créez une issue sur le dépôt GitHub ou contactez l'administrateur.
