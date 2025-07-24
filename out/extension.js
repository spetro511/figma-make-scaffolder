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
function activate(context) {
    const disposable = vscode.commands.registerCommand('figmaMake.scaffold', async (uri) => {
        try {
            await scaffoldFigmaMakeProject(uri);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error: ${error}`);
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
async function scaffoldFigmaMakeProject(uri) {
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
    await vscode.window.withProgress({
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
        await fixImportStatements(srcDir);
        // Step 5: Install dependencies
        progress.report({ increment: 90, message: "Installing dependencies..." });
        try {
            await execAsync('npm install', { cwd: projectDir });
        }
        catch (error) {
            console.log('npm install error (may be normal):', error);
        }
        progress.report({ increment: 100, message: "Complete!" });
    });
    // Step 4: Ask if user wants to open project and start dev server
    const choice = await vscode.window.showInformationMessage(`Figma Make project created successfully at ${projectDir}`, 'Open Project', 'Open & Start Dev Server');
    if (choice === 'Open Project' || choice === 'Open & Start Dev Server') {
        // Open the project in a new VS Code window
        await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectDir), true);
        if (choice === 'Open & Start Dev Server') {
            // Start the dev server
            const terminal = vscode.window.createTerminal({
                name: 'Figma Make Dev Server',
                cwd: projectDir
            });
            terminal.show();
            terminal.sendText('npm run dev');
        }
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
    const processFile = async (filePath) => {
        if (!filePath.match(/\.(js|jsx|ts|tsx)$/)) {
            return;
        }
        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            // Regex to match imports with version specifiers
            // Example: import { Slot } from "@radix-ui/react-slot@1.1.2"
            const versionSpecifierRegex = /from\s+["']([^"']+)@[\d\.\-\w]+["']/g;
            const fixedContent = content.replace(versionSpecifierRegex, (match, packageName) => {
                return `from "${packageName}"`;
            });
            if (content !== fixedContent) {
                await fs.promises.writeFile(filePath, fixedContent, 'utf8');
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
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map