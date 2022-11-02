import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { Keypair } from '@solana/web3.js';
import {
  createNft,
  createWallet,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSamePubkey,
} from '../../helpers';
import { createAuctionHouse } from './helpers';
import { sol, token } from '@/types';
import { PrivateBid, PublicBid, Purchase } from '@/plugins';

killStuckProcess();

test('[auctionHouseModule] sell using private bid on an Auction House with minimum input', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const auctionHouse = await createAuctionHouse(mx);

  // And we put a private bid on that NFT for 1 SOL.
  const { bid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer,
    mintAccount: nft.address,
    price: sol(1),
    seller: mx.identity().publicKey,
  });

  const privateBid = bid as PrivateBid;

  // Then we execute an Sell on the bid
  const { purchase } = await mx
    .auctionHouse()
    .sell({ auctionHouse, bid: privateBid });

  // Then we created and returned the new Purchase with appropriate values.
  const expectedPurchase = {
    price: spokSameAmount(sol(1)),
    tokens: spokSameAmount(token(1)),
    buyerAddress: spokSamePubkey(buyer.publicKey),
    sellerAddress: spokSamePubkey(mx.identity().publicKey),
    auctionHouse: {
      address: spokSamePubkey(auctionHouse.address),
    },
    asset: {
      address: spokSamePubkey(nft.address),
      token: {
        address: mx.tokens().pdas().associatedTokenAccount({
          mint: nft.address,
          owner: buyer.publicKey,
        }),
        ownerAddress: spokSamePubkey(buyer.publicKey),
      },
    },
    receiptAddress: spok.defined,
  };
  spok(t, purchase, {
    $topic: 'Purchase',
    ...expectedPurchase,
  } as unknown as Specifications<Purchase>);
});

test('[auctionHouseModule] sell using private bid on an Auction House with auctioneer', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const auctioneerAuthority = Keypair.generate();
  const auctionHouse = await createAuctionHouse(mx, auctioneerAuthority);

  // And we put a private bid on that NFT for 1 SOL.
  const { bid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer,
    mintAccount: nft.address,
    price: sol(1),
    seller: mx.identity().publicKey,
    auctioneerAuthority,
  });

  const privateBid = bid as PrivateBid;

  // Then we execute an Sell on the bid
  const { purchase } = await mx
    .auctionHouse()
    .sell({ auctionHouse, auctioneerAuthority, bid: privateBid });

  // Then we created and returned the new Purchase
  t.equal(purchase.asset.address.toBase58(), nft.address.toBase58());
});

test('[auctionHouseModule] sell using private bid on an Auction House with maximum input', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);
  const seller = await createWallet(mx);
  const authority = Keypair.generate();

  const nft = await createNft(mx, { tokenOwner: seller.publicKey });
  const auctionHouse = await createAuctionHouse(mx, null, {
    authority,
  });

  // And we put a private bid on that NFT for 1 SOL.
  const { bid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer,
    seller: seller.publicKey,
    mintAccount: nft.address,
    price: sol(1),
    printReceipt: true,
  });

  const privateBid = bid as PrivateBid;

  // When we execute direct buy with the given listing.
  const { purchase } = await mx.auctionHouse().sell({
    auctionHouse,
    authority,
    seller,
    bid: privateBid,
    printReceipt: true,
  });

  // Then we created and returned the new Purchase with appropriate values.
  const expectedPurchase = {
    price: spokSameAmount(sol(1)),
    tokens: spokSameAmount(token(1)),
    buyerAddress: spokSamePubkey(buyer.publicKey),
    sellerAddress: spokSamePubkey(seller.publicKey),
    bookkeeperAddress: spokSamePubkey(mx.identity().publicKey),
    auctionHouse: {
      address: spokSamePubkey(auctionHouse.address),
    },
    asset: {
      address: spokSamePubkey(nft.address),
      token: {
        address: mx.tokens().pdas().associatedTokenAccount({
          mint: nft.address,
          owner: buyer.publicKey,
        }),
        ownerAddress: spokSamePubkey(buyer.publicKey),
      },
    },
    receiptAddress: spok.defined,
  };
  spok(t, purchase, {
    $topic: 'Purchase',
    ...expectedPurchase,
  } as unknown as Specifications<Purchase>);
});

test('[auctionHouseModule] sell using public bid on an Auction House with minimum input', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const auctionHouse = await createAuctionHouse(mx);

  // And we put a private bid on that NFT for 1 SOL.
  const { bid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer,
    mintAccount: nft.address,
    price: sol(1),
  });

  const publicBid = bid as PublicBid;

  // Then we execute an Sell on the bid by providing bid and nft token as external property
  const { purchase } = await mx
    .auctionHouse()
    .sell({ auctionHouse, bid: publicBid, sellerToken: nft.token });

  // Then we created and returned the new Purchase
  t.equal(purchase.asset.address.toBase58(), nft.address.toBase58());
});
