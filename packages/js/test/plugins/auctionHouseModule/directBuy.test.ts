import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { Keypair } from '@solana/web3.js';
import {
  createNft,
  createSft,
  createWallet,
  killStuckProcess,
  metaplex, spokSameAmount, spokSamePubkey,
} from '../../helpers';
import { createAuctionHouse } from './helpers';
import { sol, token } from '@/types';
import { Purchase } from '@/plugins';

killStuckProcess();

test('[auctionHouseModule] buy on an Auction House with minimum input', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const seller = await createWallet(mx);

  const nft = await createNft(mx, { tokenOwner: seller.publicKey });
  const auctionHouse = await createAuctionHouse(mx);

  // And we listed that NFT for 1 SOL.
  const { listing } = await mx.auctionHouse().list({
    auctionHouse,
    seller,
    mintAccount: nft.address,
    price: sol(1),
  });

  // When we execute direct buy with the given listing.
  const { purchase } = await mx.auctionHouse().buy({
    auctionHouse,
    listing,
  });

  // Then we created and returned the new Purchase with appropriate values.
  const expectedPurchase = {
    price: spokSameAmount(sol(1)),
    tokens: spokSameAmount(token(1)),
    buyerAddress: spokSamePubkey(mx.identity().publicKey),
    sellerAddress: spokSamePubkey(seller.publicKey),
    auctionHouse: {
      address: spokSamePubkey(auctionHouse.address),
    },
    asset: {
      address: spokSamePubkey(nft.address),
      token: {
        address: mx.tokens().pdas().associatedTokenAccount({
          mint: nft.address,
          owner: mx.identity().publicKey,
        }),
        ownerAddress: spokSamePubkey(mx.identity().publicKey),
      },
    },
    receiptAddress: spok.defined,
  };
  spok(t, purchase, {
    $topic: 'Purchase',
    ...expectedPurchase,
  } as unknown as Specifications<Purchase>);
});

test('[auctionHouseModule] partial buy on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an SFT.
  const mx = await metaplex();
  const seller = await createWallet(mx);
  const auctionHouse = await createAuctionHouse(mx);
  const sft = await createSft(mx, {
    tokenOwner: seller.publicKey,
    tokenAmount: token(10)
  });

  // And we listed that 5 SFTs for 1 SOL each.
  const { listing } = await mx.auctionHouse().list({
    auctionHouse,
    seller,
    mintAccount: sft.address,
    price: sol(5),
    tokens: token(5),
  });

  // When we execute direct buy with the given listing.
  const { purchase } = await mx.auctionHouse().buy({
    auctionHouse,
    listing,
    tokens: token(3)
  });

  // Then the user must receive 3 Tokens.
  const buyerTokens = await mx
    .nfts()
    .findByToken({ token: purchase.asset.token.address });

  t.equal(buyerTokens.token.amount.basisPoints.toNumber(), 3);

  // And then the seller must have 2 Tokens on sale left.
  const sellerTokens = await mx
    .nfts()
    .findByToken({ token: listing.asset.token.address });

  t.equal(sellerTokens.token.delegateAmount.basisPoints.toNumber(), 2);
});

test('[auctionHouseModule] partial buy on an Auction House with exact price', async (t: Test) => {
  // Given we have an Auction House and an SFT.
  const mx = await metaplex();
  const seller = await createWallet(mx);
  const auctionHouse = await createAuctionHouse(mx);
  const sft = await createSft(mx, {
    tokenOwner: seller.publicKey,
    tokenAmount: token(10)
  });

  // And we listed that 5 SFTs for 1 SOL each.
  const { listing } = await mx.auctionHouse().list({
    auctionHouse,
    seller,
    mintAccount: sft.address,
    price: sol(5),
    tokens: token(5),
  });

  // When we execute direct buy with the given listing with 3 SOL.
  const { purchase } = await mx.auctionHouse().buy({
    auctionHouse,
    listing,
    tokens: token(3),
    price: sol(3)
  });

  // Then the user must receive 3 Tokens.
  const buyerTokens = await mx
    .nfts()
    .findByToken({ token: purchase.asset.token.address });

  t.equal(buyerTokens.token.amount.basisPoints.toNumber(), 3);

  // And then the seller must have 2 Tokens on sale left.
  const sellerTokens = await mx
    .nfts()
    .findByToken({ token: listing.asset.token.address });

  t.equal(sellerTokens.token.delegateAmount.basisPoints.toNumber(), 2);
});

test('[auctionHouseModule] buy on an Auction House with auctioneer with auctioneer', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const auctioneerAuthority = Keypair.generate();
  const auctionHouse = await createAuctionHouse(mx, auctioneerAuthority);

  // And we listed that NFT for 1 SOL.
  const { listing } = await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: nft.address,
    price: sol(1),
    auctioneerAuthority,
  });

  // When we execute direct buy with the given listing.
  const { purchase } = await mx.auctionHouse().buy({
    auctionHouse,
    auctioneerAuthority,
    listing,
    buyer,
    price: sol(1),
  });

  // Then we created and returned the new Purchase
  t.equal(purchase.asset.address.toBase58(), nft.address.toBase58());
});

test('[auctionHouseModule] buy on an Auction House with maximum input', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);
  const seller = await createWallet(mx);
  const authority = Keypair.generate();

  const nft = await createNft(mx, { tokenOwner: seller.publicKey });
  const auctionHouse = await createAuctionHouse(mx, null, {
    authority,
  });

  // And we listed that NFT for 1 SOL.
  const { listing } = await mx.auctionHouse().list({
    auctionHouse,
    authority,
    seller,
    mintAccount: nft.address,
    price: sol(1),
  });

  // When we execute direct buy with the given listing.
  const { purchase } = await mx.auctionHouse().buy({
    auctionHouse,
    authority,
    buyer,
    listing,
    printReceipt: true,
    price: sol(1),
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
