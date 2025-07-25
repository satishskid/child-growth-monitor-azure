/**
 * Metro configuration for React Native
 * Optimized for Child Growth Monitor development
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Reduce file watching to prevent EMFILE errors on macOS
config.watchFolders = [];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Optimize bundle size and performance  
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    mangle: {
      keep_fnames: true,
    },
    output: {
      ascii_only: true,
      quote_keys: true,
      wrap_iife: true,
    },
    sourceMap: {
      includeSources: false,
    },
    toplevel: false,
    warnings: false,
  },
};

// Increase max file size for images and assets
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'ttf',
  'otf',
  'woff',
  'woff2',
];

module.exports = config;
