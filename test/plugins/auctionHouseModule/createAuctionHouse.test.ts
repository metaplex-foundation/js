import test, { Test } from 'tape';
import spok from 'spok';
import { metaplex, spokSamePubkey, killStuckProcess } from '../../helpers';
import { WRAPPED_SOL_MINT } from '@/plugins/auctionHouseModule/constants';
import {
  findAuctionHouseFeePda,
  findAuctionHousePda,
  findAuctionHouseTreasuryPda,
} from '@/programs';

killStuckProcess();

test('[auctionHouseModule] create new Auction House with minimum configuration', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // When we create a new Auction House with minimum configuration.
  const auctionHouse = await mx.auctions().createAuctionHouse({
    sellerFeeBasisPoints: 200, // 2.00%
  });

  // Then we created and returned the new Auction House and it has appropriate defaults.
  const expectedCreator = mx.identity().publicKey;
  const expectedMint = WRAPPED_SOL_MINT;
  const expectedAddress = findAuctionHousePda(expectedCreator, expectedMint);
  const expectedAuctionHouse = {
    address: spokSamePubkey(expectedAddress),
    creator: spokSamePubkey(expectedCreator),
    treasuryMint: spokSamePubkey(expectedMint),
    feeAccount: spokSamePubkey(findAuctionHouseFeePda(expectedAddress)),
    treasuryAccount: spokSamePubkey(
      findAuctionHouseTreasuryPda(expectedAddress)
    ),
    feeWithdrawalDestination: spokSamePubkey(expectedCreator),
    treasuryWithdrawalDestination: spokSamePubkey(expectedCreator),
    sellerFeeBasisPoints: 200,
    requiresSignOff: false,
    canChangeSalePrice: false,
  };

  spok(t, auctionHouse, { $topic: 'AuctionHouse', ...expectedAuctionHouse });

  // And we get the same result when we fetch the Auction House by address.
  const retrievedAuctionHouse = await mx
    .auctions()
    .findAuctionHouseByAddress(auctionHouse.address);

  spok(t, retrievedAuctionHouse, {
    $topic: 'Retrieved AuctionHouse',
    ...expectedAuctionHouse,
  });
});
