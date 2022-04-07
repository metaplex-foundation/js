import { PublicKey } from '@solana/web3.js';
import { OperationHandler, Postpone, GmaBuilder } from '@/shared';
import { Nft } from '../models';
import { FindNftsByCandyMachineOperation } from '../operations';
import { TokenMetadataProgram, MetadataAccount } from '@/programs/tokenMetadata';

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
        // Get and resolve PDAs.
        .map(async (mint) => MetadataAccount.pda(mint))
        .asyncPipe(async (promises) => Promise.all(await promises))

        // Feed PDAs into a GetMultipleAccountBuilder.
        .pipe((pdas) => new GmaBuilder(this.metaplex.connection, pdas))
        .asyncPipe(async (gma) => (await gma).get())

        // Map Nfts from Metadata accounts.
        .flatMap((metadataInfo) => {
          const metadata = metadataInfo.exists
            ? MetadataAccount.fromAccountInfo(metadataInfo)
            : null;
          return metadata ? [new Nft(metadata)] : [];
        })

        // Execute the postponed promise.
        .run()
    );
  }
}
