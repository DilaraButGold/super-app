const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Projenin olduğu yer (apps/mobile)
const projectRoot = __dirname;
// Monorepo'nun ana kökü (super-app)
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Expo'ya diyoruz ki: "Sadece burayı değil, ana klasörü de izle"
config.watchFolders = [workspaceRoot];

// 2. Node modules yollarını öğretiyoruz (Hem kendi içinde hem ana klasörde ara)
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;