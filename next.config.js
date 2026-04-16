/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  experimental: {
    serverExternalPackages: ['@prisma/client'],
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

// Increase server timeouts for Render deployment
if (process.env.NODE_ENV === 'production') {
  const http = require('http');
  http.createServer.prototype.setTimeout = http.createServer.prototype.setTimeout || function() {};
  const origListen = http.createServer.prototype.listen;
  http.createServer.prototype.listen = function(...args) {
    this.keepAliveTimeout = 120000;
    this.headersTimeout = 120000;
    return origListen.apply(this, args);
  };
}

module.exports = nextConfig
