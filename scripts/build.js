const esbuild = require('esbuild');
const {nodeExternalsPlugin} = require('esbuild-node-externals');

esbuild.build({
  bundle: true,
  entryPoints: [
    'src/index.ts'
  ],
  outfile: 'dist/index.js',
  platform: 'node',
  plugins: [nodeExternalsPlugin()],
  sourcemap: true,
  target: 'node14',
  tsconfig: 'tsconfig.plugin.json',
}).catch(() => process.exit(1));
