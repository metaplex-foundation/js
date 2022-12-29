import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import { createSft, killStuckProcess, metaplex } from '../../helpers';
import { Sft } from '@/index';

killStuckProcess();

test.only('[nftModule] it can mint tokens from an SFT', async (t: Test) => {
  // Given an existing SFT.
  const mx = await metaplex();
  const sft = await createSft(mx);
  t.equal(sft.mint.supply.basisPoints.toNumber(), 0, 'SFT has no supply');

  // When ...
  await mx.nfts().mint({ mintAddress: sft.address });
  const updatedSft = await mx.nfts().refresh(sft);

  // Then the SFT was updated accordingly.
  spok(t, updatedSft, {
    model: 'sft',
    $topic: 'Updated SFT',
  } as unknown as Specifications<Sft>);
});
