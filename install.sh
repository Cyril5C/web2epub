#!/bin/bash

echo "🚀 Installation de Web2EPUB"
echo "=========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    echo "Veuillez installer Node.js depuis https://nodejs.org"
    exit 1
fi

echo "✅ Node.js détecté: $(node --version)"
echo ""

# Download JSZip
echo "📥 Téléchargement de JSZip..."
mkdir -p lib
if command -v curl &> /dev/null; then
    curl -o lib/jszip.min.js https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
elif command -v wget &> /dev/null; then
    wget -O lib/jszip.min.js https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
else
    echo "❌ curl ou wget requis pour télécharger JSZip"
    exit 1
fi

if [ -f "lib/jszip.min.js" ]; then
    echo "✅ JSZip téléchargé"
else
    echo "❌ Erreur lors du téléchargement de JSZip"
    exit 1
fi

echo ""

# Create icon
echo "🎨 Création de l'icône..."
cat > icons/icon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#667eea" rx="15"/>
  <path d="M25 30 h50 v5 h-50 z M25 45 h50 v5 h-50 z M25 60 h35 v5 h-35 z" fill="white"/>
  <circle cx="75" cy="75" r="15" fill="#764ba2"/>
  <path d="M75 68 v14 M68 75 h14" stroke="white" stroke-width="3" stroke-linecap="round"/>
</svg>
EOF

# Convert SVG to PNG for different sizes (if ImageMagick is available)
if command -v convert &> /dev/null; then
    convert -background none icons/icon.svg -resize 48x48 icons/icon-48.png
    convert -background none icons/icon.svg -resize 96x96 icons/icon-96.png
    echo "✅ Icônes créées"
else
    echo "⚠️  ImageMagick non détecté - icônes PNG non générées"
    echo "   Vous pouvez les créer manuellement ou installer ImageMagick"
fi

echo ""

# Install server dependencies
echo "📦 Installation des dépendances du serveur..."
cd server
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dépendances installées"
else
    echo "❌ Erreur lors de l'installation des dépendances"
    exit 1
fi

cd ..
echo ""

# Create .env file if it doesn't exist
if [ ! -f "server/.env" ]; then
    echo "⚙️  Création du fichier de configuration..."
    cat > server/.env << 'EOF'
PORT=3000
MAX_FILE_SIZE=52428800
EOF
    echo "✅ Configuration créée"
fi

echo ""
echo "✅ Installation terminée avec succès !"
echo ""
echo "📚 Prochaines étapes :"
echo ""
echo "1. Démarrer le serveur :"
echo "   cd server && npm start"
echo ""
echo "2. Installer l'extension dans Firefox :"
echo "   - Ouvrir about:debugging"
echo "   - Cliquer sur 'Ce Firefox'"
echo "   - Cliquer sur 'Charger un module complémentaire temporaire'"
echo "   - Sélectionner le fichier manifest.json"
echo ""
echo "3. Configurer l'extension :"
echo "   - Cliquer sur l'icône de l'extension"
echo "   - Aller dans les options"
echo "   - Vérifier l'URL du serveur"
echo ""
echo "📖 Consultez le README.md pour plus d'informations"
