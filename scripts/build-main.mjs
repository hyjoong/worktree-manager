import { build } from 'esbuild';

await build({
  entryPoints: ['src/main/index.ts'],
  outfile: 'dist/main/index.js',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  external: ['electron'],
  logLevel: 'info',
});
