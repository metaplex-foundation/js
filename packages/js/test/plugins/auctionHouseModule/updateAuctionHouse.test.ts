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
  findAssociatedTokenAccountPda,
  findAuctionHouseFeePda,
  findAuctionHousePda,
  findAuctionHouseTreasuryPda,
} from '@/index';
import { AuthorityScope } from '@metaplex-foundation/mpl-auction-house';

killStuckProcess();

test('[auctionHouseModule] update all fields of an Auction House', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And an existing SPL treasury.
  const treasuryOwner = Keypair.generate().publicKey;
  const { token: treasuryToken } = await mx
    .tokens()
    .createTokenWithMint({ owner: treasuryOwner })
    .run();
  const treasuryMint = treasuryToken.mint.address;

  // And an existing Auction House using that SPL treasury.
  const { auctionHouse: originalAuctionHouse } = await mx
    .auctions()
    .createAuctionHouse({
      sellerFeeBasisPoints: 200,
      treasuryMint: treasuryMint,
      treasuryWithdrawalDestinationOwner: treasuryOwner,
    })
    .run();
  const originalCreator = mx.identity().publicKey;
  const originalAddress = findAuctionHousePda(originalCreator, treasuryMint);
  spok(t, originalAuctionHouse, {
    $topic: 'Original AuctionHouse',
    address: spokSamePubkey(originalAddress),
    creatorAddress: spokSamePubkey(originalCreator),
    authorityAddress: spokSamePubkey(originalCreator),
    treasuryMint: {
      address: spokSamePubkey(treasuryMint),
    },
    feeAccountAddress: spokSamePubkey(findAuctionHouseFeePda(originalAddress)),
    treasuryAccountAddress: spokSamePubkey(
      findAuctionHouseTreasuryPda(originalAddress)
    ),
    feeWithdrawalDestinationAddress: spokSamePubkey(originalCreator),
    treasuryWithdrawalDestinationAddress: spokSamePubkey(treasuryToken.address),
    sellerFeeBasisPoints: 200,
    requiresSignOff: false,
    canChangeSalePrice: false,
    isNative: false,
  });

  // When we update as much as we can from that Auction House.
  const newAuthority = Keypair.generate().publicKey;
  const newFeeWithdrawalDestination = Keypair.generate().publicKey;
  const newTreasuryOwner = Keypair.generate().publicKey;
  const { auctionHouse: updatedAuctionHouse } = await mx
    .auctions()
    .updateAuctionHouse(originalAuctionHouse, {
      sellerFeeBasisPoints: 300,
      requiresSignOff: true,
      canChangeSalePrice: true,
      newAuthority,
      feeWithdrawalDestination: newFeeWithdrawalDestination,
      treasuryWithdrawalDestinationOwner: newTreasuryOwner,
    })
    .run();

  // Then all changes have been correctly applied.
  spok(t, updatedAuctionHouse, {
    $topic: 'Updated AuctionHouse',
    address: spokSamePubkey(originalAddress),
    creatorAddress: spokSamePubkey(originalCreator),
    authorityAddress: spokSamePubkey(newAuthority),
    treasuryMint: {
      address: spokSamePubkey(treasuryMint),
    },
    feeAccountAddress: spokSamePubkey(findAuctionHouseFeePda(originalAddress)),
    treasuryAccountAddress: spokSamePubkey(
      findAuctionHouseTreasuryPda(originalAddress)
    ),
    feeWithdrawalDestinationAddress: spokSamePubkey(
      newFeeWithdrawalDestination
    ),
    treasuryWithdrawalDestinationAddress: spokSamePubkey(
      findAssociatedTokenAccountPda(treasuryMint, newTreasuryOwner)
    ),
    sellerFeeBasisPoints: 300,
    requiresSignOff: true,
    canChangeSalePrice: true,
    isNative: false,
  });
});

test('[auctionHouseModule] it throws an error if nothing has changed when updating an Auction House.', async (t) => {
  // Given an existing Auction House.
  const mx = await metaplex();
  const { auctionHouse } = await mx
    .auctions()
    .createAuctionHouse({ sellerFeeBasisPoints: 200 })
    .run();

  // When we send an update without providing any changes.
  const promise = mx.auctions().updateAuctionHouse(auctionHouse, {}).run();

  // Then we expect an error.
  await assertThrows(t, promise, /No Instructions To Send/);
});

test('[auctionHouseModule] delegate Auctioneer on Auction House update.', async (t) => {
  // Given an existing Auction House.
  const mx = await metaplex();
  const auctioneerAuthority = Keypair.generate();

  const { auctionHouse } = await mx
    .auctions()
    .createAuctionHouse({ sellerFeeBasisPoints: 200 })
    .run();

  t.false(auctionHouse.hasAuctioneer);

  // When we send an update with auctioneerAuthority to delegate.
  const { auctionHouse: updatedAuctionHouse, auctioneer } = await mx
    .auctions()
    .updateAuctionHouse(auctionHouse, {
      auctioneerAuthority: auctioneerAuthority.publicKey,
    })
    .run();

  // Then the Auctioneer is delegated and account is created.
  t.ok(updatedAuctionHouse.hasAuctioneer);
  t.equals(
    auctioneer?.auctioneerAuthority.toBase58(),
    auctioneerAuthority.publicKey.toBase58()
  );
});

test('[auctionHouseModule] it allows to delegate Auctioneer on Auction House update with separate authority.', async (t) => {
  // Given an existing Auction House with separate Authority Signer.
  const mx = await metaplex();
  const auctioneerAuthority = Keypair.generate();
  const authority = await createWallet(mx);

  const { auctionHouse } = await mx
    .auctions()
    .createAuctionHouse({ authority, sellerFeeBasisPoints: 200 })
    .run();

  // When we send an update with auctioneerAuthority to delegate.
  const { auctioneer } = await mx
    .auctions()
    .updateAuctionHouse(auctionHouse, {
      authority,
      auctioneerAuthority: auctioneerAuthority.publicKey,
    })
    .run();

  // Then the Auctioneer is delegated and account is created.
  t.equals(
    auctioneer?.auctioneerAuthority.toBase58(),
    auctioneerAuthority.publicKey.toBase58()
  );
});

test('[auctionHouseModule] it persists scope when delegating a different Auctioneer Authority on Auction House update.', async (t) => {
  // Given an existing Auctioneer Auction House.
  const mx = await metaplex();
  const auctioneerAuthority = Keypair.generate();
  const secondAuctioneerAuthority = Keypair.generate();

  const { auctionHouse } = await mx
    .auctions()
    .createAuctionHouse({
      auctioneerAuthority: auctioneerAuthority.publicKey,
      auctioneerScopes: [AuthorityScope.Buy],
      sellerFeeBasisPoints: 200,
    })
    .run();

  // When we send an update with different auctioneerAuthority to delegate.
  const { auctioneer } = await mx
    .auctions()
    .updateAuctionHouse(auctionHouse, {
      auctioneerAuthority: auctioneerAuthority.publicKey,
      newAuctioneerAuthority: secondAuctioneerAuthority.publicKey,
    })
    .run();

  // Then the new Auctioneer is delegated with persisted scope.
  t.equals(
    auctioneer?.auctioneerAuthority.toBase58(),
    secondAuctioneerAuthority.publicKey.toBase58()
  );
  t.same(auctioneer?.scopes, [AuthorityScope.Buy]);
});

test('[auctionHouseModule] it allows to update Auctioneer Scope.', async (t) => {
  // Given an existing Auctioneer Auction House.
  const mx = await metaplex();
  const auctioneerAuthority = Keypair.generate();

  const { auctionHouse } = await mx
    .auctions()
    .createAuctionHouse({
      auctioneerAuthority: auctioneerAuthority.publicKey,
      auctioneerScopes: [AuthorityScope.PublicBuy],
      sellerFeeBasisPoints: 200,
    })
    .run();

  // When we send the scope update.
  const { auctioneer } = await mx
    .auctions()
    .updateAuctionHouse(auctionHouse, {
      auctioneerAuthority: auctioneerAuthority.publicKey,
      auctioneerScopes: [AuthorityScope.Buy],
    })
    .run();

  // Then we update and return the updated Auctioneer with the new scope.
  t.ok(auctioneer);
  t.same(auctioneer?.scopes, [AuthorityScope.Buy]);
});

test('[auctionHouseModule] it allows to use already delegated newAuctioneerAuthority.', async (t) => {
  // Given an existing Auctioneer Auction House.
  const mx = await metaplex();
  const auctioneerAuthority = Keypair.generate();

  const { auctionHouse } = await mx
    .auctions()
    .createAuctionHouse({
      auctioneerAuthority: auctioneerAuthority.publicKey,
      auctioneerScopes: [AuthorityScope.PublicBuy],
      sellerFeeBasisPoints: 200,
    })
    .run();

  // When we send the scope update and provide the newAuctioneerAuthority that's the same as auctioneerAuthority.
  const { auctioneer } = await mx
    .auctions()
    .updateAuctionHouse(auctionHouse, {
      newAuctioneerAuthority: auctioneerAuthority.publicKey,
      auctioneerAuthority: auctioneerAuthority.publicKey,
      auctioneerScopes: [AuthorityScope.Buy],
    })
    .run();

  // Then we update and return the updated Auctioneer with the new scope.
  t.ok(auctioneer);
  t.same(auctioneer?.scopes, [AuthorityScope.Buy]);
});

test('[auctionHouseModule] it throws an error if nothing has changed when updating an Auctioneer.', async (t) => {
  // Given an Auctioneer Auction House.
  const mx = await metaplex();
  const auctioneerAuthority = Keypair.generate();

  const { auctionHouse } = await mx
    .auctions()
    .createAuctionHouse({
      auctioneerAuthority: auctioneerAuthority.publicKey,
      sellerFeeBasisPoints: 200,
    })
    .run();

  // When we send an update without providing any changes.
  const promise = mx
    .auctions()
    .updateAuctionHouse(auctionHouse, {
      auctioneerAuthority: auctioneerAuthority.publicKey,
    })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /No Instructions To Send/);
});
