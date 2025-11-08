#!/bin/bash

echo "🔍 Test rapide Web2EPUB"
echo "======================="
echo ""

# Test 1 : Serveur
echo -n "1. Serveur accessible... "
if curl -s http://localhost:3000/health | grep -q "ok"; then
    echo "✅"
else
    echo "❌"
    echo "   → Démarrez le serveur: cd server && npm start"
    exit 1
fi

# Test 2 : Fichiers extension
echo -n "2. Fichiers extension... "
if [ -f "manifest.json" ] && [ -f "background.js" ] && [ -f "content.js" ]; then
    echo "✅"
else
    echo "❌"
    exit 1
fi

# Test 3 : JSZip
echo -n "3. JSZip présent... "
if [ -f "lib/jszip.min.js" ]; then
    size=$(wc -c < "lib/jszip.min.js" | tr -d ' ')
    if [ "$size" -gt 90000 ]; then
        echo "✅ ($size bytes)"
    else
        echo "❌ Fichier trop petit ($size bytes)"
        exit 1
    fi
else
    echo "❌"
    exit 1
fi

# Test 4 : Icônes
echo -n "4. Icônes présentes... "
if [ -f "icons/icon-48.png" ] && [ -f "icons/icon-96.png" ]; then
    echo "✅"
else
    echo "❌"
    exit 1
fi

echo ""
echo "✅ Tous les fichiers sont OK !"
echo ""
echo "📝 Prochaines étapes pour diagnostiquer :"
echo ""
echo "1. Firefox : about:debugging#/runtime/this-firefox"
echo "2. Trouvez Web2EPUB"
echo "3. Cliquez 'Inspecter'"
echo "4. Regardez la console pour les erreurs"
echo ""
echo "5. Ou testez manuellement : Copiez cette commande dans la console de l'extension :"
echo ""
echo "browser.tabs.query({active: true, currentWindow: true}).then(tabs => browser.tabs.sendMessage(tabs[0].id, {action: 'extractArticle'}));"
echo ""
echo "📖 Guide complet : DEBUG.md"
