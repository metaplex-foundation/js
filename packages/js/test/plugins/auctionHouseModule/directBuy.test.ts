import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { sol, token } from '@/types';
import {
  assertThrows,
  createNft,
  createWallet,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSamePubkey,
} from '../../helpers';
import { createAuctionHouse } from './helpers';
import { findAssociatedTokenAccountPda, Purchase } from '@/index';
import { Keypair } from '@solana/web3.js';

killStuckProcess();

test('[auctionHouseModule] buy on an Auction House with minimum input', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const auctionHouse = await createAuctionHouse(mx);

  // And we listed that NFT for 1 SOL.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // When we execute direct buy with the given listing.
  const { purchase } = await mx
    .auctionHouse()
    .buy({
      auctionHouse,
      listing,
      buyer,
    })
    .run();

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
        address: findAssociatedTokenAccountPda(nft.address, buyer.publicKey),
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

test('[auctionHouseModule] direct buy throws on an Auction House with auctioneer', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const auctioneerAuthority = Keypair.generate();
  const auctionHouse = await createAuctionHouse(mx, auctioneerAuthority);

  // And we listed that NFT for 1 SOL.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(1),
      auctioneerAuthority,
    })
    .run();

  // When we execute direct buy with the given listing.
  const promise = mx
    .auctionHouse()
    .buy({
      auctionHouse,
      listing,
      buyer,
      auctioneerAuthority,
    })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /You are trying to execute a direct buy, but direct buy are not supported in Auctioneer./
  );
});

test('[auctionHouseModule] buy on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const auctionHouse = await createAuctionHouse(mx, null, {
    authority: buyer,
  });

  // And we listed that NFT for 1 SOL.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(1),
      printReceipt: true,
      confirmOptions: { skipPreflight: true },
    })
    .run();

  // When we execute direct buy with the given listing.
  const { purchase } = await mx
    .auctionHouse()
    .buy({
      auctionHouse,
      authority: buyer,
      buyer,
      listing,
      confirmOptions: { skipPreflight: true },
    })
    .run();

  // Then we created and returned the new Purchase with appropriate values.
  t.equal(
    purchase.asset.token.ownerAddress.toBase58(),
    buyer.publicKey.toBase58()
  );
});
