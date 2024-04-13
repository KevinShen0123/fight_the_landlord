const { build } = require('esbuild')
const esbuildPluginPino = require('esbuild-plugin-pino')

build({
  entryPoints: ['server.ts'],
  outdir: 'dist',
  platform: 'node',
  format: 'cjs',
  bundle: true,
  plugins: [esbuildPluginPino({ transports: ['pino-pretty'] })],
}).catch((error) => {
  console.error(error);
  process.exit(1);
})