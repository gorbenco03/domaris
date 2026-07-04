// Metro config pentru monorepo pnpm (Nx).
// Permite Metro să rezolve și să transpileze pachetul partajat @domaris/types
// direct din sursă (packages/types/src), fără a necesita un build `dist/` —
// altfel build-ul EAS eșuează cu „dist/index.js does not exist".
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Urmărește tot monorepo-ul (ca să poată citi packages/types)
config.watchFolders = [workspaceRoot];

// 2. Caută node_modules în mobile și în rădăcina monorepo-ului
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Rezolvă corect pachetele cu simlink (pnpm) și câmpul „react-native"
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// 4. Sursa @domaris/types folosește importuri ESM cu extensie „.js"
//    (ex. import "./lib/enums.js") care la build TS mapează pe „.ts".
//    Metro citește sursa direct, deci rescriem „.js" -> extensionless ca
//    să găsească fișierul „.ts" real. Se aplică doar în interiorul pachetului.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.startsWith('.') &&
    moduleName.endsWith('.js') &&
    /(?:packages[\\/]types|@domaris[\\/]types)/.test(context.originModulePath || '')
  ) {
    moduleName = moduleName.replace(/\.js$/, '');
  }
  return (defaultResolveRequest || context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
