"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const AdmZip = require("adm-zip");
const simple_git_1 = require("simple-git");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function loadConfig(context) {
    const config = context.globalState.get('figmaMakeConfig', {});
    return config;
}
async function saveConfig(context, config) {
    await context.globalState.update('figmaMakeConfig', config);
}
async function configureSettings(context) {
    const currentConfig = await loadConfig(context);
    // Auto-start dev server preference
    const autoStart = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: `Auto-start dev server after scaffolding? (Current: ${currentConfig.autoStartDevServer ? 'Yes' : 'No'})`
    });
    if (autoStart) {
        currentConfig.autoStartDevServer = autoStart === 'Yes';
    }
    // Auto-open project preference
    const autoOpen = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: `Auto-open project in new window? (Current: ${currentConfig.autoOpenProject ? 'Yes' : 'No'})`
    });
    if (autoOpen) {
        currentConfig.autoOpenProject = autoOpen === 'Yes';
    }
    // Component preview preference
    const generatePreview = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: `Generate component preview catalog? (Current: ${currentConfig.generateComponentPreview ? 'Yes' : 'No'})`
    });
    if (generatePreview) {
        currentConfig.generateComponentPreview = generatePreview === 'Yes';
    }
    await saveConfig(context, currentConfig);
    vscode.window.showInformationMessage('Figma Make Scaffolder configuration saved!');
}
function activate(context) {
    const disposable = vscode.commands.registerCommand('figmaMake.scaffold', async (uri) => {
        try {
            await scaffoldFigmaMakeProject(uri, context);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error: ${error}`);
        }
    });
    const configCommand = vscode.commands.registerCommand('figmaMake.configure', async () => {
        try {
            await configureSettings(context);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error: ${error}`);
        }
    });
    context.subscriptions.push(disposable, configCommand);
}
exports.activate = activate;
async function scaffoldFigmaMakeProject(uri, context) {
    const config = context ? await loadConfig(context) : {};
    // Step 1: Get target directory
    let targetDir;
    if (uri && uri.fsPath) {
        // Right-clicked on a folder
        targetDir = uri.fsPath;
    }
    else {
        // Command palette - ask user to select folder
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Project Directory'
        });
        if (!folderUri || folderUri.length === 0) {
            return;
        }
        targetDir = folderUri[0].fsPath;
    }
    // Step 2: Ask for zip file
    const zipFile = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        openLabel: 'Select Figma Make Export (.zip)',
        filters: {
            'Zip files': ['zip']
        }
    });
    if (!zipFile || zipFile.length === 0) {
        return;
    }
    const zipPath = zipFile[0].fsPath;
    const projectName = path.basename(zipPath, '.zip');
    const projectDir = path.join(targetDir, projectName);
    // Step 3: Show progress and execute steps
    const importReport = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Setting up Figma Make project",
        cancellable: false
    }, async (progress, token) => {
        // Step 1: Clone figma-make-local-runner
        progress.report({ increment: 0, message: "Cloning figma-make-local-runner..." });
        const git = (0, simple_git_1.simpleGit)();
        await git.clone('https://github.com/likang/figma-make-local-runner.git', projectDir);
        // Step 2: Extract zip file
        progress.report({ increment: 25, message: "Extracting Figma Make export..." });
        const tempDir = path.join(projectDir, 'temp-extract');
        await extractZip(zipPath, tempDir);
        // Step 3: Copy extracted files to src directory
        progress.report({ increment: 50, message: "Copying files to src directory..." });
        const srcDir = path.join(projectDir, 'src');
        // Remove existing src contents (demo app)
        if (fs.existsSync(srcDir)) {
            await fs.promises.rm(srcDir, { recursive: true, force: true });
        }
        // Copy extracted files to src
        await copyDirectory(tempDir, srcDir);
        // Clean up temp directory
        await fs.promises.rm(tempDir, { recursive: true, force: true });
        // Step 4: Fix imports (remove version specifiers)
        progress.report({ increment: 75, message: "Fixing import statements..." });
        const importReport = await fixImportStatements(srcDir);
        // Step 5: Install dependencies
        progress.report({ increment: 90, message: "Installing dependencies..." });
        try {
            await execAsync('npm install', { cwd: projectDir });
        }
        catch (error) {
            console.log('npm install error (may be normal):', error);
        }
        progress.report({ increment: 100, message: "Complete!" });
        return importReport;
    });
    // Display import fix report
    if (importReport && importReport.importsFixed.length > 0) {
        const reportMessage = `Import Fix Report:\n` +
            `✓ Processed ${importReport.filesProcessed} files\n` +
            `✓ Fixed ${importReport.filesFixed} files\n` +
            `✓ Removed ${importReport.importsFixed.length} version specifiers:\n  - ${importReport.importsFixed.join('\n  - ')}`;
        vscode.window.showInformationMessage('View Import Fix Report', 'Show Details').then(selection => {
            if (selection === 'Show Details') {
                vscode.window.showInformationMessage(reportMessage, { modal: true });
            }
        });
    }
    // Step 4: Ask if user wants to open project and start dev server
    let shouldOpenProject = config.autoOpenProject || false;
    let shouldStartDevServer = config.autoStartDevServer || false;
    if (!config.autoOpenProject && !config.autoStartDevServer) {
        const choice = await vscode.window.showInformationMessage(`Figma Make project created successfully at ${projectDir}`, 'Open Project', 'Open & Start Dev Server');
        shouldOpenProject = choice === 'Open Project' || choice === 'Open & Start Dev Server';
        shouldStartDevServer = choice === 'Open & Start Dev Server';
    }
    if (shouldOpenProject) {
        // Open the project in a new VS Code window
        await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectDir), true);
        if (shouldStartDevServer) {
            // Start the dev server
            const terminal = vscode.window.createTerminal({
                name: 'Figma Make Dev Server',
                cwd: projectDir
            });
            terminal.show();
            terminal.sendText('npm run dev');
        }
    }
    // Generate component preview if enabled
    if (config.generateComponentPreview) {
        await generateComponentPreview(projectDir);
    }
}
async function extractZip(zipPath, outputDir) {
    try {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(outputDir, true);
        console.log(`Successfully extracted ${zipPath} to ${outputDir}`);
    }
    catch (error) {
        throw new Error(`Failed to extract zip file: ${error}`);
    }
}
async function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = await fs.promises.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        }
        else {
            await fs.promises.copyFile(srcPath, destPath);
        }
    }
}
async function fixImportStatements(srcDir) {
    const report = {
        filesProcessed: 0,
        filesFixed: 0,
        importsFixed: []
    };
    const processFile = async (filePath) => {
        if (!filePath.match(/\.(js|jsx|ts|tsx)$/)) {
            return;
        }
        report.filesProcessed++;
        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            // Regex to match imports with version specifiers
            // Example: import { Slot } from "@radix-ui/react-slot@1.1.2"
            const versionSpecifierRegex = /from\s+["']([^"']+)@[\d\.\-\w]+["']/g;
            const fixedContent = content.replace(versionSpecifierRegex, (match, packageName) => {
                const importWithVersion = match.match(/["']([^"']+@[\d\.\-\w]+)["']/)?.[1];
                if (importWithVersion && !report.importsFixed.includes(importWithVersion)) {
                    report.importsFixed.push(importWithVersion);
                }
                return `from "${packageName}"`;
            });
            if (content !== fixedContent) {
                await fs.promises.writeFile(filePath, fixedContent, 'utf8');
                report.filesFixed++;
                console.log(`Fixed imports in: ${filePath}`);
            }
        }
        catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
        }
    };
    const processDirectory = async (dir) => {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await processDirectory(fullPath);
            }
            else {
                await processFile(fullPath);
            }
        }
    };
    await processDirectory(srcDir);
    return report;
}
async function generateComponentPreview(projectDir) {
    try {
        const srcDir = path.join(projectDir, 'src');
        const components = [];
        // Find all component files
        const findComponents = async (dir, basePath = '') => {
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.join(basePath, entry.name);
                if (entry.isDirectory() && entry.name !== 'node_modules') {
                    await findComponents(fullPath, relativePath);
                }
                else if (entry.isFile() && entry.name.match(/\.(jsx|tsx)$/)) {
                    // Read file to find exported components
                    const content = await fs.promises.readFile(fullPath, 'utf8');
                    const exportMatches = content.match(/export\s+(default\s+)?(function|const|class)\s+([A-Z][a-zA-Z0-9]*)/g) || [];
                    const exportNames = exportMatches.map(match => {
                        const nameMatch = match.match(/([A-Z][a-zA-Z0-9]*)$/);
                        return nameMatch ? nameMatch[1] : '';
                    }).filter(name => name);
                    if (exportNames.length > 0) {
                        components.push({
                            name: entry.name.replace(/\.(jsx|tsx)$/, ''),
                            path: relativePath,
                            exports: exportNames
                        });
                    }
                }
            }
        };
        await findComponents(srcDir);
        // Generate HTML preview
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Component Preview - Figma Make Project</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #333; margin-bottom: 10px; }
        .subtitle { color: #666; }
        .component-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .component-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .component-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .component-name {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
        }
        .component-path {
            font-size: 12px;
            color: #999;
            font-family: 'Courier New', monospace;
            margin-bottom: 12px;
        }
        .exports {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #eee;
        }
        .export-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 6px;
        }
        .export-item {
            display: inline-block;
            background: #f0f0f0;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin: 2px;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 Component Catalog</h1>
        <p class="subtitle">Generated from Figma Make export • ${components.length} components found</p>
    </div>
    <div class="component-grid">
        ${components.map(comp => `
            <div class="component-card">
                <div class="component-name">${comp.name}</div>
                <div class="component-path">${comp.path}</div>
                ${comp.exports.length > 0 ? `
                    <div class="exports">
                        <div class="export-label">Exports:</div>
                        ${comp.exports.map(exp => `<span class="export-item">${exp}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>`;
        const previewPath = path.join(projectDir, 'COMPONENT_PREVIEW.html');
        await fs.promises.writeFile(previewPath, htmlContent, 'utf8');
        vscode.window.showInformationMessage(`Component preview generated with ${components.length} components`, 'Open Preview').then(selection => {
            if (selection === 'Open Preview') {
                vscode.env.openExternal(vscode.Uri.file(previewPath));
            }
        });
    }
    catch (error) {
        console.error('Error generating component preview:', error);
    }
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map