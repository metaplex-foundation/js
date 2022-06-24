import test, { Test } from 'tape';
import spok from 'spok';
import { metaplex, spokSamePubkey, killStuckProcess } from '../../helpers';
import { WRAPPED_SOL_MINT } from '@/plugins/auctionHouseModule/constants';
import {
  findAuctionHouseFeePda,
  findAuctionHousePda,
  findAuctionHouseTreasuryPda,
} from '@/index';
import { Keypair } from '@solana/web3.js';

killStuckProcess();

test('[auctionHouseModule] update all fields of an Auction House', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And an existing Auction House.
  const { auctionHouse: originalAuctionHouse } = await mx
    .auctions()
    .createAuctionHouse({ sellerFeeBasisPoints: 200 })
    .run();
  const originalCreator = mx.identity().publicKey;
  const originalMint = WRAPPED_SOL_MINT;
  const originalAddress = findAuctionHousePda(originalCreator, originalMint);
  spok(t, originalAuctionHouse, {
    $topic: 'Original AuctionHouse',
    address: spokSamePubkey(originalAddress),
    creator: spokSamePubkey(originalCreator),
    authority: spokSamePubkey(originalCreator),
    treasuryMint: spokSamePubkey(originalMint),
    feeAccount: spokSamePubkey(findAuctionHouseFeePda(originalAddress)),
    treasuryAccount: spokSamePubkey(
      findAuctionHouseTreasuryPda(originalAddress)
    ),
    feeWithdrawalDestination: spokSamePubkey(originalCreator),
    treasuryWithdrawalDestination: spokSamePubkey(originalCreator),
    sellerFeeBasisPoints: 200,
    requiresSignOff: false,
    canChangeSalePrice: false,
  });

  // When we update as much as we can from that Auction House.
  const newAuthority = Keypair.generate().publicKey;
  const newFeeWithdrawalDestination = Keypair.generate().publicKey;
  const newTreasuryWithdrawalDestinationOwner = Keypair.generate().publicKey;
  const { auctionHouse: updatedAuctionHouse } = await mx
    .auctions()
    .updateAuctionHouse(originalAuctionHouse, {
      sellerFeeBasisPoints: 300,
      requiresSignOff: true,
      canChangeSalePrice: true,
      newAuthority,
      feeWithdrawalDestination: newFeeWithdrawalDestination,
      treasuryWithdrawalDestinationOwner: newTreasuryWithdrawalDestinationOwner,
    })
    .run();

  // Then all changes have been correctly applied.
  spok(t, updatedAuctionHouse, {
    $topic: 'Updated AuctionHouse',
    address: spokSamePubkey(originalAddress),
    creator: spokSamePubkey(originalCreator),
    authority: spokSamePubkey(newAuthority),
    // TODO(loris): Update this to a different mint when we have helper methods or a Token module.
    treasuryMint: spokSamePubkey(originalMint),
    feeAccount: spokSamePubkey(findAuctionHouseFeePda(originalAddress)),
    treasuryAccount: spokSamePubkey(
      findAuctionHouseTreasuryPda(originalAddress)
    ),
    feeWithdrawalDestination: spokSamePubkey(newFeeWithdrawalDestination),
    treasuryWithdrawalDestination: spokSamePubkey(
      newTreasuryWithdrawalDestinationOwner
    ),
    sellerFeeBasisPoints: 300,
    requiresSignOff: true,
    canChangeSalePrice: true,
  });
});

test('[auctionHouseModule] providing no changes updates nothing on the Auction House', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And an existing Auction House.
  const { auctionHouse: originalAuctionHouse } = await mx
    .auctions()
    .createAuctionHouse({ sellerFeeBasisPoints: 200 })
    .run();

  // When we update the Auction House with no changes.
  const { auctionHouse: updatedAuctionHouse } = await mx
    .auctions()
    .updateAuctionHouse(originalAuctionHouse, {})
    .run();

  // Then all original fields were left unchanged.
  const originalCreator = mx.identity().publicKey;
  const originalMint = WRAPPED_SOL_MINT;
  const originalAddress = findAuctionHousePda(originalCreator, originalMint);
  spok(t, updatedAuctionHouse, {
    $topic: 'Non Updated AuctionHouse',
    address: spokSamePubkey(originalAddress),
    creator: spokSamePubkey(originalCreator),
    authority: spokSamePubkey(originalCreator),
    treasuryMint: spokSamePubkey(originalMint),
    feeAccount: spokSamePubkey(findAuctionHouseFeePda(originalAddress)),
    treasuryAccount: spokSamePubkey(
      findAuctionHouseTreasuryPda(originalAddress)
    ),
    feeWithdrawalDestination: spokSamePubkey(originalCreator),
    treasuryWithdrawalDestination: spokSamePubkey(originalCreator),
    sellerFeeBasisPoints: 200,
    requiresSignOff: false,
    canChangeSalePrice: false,
  });
});
