import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: ['remark-gfm', 'remark-frontmatter', 'remark-mdx-frontmatter'],
  },
});

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  async redirects() {
    return [
      {
        source: '/calculadoras/depurador-ttos',
        destination: '/escalas/depuradorTtos',
        permanent: true,
      },
    ];
  },
};

export default withMDX(nextConfig);
