const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      // Reduce bundle size and optimize for development
      mode: env.mode || 'development',
    },
    argv
  );

  // Optimize development experience
  if (config.mode === 'development') {
    // Use simple stats configuration
    config.stats = 'minimal';

    // Optimize hot reloading
    config.watchOptions = {
      aggregateTimeout: 300,
      poll: 1000,
      ignored: [
        '**/node_modules/**',
        '**/docs/**',
        '**/backend/**',
        '**/ml-service/**',
      ],
    };
  }

  // Optimize bundle splitting
  if (config.optimization) {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    };
  }

  return config;
};
