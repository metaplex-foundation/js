import test from 'tape';
import spok, { Specifications } from 'spok';
import { TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import {
  createNft,
  createWallet,
  killStuckProcess,
  metaplex,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import { createCandyMachine } from './helpers';
import {
  CandyMachine,
  findCandyMachineCreatorPda,
  Nft,
  now,
  toBigNumber,
  toDateTime,
  token,
} from '@/index';
import { WhitelistMintMode } from '@metaplex-foundation/mpl-candy-machine';

killStuckProcess();

test('[candyMachineModule] it can mint from candy machine', async (t) => {
  // Given an existing Candy Machine with 2 items.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    symbol: 'CANDY',
    sellerFeeBasisPoints: 123,
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
  });

  // When we mint an NFT from the candy machine.
  const { nft } = await mx.candyMachines().mint({ candyMachine }).run();
  const updatedCandyMachine = await mx
    .candyMachines()
    .refresh(candyMachine)
    .run();

  // Then an NFT was created with the right data.
  spok(t, nft, {
    $topic: 'Minted NFT',
    model: 'nft',
    name: 'Degen #1',
    symbol: 'CANDY',
    uri: 'https://example.com/degen/1',
    sellerFeeBasisPoints: 123,
    tokenStandard: TokenStandard.NonFungible,
    isMutable: true,
    primarySaleHappened: true,
    updateAuthorityAddress: spokSamePubkey(candyMachine.authorityAddress),
    creators: [
      {
        address: spokSamePubkey(
          findCandyMachineCreatorPda(candyMachine.address)
        ),
        verified: true,
        share: 0,
      },
      {
        address: spokSamePubkey(mx.identity().publicKey),
        verified: false,
        share: 100,
      },
    ],
    edition: {
      model: 'nftEdition',
      isOriginal: true,
      supply: spokSameBignum(toBigNumber(0)),
      maxSupply: spokSameBignum(toBigNumber(0)),
    },
  } as Specifications<Nft>);

  // And the Candy Machine data was updated.
  spok(t, updatedCandyMachine, {
    $topic: 'Update Candy Machine',
    itemsAvailable: spokSameBignum(toBigNumber(2)),
    itemsMinted: spokSameBignum(toBigNumber(1)),
    itemsRemaining: spokSameBignum(toBigNumber(1)),
  } as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can mint from candy machine with a collection', async (t) => {
  // Given a Candy Machine with a set Collection.
  const mx = await metaplex();
  const collection = await createNft(mx);
  const { candyMachine } = await createCandyMachine(mx, {
    goLiveDate: toDateTime(now().subn(24 * 60 * 60)), // Yesterday.
    itemsAvailable: toBigNumber(1),
    collection: collection.address,
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
  });

  // When we mint an NFT from that candy machine.
  const { nft } = await mx.candyMachines().mint({ candyMachine }).run();

  // Then an NFT was created.
  spok(t, nft, {
    $topic: 'Minted NFT',
    model: 'nft',
    name: 'Degen #1',
    collection: {
      verified: true,
      address: spokSamePubkey(collection.address),
    },
  } as Specifications<Nft>);
});

test('[candyMachineModule] it can mint from candy machine as another payer', async (t) => {
  // Given a loaded Candy Machine
  const mx = await metaplex();
  const payer = await createWallet(mx);
  const { candyMachine } = await createCandyMachine(mx, {
    goLiveDate: toDateTime(now().subn(24 * 60 * 60)), // Yesterday.
    itemsAvailable: toBigNumber(1),
    symbol: 'CANDY',
    sellerFeeBasisPoints: 123,
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
  });

  // When we mint an NFT from the candy machine.
  const { nft } = await mx
    .candyMachines()
    .mint({ candyMachine, payer, newOwner: payer.publicKey })
    .run();

  // Then an NFT was created with the right data.
  spok(t, nft, {
    $topic: 'Minted NFT',
    model: 'nft',
    name: 'Degen #1',
  } as Specifications<Nft>);

  // And it belongs to the payer.
  const nftTokenHolder = await mx
    .tokens()
    .findTokenWithMintByMint({
      mint: nft.address,
      address: payer.publicKey,
      addressType: 'owner',
    })
    .run();
  t.ok(
    nftTokenHolder.ownerAddress.equals(payer.publicKey),
    'NFT belongs to the payer'
  );
});

test('[candyMachineModule] it can mint from candy machine with an SPL treasury', async (t) => {
  // Given a mint accounts with two token accounts:
  // - One for the payer with an initial supply of 10 tokens "payerTokenAccount".
  // - One for the candy machine "treasuryTokenAccount".
  const mx = await metaplex();
  const payer = await createWallet(mx);
  const { token: payerTokenAccount } = await mx
    .tokens()
    .createTokenWithMint({ initialSupply: token(10), owner: payer.publicKey })
    .run();
  const mintTreasury = payerTokenAccount.mint;
  const { token: treasuryTokenAccount } = await mx
    .tokens()
    .createToken({ mint: mintTreasury.address })
    .run();

  // And given a Candy Machine with all of these settings.
  const { candyMachine } = await createCandyMachine(mx, {
    price: token(5),
    goLiveDate: toDateTime(now().subn(24 * 60 * 60)), // Yesterday.
    itemsAvailable: toBigNumber(2),
    symbol: 'CANDY',
    sellerFeeBasisPoints: 123,
    tokenMint: mintTreasury.address,
    wallet: treasuryTokenAccount.address,
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
  });

  // When we mint an NFT from that candy machine.
  const { nft } = await mx
    .candyMachines()
    .mint({ candyMachine, payer, newOwner: payer.publicKey })
    .run();

  // Then an NFT was created.
  spok(t, nft, {
    $topic: 'Minted NFT',
    model: 'nft',
    name: 'Degen #1',
  } as Specifications<Nft>);

  // And the payer token account was debited.
  const updatedPayerTokenAccount = await mx
    .tokens()
    .findTokenByAddress({ address: payerTokenAccount.address })
    .run();
  t.equal(
    updatedPayerTokenAccount.amount.basisPoints.toNumber(),
    5,
    'Payer token account was debited'
  );
});

test('[candyMachineModule] it can mint from candy machine even when we max out the instructions needed', async (t) => {
  // Given a mint accounts with two token accounts:
  // - One for the payer with an initial supply of 10 tokens "payerTokenAccount".
  // - One for the candy machine "treasuryTokenAccount".
  const mx = await metaplex();
  const payer = await createWallet(mx);
  const { token: payerTokenAccount } = await mx
    .tokens()
    .createTokenWithMint({ initialSupply: token(10), owner: payer.publicKey })
    .run();
  const mintTreasury = payerTokenAccount.mint;
  const { token: treasuryTokenAccount } = await mx
    .tokens()
    .createToken({ mint: mintTreasury.address })
    .run();

  // And the following whitelist settings.
  const { token: payerWhitelistTokenAccount } = await mx
    .tokens()
    .createTokenWithMint({ initialSupply: token(1), owner: payer.publicKey })
    .run();
  const whitelistMintSettings = {
    mode: WhitelistMintMode.BurnEveryTime,
    mint: payerWhitelistTokenAccount.mint.address,
    presale: false,
    discountPrice: null,
  };

  // And the following collection.
  const collection = await createNft(mx);

  // And given a Candy Machine with all of these settings.
  const { candyMachine } = await createCandyMachine(mx, {
    price: token(5),
    goLiveDate: toDateTime(now().subn(24 * 60 * 60)), // Yesterday.
    itemsAvailable: toBigNumber(2),
    symbol: 'CANDY',
    sellerFeeBasisPoints: 123,
    tokenMint: mintTreasury.address,
    wallet: treasuryTokenAccount.address,
    whitelistMintSettings,
    collection: collection.address,
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
  });

  // When we mint an NFT from that candy machine.
  const { nft } = await mx
    .candyMachines()
    .mint({ candyMachine, payer, newOwner: payer.publicKey })
    .run();

  // Then an NFT was created.
  spok(t, nft, {
    $topic: 'Minted NFT',
    model: 'nft',
    name: 'Degen #1',
  } as Specifications<Nft>);
});
