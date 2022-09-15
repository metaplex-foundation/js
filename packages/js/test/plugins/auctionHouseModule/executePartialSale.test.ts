import test, { Test } from 'tape';
import { sol, token } from '@/types';
import { metaplex, killStuckProcess, createSft, createWallet } from '../../helpers';
import { createAuctionHouse } from './helpers';

killStuckProcess();

test('[auctionHouseModule] execute partial sale on an Auction House', async (t: Test) => {
  // Given we have an Auction House and a SFT with 5 supply.
  const mx = await metaplex();
  const buyer = await createWallet(mx);
  const auctionHouse = await createAuctionHouse(mx);
  const sft = await createSft(mx);

  await mx
    .tokens()
    .mint({
      mintAddress: sft.address,
      amount: token(5),
    })
    .run();

  // And we listed that 5 SFTs for 1 SOL each.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: sft.address,
      price: sol(5),
      tokens: token(5),
    })
    .run();

  // And we created a public bid on that SFT to buy only 3 Tokens.
  const { bid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: sft.address,
      price: sol(3),
      tokens: token(3),
    })
    .run();

  // When we execute a sale with given listing and bid.
  const { purchase } = await mx
    .auctionHouse()
    .executeSale({
      auctionHouse,
      listing,
      bid,
    })
    .run();

  // Then the user must receive 3 Tokens.
  const buyerToken = await mx
    .nfts()
    .findByToken({ token: purchase.asset.token.address })
    .run();

  t.equal(buyerToken.token.amount.basisPoints.toNumber(), 3);
});
