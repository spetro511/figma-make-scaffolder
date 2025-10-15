# Figma Make Scaffolder - VS Code Extension (built upon the work of: https://github.com/likang/figma-make-local-runner)

> **Hey [@sucoro-ai](https://www.sucoro.com) & "Shouldn't have had to make this but here we are @figma..."** 
>
> ^^asked Copilot to update my readme and it really crushed it. This is siri dictation level execution lmao.
> 
> Look, this is what happens when you make a product that does ALMOST everything perfectly and solves a massive pain point in the design-to-dev world. We've all been there - those clients who want everything pixel-perfect, right? Figma Make gets us 95% of the way there, but then... well, here we are building workarounds.
>
> Shoutout to [@spetro511](https://surenscreations.com) for this figma-make-scaffolder - use it, love it, but fair warning: Figma will probably push an update tomorrow that breaks everything. Such is life! 🤷‍♂️
>
> *Built with ❤️ by [Sucoro](https://www.sucoro.com) | [SurensCreations](https://surenscreations.com)*

Convert Figma Make exports into local React projects with automatic setup and import fixing.

**✨ Compatible with VS Code, Cursor, Windsurf, and other VS Code-based editors**

## Features

- **One-click setup**: Automatically clones figma-make-local-runner repository
- **Zip extraction**: Extracts Figma Make export files directly into project structure
- **Import fixing**: Automatically removes version specifiers from imports (e.g., `@radix-ui/react-slot@1.1.2` → `@radix-ui/react-slot`)
- **Import reporting**: Provides detailed reports on which imports were fixed during scaffolding
- **Component preview**: Generates an HTML catalog of all components in your export for easy reference
- **Configuration management**: Save and reuse your scaffolding preferences (auto-start dev server, auto-open project, etc.)
- **Dependency management**: Installs required dependencies
- **Integrated terminal**: Optionally starts the dev server immediately

## Usage

### Method 1: Right-click in Explorer
1. Right-click on any folder in the VS Code Explorer
2. Select "Scaffold Figma Make Project"
3. Choose your Figma Make .zip export file
4. Wait for the setup to complete
5. View the import fix report (if any imports were fixed)
6. Choose to open the project and/or start the dev server
7. View the component preview catalog (if enabled in settings)

### Method 2: Command Palette
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "Scaffold Figma Make Project"
3. Select a target directory
4. Choose your Figma Make .zip export file
5. Wait for the setup to complete

### Method 3: Configure Settings
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "Configure Scaffolder Settings"
3. Set your preferences:
   - Auto-start dev server after scaffolding
   - Auto-open project in new window
   - Generate component preview catalog

## What it does

1. **Clone Repository**: Downloads the latest figma-make-local-runner from GitHub
2. **Extract Export**: Unzips your Figma Make export file
3. **Replace Demo**: Removes the demo app from `src/` directory
4. **Copy Files**: Moves all your Figma Make files into the `src/` directory
5. **Fix Imports**: Automatically removes version specifiers that cause conflicts
6. **Report Fixes**: Shows a detailed report of which imports were fixed
7. **Install Dependencies**: Runs `npm install` to set up the project
8. **Generate Preview**: Creates an HTML component catalog (if enabled)
9. **Ready to Go**: Project is ready for `npm run dev`

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
2. (Optional) Configure your preferences using "Configure Scaffolder Settings"
3. In VS Code, right-click on your projects folder
4. Select "Scaffold Figma Make Project"
5. Select your exported .zip file
6. The extension will:
   - Create a new project folder
   - Clone figma-make-local-runner
   - Extract and copy your files
   - Fix problematic imports
   - Generate an import fix report
   - Install dependencies
   - Generate component preview catalog (if enabled)
7. Open the project and run `npm run dev`
8. Your Figma Make project is now running at `http://localhost:5173`
9. View the component catalog at `COMPONENT_PREVIEW.html` (if generated)

## New Features (v1.1.0)

### 1. Import Fix Reporting
Get detailed visibility into the import fixing process:
- See which files were processed
- Know how many imports were fixed
- View the list of all version specifiers that were removed

This helps you understand what changes were made to your exported code and ensures transparency in the scaffolding process.

### 2. Component Preview Catalog
Automatically generate a visual HTML catalog of all components in your Figma Make export:
- Browse all exported components in one place
- See component names, file paths, and exports
- Quickly reference available components while developing

Enable this feature in the configuration settings.

### 3. Configuration Management
Save your scaffolding preferences to streamline your workflow:
- **Auto-start dev server**: Automatically run `npm run dev` after scaffolding
- **Auto-open project**: Automatically open the new project in a new VS Code window
- **Generate component preview**: Automatically create the component catalog

Access via Command Palette: "Configure Scaffolder Settings"


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
