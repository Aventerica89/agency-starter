// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vfInspector from './src/integrations/vf-inspector';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [vfInspector()],
  vite: {
    plugins: [tailwindcss()]
  }
});