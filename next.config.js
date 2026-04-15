/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.watchOptions = config.watchOptions || {};
    const ignored = config.watchOptions.ignored || [];
    config.watchOptions.ignored = [
      ...(Array.isArray(ignored) ? ignored : [ignored]),
      '**/DumpStack.log.tmp',
      '**/hiberfil.sys',
      '**/pagefile.sys',
      '**/swapfile.sys',
    ];
    return config;
  },
};

module.exports = nextConfig
