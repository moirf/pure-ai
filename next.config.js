/** @type {import('next').NextConfig} */

const repoName = 'pure-ai';
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: `/${repoName}`,
  assetPrefix: `/${repoName}/`,
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig;
