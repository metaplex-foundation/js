import { Keypair, PublicKey } from '@solana/web3.js';
import { getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress } from '@solana/spl-token';
import { MetadataAccount, MasterEditionAccount, DataV2 } from '@/programs/tokenMetadata';
import { Creator } from '@/programs/tokenMetadata/generated';
import { OperationHandler } from '@/modules/shared';
import { InputStep, Plan, RequiredParams } from '@/utils';
import { CreateNftInput, CreateNftOperation, CreateNftOutput } from '../operations';
import { JsonMetadata } from '../models/JsonMetadata';
import { createNftBuilder } from '../transactionBuilders';

type CreateNftInputWithDefaults = RequiredParams<
  CreateNftInput,
  'allowHolderOffCurve' | 'mint' | 'payer' | 'mintAuthority' | 'updateAuthority' | 'owner'
>;

type CreateNftInputWithUriAndMetadata = RequiredParams<
  CreateNftInputWithDefaults,
  'uri' | 'metadata'
>;

export class CreateNftOperationHandler extends OperationHandler<
  CreateNftInput,
  CreateNftOutput,
  CreateNftOperation
> {
  public async handle(
    operation: CreateNftOperation
  ): Promise<Plan<CreateNftInput, CreateNftOutput>> {
    return Plan.make<CreateNftInput>()
      .addStep(this.fillDefaultValues())
      .addStep(this.resolveUriAndMetadata(operation.input))
      .addStep(this.sendNftTransaction());
  }

  protected fillDefaultValues(): InputStep<CreateNftInput, CreateNftInputWithDefaults> {
    return {
      name: 'Fill default values',
      hidden: true,
      handler: async (params) => {
        const {
          allowHolderOffCurve = false,
          mint = Keypair.generate(),
          payer = this.metaplex.identity(),
          mintAuthority = payer,
          updateAuthority = mintAuthority,
          owner = mintAuthority.publicKey,
        } = params;

        return {
          ...params,
          allowHolderOffCurve,
          mint,
          payer,
          mintAuthority,
          updateAuthority,
          owner,
        };
      },
    };
  }

  protected resolveUriAndMetadata(
    input: CreateNftInput
  ): InputStep<CreateNftInputWithDefaults, CreateNftInputWithUriAndMetadata> {
    if (input.uri) {
      const uri: string = input.uri;

      return {
        name: 'Download Metadata',
        hidden: true,
        handler: async (input: CreateNftInputWithDefaults) => {
          const metadata: JsonMetadata = await this.metaplex.storage().downloadJson(uri);

          return { ...input, uri, metadata };
        },
      };
    }

    const metadata: JsonMetadata = input.metadata ?? {
      name: input.name,
      symbol: input.symbol,
      seller_fee_basis_points: input.sellerFeeBasisPoints,
      properties: {
        creators: input.creators?.map((creator) => ({
          address: creator.address.toBase58(),
          share: creator.share,
        })),
      },
    };

    return {
      name: 'Upload Metadata',
      handler: async (input: CreateNftInputWithDefaults) => {
        const uri = await this.metaplex.storage().uploadJson(metadata);

        return { ...input, uri, metadata };
      },
    };
  }

  protected sendNftTransaction(): InputStep<CreateNftInputWithUriAndMetadata, CreateNftOutput> {
    return {
      name: 'Creation of the NFT',
      handler: async (params) => {
        const {
          isMutable,
          maxSupply,
          allowHolderOffCurve,
          mint,
          payer,
          mintAuthority,
          updateAuthority,
          owner,
          freezeAuthority,
          tokenProgram,
          associatedTokenProgram,
        } = params;

        const data = this.resolveData(params);
        const metadataPda = await MetadataAccount.pda(mint.publicKey);
        const masterEditionPda = await MasterEditionAccount.pda(mint.publicKey);
        const lamports = await getMinimumBalanceForRentExemptMint(this.metaplex.connection);
        const associatedToken = await getAssociatedTokenAddress(
          mint.publicKey,
          owner,
          allowHolderOffCurve,
          tokenProgram,
          associatedTokenProgram
        );

        const transactionId = await this.metaplex.sendAndConfirmTransaction(
          createNftBuilder({
            lamports,
            data,
            isMutable,
            maxSupply,
            mint,
            payer,
            mintAuthority,
            updateAuthority,
            owner,
            associatedToken,
            freezeAuthority,
            metadata: metadataPda,
            masterEdition: masterEditionPda,
            tokenProgram,
            associatedTokenProgram,
          }),
          undefined,
          this.confirmOptions
        );

        return {
          mint,
          metadata: metadataPda,
          masterEdition: masterEditionPda,
          associatedToken,
          transactionId,
        };
      },
      price: 100000, // TODO: Price of minting in lamports.
    };
  }

  protected resolveData(input: CreateNftInputWithUriAndMetadata): DataV2 {
    const metadataCreators: Creator[] | undefined = input.metadata.properties?.creators
      ?.filter((creator) => creator.address)
      .map((creator) => ({
        address: new PublicKey(creator.address as string),
        share: creator.share ?? 0,
        verified: false,
      }));

    let creators = input.creators ?? metadataCreators ?? null;

    if (creators === null) {
      creators = [
        {
          address: input.updateAuthority.publicKey,
          share: 100,
          verified: true,
        },
      ];
    } else {
      creators = creators.map((creator) => {
        if (creator.address.toBase58() === input.updateAuthority.publicKey.toBase58()) {
          return { ...creator, verified: true };
        } else {
          return creator;
        }
      });
    }

    return {
      name: input.name ?? input.metadata.name ?? '',
      symbol: input.symbol ?? input.metadata.symbol ?? '',
      uri: input.uri,
      sellerFeeBasisPoints:
        input.sellerFeeBasisPoints ?? input.metadata.seller_fee_basis_points ?? 500,
      creators,
      collection: input.collection ?? null,
      uses: input.uses ?? null,
    };
  }
}
