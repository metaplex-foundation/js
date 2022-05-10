import * as exported from '../dist/esm/index.mjs';
import test from 'tape';

test('It successful export esm named exports', (t) => {
  const exportedKeys = Object.keys(exported);

  t.ok(exportedKeys.includes('Metaplex'));
  t.end();
});
