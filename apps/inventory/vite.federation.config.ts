import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import {
  resolveFrontendResolutionMode,
  resolveHypercardWorkspaceAliases,
} from '../../tooling/vite/createHypercardViteConfig';

function emitFederationManifest(): Plugin {
  return {
    name: 'inventory-federation-manifest',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'mf-manifest.json',
        source: JSON.stringify(
          {
            version: 1,
            remoteId: 'inventory',
            compatiblePlatformRange: '^0.1.0',
            contract: {
              entry: './inventory-host-contract.js',
              exportName: 'inventoryHostContract',
            },
          },
          null,
          2,
        ),
      });
    },
  };
}

const frontendResolutionMode = resolveFrontendResolutionMode();

export default defineConfig({
  plugins: [react(), emitFederationManifest()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  resolve: {
    alias: resolveHypercardWorkspaceAliases(frontendResolutionMode),
  },
  build: {
    target: 'es2022',
    outDir: 'dist-federation',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'src/host.ts'),
      formats: ['es'],
      fileName: () => 'inventory-host-contract.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
