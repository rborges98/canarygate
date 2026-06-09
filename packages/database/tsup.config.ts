import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    client: 'src/client.ts',
    schema: 'src/schema/index.ts' // Aqui a mágica acontece: mapeia o index.ts para um output chamado schema.js
  },
  format: ['cjs'],
  dts: true,
  clean: true, // Limpa a pasta dist antes de buildar para não deixar lixo antigo
  outDir: 'dist'
})
