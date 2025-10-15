# Changelog

All notable changes to the Figma Make Scaffolder extension will be documented in this file.

## [1.1.0] - 2025-10-15

### Added
- **Import Fix Reporting**: Detailed reports showing which imports were fixed during scaffolding
  - Displays number of files processed
  - Shows how many files had imports fixed
  - Lists all version specifiers that were removed
  - Interactive dialog to view full report details

- **Component Preview Catalog**: Automatic generation of HTML component catalog
  - Visual overview of all components in the Figma Make export
  - Shows component names, file paths, and exported functions
  - Styled, responsive HTML page for easy browsing
  - Can be enabled/disabled in configuration settings

- **Configuration Management**: Save and reuse scaffolding preferences
  - Auto-start dev server after scaffolding
  - Auto-open project in new window
  - Toggle component preview generation
  - Accessible via Command Palette: "Configure Scaffolder Settings"
  - Settings persist across VS Code sessions

### Changed
- Updated extension version to 1.1.0
- Enhanced README with detailed documentation for new features
- Improved user workflow with automated configuration options

### Fixed
- None

## [1.0.0] - Initial Release

### Added
- One-click setup with automatic repository cloning
- Zip extraction for Figma Make exports
- Automatic import fixing (removes version specifiers)
- Dependency management with npm install
- Integrated terminal with dev server support
- Right-click context menu in Explorer
- Command Palette integration
