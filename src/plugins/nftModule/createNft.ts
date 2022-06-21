import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { getMinimumBalanceForRentExemptMint } from '@solana/spl-token';
import { bignum } from '@metaplex-foundation/beet';
import {
  Creator,
  Collection,
  Uses,
  DataV2,
} from '@metaplex-foundation/mpl-token-metadata';
import { Metaplex } from '@/Metaplex';
import { useOperation, Operation, Signer, OperationHandler } from '@/types';
import { JsonMetadata } from './JsonMetadata';
import {
  createCreateMasterEditionV3InstructionWithSigners,
  createCreateMetadataAccountV2InstructionWithSigners,
  createMintAndMintToAssociatedTokenBuilder,
  findAssociatedTokenAccountPda,
  findMasterEditionV2Pda,
  findMetadataPda,
} from '@/programs';
import { TransactionBuilder } from '@/utils';

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
  freezeAuthority?: PublicKey;

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
    const lamports = await getMinimumBalanceForRentExemptMint(
      metaplex.connection
    );
    const associatedToken = findAssociatedTokenAccountPda(
      mint.publicKey,
      owner,
      tokenProgram,
      associatedTokenProgram
    );

    const { signature } = await metaplex.rpc().sendAndConfirmTransaction(
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
      confirmOptions
    );

    return {
      mint,
      metadata: metadataPda,
      masterEdition: masterEditionPda,
      associatedToken,
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

export interface CreateNftBuilderParams {
  // Data.
  lamports: number;
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
  associatedToken: PublicKey;
  freezeAuthority?: PublicKey;
  metadata: PublicKey;
  masterEdition: PublicKey;

  // Programs.
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;

  // Instruction keys.
  createAccountInstructionKey?: string;
  initializeMintInstructionKey?: string;
  createAssociatedTokenInstructionKey?: string;
  mintToInstructionKey?: string;
  createMetadataInstructionKey?: string;
  createMasterEditionInstructionKey?: string;
}

export const createNftBuilder = (
  params: CreateNftBuilderParams
): TransactionBuilder => {
  const {
    lamports,
    data,
    isMutable,
    maxSupply,
    mint,
    payer,
    mintAuthority,
    updateAuthority = mintAuthority,
    owner,
    associatedToken,
    freezeAuthority,
    metadata,
    masterEdition,
    tokenProgram,
    associatedTokenProgram,
    createAccountInstructionKey,
    initializeMintInstructionKey,
    createAssociatedTokenInstructionKey,
    mintToInstructionKey,
    createMetadataInstructionKey,
    createMasterEditionInstructionKey,
  } = params;

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Create the mint account and send one token to the holder.
      .add(
        createMintAndMintToAssociatedTokenBuilder({
          lamports,
          decimals: 0,
          amount: 1,
          createAssociatedToken: true,
          mint,
          payer,
          mintAuthority,
          owner,
          associatedToken,
          freezeAuthority,
          tokenProgram,
          associatedTokenProgram,
          createAccountInstructionKey,
          initializeMintInstructionKey,
          createAssociatedTokenInstructionKey,
          mintToInstructionKey,
        })
      )

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
          instructionKey: createMetadataInstructionKey,
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
          instructionKey: createMasterEditionInstructionKey,
        })
      )
  );
};
