import test, { Test } from 'tape';
import spok from 'spok';
import { Keypair } from '@solana/web3.js';
import { WRAPPED_SOL_MINT } from '@/plugins/auctionHouseModule/modelsToRefactor';
import { metaplex, spokSamePubkey, killStuckProcess } from '../../helpers';
import {
  findAuctionHouseFeePda,
  findAuctionHousePda,
  findAuctionHouseTreasuryPda,
} from '@/index';

killStuckProcess();

test('[auctionHouseModule] create new Auction House with minimum configuration', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // When we create a new Auction House with minimum configuration.
  const { auctionHouse } = await mx
    .auctions()
    .createAuctionHouse({ sellerFeeBasisPoints: 200 })
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

  spok(t, auctionHouse, { $topic: 'AuctionHouse', ...expectedAuctionHouse });

  // And we get the same result when we fetch the Auction House by address.
  const retrievedAuctionHouse = await mx
    .auctions()
    .findAuctionHouseByAddress(auctionHouse.address)
    .run();

  spok(t, retrievedAuctionHouse, {
    $topic: 'Retrieved AuctionHouse',
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
    .auctions()
    .createAuctionHouse({
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

  spok(t, auctionHouse, { $topic: 'AuctionHouse', ...expectedAuctionHouse });
});
