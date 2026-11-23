/* Rebuilds vendor/three/three-lite.min.js (three.js, tree-shaken to what tools/three-entry.js exports).
   The repository has no package.json, so run it from any folder where three and esbuild are installed:
     npm install --no-save three@0.187.0 esbuild
     node /path/to/daily-engineering/tools/build-three.mjs
   Then copy three's LICENSE to vendor/three/LICENSE if the version changed. */
import {createRequire} from 'module';
import path from 'path';
import {fileURLToPath} from 'url';
import fs from 'fs';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, '..');
const require = createRequire(path.join(process.cwd(), 'build.js'));
const {build} = require('esbuild');
const {version} = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'node_modules', 'three', 'package.json'), 'utf8'));
await build({
    entryPoints: [path.join(here, 'three-entry.js')],
    nodePaths: [path.join(process.cwd(), 'node_modules')],
    bundle: true, minify: true, format: 'esm', target: 'es2020', legalComments: 'none',
    banner: {js: `/* three.js ${version} (MIT licence, see LICENSE), tree-shaken for Daily Engineer by tools/build-three.mjs */`},
    outfile: path.join(root, 'vendor', 'three', 'three-lite.min.js')
});
console.log(`vendor/three/three-lite.min.js built from three ${version}`);
