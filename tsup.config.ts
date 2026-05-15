import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      nestjs: 'src/integrations/nestjs.ts',
      express: 'src/integrations/express.ts',
      hono: 'src/integrations/hono.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    sourcemap: true,
  },
  {
    entry: { cli: 'src/cli/index.ts' },
    format: ['cjs'],
    dts: true,
    clean: false,
    sourcemap: true,
    banner: { js: '#!/usr/bin/env node' },
  },
])
