import { PublicKey } from "@solana/web3.js";
import { Nft } from "@/modules/nfts";
import { MasterEditionAccount, MetadataAccount, TokenMetadataProgram } from "@/programs/tokenMetadata";
import { Metaplex } from "@/Metaplex";
import { Postpone } from "@/utils";
import { GmaBuilder } from "@/programs";

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

  const mintKeys = await TokenMetadataProgram
    .metadataV1Accounts(metaplex.connection)
    .selectMint()
    .whereFirstCreator(firstCreator)
    .getDataAsPublicKeys();

  const postpone = Postpone.make(async () => mintKeys.map(async mint => [
    await MetadataAccount.pda(mint),
    await MasterEditionAccount.pda(mint),
  ]));

  return postpone
    .asyncPipe(async promises => Promise.allSettled(await promises))
    .flatMap(result => result.status === 'fulfilled' ? result.value : [])
    .pipe(pdas => new GmaBuilder(metaplex.connection, pdas))
    .asyncPipe(async gma => (await gma).get())
    .chunk(2)
    .flatMap(([metadataInfo, editionInfo]) => {
      const metadata = metadataInfo.exists ? MetadataAccount.fromAccountInfo(metadataInfo) : null;
      const edition = editionInfo.exists ? MasterEditionAccount.fromAccountInfo(editionInfo) : null;
      return metadata ? [new Nft(metadata, edition)] : [];
    })
    .run()
}
