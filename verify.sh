#!/bin/bash
# Script de vérification automatique pour Web2EPUB

echo "🔍 Vérification de l'intégrité du code Web2EPUB..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. Vérifier la syntaxe JavaScript
echo "1️⃣  Vérification de la syntaxe JavaScript..."
if node -c background.js 2>/dev/null && node -c content.js 2>/dev/null && node -c server/server.js 2>/dev/null; then
    echo -e "   ${GREEN}✓${NC} Aucune erreur de syntaxe"
else
    echo -e "   ${RED}✗${NC} Erreurs de syntaxe détectées"
    ERRORS=$((ERRORS+1))
fi

# 2. Vérifier que les fonctions helper existent
echo ""
echo "2️⃣  Vérification des fonctions helper..."
if grep -q "function extractImageSource" background.js && \
   grep -q "function downloadImage" background.js && \
   grep -q "function processArticleImages" background.js && \
   grep -q "function buildChapterXhtml" background.js; then
    echo -e "   ${GREEN}✓${NC} Toutes les fonctions helper sont présentes"
else
    echo -e "   ${RED}✗${NC} Fonctions helper manquantes"
    ERRORS=$((ERRORS+1))
fi

# 3. Vérifier la fonction withErrorHandling
echo ""
echo "3️⃣  Vérification de la gestion d'erreurs..."
if grep -q "function withErrorHandling" background.js && \
   grep -q "withErrorHandling(async (info, tab)" background.js; then
    echo -e "   ${GREEN}✓${NC} Wrapper de gestion d'erreurs présent"
else
    echo -e "   ${RED}✗${NC} Gestion d'erreurs manquante"
    ERRORS=$((ERRORS+1))
fi

# 4. Vérifier l'extracteur Liberation
echo ""
echo "4️⃣  Vérification de l'extracteur Liberation.fr..."
if grep -q "function extractLiberation" content.js && \
   grep -q "domain.includes('liberation.fr')" content.js; then
    echo -e "   ${GREEN}✓${NC} Extracteur Liberation.fr présent"
else
    echo -e "   ${RED}✗${NC} Extracteur Liberation.fr manquant"
    ERRORS=$((ERRORS+1))
fi

# 5. Vérifier la validation serveur
echo ""
echo "5️⃣  Vérification de la validation serveur..."
if grep -q "function validateUploadData" server/server.js && \
   grep -q "const validation = validateUploadData" server/server.js; then
    echo -e "   ${GREEN}✓${NC} Validation des données serveur présente"
else
    echo -e "   ${RED}✗${NC} Validation serveur manquante"
    ERRORS=$((ERRORS+1))
fi

# 6. Vérifier l'absence de code dupliqué (alerte)
echo ""
echo "6️⃣  Vérification de l'absence de duplication..."
ALERT_COUNT=$(grep -c "alertDiv.style.cssText" background.js)
if [ "$ALERT_COUNT" -eq 1 ]; then
    echo -e "   ${GREEN}✓${NC} Pas de duplication de code d'alerte"
else
    echo -e "   ${YELLOW}⚠${NC}  Code d'alerte trouvé $ALERT_COUNT fois (attendu: 1)"
fi

# 7. Vérifier la présence des fichiers essentiels
echo ""
echo "7️⃣  Vérification des fichiers essentiels..."
MISSING_FILES=0
for file in "background.js" "content.js" "manifest.json" "server/server.js" "popup.html" "popup.js"; do
    if [ ! -f "$file" ]; then
        echo -e "   ${RED}✗${NC} Fichier manquant: $file"
        MISSING_FILES=$((MISSING_FILES+1))
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    echo -e "   ${GREEN}✓${NC} Tous les fichiers essentiels sont présents"
else
    ERRORS=$((ERRORS+1))
fi

# Résumé final
echo ""
echo "═══════════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ SUCCÈS${NC} - Toutes les vérifications sont passées !"
    echo ""
    echo "Prochaines étapes :"
    echo "  1. Charger l'extension dans Firefox (about:debugging)"
    echo "  2. Suivre le plan de tests dans TESTS.md"
    echo "  3. Tester sur des articles réels"
else
    echo -e "${RED}❌ ÉCHEC${NC} - $ERRORS erreur(s) détectée(s)"
    echo ""
    echo "Veuillez corriger les erreurs avant de tester."
fi
echo "═══════════════════════════════════════════"

exit $ERRORS
