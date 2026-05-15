import { defineConfig } from 'tsup'
import { readFileSync, writeFileSync } from 'fs'

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
  onSuccess: async () => {
    const file = 'dist/cli.cjs'
    const content = readFileSync(file, 'utf8')
    if (!content.startsWith('#!/usr/bin/env node')) {
      writeFileSync(file, '#!/usr/bin/env node\n' + content)
    }
  },
})
