#!/bin/bash

echo "🚀 Setting up Figma Make Scaffolder VS Code Extension"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install vsce if not already installed
if ! command -v vsce &> /dev/null; then
    echo "📦 Installing VS Code Extension CLI (vsce)..."
    npm install -g vsce
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Add types for adm-zip if missing
if [ ! -d "node_modules/@types/adm-zip" ]; then
    echo "📦 Installing additional type definitions..."
    npm install --save-dev @types/adm-zip
fi

# Compile TypeScript
echo "🔨 Compiling TypeScript..."
npm run compile

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
    
    # Package the extension
    echo "📦 Packaging extension..."
    vsce package
    
    if [ $? -eq 0 ]; then
        echo "🎉 Extension packaged successfully!"
        echo "📁 Look for the .vsix file in the current directory"
        echo ""
        echo "To install:"
        echo "1. Open VS Code"
        echo "2. Go to Extensions (Ctrl+Shift+X)"
        echo "3. Click '...' menu and select 'Install from VSIX...'"
        echo "4. Select the generated .vsix file"
        echo ""
        echo "Or run: code --install-extension figma-make-scaffolder-1.0.0.vsix"
    else
        echo "❌ Failed to package extension"
        exit 1
    fi
else
    echo "❌ Compilation failed. Check the errors above."
    exit 1
fi