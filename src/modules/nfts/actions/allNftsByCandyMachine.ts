import { PublicKey } from "@solana/web3.js";
import { Nft } from "@/modules/nfts";
import { Metaplex } from "@/Metaplex";
import { TokenMetadataProgram } from "@/programs";

export interface AllNftsFromCandyMachineParams {
  v1?: PublicKey,
  v2?: PublicKey,
}

// TODO: This should probably live in a "Candy Machine" module instead but here is good enough for now.
export const allNftsFromCandyMachine = async (metaplex: Metaplex, params: AllNftsFromCandyMachineParams): Promise<Nft[]> => {
  let firstCreator: PublicKey;

  if (params.v1) {
    firstCreator = params.v1;
  } else if (params.v2) {
    // TODO: Refactor when we have a CandyMachine program in the SDK.
    [firstCreator] = await PublicKey.findProgramAddress(
      [Buffer.from('candy_machine'), params.v2.toBuffer()],
      new PublicKey('cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ'),
    )
  } else {
    // TODO: Custom error.
    throw new Error('Candy Machine address not provided');
  }

  const mints = await TokenMetadataProgram
    .metadataV1Accounts(metaplex.connection)
    .selectMint()
    .whereFirstCreator(firstCreator)
    .getDataAsPublicKeys();

  return [];
}
