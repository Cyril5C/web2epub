#!/bin/bash

echo "🧪 Test automatique Web2EPUB"
echo "============================"
echo ""

errors=0

# Test 1: Health check
echo -n "Test 1: Serveur accessible... "
if curl -s http://localhost:3000/health | grep -q "ok"; then
    echo "✅"
else
    echo "❌ Le serveur ne répond pas"
    echo "   Lancez: cd server && npm start"
    errors=$((errors + 1))
fi

# Test 2: Interface web
echo -n "Test 2: Interface web... "
if curl -s http://localhost:3000 | grep -q "Mes EPUB"; then
    echo "✅"
else
    echo "❌"
    errors=$((errors + 1))
fi

# Test 3: API liste
echo -n "Test 3: API /api/epubs... "
if curl -s http://localhost:3000/api/epubs | grep -q "\["; then
    echo "✅"
else
    echo "❌"
    errors=$((errors + 1))
fi

# Test 4: Fichiers extension
echo -n "Test 4: Fichiers extension... "
if [ -f "manifest.json" ] && [ -f "background.js" ] && [ -f "content.js" ]; then
    echo "✅"
else
    echo "❌"
    errors=$((errors + 1))
fi

# Test 5: JSZip
echo -n "Test 5: JSZip téléchargé... "
if [ -f "lib/jszip.min.js" ]; then
    size=$(wc -c < "lib/jszip.min.js" | tr -d ' ')
    if [ "$size" -gt 10000 ]; then
        echo "✅"
    else
        echo "❌ Fichier trop petit"
        errors=$((errors + 1))
    fi
else
    echo "❌ Non trouvé"
    errors=$((errors + 1))
fi

# Test 6: Configuration serveur
echo -n "Test 6: Configuration serveur... "
if [ -f "server/.env" ] || [ -f "server/.env.example" ]; then
    echo "✅"
else
    echo "⚠️  Pas de fichier .env (optionnel)"
fi

echo ""
echo "============================"

if [ $errors -eq 0 ]; then
    echo "✅ Tous les tests passent !"
    echo ""
    echo "📝 Prochaines étapes :"
    echo "   1. Ouvrir Firefox"
    echo "   2. Aller à about:debugging"
    echo "   3. Charger manifest.json"
    echo "   4. Tester sur lemonde.fr"
    echo ""
    echo "📖 Guide complet : TESTING_GUIDE.md"
    exit 0
else
    echo "❌ $errors test(s) échoué(s)"
    echo ""
    echo "Pour corriger :"
    echo "   ./install.sh"
    echo "   cd server && npm start"
    exit 1
fi
