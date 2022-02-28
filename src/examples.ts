import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Metaplex, KeypairIdentityDriver, NftClient, Signer } from ".";
import { TokenMetadataProgram } from "./programs";




/////////////////////////
// ✨ Initial setup. ✨ //
/////////////////////////

const connection = new Connection(clusterApiUrl('devnet'));
const metaplex = Metaplex.make(connection)
  .setIdentity(new KeypairIdentityDriver(Keypair.generate()))

const nftClient = new NftClient(metaplex);
// ⬆️ Would love to just `metaplex.nfts.method()` instead but it's not tree-shakable.




//////////////////////
// 📖 Find an NFT 📖 //
//////////////////////

const mintPublicKey = new PublicKey('4xDRiUt7GWNBDGbErRPSsQN6roKku42pKpUHg6NCSBV6');

const nft = await nftClient.findNft({ mint: mintPublicKey });
// ⬆️ tryFindNft returns null if not found.
// ⬆️ other options such as "metadata", "token" or "uri" could be supported where only one is needed.




////////////////////////////////
// 📖 Access the NFT's data 📖 //
////////////////////////////////

// On-chain (readonly).
nft.updateAuthority;
nft.mint;
nft.name;
nft.symbol;
nft.uri;
nft.sellerFeeBasisPoints;
nft.creators;
nft.primarySaleHappened;
nft.isMutable;
nft.editionNonce;
nft.tokenStandard;
nft.collection;
nft.uses;
nft.supply;
nft.maxSupply;
// ⬆️ Data from metadata and masterEdition destructured into the NFT object.

// JSON metadata (readonly).
nft.json?.name;
nft.json?.image;
nft.json?.properties?.creators;
// etc.
// ⬆️ Explicit `json` property to show it's not on-chain data.




/////////////////////////////////////////////
// 📖 Find many NFTs (Not Yet Implement) 📖 //
/////////////////////////////////////////////

const owner = new PublicKey('some_owner');
const ownerNfts = await nftClient.allNftsFromOwner(owner);

const candyMachine = new PublicKey('some_candy_machine');
const candyMachineNfts = await nftClient.allNftsFromCandyMachineV2(candyMachine);

// Under the hood, this will use GpaBuilders like so:
TokenMetadataProgram
  .metadataV1Accounts(connection)
  .whereFirstCreator(await CandyMachineCreator.pda(candyMachine))
  .get();




///////////////////////////
// 🖊 Create a new NFT 🖊 //
///////////////////////////

const newNft = await nftClient.createNft({
  name: 'My NFT',
  uri: 'https://example.org/metadata',
  // ⬆️ nftClient.uploadMetadata({...}) could generate that URL based on the given Storage driver.
});

// These are the only required options but a lot more are available:
export interface CreateNftParams {
  // Data.
  name: string;
  symbol?: string; // ⬅️ Defaults to empty string.
  uri: string;
  sellerFeeBasisPoints?: number; // ⬅️ Defaults to 500?
  creators?: Creator[];
  collection?: Collection;
  uses?: Uses;
  isMutable?: boolean; // ⬅️ Defaults to false.
  maxSupply?: bignum; // ⬅️ Defaults to none.
  allowHolderOffCurve?: boolean; // ⬅️ Defaults to false. Used to compute ATA.

  // Signers.
  mint?: Signer; // ⬅️ Defaults to Keypair.generate().
  payer?: Signer; // ⬅️ Defaults to Metaplex.identity().
  mintAuthority?: Signer; // ⬅️ Defaults to payer / identity.
  updateAuthority?: Signer; // ⬅️ Defaults to mintAuthority.

  // Public keys.
  owner?: PublicKey; // ⬅️ Defaults to mintAuthority.publicKey.
  freezeAuthority?: PublicKey; // ⬅️ Defaults to null.

   // Programs.
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;
}




////////////////////////////////////////////
// 🖊 Update an NFT (Not Yet Implement) 🖊 //
////////////////////////////////////////////

const updatedNft = await nftClient.updateNft(nft, {
  name: 'My Updated NFT',
})

// ⬆️ Groups data properties together before sending to program if any are given.
// ⬆️ Returns a brand new Nft object?
// Readonly + immutable => safer and creates a more consistent API but slightly hurts DevEx.
