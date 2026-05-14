import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli/index.ts',
    nestjs: 'src/integrations/nestjs.ts',
    express: 'src/integrations/express.ts',
    hono: 'src/integrations/hono.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
})
