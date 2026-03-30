import path from 'node:path';
import { existsSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig, type ProxyOptions } from 'vite';

export interface HypercardViteConfigOptions {
  inventoryChatProxy?: boolean;
  inventoryChatBackendEnvVar?: string;
  inventoryChatBackendDefault?: string;
}

type FrontendResolutionMode = 'workspace' | 'published';

function createInventoryProxy(target: string): Record<string, ProxyOptions> {
  return {
    '/api/apps/inventory/chat': {
      target,
      changeOrigin: true,
    },
    '/api/apps/inventory/ws': {
      target,
      ws: true,
      changeOrigin: true,
    },
    '/api/apps/inventory/api': {
      target,
      changeOrigin: true,
    },
    '/api/apps/inventory/confirm': {
      target,
      changeOrigin: true,
    },
    '/api/apps/inventory/confirm/ws': {
      target,
      ws: true,
      changeOrigin: true,
    },
    '/api/os/apps': {
      target,
      changeOrigin: true,
    },
  };
}

export function resolveFrontendResolutionMode(): FrontendResolutionMode {
  const configuredMode = process.env.GO_GO_OS_FRONTEND_RESOLUTION;
  if (configuredMode === 'workspace' || configuredMode === 'published') {
    return configuredMode;
  }

  const workspaceFrontendRoot = path.resolve(__dirname, '../../../go-go-os-frontend');
  return existsSync(workspaceFrontendRoot) ? 'workspace' : 'published';
}

export function resolveHypercardWorkspaceAliases(frontendResolutionMode = resolveFrontendResolutionMode()) {
  return frontendResolutionMode === 'workspace'
    ? {
        '@go-go-golems/os-core': path.resolve(__dirname, '../../../go-go-os-frontend/packages/os-core/src'),
        '@go-go-golems/os-shell': path.resolve(__dirname, '../../../go-go-os-frontend/packages/os-shell/src'),
        '@go-go-golems/os-chat': path.resolve(__dirname, '../../../go-go-os-frontend/packages/os-chat/src'),
        '@go-go-golems/os-scripting': path.resolve(__dirname, '../../../go-go-os-frontend/packages/os-scripting/src'),
        '@go-go-golems/os-kanban': path.resolve(__dirname, '../../../go-go-os-frontend/packages/os-kanban/src'),
        '@go-go-golems/os-ui-cards': path.resolve(__dirname, '../../../go-go-os-frontend/packages/os-ui-cards/src'),
        '@go-go-golems/os-confirm': path.resolve(__dirname, '../../../go-go-os-frontend/packages/os-confirm/src'),
      }
    : {};
}

export function createHypercardViteConfig(options: HypercardViteConfigOptions = {}) {
  const frontendResolutionMode = resolveFrontendResolutionMode();
  const workspaceAliases = resolveHypercardWorkspaceAliases(frontendResolutionMode);

  const config = {
    plugins: [react()],
    resolve: {
      alias: workspaceAliases,
    },
  } as {
    plugins: ReturnType<typeof react>[];
    resolve: {
      alias: Record<string, string>;
    };
    server?: {
      proxy: Record<string, ProxyOptions>;
    };
  };

  if (options.inventoryChatProxy) {
    const backendEnvVar = options.inventoryChatBackendEnvVar ?? 'INVENTORY_CHAT_BACKEND';
    const backendDefault = options.inventoryChatBackendDefault ?? 'http://127.0.0.1:8091';
    const target = process.env[backendEnvVar] ?? backendDefault;
    config.server = {
      proxy: createInventoryProxy(target),
    };
  }

  return defineConfig(config);
}
