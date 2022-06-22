import test, { Test } from 'tape';
import { metaplex, killStuckProcess } from '../../helpers';

killStuckProcess();

test('[auctionHouseModule] create new Auction House with minimum configuration', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // When
  const foo = await mx.auctions().createAuctionHouse({
    sellerFeeBasisPoints: 200, // 2.00%
  });

  // Then
  console.log(foo);
});
