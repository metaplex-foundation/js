import test, { Test } from 'tape';
import spok from 'spok';
import { Keypair } from '@solana/web3.js';
import {
  metaplex,
  spokSamePubkey,
  killStuckProcess,
  assertThrows,
  createWallet,
} from '../../helpers';
import {
  findAuctionHouseFeePda,
  findAuctionHousePda,
  findAuctionHouseTreasuryPda,
  findAuctioneerPda,
  WRAPPED_SOL_MINT,
} from '@/index';
import { AUCTIONEER_ALL_SCOPES } from '@/plugins/auctionHouseModule/constants';

killStuckProcess();

test('[auctionHouseModule] create new Auction House with minimum configuration', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // When we create a new Auction House with minimum configuration.
  const { auctionHouse } = await mx
    .auctionHouse()
    .create({ sellerFeeBasisPoints: 200 })
    .run();

  // Then we created and returned the new Auction House and it has appropriate defaults.
  const expectedCreator = mx.identity().publicKey;
  const expectedMint = WRAPPED_SOL_MINT;
  const expectedAddress = findAuctionHousePda(expectedCreator, expectedMint);
  const expectedAuctionHouse = {
    address: spokSamePubkey(expectedAddress),
    creatorAddress: spokSamePubkey(expectedCreator),
    authorityAddress: spokSamePubkey(expectedCreator),
    treasuryMint: {
      address: spokSamePubkey(expectedMint),
    },
    feeAccountAddress: spokSamePubkey(findAuctionHouseFeePda(expectedAddress)),
    treasuryAccountAddress: spokSamePubkey(
      findAuctionHouseTreasuryPda(expectedAddress)
    ),
    feeWithdrawalDestinationAddress: spokSamePubkey(expectedCreator),
    treasuryWithdrawalDestinationAddress: spokSamePubkey(expectedCreator),
    sellerFeeBasisPoints: 200,
    requiresSignOff: false,
    canChangeSalePrice: false,
    isNative: true,
  };

  spok(t, auctionHouse, { $topic: 'Auction House', ...expectedAuctionHouse });

  // And we get the same result when we fetch the Auction House by address.
  const retrievedAuctionHouse = await mx
    .auctionHouse()
    .findByAddress({ address: auctionHouse.address })
    .run();

  spok(t, retrievedAuctionHouse, {
    $topic: 'Retrieved Auction House',
    ...expectedAuctionHouse,
  });
});

test('[auctionHouseModule] create new Auction House with maximum configuration', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // When we create a new Auction House by providing all inputs.
  const treasuryMint = WRAPPED_SOL_MINT;
  const authority = mx.identity();
  const feeWithdrawalDestination = Keypair.generate();
  const treasuryWithdrawalDestinationOwner = Keypair.generate();
  const { auctionHouse } = await mx
    .auctionHouse()
    .create({
      sellerFeeBasisPoints: 200,
      requiresSignOff: true,
      canChangeSalePrice: true,
      treasuryMint: treasuryMint,
      payer: authority,
      authority: authority.publicKey,
      feeWithdrawalDestination: feeWithdrawalDestination.publicKey,
      treasuryWithdrawalDestinationOwner:
        treasuryWithdrawalDestinationOwner.publicKey,
    })
    .run();

  // Then the created Auction House has the expected configuration.
  const expectedAddress = findAuctionHousePda(
    authority.publicKey,
    treasuryMint
  );
  const expectedAuctionHouse = {
    address: spokSamePubkey(expectedAddress),
    creatorAddress: spokSamePubkey(authority.publicKey),
    authorityAddress: spokSamePubkey(authority.publicKey),
    treasuryMint: {
      address: spokSamePubkey(treasuryMint),
    },
    feeAccountAddress: spokSamePubkey(findAuctionHouseFeePda(expectedAddress)),
    treasuryAccountAddress: spokSamePubkey(
      findAuctionHouseTreasuryPda(expectedAddress)
    ),
    feeWithdrawalDestinationAddress: spokSamePubkey(
      feeWithdrawalDestination.publicKey
    ),
    treasuryWithdrawalDestinationAddress: spokSamePubkey(
      treasuryWithdrawalDestinationOwner.publicKey
    ),
    sellerFeeBasisPoints: 200,
    requiresSignOff: true,
    canChangeSalePrice: true,
    isNative: true,
  };

  spok(t, auctionHouse, { $topic: 'Auction House', ...expectedAuctionHouse });
});

test('[auctionHouseModule] create new Auction House with SPL treasury', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And an existing SPL treasury.
  const treasuryOwner = Keypair.generate().publicKey;
  const { token } = await mx
    .tokens()
    .createTokenWithMint({ owner: treasuryOwner })
    .run();

  // When we create a new Auction House using that treasury.
  const { auctionHouse } = await mx
    .auctionHouse()
    .create({
      sellerFeeBasisPoints: 200,
      treasuryMint: token.mint.address,
      treasuryWithdrawalDestinationOwner: treasuryOwner,
    })
    .run();

  // Then the created Auction House stores the treasury information.
  spok(t, auctionHouse, {
    $topic: 'Auction House with Spl Token',
    isNative: false,
    treasuryWithdrawalDestinationAddress: spokSamePubkey(token.address),
    treasuryMint: {
      address: spokSamePubkey(token.mint.address),
    },
  });
});

test('[auctionHouseModule] create new Auctioneer Auction House', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  const auctioneerAuthority = Keypair.generate();

  // When we create a new Auctioneer Auction House.
  const { auctionHouse } = await mx
    .auctionHouse()
    .create({
      sellerFeeBasisPoints: 200,
      auctioneerAuthority: auctioneerAuthority.publicKey,
    })
    .run();

  // Then the new Auction House has Auctioneer attached.
  const ahAuctioneerPda = findAuctioneerPda(
    auctionHouse.address,
    auctioneerAuthority.publicKey
  );
  spok(t, auctionHouse, {
    hasAuctioneer: true,
    auctioneer: {
      address: spokSamePubkey(ahAuctioneerPda),
      authority: spokSamePubkey(auctioneerAuthority.publicKey),
      scopes: AUCTIONEER_ALL_SCOPES,
    },
  });

  // And the Auctioneer PDA for that Auction House was created.
  const ahAuctioneerAccount = await mx.rpc().getAccount(ahAuctioneerPda);
  t.ok(ahAuctioneerAccount.exists);
});

test('[auctionHouseModule] create new Auctioneer Auction House with separate authority', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  const auctioneerAuthority = Keypair.generate();
  const authority = await createWallet(mx);

  // When we create a new Auctioneer Auction House with a separate authority.
  const { auctionHouse } = await mx
    .auctionHouse()
    .create({
      sellerFeeBasisPoints: 200,
      auctioneerAuthority: auctioneerAuthority.publicKey,
      authority,
    })
    .run();

  // Then the new Auction House has separate authority.
  t.equal(
    auctionHouse.authorityAddress.toBase58(),
    authority.publicKey.toBase58()
  );

  // And Auctioneer was delegated.
  t.ok(auctionHouse.hasAuctioneer);
});

test('[auctionHouseModule] it throws when creating Auctioneer Auction House with a PublicKey authority provided', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  const auctioneerAuthority = Keypair.generate();
  const authority = await createWallet(mx);

  // When we create a new Auctioneer Auction House with an separate authority provided as PublicKey.
  const promise = mx
    .auctionHouse()
    .create({
      sellerFeeBasisPoints: 200,
      auctioneerAuthority: auctioneerAuthority.publicKey,
      authority: authority.publicKey, // Provide PublicKey instead of Signer to catch an error
    })
    .run();

  // Then we expect an error because Auctioneer delegation requires authority signer.
  await assertThrows(
    t,
    promise,
    /Expected variable \[authority\] to be of type \[Signer\]/
  );
});
