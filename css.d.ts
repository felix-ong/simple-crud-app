// Ambient declarations for stylesheet side-effect imports (e.g. `import "./globals.css"`).
// Next.js handles these at build time, but the editor's TypeScript language server
// needs this to resolve the import instead of flagging it.
declare module "*.css";
