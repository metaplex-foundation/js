import test from 'tape';
import spok, { Specifications } from 'spok';
import { TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { WhitelistMintMode } from '@metaplex-foundation/mpl-candy-machine';
import {
  createNft,
  createWallet,
  killStuckProcess,
  metaplex,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import { createCandyMachineV2 } from './helpers';
import {
  CandyMachineV2,
  findCandyMachineV2CreatorPda,
  Nft,
  now,
  toBigNumber,
  toDateTime,
  token,
} from '@/index';

killStuckProcess();

test('[candyMachineV2Module] it can mint from candy machine', async (t) => {
  // Given an existing Candy Machine with 2 items.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachineV2(mx, {
    itemsAvailable: toBigNumber(2),
    symbol: 'CANDY',
    sellerFeeBasisPoints: 123,
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
  });

  // When we mint an NFT from the candy machine.
  const { nft } = await mx.candyMachinesV2().mint({ candyMachine });
  const updatedCandyMachine = await mx.candyMachinesV2().refresh(candyMachine);

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
          findCandyMachineV2CreatorPda(candyMachine.address)
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
  } as Specifications<CandyMachineV2>);
});

test('[candyMachineV2Module] it can mint from candy machine with a collection', async (t) => {
  // Given a Candy Machine with a set Collection.
  const mx = await metaplex();
  const collection = await createNft(mx);
  const { candyMachine } = await createCandyMachineV2(mx, {
    goLiveDate: toDateTime(now().subn(24 * 60 * 60)), // Yesterday.
    itemsAvailable: toBigNumber(1),
    collection: collection.address,
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
  });

  // When we mint an NFT from that candy machine.
  const { nft } = await mx.candyMachinesV2().mint({ candyMachine });

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

test('[candyMachineV2Module] it can mint from candy machine as another payer', async (t) => {
  // Given a loaded Candy Machine
  const mx = await metaplex();
  const payer = await createWallet(mx);
  const { candyMachine } = await createCandyMachineV2(mx, {
    goLiveDate: toDateTime(now().subn(24 * 60 * 60)), // Yesterday.
    itemsAvailable: toBigNumber(1),
    symbol: 'CANDY',
    sellerFeeBasisPoints: 123,
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
  });

  // When we mint an NFT from the candy machine.
  const { nft } = await mx
    .candyMachinesV2()
    .mint({ candyMachine, newOwner: payer.publicKey }, { payer });

  // Then an NFT was created with the right data.
  spok(t, nft, {
    $topic: 'Minted NFT',
    model: 'nft',
    name: 'Degen #1',
  } as Specifications<Nft>);

  // And it belongs to the payer.
  const nftTokenHolder = await mx.tokens().findTokenWithMintByMint({
    mint: nft.address,
    address: payer.publicKey,
    addressType: 'owner',
  });

  t.ok(
    nftTokenHolder.ownerAddress.equals(payer.publicKey),
    'NFT belongs to the payer'
  );
});

test('[candyMachineV2Module] it can mint from candy machine with an SPL treasury', async (t) => {
  // Given a mint accounts with two token accounts:
  // - One for the payer with an initial supply of 10 tokens "payerTokenAccount".
  // - One for the candy machine "treasuryTokenAccount".
  const mx = await metaplex();
  const payer = await createWallet(mx);
  const { token: payerTokenAccount } = await mx
    .tokens()
    .createTokenWithMint({ initialSupply: token(10), owner: payer.publicKey });

  const mintTreasury = payerTokenAccount.mint;
  const { token: treasuryTokenAccount } = await mx
    .tokens()
    .createToken({ mint: mintTreasury.address });

  // And given a Candy Machine with all of these settings.
  const { candyMachine } = await createCandyMachineV2(mx, {
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
    .candyMachinesV2()
    .mint({ candyMachine, newOwner: payer.publicKey }, { payer });

  // Then an NFT was created.
  spok(t, nft, {
    $topic: 'Minted NFT',
    model: 'nft',
    name: 'Degen #1',
  } as Specifications<Nft>);

  // And the payer token account was debited.
  const updatedPayerTokenAccount = await mx
    .tokens()
    .findTokenByAddress({ address: payerTokenAccount.address });

  t.equal(
    updatedPayerTokenAccount.amount.basisPoints.toNumber(),
    5,
    'Payer token account was debited'
  );
});

test('[candyMachineV2Module] it can mint from candy machine even when we max out the instructions needed', async (t) => {
  // Given a mint accounts with two token accounts:
  // - One for the payer with an initial supply of 10 tokens "payerTokenAccount".
  // - One for the candy machine "treasuryTokenAccount".
  const mx = await metaplex();
  const payer = await createWallet(mx);
  const { token: payerTokenAccount } = await mx
    .tokens()
    .createTokenWithMint({ initialSupply: token(10), owner: payer.publicKey });

  const mintTreasury = payerTokenAccount.mint;
  const { token: treasuryTokenAccount } = await mx
    .tokens()
    .createToken({ mint: mintTreasury.address });

  // And the following whitelist settings.
  const { token: payerWhitelistTokenAccount } = await mx
    .tokens()
    .createTokenWithMint({ initialSupply: token(1), owner: payer.publicKey });

  const whitelistMintSettings = {
    mode: WhitelistMintMode.BurnEveryTime,
    mint: payerWhitelistTokenAccount.mint.address,
    presale: false,
    discountPrice: null,
  };

  // And the following collection.
  const collection = await createNft(mx);

  // And given a Candy Machine with all of these settings.
  const { candyMachine } = await createCandyMachineV2(mx, {
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
    .candyMachinesV2()
    .mint({ candyMachine, newOwner: payer.publicKey }, { payer });

  // Then an NFT was created.
  spok(t, nft, {
    $topic: 'Minted NFT',
    model: 'nft',
    name: 'Degen #1',
  } as Specifications<Nft>);
});
