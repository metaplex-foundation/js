import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { bignum } from '@metaplex-foundation/beet';
import {
  Creator,
  Collection,
  Uses,
  DataV2,
} from '@metaplex-foundation/mpl-token-metadata';
import { Metaplex } from '@/Metaplex';
import {
  useOperation,
  Operation,
  Signer,
  OperationHandler,
  token,
} from '@/types';
import { JsonMetadata } from './JsonMetadata';
import {
  createCreateMasterEditionV3InstructionWithSigners,
  createCreateMetadataAccountV2InstructionWithSigners,
  findMasterEditionV2Pda,
  findMetadataPda,
} from '@/programs';
import { TransactionBuilder } from '@/utils';

// -----------------
// Operation
// -----------------

const Key = 'CreateNftOperation' as const;
export const createNftOperation = useOperation<CreateNftOperation>(Key);
export type CreateNftOperation = Operation<
  typeof Key,
  CreateNftInput,
  CreateNftOutput
>;

export interface CreateNftInput {
  // Data.
  uri: string;
  name?: string;
  symbol?: string;
  sellerFeeBasisPoints?: number;
  creators?: Creator[];
  collection?: Collection;
  uses?: Uses;
  isMutable?: boolean;
  maxSupply?: bignum;

  // Signers.
  mint?: Signer;
  payer?: Signer;
  mintAuthority?: Signer;
  updateAuthority?: Signer;

  // Public keys.
  owner?: PublicKey;
  freezeAuthority?: PublicKey; // TODO(loris): Make Option<PublicKey> | undefined.

  // Programs.
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface CreateNftOutput {
  mint: Signer;
  metadata: PublicKey;
  masterEdition: PublicKey;
  associatedToken: PublicKey;
  transactionId: string;
}

// -----------------
// Handler
// -----------------

export const createNftOperationHandler: OperationHandler<CreateNftOperation> = {
  handle: async (operation: CreateNftOperation, metaplex: Metaplex) => {
    const {
      uri,
      isMutable,
      maxSupply,
      mint = Keypair.generate(),
      payer = metaplex.identity(),
      mintAuthority = metaplex.identity(),
      updateAuthority = mintAuthority,
      owner = mintAuthority.publicKey,
      freezeAuthority,
      tokenProgram,
      associatedTokenProgram,
      confirmOptions,
    } = operation.input;

    let metadata: JsonMetadata;
    try {
      metadata = await metaplex.storage().downloadJson(uri);
    } catch (e) {
      metadata = {};
    }

    const data = resolveData(
      operation.input,
      metadata,
      updateAuthority.publicKey
    );

    const metadataPda = findMetadataPda(mint.publicKey);
    const masterEditionPda = findMasterEditionV2Pda(mint.publicKey);

    const builder = await createNftBuilder(metaplex, {
      data,
      isMutable,
      maxSupply,
      mint,
      payer,
      mintAuthority,
      updateAuthority,
      owner,
      freezeAuthority,
      metadata: metadataPda,
      masterEdition: masterEditionPda,
      tokenProgram,
      associatedTokenProgram,
    });

    const { tokenAddress } = builder.getContext();

    const { signature } = await metaplex
      .rpc()
      .sendAndConfirmTransaction(builder, undefined, confirmOptions);

    return {
      mint,
      metadata: metadataPda,
      masterEdition: masterEditionPda,
      associatedToken: tokenAddress,
      transactionId: signature,
    };
  },
};

const resolveData = (
  input: CreateNftInput,
  metadata: JsonMetadata,
  updateAuthority: PublicKey
): DataV2 => {
  const metadataCreators: Creator[] | undefined = metadata.properties?.creators
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
        address: updateAuthority,
        share: 100,
        verified: true,
      },
    ];
  } else {
    creators = creators.map((creator) => {
      if (creator.address.toBase58() === updateAuthority.toBase58()) {
        return { ...creator, verified: true };
      } else {
        return creator;
      }
    });
  }

  return {
    name: input.name ?? metadata.name ?? '',
    symbol: input.symbol ?? metadata.symbol ?? '',
    uri: input.uri,
    sellerFeeBasisPoints:
      input.sellerFeeBasisPoints ?? metadata.seller_fee_basis_points ?? 500,
    creators,
    collection: input.collection ?? null,
    uses: input.uses ?? null,
  };
};

// -----------------
// Builder
// -----------------

export type CreateNftBuilderParams = {
  // Data.
  data: DataV2;
  isMutable?: boolean;
  maxSupply?: bignum;

  // Signers.
  mint: Signer;
  payer: Signer;
  mintAuthority: Signer;
  updateAuthority?: Signer;

  // Public keys.
  owner: PublicKey;
  freezeAuthority?: PublicKey;
  metadata: PublicKey;
  masterEdition: PublicKey;

  // Programs.
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;

  // Instruction keys.
  createMintAccountInstructionKey?: string;
  initializeMintInstructionKey?: string;
  createAssociatedTokenAccountInstructionKey?: string;
  createTokenAccountInstructionKey?: string;
  initializeTokenInstructionKey?: string;
  mintTokensInstructionKey?: string;
  createMetadataInstructionKey?: string;
  createMasterEditionInstructionKey?: string;
};

export type CreateNftBuilderContext = {
  tokenAddress: PublicKey;
};

export const createNftBuilder = async (
  metaplex: Metaplex,
  params: CreateNftBuilderParams
): Promise<TransactionBuilder<CreateNftBuilderContext>> => {
  const {
    data,
    isMutable,
    maxSupply,
    mint,
    payer,
    mintAuthority,
    updateAuthority = mintAuthority,
    owner,
    freezeAuthority,
    metadata,
    masterEdition,
    tokenProgram,
    associatedTokenProgram,
  } = params;

  const tokenWithMintBuilder = await metaplex
    .tokens()
    .builders()
    .createTokenWithMint({
      decimals: 0,
      initialSupply: token(1),
      mint,
      mintAuthority,
      freezeAuthority: freezeAuthority ?? null,
      owner,
      payer,
      tokenProgram,
      associatedTokenProgram,
      createMintAccountInstructionKey: params.createMintAccountInstructionKey,
      initializeMintInstructionKey: params.initializeMintInstructionKey,
      createAssociatedTokenAccountInstructionKey:
        params.createAssociatedTokenAccountInstructionKey,
      createTokenAccountInstructionKey: params.createTokenAccountInstructionKey,
      initializeTokenInstructionKey: params.initializeTokenInstructionKey,
      mintTokensInstructionKey: params.mintTokensInstructionKey,
    });

  const { tokenAddress } = tokenWithMintBuilder.getContext();

  return (
    TransactionBuilder.make<CreateNftBuilderContext>()
      .setFeePayer(payer)
      .setContext({ tokenAddress })

      // Create the mint and token accounts before minting 1 token to the owner.
      .add(tokenWithMintBuilder)

      // Create metadata account.
      .add(
        createCreateMetadataAccountV2InstructionWithSigners({
          data,
          isMutable,
          mintAuthority,
          payer,
          mint: mint.publicKey,
          metadata,
          updateAuthority: updateAuthority.publicKey,
          instructionKey:
            params.createMetadataInstructionKey ?? 'createMetadata',
        })
      )

      // Create master edition account (prevents further minting).
      .add(
        createCreateMasterEditionV3InstructionWithSigners({
          maxSupply,
          payer,
          mintAuthority,
          updateAuthority,
          mint: mint.publicKey,
          metadata,
          masterEdition,
          instructionKey:
            params.createMasterEditionInstructionKey ?? 'createMasterEdition',
        })
      )
  );
};
