import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { sol, token } from '@/types';
import {
  metaplex,
  killStuckProcess,
  createNft,
  createWallet,
  spokSamePubkey,
  spokSameAmount,
} from '../../helpers';
import { createAuctionHouse } from './helpers';
import {
  AccountNotFoundError,
  findAssociatedTokenAccountPda,
  Purchase,
} from '@/index';
import { Keypair } from '@solana/web3.js';

killStuckProcess();

test('[auctionHouseModule] execute sale on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const { auctionHouse, client } = await createAuctionHouse(mx);

  // And we listed that NFT for 1 SOL.
  const { listing } = await client
    .list({
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // And we created a private bid on that NFT for 1 SOL.
  const { bid } = await client
    .bid({
      buyer,
      mintAccount: nft.address,
      seller: mx.identity().publicKey,
      price: sol(1),
    })
    .run();

  // When we execute a sale with given listing and bid.
  const { purchase } = await client.executeSale({ listing, bid }).run();

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

  // And we get the same result when we fetch the Purchase by address.
  const retrievePurchase = await client
    .findPurchaseByAddress(listing.tradeStateAddress, bid.tradeStateAddress)
    .run();
  spok(t, retrievePurchase, {
    $topic: 'Retrieved Purchase',
    ...expectedPurchase,
  } as unknown as Specifications<Purchase>);
});

test('[auctionHouseModule] it executes receipt-less sale on an Auction House when Bid is receipt-less but cannot fetch it afterwards by default', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const { client } = await createAuctionHouse(mx);

  // And we listed that NFT for 1 SOL.
  const { listing } = await client
    .list({
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // And we created a private receipt-less bid on that NFT for 1 SOL.
  const { bid } = await client
    .bid({
      buyer,
      mintAccount: nft.address,
      tokenAccount: nft.token.address,
      price: sol(1),
      printReceipt: false,
    })
    .run();

  // When we execute a sale with given listing and receipt-less bid.
  const { purchase } = await client.executeSale({ listing, bid }).run();

  // Then we still get a purchase model but without a generated receipt.
  t.same(purchase.asset.address, nft.address);
  t.false(purchase.receiptAddress);

  // But we cannot retrieve it later with the default operation handler.
  try {
    await client
      .findPurchaseByAddress(listing.tradeStateAddress, bid.tradeStateAddress)
      .run();
    t.fail('expected to throw AccountNotFoundError');
  } catch (error: any) {
    const hasNotFoundMessage = error.message.includes(
      'The account of type [PurchaseReceipt] was not found'
    );
    t.ok(error instanceof AccountNotFoundError, 'throws AccountNotFoundError');
    t.ok(hasNotFoundMessage, 'has PurchaseReceipt Not Found message');
  }
});

test('[auctionHouseModule] it executes receipt-less sale on an Auction House when Listing is receipt-less', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const { client } = await createAuctionHouse(mx);

  // And we listed that NFT for 1 SOL without receipt.
  const { listing } = await client
    .list({
      mintAccount: nft.address,
      price: sol(1),
      printReceipt: false,
    })
    .run();

  // And we created a private bid on that NFT for 1 SOL.
  const { bid } = await client
    .bid({
      buyer,
      mintAccount: nft.address,
      tokenAccount: nft.token.address,
      price: sol(1),
    })
    .run();

  // When we execute a sale with given bid and receipt-less listing.
  const { purchase } = await client.executeSale({ listing, bid }).run();

  // Then we still get a purchase model but without a generated receipt.
  t.same(purchase.asset.address, nft.address);
  t.false(purchase.receiptAddress);
});

test('[auctionHouseModule] it executes sale on an Auction House when Bid is public', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const { client } = await createAuctionHouse(mx);

  // And we listed that NFT for 1 SOL.
  const { listing } = await client
    .list({
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // And we created a public bid on that NFT for 1 SOL.
  const { bid } = await client
    .bid({
      buyer,
      mintAccount: nft.address,
      price: sol(1),
      printReceipt: false,
    })
    .run();

  // When we execute a sale with given listing and bid.
  const { purchase } = await client.executeSale({ listing, bid }).run();

  // Then we created and returned the new Purchase
  t.equal(purchase.asset.address.toBase58(), nft.address.toBase58());
});

test('[auctionHouseModule] it executes sale on an Auction House with Auctioneer', async (t: Test) => {
  // Given we have an Auctioneer Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);

  const auctioneerAuthority = Keypair.generate();
  const { client } = await createAuctionHouse(mx, auctioneerAuthority);

  // And we listed that NFT for 1 SOL.
  const { listing } = await client
    .list({
      mintAccount: nft.address,
    })
    .run();

  // And we created a public bid on that NFT for 1 SOL.
  const { bid } = await client
    .bid({
      buyer,
      mintAccount: nft.address,
      price: sol(5),
    })
    .run();

  // When we execute an auctioneer sale with given listing and bid.
  const { purchase } = await client
    .executeSale({
      listing,
      bid,
    })
    .run();

  // Then we created and returned the new Purchase
  t.equal(purchase.asset.address.toBase58(), nft.address.toBase58());
});

// test('[auctionHouseModule] it executes sale on an Auction House with SPL treasury', async (t: Test) => {
//   // Given we have a Metaplex instance.
//   const mx = await metaplex();

//   // And an existing SPL treasury and airdrop one token to buyer.
//   const { token: treasuryToken } = await mx
//     .tokens()
//     .createTokenWithMint({ initialSupply: token(10) })
//     .run();
//   const treasuryMint = treasuryToken.mint.address;

//   // And we created a new Auction House using that treasury.
//   const { client } = await createAuctionHouse(mx, null, {
//     sellerFeeBasisPoints: 200,
//     treasuryMint,
//   });

//   // And we created an NFT to sell.
//   const nft = await createNft(mx);

//   // And we listed that NFT for 1 Token.
//   const { listing } = await client
//     .list({
//       mintAccount: nft.address,
//       price: token(1),
//     })
//     .run();

//   // And we created a public bid on that NFT for 1 Token.
//   const { bid } = await client
//     .bid({
//       mintAccount: nft.address,
//       tokenAccount: nft.token.address,
//       price: token(1),
//     })
//     .run();

//   // When we execute a sale with given listing and bid.
//   const { purchase } = await client.executeSale({ listing, bid }).run();

//   // Then we created and returned the new Purchase
//   t.equal(purchase.asset.address.toBase58(), nft.address.toBase58());
// });
