# Figma Make Scaffolder - VS Code Extension

> **Hey [@sucoro-ai](https://www.sucoro.com) & "Shouldn't have had to make this but here we are @figma..."** 
> 
> Look, this is what happens when you make a product that does ALMOST everything perfectly and solves a massive pain point in the design-to-dev world. We've all been there - those clients who want everything pixel-perfect, right? Figma Make gets us 95% of the way there, but then... well, here we are building workarounds.
>
> Shoutout to [@spetro511](https://surenscreations.com) for this figma-make-scaffolder - use it, love it, but fair warning: Figma will probably push an update tomorrow that breaks everything. Such is life! 🤷‍♂️
>
> *Built with ❤️ by [Sucoro](https://www.sucoro.com) | [SurensCreations](https://surenscreations.com)*

Convert Figma Make exports into local React projects with automatic setup and import fixing.

## Features

- **One-click setup**: Automatically clones figma-make-local-runner repository
- **Zip extraction**: Extracts Figma Make export files directly into project structure
- **Import fixing**: Automatically removes version specifiers from imports (e.g., `@radix-ui/react-slot@1.1.2` → `@radix-ui/react-slot`)
- **Dependency management**: Installs required dependencies
- **Integrated terminal**: Optionally starts the dev server immediately

## Usage

### Method 1: Right-click in Explorer
1. Right-click on any folder in the VS Code Explorer
2. Select "Scaffold Figma Make Project"
3. Choose your Figma Make .zip export file
4. Wait for the setup to complete
5. Choose to open the project and/or start the dev server

### Method 2: Command Palette
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "Scaffold Figma Make Project"
3. Select a target directory
4. Choose your Figma Make .zip export file
5. Wait for the setup to complete

## What it does

1. **Clone Repository**: Downloads the latest figma-make-local-runner from GitHub
2. **Extract Export**: Unzips your Figma Make export file
3. **Replace Demo**: Removes the demo app from `src/` directory
4. **Copy Files**: Moves all your Figma Make files into the `src/` directory
5. **Fix Imports**: Automatically removes version specifiers that cause conflicts
6. **Install Dependencies**: Runs `npm install` to set up the project
7. **Ready to Go**: Project is ready for `npm run dev`

## Requirements

- VS Code 1.74.0 or higher
- Node.js and npm installed
- Git installed
- Internet connection (for cloning repository)

## Installation

### From VSIX file:
1. Download the `.vsix` file
2. Open VS Code
3. Go to Extensions view (`Ctrl+Shift+X`)
4. Click the "..." menu and select "Install from VSIX..."
5. Select the downloaded `.vsix` file

### From source:
1. Clone this repository
2. Run `npm install`
3. Run `npm run compile`
4. Press `F5` to run in Extension Development Host

## Building the Extension

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package as VSIX
npx vsce package
```

## Project Structure

```
figma-make-scaffolder/
├── src/
│   └── extension.ts          # Main extension logic
├── package.json              # Extension manifest
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

## Example Workflow

1. Export your project from Figma Make as a .zip file
2. In VS Code, right-click on your projects folder
3. Select "Scaffold Figma Make Project"
4. Select your exported .zip file
5. The extension will:
   - Create a new project folder
   - Clone figma-make-local-runner
   - Extract and copy your files
   - Fix problematic imports
   - Install dependencies
6. Open the project and run `npm run dev`
7. Your Figma Make project is now running at `http://localhost:5173`

## Troubleshooting

### "Git not found"
Make sure Git is installed and available in your system PATH.

### "npm install failed"
The extension continues even if npm install has warnings. You can manually run `npm install` in the created project directory.

### "Import errors in generated code"
The extension automatically fixes common import issues, but some manual fixes might be needed for complex imports.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `F5` in VS Code
5. Submit a pull request

## License

MIT License - see LICENSE file for details