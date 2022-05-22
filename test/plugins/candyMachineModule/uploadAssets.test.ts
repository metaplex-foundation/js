import test from 'tape';
import spok from 'spok';

import fetch from 'cross-fetch';

import {
  CandyMachineIsFullError,
  MetaplexFile,
  UploadedAsset,
} from '../../../src';
import {
  amman,
  killStuckProcess,
  metaplex,
  MOCK_STORAGE_ID,
} from '../../helpers';
import {
  benchPng,
  bridgePng,
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

async function verifyUploadedAssets(
  t: test.Test,
  assets: MetaplexFile[],
  uploadedAssets: UploadedAsset[],
  creators: Creator[]
) {
  for (const x of uploadedAssets) {
    const asset = assets.find((y) => y.displayName === x.name);
    t.ok(asset != null, 'asset was named correctly');
    await verifyProperlyUploaded(t, x.uri, asset!, creators);
  }
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
  const { uri, addAssetsTransactionId } = await cm.uploadAssetForCandyMachine({
    authoritySigner: payerSigner,
    candyMachineAddress: candyMachineSigner.publicKey,
    image: asset,
  });

  // Then the asset is uploaded properly
  await verifyProperlyUploaded(t, uri, asset, candyMachine.creators);

  // And the asset is not added to the candy machine
  const updatedCm = await cm.findByAddress(candyMachine.candyMachineAddress);
  t.ok(addAssetsTransactionId == null, 'did not add asset to candy machine');
  t.equal(updatedCm?.assetsCount, 0, 'candy machine has 1 asset');
});

test('uploadAsset: candy machine that can hold 2 assets add three assets one at a time', async (t) => {
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
    const { uri, metadata } = await cm.uploadAssetForCandyMachine({
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
    const { uri, metadata } = await cm.uploadAssetForCandyMachine({
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
      await cm.uploadAssetForCandyMachine({
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

test('uploadAndAddAsset: candy machine that can hold 2 assets upload one', async (t) => {
  // Given I create a candy machine holding 2 assets
  const mx = await metaplex();
  const storageDriver = amman.createMockStorageDriver(MOCK_STORAGE_ID, {
    costPerByte: 0.001,
  });
  storageDriver.install(mx as any);

  const cm = mx.candyMachines();

  const { candyMachine, candyMachineSigner, payerSigner } =
    await createCandyMachineWithMaxSupply(mx, 2);

  // When I upload one asset for it and have it added to the candy machine
  const asset = new MetaplexFile(rockPng, 'rock.png');
  const { uri, addAssetsTransactionId } = await cm.uploadAssetForCandyMachine({
    authoritySigner: payerSigner,
    candyMachineAddress: candyMachineSigner.publicKey,
    image: asset,
    addToCandyMachine: true,
  });

  // Then the asset is uploaded properly
  await verifyProperlyUploaded(t, uri, asset, candyMachine.creators);

  // And the asset is added to the candy machine
  const updatedCm = await cm.findByAddress(candyMachine.candyMachineAddress);
  t.ok(addAssetsTransactionId != null, 'did add asset to candy machine');
  t.equal(updatedCm?.assetsCount, 1, 'candy machine has 1 asset');
});

// -----------------
// upload multiple
// -----------------
const assets = [
  new MetaplexFile(rockPng, 'rock.png', { displayName: 'rock' }),
  new MetaplexFile(bridgePng, 'bridge.png', {
    displayName: 'bridge',
  }),
  new MetaplexFile(benchPng, 'bench.png', { displayName: 'bench' }),
  new MetaplexFile(walrusPng, 'walrus.png', {
    displayName: 'Creature of the sea',
  }),
];

test('uploadAndAddAssets: candy machine that can hold 4 assets upload 4 and add', async (t) => {
  for (const parallel of [false, true]) {
    t.comment(`Uploading ${parallel ? 'in parallel' : 'sequentially'}`);

    // Given I create a candy machine holding 4 assets
    const mx = await metaplex();
    const storageDriver = amman.createMockStorageDriver(MOCK_STORAGE_ID, {
      costPerByte: 0.001,
    });
    storageDriver.install(mx as any);

    const cm = mx.candyMachines();

    const { candyMachine, candyMachineSigner, payerSigner } =
      await createCandyMachineWithMaxSupply(mx, 4);

    // When I upload 4 assets to it sequentially and have it added to the candy machine
    const { addAssetsTransactionId, uploadedAssets } =
      await cm.uploadAssetsForCandyMachine({
        authoritySigner: payerSigner,
        candyMachineAddress: candyMachineSigner.publicKey,
        assets: assets,
        addToCandyMachine: true,
      });

    await amman.addr.addLabel(
      addAssetsTransactionId!,
      'tx: upload+add 4 assets sequentially'
    );

    // Then the asset is uploaded properly
    t.ok(
      addAssetsTransactionId != null,
      'run transaction to add assets to candy machine'
    );
    await verifyUploadedAssets(
      t,
      assets,
      uploadedAssets,
      candyMachine.creators
    );

    // And the asset is added to the candy machine
    const updatedCm = await cm.findByAddress(candyMachine.candyMachineAddress);
    t.ok(addAssetsTransactionId != null, 'did add assets to candy machine');
    t.equal(updatedCm?.assetsCount, 4, 'candy machine has 4 assets');
  }
});
