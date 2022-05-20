import test from 'tape';
import spok from 'spok';

import fetch from 'cross-fetch';

import { CandyMachineIsFullError, MetaplexFile } from '../../../src';
import {
  amman,
  killStuckProcess,
  metaplex,
  MOCK_STORAGE_ID,
} from '../../helpers';
import {
  benchPng,
  createCandyMachineWithMaxSupply,
  rockPng,
  walrusPng,
} from './helpers';
import { Creator } from '@metaplex-foundation/mpl-token-metadata';
import BN from 'bn.js';

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

test('uploadAsset: candy machine that can hold 2 assets', async (t) => {
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

test.only('uploadAsset: candy machine that can hold 2 assets add three assets one at a time', async (t) => {
  // Given I create a candy machine that can hold 2 assets
  const mx = await metaplex();
  const tc = amman.transactionChecker(mx.connection);

  const storageDriver = amman.createMockStorageDriver(MOCK_STORAGE_ID, {
    costPerByte: 0.001,
  });
  storageDriver.install(mx as any);

  const cm = mx.candyMachines();

  const { candyMachine, candyMachineSigner, payerSigner } =
    await createCandyMachineWithMaxSupply(mx, 2);

  {
    // When I upload the first asset for it
    t.comment('uploading first asset');
    const asset = new MetaplexFile(rockPng, 'rock.png');
    const { uri, metadata } = await cm.uploadOneAssetForCandyMachine({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      image: asset,
    });

    // Then the asset is uploaded properly
    await verifyProperlyUploaded(t, uri, asset, candyMachine.creators);

    // And I can add the asset to the candy machine
    const { transactionId } = await cm.addAssets({
      candyMachineAddress: candyMachineSigner.publicKey,
      authoritySigner: payerSigner,
      assets: [
        {
          uri,
          name: metadata.name ?? asset.displayName,
        },
      ],
    });
    tc.assertSuccess(t, transactionId);
  }
  {
    // When I upload the second asset for it
    t.comment('uploading second asset');
    const asset = new MetaplexFile(benchPng, 'bench.png');
    const { uri, metadata } = await cm.uploadOneAssetForCandyMachine({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      image: asset,
    });

    // Then the asset is uploaded properly
    await verifyProperlyUploaded(t, uri, asset, candyMachine.creators);

    // And I can add the asset to the candy machine
    const { transactionId } = await cm.addAssets({
      candyMachineAddress: candyMachineSigner.publicKey,
      authoritySigner: payerSigner,
      assets: [
        {
          uri,
          name: metadata.name ?? asset.displayName,
        },
      ],
    });
    tc.assertSuccess(t, transactionId);
  }
  {
    // When I upload the third asset for it
    t.comment('uploading third asset');
    const asset = new MetaplexFile(walrusPng, 'walrus.png');
    try {
      await cm.uploadOneAssetForCandyMachine({
        authoritySigner: payerSigner,
        candyMachineAddress: candyMachineSigner.publicKey,
        image: asset,
      });
      t.fail('should throw');
    } catch (err) {
      // Then it fails because the candy machine is full

      t.ok(
        err instanceof CandyMachineIsFullError,
        'throws CandyMachineIsFullError'
      );
    }
  }
});
