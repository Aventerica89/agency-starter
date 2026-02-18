import type { AstroIntegration } from 'astro';

/**
 * VaporForge Inspector integration.
 * Injects the click-to-edit overlay script in dev mode only,
 * enabling visual component selection from the parent editor iframe.
 */
export default function vfInspector(): AstroIntegration {
  return {
    name: 'vf-inspector',
    hooks: {
      'astro:config:setup': ({ command, injectScript }) => {
        if (command === 'dev') {
          injectScript('page', `import '/vf-inspector.js';`);
        }
      },
    },
  };
}
