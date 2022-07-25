import { toMetaplexFile } from '@metaplex-foundation/js';
import test, { Test } from 'tape';
import { killStuckProcess, metaplex } from './helpers';
import { nftStorage } from '../src';

killStuckProcess();

test('[nftStorage] TODO', async (t: Test) => {
  //
  const mx = await metaplex();
  mx.use(nftStorage());

  const foo = await mx
    .storage()
    .upload(toMetaplexFile('some-image', 'some-image.jpg'));

  console.log(foo, mx.cluster);
});
