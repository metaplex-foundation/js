import test, { Test } from 'tape';
import { sol } from '@/types';
import {
  metaplex,
  killStuckProcess,
  createNft,
  createWallet,
} from '../../helpers';
import { createAuctionHouse } from './helpers';

killStuckProcess();

test('[auctionHouseModule] withdraw from treasury account on an Auction House', async (t: Test) => {
  // Given we have an Auction House with fee that equals 100 basis points and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);
  const nft = await createNft(mx);

  const { auctionHouse } = await createAuctionHouse(mx, null, {
    sellerFeeBasisPoints: 1000,
  });

  // And we deposited 2 SOL to the buyer's escrow, so 0.1 SOL fee can be withdrawn.
  await mx
    .auctionHouse()
    .depositToBuyerAccount({
      auctionHouse,
      amount: sol(2),
      buyer,
    })
    .run();

  // And we listed that NFT for 1 SOL.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // And we created a private bid on that NFT for 1 SOL.
  const { bid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: nft.address,
      seller: mx.identity().publicKey,
      price: sol(1),
    })
    .run();

  // And we execute a sale with given listing and bid. The fee in this case is 0.1 SOL
  await mx.auctionHouse().executeSale({ auctionHouse, listing, bid }).run();

  // When we withdraw 0.1 SOL from treasury account.
  await mx
    .auctionHouse()
    .withdrawFromTreasuryAccount({
      auctionHouse,
      amount: sol(0.1),
    })
    .run();

  // Then treasury account has 0 SOL in it.
  const treasuryBalance = await mx
    .rpc()
    .getBalance(auctionHouse.treasuryAccountAddress);

  t.same(treasuryBalance.basisPoints.toNumber(), 0);
});
