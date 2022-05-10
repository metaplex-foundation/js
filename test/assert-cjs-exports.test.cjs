const exported = require('../dist/cjs/index.cjs');
const { test } = require('tape');

test('It successful export commonjs named exports', (t) => {
  const exportedKeys = Object.keys(exported);

  t.ok(exportedKeys.includes('Metaplex'));
  t.end();
});
