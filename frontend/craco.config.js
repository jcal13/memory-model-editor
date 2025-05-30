module.exports = {
  webpack: {
    configure: (config) => {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs:   false,
        path: false,
        os:   false,
      };
      return config;
    },
  },
};