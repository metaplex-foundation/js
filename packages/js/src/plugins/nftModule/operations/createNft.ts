import { Metaplex } from '@/Metaplex';
import {
  BigNumber,
  CreatorInput,
  Operation,
  OperationHandler,
  Signer,
  token,
  useOperation,
} from '@/types';
import { DisposableScope, Option, Task, TransactionBuilder } from '@/utils';
import {
  createCreateMasterEditionV3Instruction,
  Uses,
} from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { assertNftWithToken, NftWithToken } from './Nft';
import type { NftBuildersClient } from './NftBuildersClient';
import type { NftClient } from './NftClient';
import { findMasterEditionV2Pda } from './pdas';

// -----------------
// Clients
// -----------------

/** @internal */
export function _createNftClient(
  this: NftClient,
  input: CreateNftInput
): Task<CreateNftOutput & { nft: NftWithToken }> {
  return new Task(async (scope) => {
    const operation = createNftOperation(input);
    const output = await this.metaplex.operations().execute(operation, scope);
    scope.throwIfCanceled();
    const nft = await this.findByMint(output.mintAddress, {
      tokenAddress: output.tokenAddress,
    }).run(scope);
    assertNftWithToken(nft);
    return { ...output, nft };
  });
}

/** @internal */
export function _createNftBuildersClient(
  this: NftBuildersClient,
  input: CreateNftBuilderParams
) {
  return createNftBuilder(this.metaplex, input);
}

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
  // Accounts.
  payer?: Signer; // Defaults to mx.identity().
  updateAuthority?: Signer; // Defaults to mx.identity().
  mintAuthority?: Signer; // Defaults to mx.identity(). Only necessary for existing mints.

  // Mint Account.
  useNewMint?: Signer; // Defaults to new generated Keypair.
  useExistingMint?: PublicKey;

  // Token Account.
  tokenOwner?: PublicKey; // Defaults to mx.identity().publicKey.
  tokenAddress?: PublicKey | Signer;

  // Data.
  uri: string;
  name: string;
  sellerFeeBasisPoints: number;
  symbol?: string; // Defaults to an empty string.
  creators?: CreatorInput[]; // Defaults to mx.identity() as a single Creator.
  isMutable?: boolean; // Defaults to true.
  maxSupply?: Option<BigNumber>; // Defaults to 0.
  uses?: Option<Uses>; // Defaults to null.
  isCollection?: boolean; // Defaults to false.
  collection?: Option<PublicKey>; // Defaults to null.
  collectionAuthority?: Option<Signer>; // Defaults to null.
  collectionAuthorityIsDelegated?: boolean; // Defaults to false.
  collectionIsSized?: boolean; // Defaults to true.

  // Programs.
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface CreateNftOutput {
  response: SendAndConfirmTransactionResponse;
  mintAddress: PublicKey;
  metadataAddress: PublicKey;
  masterEditionAddress: PublicKey;
  tokenAddress: PublicKey;
}

// -----------------
// Handler
// -----------------

export const createNftOperationHandler: OperationHandler<CreateNftOperation> = {
  handle: async (
    operation: CreateNftOperation,
    metaplex: Metaplex,
    scope: DisposableScope
  ) => {
    const builder = await createNftBuilder(metaplex, operation.input);
    scope.throwIfCanceled();
    return builder.sendAndConfirm(metaplex, operation.input.confirmOptions);
  },
};

// -----------------
// Builder
// -----------------

export type CreateNftBuilderParams = Omit<CreateNftInput, 'confirmOptions'> & {
  createMintAccountInstructionKey?: string;
  initializeMintInstructionKey?: string;
  createAssociatedTokenAccountInstructionKey?: string;
  createTokenAccountInstructionKey?: string;
  initializeTokenInstructionKey?: string;
  mintTokensInstructionKey?: string;
  createMetadataInstructionKey?: string;
  createMasterEditionInstructionKey?: string;
};

export type CreateNftBuilderContext = Omit<CreateNftOutput, 'response'>;

export const createNftBuilder = async (
  metaplex: Metaplex,
  params: CreateNftBuilderParams
): Promise<TransactionBuilder<CreateNftBuilderContext>> => {
  const {
    useNewMint = Keypair.generate(),
    payer = metaplex.identity(),
    updateAuthority = metaplex.identity(),
    mintAuthority = metaplex.identity(),
    tokenOwner = metaplex.identity().publicKey,
  } = params;

  const sftBuilder = await metaplex
    .nfts()
    .builders()
    .createSft({
      ...params,
      payer,
      updateAuthority,
      mintAuthority,
      freezeAuthority: mintAuthority.publicKey,
      useNewMint,
      tokenOwner,
      tokenAmount: token(1),
      decimals: 0,
    });

  const { mintAddress, metadataAddress, tokenAddress } =
    sftBuilder.getContext();
  const masterEditionAddress = findMasterEditionV2Pda(mintAddress);

  return (
    TransactionBuilder.make<CreateNftBuilderContext>()
      .setFeePayer(payer)
      .setContext({
        mintAddress,
        metadataAddress,
        masterEditionAddress,
        tokenAddress: tokenAddress as PublicKey,
      })

      // Create the mint, the token and the metadata.
      .add(sftBuilder)

      // Create master edition account (prevents further minting).
      .add({
        instruction: createCreateMasterEditionV3Instruction(
          {
            edition: masterEditionAddress,
            mint: mintAddress,
            updateAuthority: updateAuthority.publicKey,
            mintAuthority: mintAuthority.publicKey,
            payer: payer.publicKey,
            metadata: metadataAddress,
          },
          {
            createMasterEditionArgs: {
              maxSupply: params.maxSupply === undefined ? 0 : params.maxSupply,
            },
          }
        ),
        signers: [payer, mintAuthority, updateAuthority],
        key: params.createMasterEditionInstructionKey ?? 'createMasterEdition',
      })
  );
};
