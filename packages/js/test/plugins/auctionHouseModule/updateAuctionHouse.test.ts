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
  findAuctioneerPda,
  findAuctionHouseFeePda,
  findAuctionHousePda,
  findAuctionHouseTreasuryPda,
} from '@/index';
import { AuthorityScope } from '@metaplex-foundation/mpl-auction-house';
import { createAuctionHouse } from './helpers';
import { AUCTIONEER_ALL_SCOPES } from '@/plugins/auctionHouseModule/constants';

killStuckProcess();

test('[auctionHouseModule] it updates all fields of an Auction House', async (t: Test) => {
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
    .auctionHouse()
    .create({
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
    .auctionHouse()
    .update({
      auctionHouse: originalAuctionHouse,
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

test('[auctionHouseModule] it throws an error if nothing has changed when updating an Auction House', async (t) => {
  // Given an existing Auction House.
  const mx = await metaplex();
  const { auctionHouse } = await mx
    .auctionHouse()
    .create({ sellerFeeBasisPoints: 200 })
    .run();

  // When we send an update without providing any changes.
  const promise = mx.auctionHouse().update({ auctionHouse }).run();

  // Then we expect an error.
  await assertThrows(t, promise, /No Instructions To Send/);
});

test('[auctionHouseModule] it can assign an Auctioneer authority on an Auction House update', async (t) => {
  // Given an Auction House without Auctioneer.
  const mx = await metaplex();
  const { auctionHouse } = await createAuctionHouse(mx);
  t.false(auctionHouse.hasAuctioneer);

  // When we update it with an Auctioneer authority.
  const auctioneerAuthority = Keypair.generate();
  const { auctionHouse: updatedAuctionHouse } = await mx
    .auctionHouse()
    .update({
      auctionHouse,
      auctioneerAuthority: auctioneerAuthority.publicKey,
    })
    .run();

  // Then the Auctioneer authority has been correctly set.
  const ahAuctioneerPda = findAuctioneerPda(
    updatedAuctionHouse.address,
    auctioneerAuthority.publicKey
  );
  spok(t, updatedAuctionHouse, {
    hasAuctioneer: true,
    auctioneer: {
      address: spokSamePubkey(ahAuctioneerPda),
      authority: spokSamePubkey(auctioneerAuthority.publicKey),
      scopes: AUCTIONEER_ALL_SCOPES,
    },
  });
});

test('[auctionHouseModule] it can assign an Auctioneer authority with an explicit Auction House authority and explicit scopes', async (t) => {
  // Given an Auction House without Auctioneer.
  const mx = await metaplex();
  const authority = await createWallet(mx);
  const { auctionHouse } = await createAuctionHouse(mx, null, { authority });
  t.false(auctionHouse.hasAuctioneer);

  // When we send an update with auctioneerAuthority to delegate.
  const auctioneerAuthority = Keypair.generate();
  const { auctionHouse: updatedAuctionHouse } = await mx
    .auctionHouse()
    .update({
      auctionHouse,
      authority,
      auctioneerAuthority: auctioneerAuthority.publicKey,
      auctioneerScopes: [AuthorityScope.Sell, AuthorityScope.Buy].sort(),
    })
    .run();

  // Then the Auctioneer data has been correctly set.
  const ahAuctioneerPda = findAuctioneerPda(
    updatedAuctionHouse.address,
    auctioneerAuthority.publicKey
  );
  spok(t, updatedAuctionHouse, {
    hasAuctioneer: true,
    auctioneer: {
      address: spokSamePubkey(ahAuctioneerPda),
      authority: spokSamePubkey(auctioneerAuthority.publicKey),
      scopes: [AuthorityScope.Sell, AuthorityScope.Buy].sort(),
    },
  });
});

test('[auctionHouseModule] it keeps the original scope when updating the Auctioneer Authority', async (t) => {
  // Given an existing Auctioneer Auction House.
  const mx = await metaplex();
  const auctioneerAuthority = Keypair.generate();
  const { auctionHouse } = await createAuctionHouse(mx, auctioneerAuthority, {
    auctioneerScopes: [AuthorityScope.Buy],
  });

  // When we send an update with different auctioneerAuthority to delegate.
  const newAuctioneerAuthority = Keypair.generate();
  const { auctionHouse: updatedAuctionHouse } = await mx
    .auctionHouse()
    .update({
      auctionHouse,
      auctioneerAuthority: newAuctioneerAuthority.publicKey,
    })
    .run();

  // Then the new scopes have been correctly set.
  const ahAuctioneerPda = findAuctioneerPda(
    updatedAuctionHouse.address,
    newAuctioneerAuthority.publicKey
  );
  spok(t, updatedAuctionHouse, {
    hasAuctioneer: true,
    auctioneer: {
      address: spokSamePubkey(ahAuctioneerPda),
      authority: spokSamePubkey(newAuctioneerAuthority.publicKey),
      scopes: [AuthorityScope.Buy],
    },
  });
});

test('[auctionHouseModule] it can update Auctioneer Scope', async (t) => {
  // Given an existing Auctioneer Auction House.
  const mx = await metaplex();
  const auctioneerAuthority = Keypair.generate();
  const { auctionHouse } = await createAuctionHouse(mx, auctioneerAuthority, {
    auctioneerScopes: [AuthorityScope.PublicBuy],
  });

  // When update its Auctioneer scopes.
  const { auctionHouse: updatedAuctionHouse } = await mx
    .auctionHouse()
    .update({
      auctionHouse,
      auctioneerAuthority: auctioneerAuthority.publicKey,
      auctioneerScopes: [AuthorityScope.Buy],
    })
    .run();

  // Then the new scopes have been correctly set.
  const ahAuctioneerPda = findAuctioneerPda(
    updatedAuctionHouse.address,
    auctioneerAuthority.publicKey
  );
  spok(t, updatedAuctionHouse, {
    hasAuctioneer: true,
    auctioneer: {
      address: spokSamePubkey(ahAuctioneerPda),
      authority: spokSamePubkey(auctioneerAuthority.publicKey),
      scopes: [AuthorityScope.Buy],
    },
  });
});

test('[auctionHouseModule] it can update both the Auctioneer authority and scopes', async (t) => {
  // Given an existing Auctioneer Auction House.
  const mx = await metaplex();
  const auctioneerAuthority = Keypair.generate();
  const { auctionHouse } = await createAuctionHouse(mx, auctioneerAuthority, {
    auctioneerScopes: [AuthorityScope.Sell],
  });

  // When we update both the scopes and the authority of the Auctioneer instance.
  const newAuctioneerAuthority = Keypair.generate();
  const { auctionHouse: updatedAuctionHouse } = await mx
    .auctionHouse()
    .update({
      auctionHouse,
      auctioneerAuthority: newAuctioneerAuthority.publicKey,
      auctioneerScopes: [AuthorityScope.Buy],
    })
    .run();

  // Then the new auctioneer data has been correctly set.
  const ahAuctioneerPda = findAuctioneerPda(
    updatedAuctionHouse.address,
    newAuctioneerAuthority.publicKey
  );
  spok(t, updatedAuctionHouse, {
    hasAuctioneer: true,
    auctioneer: {
      address: spokSamePubkey(ahAuctioneerPda),
      authority: spokSamePubkey(newAuctioneerAuthority.publicKey),
      scopes: [AuthorityScope.Buy],
    },
  });
});

test('[auctionHouseModule] it throws an error if nothing has changed when updating an Auctioneer', async (t) => {
  // Given an Auctioneer Auction House.
  const mx = await metaplex();
  const auctioneerAuthority = Keypair.generate();
  const { auctionHouse } = await createAuctionHouse(mx, auctioneerAuthority, {
    auctioneerScopes: [AuthorityScope.Sell],
  });

  // When we send an update without providing any changes.
  const promise = mx
    .auctionHouse()
    .update({
      auctionHouse,
      auctioneerAuthority: auctioneerAuthority.publicKey,
      auctioneerScopes: [AuthorityScope.Sell],
    })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /No Instructions To Send/);
});
