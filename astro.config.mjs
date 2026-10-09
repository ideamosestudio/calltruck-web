import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ideamosestudio.github.io',
  base: '/calltruck-web',
  integrations: [sitemap()],
  vite: { server: { host: true } }
});
