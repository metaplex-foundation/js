import fs from 'fs';
import path from 'path';
import test from 'tape';
import spok from 'spok';

import fetch from 'cross-fetch';

import { Metaplex, MetaplexFile } from '../../../src';
import {
  amman,
  killStuckProcess,
  metaplex,
  MOCK_STORAGE_ID,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import { createCandyMachineWithMaxSupply } from './helpers';
import { Creator } from '@metaplex-foundation/mpl-token-metadata';
import BN from 'bn.js';

const fixtures = path.join(__dirname, '..', '..', 'fixtures');
const rockPng = fs.readFileSync(path.join(fixtures, 'rock_80x80.png'));

killStuckProcess();

async function verifyProperlyUploaded(
  t: test.Test,
  uri: string,
  asset: MetaplexFile,
  creators: Creator[]
) {
  const { image, properties } = await fetch(uri).then((res) => res.json());
  spok(
    t,
    properties.creators as Creator[],
    creators.map((x) => ({
      ...x,
      address: x.address.toBase58(),
      share: new BN(x.share).toNumber(),
    }))
  );

  const imageData = await fetch(image).then((res) => res.arrayBuffer());
  t.ok(
    asset.buffer.equals(Buffer.from(imageData)),
    'asset.buffer === imageData'
  );
}

test('addAssets: candy machine that can hold 2 assets', async (t) => {
  // Given I create a candy machine holing 2 assets
  const mx = await metaplex();
  const storageDriver = amman.createMockStorageDriver(MOCK_STORAGE_ID, {
    costPerByte: 0.001,
  });
  // TODO(thlorenz): why do we have to do as any?
  storageDriver.install(mx as any);

  const cm = mx.candyMachines();

  const { candyMachine, candyMachineSigner, payerSigner } =
    await createCandyMachineWithMaxSupply(mx, 2);

  // When I upload one asset for it
  const asset = new MetaplexFile(rockPng, 'rock.png');
  const { uri } = await cm.uploadOneAssetForCandyMachine({
    authoritySigner: payerSigner,
    candyMachineAddress: candyMachineSigner.publicKey,
    image: asset,
  });

  // Then the asset is uploaded properly
  await verifyProperlyUploaded(t, uri, asset, candyMachine.creators);
});
