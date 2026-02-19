import { defineConfig, passthroughImageService } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://docs.heypinchy.com',
  image: {
    service: passthroughImageService(),
  },
  integrations: [
    starlight({
      title: 'Pinchy',
      logo: {
        src: './src/assets/pinchy-logo.png',
      },
      favicon: '/favicon.png',
      customCss: ['./src/styles/custom.css'],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/heypinchy/pinchy',
        },
      ],
      sidebar: [
        {
          label: 'Start Here',
          items: [
            { label: 'Introduction', slug: '' },
            { label: 'Quick Start', slug: 'getting-started' },
            { label: 'Installation', slug: 'installation' },
          ],
        },
        {
          label: 'Concepts',
          items: [
            { label: 'Architecture', slug: 'architecture' },
          ],
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/heypinchy/pinchy/edit/main/docs/',
      },
    }),
  ],
});
