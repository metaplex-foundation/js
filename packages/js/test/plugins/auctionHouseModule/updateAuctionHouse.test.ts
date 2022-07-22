import test, { Test } from 'tape';
import spok from 'spok';
import { Keypair } from '@solana/web3.js';
import {
  metaplex,
  spokSamePubkey,
  killStuckProcess,
  assertThrows,
} from '../../helpers';
import {
  findAssociatedTokenAccountPda,
  findAuctioneerPda,
  findAuctionHouseFeePda,
  findAuctionHousePda,
  findAuctionHouseTreasuryPda,
} from '@/index';

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

  // When we send an update without providing any changes but with auctioneerAuthority to delegate.
  const { auctionHouse: updatedAuctionHouse } = await mx
    .auctions()
    .updateAuctionHouse(auctionHouse, { auctioneerAuthority })
    .run();

  t.ok(updatedAuctionHouse.hasAuctioneer);

  // Auctioneer was delegated.
  const ahAuctioneerPda = findAuctioneerPda(
    auctionHouse.address,
    auctioneerAuthority.publicKey
  );
  const ahAuctioneerAccount = await mx.rpc().getAccount(ahAuctioneerPda);
  t.ok(ahAuctioneerAccount.exists);
});

test('[auctionHouseModule] it throws an error if delegates different Auctioneer Authority on Auctioneer Auction House update.', async (t) => {
  // Given an existing Auction House.
  const mx = await metaplex();
  const auctioneerAuthority = Keypair.generate();
  const secondAuctioneerAuthority = Keypair.generate();

  // Create Auction House and delegate auctioneerAuthority.
  const { auctionHouse } = await mx
    .auctions()
    .createAuctionHouse({ auctioneerAuthority, sellerFeeBasisPoints: 200 })
    .run();

  t.ok(auctionHouse.hasAuctioneer);

  // When we send an update without providing any changes but with different auctioneerAuthority to delegate.
  const promise = mx
    .auctions()
    .updateAuctionHouse(auctionHouse, {
      auctioneerAuthority: secondAuctioneerAuthority,
    })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /No Instructions To Send/);
});

test('[auctionHouseModule] it throws an error if delegating the same auctioneerAuthority on Auction House.', async (t) => {
  // Given an existing Auction House.
  const mx = await metaplex();
  const auctioneerAuthority = Keypair.generate();

  const { auctionHouse } = await mx
    .auctions()
    .createAuctionHouse({ sellerFeeBasisPoints: 200, auctioneerAuthority })
    .run();

  // When we send an update without providing any changes but with auctioneerAuthority to delegate once more.
  const promise = mx
    .auctions()
    .updateAuctionHouse(auctionHouse, { auctioneerAuthority })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /No Instructions To Send/);
});
