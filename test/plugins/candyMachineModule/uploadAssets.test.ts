import test from 'tape';
import spok from 'spok';

import {
  CandyMachineIsFullError,
  Metaplex,
  MetaplexFile,
  mockStorage,
  UploadedAsset,
  useMetaplexFile,
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
import { ammanMockStorage } from '@metaplex-foundation/amman-client';

killStuckProcess();

async function verifyProperlyUploaded(
  t: test.Test,
  mx: Metaplex,
  uri: string,
  asset: MetaplexFile,
  creators: Creator[]
) {
  const { image, properties } = await mx.storage().downloadJson<any>(uri);
  spok(
    t,
    properties.creators as Creator[],
    creators.map((x) => ({
      ...x,
      address: x.address.toBase58(),
      share: new BN(x.share).toNumber(),
    }))
  );

  const metaplexFile = await mx.storage().download(image);
  t.ok(
    asset.buffer.equals(Buffer.from(metaplexFile.buffer)),
    'asset.buffer === metaplexFile.buffer'
  );
}

async function verifyUploadedAssets(
  t: test.Test,
  mx: Metaplex,
  assets: MetaplexFile[],
  uploadedAssets: UploadedAsset[],
  creators: Creator[]
) {
  for (const x of uploadedAssets) {
    const asset = assets.find((y) => y.displayName === x.name);
    t.ok(asset != null, 'asset was named correctly');
    await verifyProperlyUploaded(t, mx, x.uri, asset!, creators);
  }
}

function setupMockStorage(mx: Metaplex) {
  if (process.env.CI == null) {
    mx.use(ammanMockStorage(MOCK_STORAGE_ID));
  } else {
    mx.use(mockStorage());
  }
}

test.only('uploadAsset: candy machine that can hold 2 assets', async (t) => {
  // Given I create a candy machine holing 2 assets
  const mx = await metaplex();
  setupMockStorage(mx);

  const cm = mx.candyMachines();

  const { candyMachine, candyMachineSigner, payerSigner } =
    await createCandyMachineWithMaxSupply(mx, 2);

  // When I upload one asset for it
  const asset = useMetaplexFile(rockPng, 'rock.png');
  const { uri, addAssetsTransactionId } = await cm.uploadAssetForCandyMachine({
    authoritySigner: payerSigner,
    candyMachineAddress: candyMachineSigner.publicKey,
    image: asset,
  });

  // Then the asset is uploaded properly
  await verifyProperlyUploaded(t, mx, uri, asset, candyMachine.creators);

  // And the asset is not added to the candy machine
  const updatedCm = await cm.findByAddress(candyMachine.candyMachineAddress);
  t.ok(addAssetsTransactionId == null, 'did not add asset to candy machine');
  t.equal(updatedCm?.assetsCount, 0, 'candy machine has 1 asset');
});

test('uploadAsset: candy machine that can hold 2 assets add three assets one at a time', async (t) => {
  // Given I create a candy machine that can hold 2 assets
  const mx = await metaplex();
  const tc = amman.transactionChecker(mx.connection);
  setupMockStorage(mx);

  const cm = mx.candyMachines();

  const { candyMachine, candyMachineSigner, payerSigner } =
    await createCandyMachineWithMaxSupply(mx, 2);

  {
    // When I upload the first asset for it
    t.comment('uploading first asset');
    const asset = useMetaplexFile(rockPng, 'rock.png');
    const { uri, metadata } = await cm.uploadAssetForCandyMachine({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      image: asset,
    });

    // Then the asset is uploaded properly
    await verifyProperlyUploaded(t, mx, uri, asset, candyMachine.creators);

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
    await tc.assertSuccess(t, transactionId);
  }
  {
    // When I upload the second asset for it
    t.comment('uploading second asset');
    const asset = useMetaplexFile(benchPng, 'bench.png');
    const { uri, metadata } = await cm.uploadAssetForCandyMachine({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      image: asset,
    });

    // Then the asset is uploaded properly
    await verifyProperlyUploaded(t, mx, uri, asset, candyMachine.creators);

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
    await tc.assertSuccess(t, transactionId);
  }
  {
    // When I upload the third asset for it
    t.comment('uploading third asset');
    const asset = useMetaplexFile(walrusPng, 'walrus.png');
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
  setupMockStorage(mx);

  const cm = mx.candyMachines();

  const { candyMachine, candyMachineSigner, payerSigner } =
    await createCandyMachineWithMaxSupply(mx, 2);

  // When I upload one asset for it and have it added to the candy machine
  const asset = useMetaplexFile(rockPng, 'rock.png');
  const { uri, addAssetsTransactionId } = await cm.uploadAssetForCandyMachine({
    authoritySigner: payerSigner,
    candyMachineAddress: candyMachineSigner.publicKey,
    image: asset,
    addToCandyMachine: true,
  });

  // Then the asset is uploaded properly
  await verifyProperlyUploaded(t, mx, uri, asset, candyMachine.creators);

  // And the asset is added to the candy machine
  const updatedCm = await cm.findByAddress(candyMachine.candyMachineAddress);
  t.ok(addAssetsTransactionId != null, 'did add asset to candy machine');
  t.equal(updatedCm?.assetsCount, 1, 'candy machine has 1 asset');
});

// -----------------
// upload multiple
// -----------------
const assets = [
  useMetaplexFile(rockPng, 'rock.png', { displayName: 'rock' }),
  useMetaplexFile(bridgePng, 'bridge.png', {
    displayName: 'bridge',
  }),
  useMetaplexFile(benchPng, 'bench.png', { displayName: 'bench' }),
  useMetaplexFile(walrusPng, 'walrus.png', {
    displayName: 'Creature of the sea',
  }),
];

test('uploadAndAddAssets: candy machine that can hold 4 assets upload 4 and add', async (t) => {
  for (const parallel of [false, true]) {
    t.comment(`Uploading ${parallel ? 'in parallel' : 'sequentially'}`);

    // Given I create a candy machine holding 4 assets
    const mx = await metaplex();
    setupMockStorage(mx);

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
      mx,
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
