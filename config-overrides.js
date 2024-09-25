module.exports = {
    webpack: (config) => {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
        vm: require.resolve('vm-browserify'), // Přidáno
      };
      return config;
    },
  };
  