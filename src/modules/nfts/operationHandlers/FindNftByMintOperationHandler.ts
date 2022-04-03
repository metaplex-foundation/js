import { OperationHandler } from '@/shared';
import { removeEmptyChars } from '@/utils';
import { JsonMetadata, Nft } from '../models';
import { FindNftByMintOperation } from '../operations/FindNftByMintOperation';
import { MasterEditionAccount, MetadataAccount } from '@/programs';

export class FindNftByMintOperationHandler extends OperationHandler<FindNftByMintOperation> {
  public async handle(operation: FindNftByMintOperation): Promise<Nft> {
    const mint = operation.input;
    const metadataPda = await MetadataAccount.pda(mint);
    const editionPda = await MasterEditionAccount.pda(mint);
    const publicKeys = [metadataPda, editionPda];

    const [metadataInfo, editionInfo] = await this.metaplex.getMultipleAccountsInfo(publicKeys);
    const metadataAccount = metadataInfo ? MetadataAccount.fromAccountInfo(metadataInfo) : null;
    const masterEditionAccount = editionInfo
      ? MasterEditionAccount.fromAccountInfo(editionInfo)
      : null;

    if (!metadataAccount) {
      // TODO: Custom error.
      throw new Error('Nft not found');
    }

    return new Nft(
      metadataAccount,
      masterEditionAccount,
      await this.fetchJsonMetadata(metadataAccount)
    );
  }

  protected async fetchJsonMetadata(metadata: MetadataAccount): Promise<JsonMetadata | null> {
    try {
      const uri = removeEmptyChars(metadata.data.data.uri);

      return this.metaplex.storage().downloadJson<JsonMetadata>(uri);
    } catch (error) {
      return null;
    }
  }
}
