import test from 'tape';

import {
  killStuckProcess,
  metaplex,
  createNft,
  createWallet,
} from '../../helpers';
import { createAuctionHouse } from './helpers';
import { sol } from '@/types';

killStuckProcess();

test('[auctionHouseModule] get all listings in auction house', async (t) => {
  // Given we have an Auction House and 2 NFTs.
  const mx = await metaplex();
  const secondSeller = await createWallet(mx);
  const firstNft = await createNft(mx);
  const secondNft = await createNft(mx);
  const thirdNft = await createNft(mx, { tokenOwner: secondSeller.publicKey });

  const auctionHouse = await createAuctionHouse(mx);

  // And given we create a listing on first NFT for 1 SOL.
  await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: firstNft.address,
    price: sol(1),
  });

  // And given we create a listing on second NFT for 1 SOL.
  await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: secondNft.address,
    price: sol(1),
  });

  // And given we create a listing on third NFT for 1 SOL from different wallet.
  await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: thirdNft.address,
    seller: secondSeller,
    price: sol(1),
  });

  // When I find all listings.
  const listings = await mx.auctionHouse().getAllListings({ auctionHouse });

  // Then we got three lazy listings for given seller.
  t.equal(listings.length, 3, 'returns three accounts');
});