import { PublicKey } from '@solana/web3.js';
import { OperationHandler, Postpone, GmaBuilder } from '@/shared';
import { Nft } from '../models';
import { FindNftsByCandyMachineOperation } from '../operations';
import {
  TokenMetadataProgram,
  MetadataAccount,
  MasterEditionAccount,
} from '@/programs/tokenMetadata';

export class FindNftsByCandyMachineOperationHandler extends OperationHandler<FindNftsByCandyMachineOperation> {
  public async handle(operation: FindNftsByCandyMachineOperation): Promise<Nft[]> {
    const { input } = operation;
    let firstCreator: PublicKey;

    if (input.v1) {
      firstCreator = input.v1;
    } else if (input.v2) {
      // TODO: Refactor when we have a CandyMachine program in the SDK.
      [firstCreator] = await PublicKey.findProgramAddress(
        [Buffer.from('candy_machine'), input.v2.toBuffer()],
        new PublicKey('cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ')
      );
    } else {
      // TODO: Custom error.
      throw new Error('Candy Machine address not provided');
    }

    const mintKeys = await TokenMetadataProgram.metadataV1Accounts(this.metaplex.connection)
      .selectMint()
      .whereFirstCreator(firstCreator)
      .getDataAsPublicKeys();

    return (
      Postpone.make(async () => mintKeys)
        // Get PDAs.
        .map(async (mint) => [
          await MetadataAccount.pda(mint),
          await MasterEditionAccount.pda(mint),
        ])

        // Resolve and flatten PDA promises.
        .asyncPipe(async (promises) => Promise.allSettled(await promises))
        .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))

        // Feed PDAs into a GetMultipleAccountBuilder.
        .pipe((pdas) => new GmaBuilder(this.metaplex.connection, pdas))
        .asyncPipe(async (gma) => (await gma).get())

        // Regroup Metadata and MasterEdition accounts.
        .chunk(2)

        // Map Nfts from Metadata and MasterEdition accounts.
        .flatMap(([metadataInfo, editionInfo]) => {
          const metadata = metadataInfo.exists
            ? MetadataAccount.fromAccountInfo(metadataInfo)
            : null;
          const edition = editionInfo.exists
            ? MasterEditionAccount.fromAccountInfo(editionInfo)
            : null;
          return metadata ? [new Nft(metadata, edition)] : [];
        })

        // Execute the postponed promise.
        .run()
    );
  }
}
