import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

const REPO = 'sobakintech/ome.tv-userscript';
const FILE = 'ometv-unblock.user.js';
const releaseAsset = `https://github.com/${REPO}/releases/latest/download/${FILE}`;

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: 'OmeTV Virtual Camera Unblock',
        namespace: 'sobakintech',
        description:
          'Make OBS/virtual cameras work on ome.tv by neutralizing its client-side virtual-camera check at the root (keeps real device names).',
        author: 'sobakintech',
        match: ['*://ome.tv/*', '*://*.ome.tv/*'],
        'run-at': 'document-start',
        grant: 'none',
        homepage: `https://github.com/${REPO}`,
        supportURL: `https://github.com/${REPO}/issues`,
        downloadURL: releaseAsset,
        updateURL: releaseAsset,
      },
      build: {
        fileName: FILE,
        // emit <name>.meta.js next to the bundle for lightweight update checks
        metaFileName: true,
      },
    }),
  ],
});
