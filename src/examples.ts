import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Metaplex, NftClient } from ".";
import { TokenMetadataProgram } from "./programs";

// Initial setup.
const connection = new Connection(clusterApiUrl('devnet'));
const metaplex = new Metaplex(connection);
const nftClient = new NftClient(metaplex); // <- Would love to just `metaplex.nfts.method()` instead but it's not tree-shakable.
const wallet = Keypair.generate(); // <- This will be abstracted in a Identity driver. E.g. Identity.CLI or Identity.Web.

// [READ] Find an NFT.
const nft = await nftClient.findNftOrFail({ // <- findNft returns null if not found.
  mint: new PublicKey('4xDRiUt7GWNBDGbErRPSsQN6roKku42pKpUHg6NCSBV6'),
});

// Access the NFT on-chain data (readonly).
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

// Access the NFT JSON metadata (readonly).
nft.json?.name;
nft.json?.image;
nft.json?.properties?.creators;

// [READ] Find multiple NFTs using a GpaBuilder. (TODO)
const myNfts = await nftClient.allNftsFromOwner(new PublicKey('some_owner'));
const cmv2Nfts = await nftClient.allNftsFromCandyMachineV2(new PublicKey('some_candy_machine_v2_creator_pda'));

// Under the hood, it uses:
TokenMetadataProgram
  .metadataV1Accounts(connection)
  .whereFirstCreator(new PublicKey('some_candy_machine_v2_creator_pda'))
  .get();

// [WRITE] Create a new NFT.
const newNft = await nftClient.createNft({
  name: 'My NFT',
  uri: 'https://example.org/metadata', // <- nftClient.uploadMetadata({...}) could generate that URL based on the Storage driver provider.
  payer: wallet,
});

// [WRITE] Update an NFT's metadata. (TODO)
const updatedNft = await nftClient.updateNft(nft, {
  name: 'My Updated NFT',
})

// Don't forget about the thirst category: [REALTIME].
