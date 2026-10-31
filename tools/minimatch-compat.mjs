import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);

// ESLint process only. Upstream v11 is the sole matcher implementation; this
// bridges the callable CommonJS API expected by three legacy lint plugins.
// No files in node_modules are modified and no install/build hook is registered.
const resolved = require.resolve('minimatch');
const engine = require(resolved);
if (typeof engine !== 'function') {
  const callable = Object.assign(
    (path, pattern, options) => engine.minimatch(path, pattern, options),
    engine,
  );
  // import/no-internal-modules only uses the returned object's .test() method.
  // Keep matching in v11; never reintroduce the removed RegExp glob compiler.
  callable.makeRe = (pattern, options) => {
    const matcher = new engine.Minimatch(pattern, options);
    return {test: value => matcher.match(value)};
  };
  require.cache[resolved].exports = callable;
}
