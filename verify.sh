#!/bin/bash

echo "🔍 Vérification de l'installation Web2EPUB"
echo "=========================================="
echo ""

errors=0

# Check Node.js
echo -n "Node.js... "
if command -v node &> /dev/null; then
    version=$(node --version)
    echo "✅ $version"
else
    echo "❌ Non installé"
    errors=$((errors + 1))
fi

# Check npm
echo -n "npm... "
if command -v npm &> /dev/null; then
    version=$(npm --version)
    echo "✅ v$version"
else
    echo "❌ Non installé"
    errors=$((errors + 1))
fi

# Check JSZip
echo -n "JSZip... "
if [ -f "lib/jszip.min.js" ]; then
    size=$(wc -c < "lib/jszip.min.js" | tr -d ' ')
    if [ "$size" -gt 10000 ]; then
        echo "✅ Téléchargé ($size bytes)"
    else
        echo "⚠️  Fichier trop petit, peut-être corrompu"
        errors=$((errors + 1))
    fi
else
    echo "❌ Non trouvé"
    errors=$((errors + 1))
fi

# Check icons
echo -n "Icône SVG... "
if [ -f "icons/icon.svg" ]; then
    echo "✅ Présente"
else
    echo "⚠️  Non trouvée"
fi

# Check manifest
echo -n "Manifest... "
if [ -f "manifest.json" ]; then
    echo "✅ Présent"
else
    echo "❌ Non trouvé"
    errors=$((errors + 1))
fi

# Check server files
echo -n "Fichiers serveur... "
if [ -f "server/server.js" ] && [ -f "server/package.json" ]; then
    echo "✅ Présents"
else
    echo "❌ Manquants"
    errors=$((errors + 1))
fi

# Check server dependencies
echo -n "Dépendances serveur... "
if [ -d "server/node_modules" ]; then
    echo "✅ Installées"
else
    echo "⚠️  Non installées (lancez: cd server && npm install)"
    errors=$((errors + 1))
fi

# Check directories
echo -n "Répertoires requis... "
missing_dirs=()
for dir in lib icons server/public server/uploads; do
    if [ ! -d "$dir" ]; then
        missing_dirs+=("$dir")
    fi
done

if [ ${#missing_dirs[@]} -eq 0 ]; then
    echo "✅ Tous présents"
else
    echo "⚠️  Manquants: ${missing_dirs[*]}"
    mkdir -p "${missing_dirs[@]}"
    echo "   → Créés automatiquement"
fi

echo ""
echo "=========================================="

if [ $errors -eq 0 ]; then
    echo "✅ Installation complète ! Vous pouvez démarrer."
    echo ""
    echo "Prochaines étapes :"
    echo "  1. cd server && npm start"
    echo "  2. Ouvrir Firefox → about:debugging"
    echo "  3. Charger manifest.json"
    echo ""
    echo "Pour tester le serveur :"
    echo "  cd server && npm start &"
    echo "  curl http://localhost:3000/health"
    exit 0
else
    echo "❌ $errors erreur(s) détectée(s)"
    echo ""
    echo "Pour résoudre les problèmes :"
    echo "  ./install.sh"
    exit 1
fi
