import { Metaplex } from '@/Metaplex';
import { findAssociatedTokenAccountPda } from '@/plugins/tokenModule';
import {
  BigNumber,
  CreatorInput,
  Operation,
  OperationHandler,
  Signer,
  token,
  toPublicKey,
  useOperation,
} from '@/types';
import { DisposableScope, Option, TransactionBuilder } from '@/utils';
import {
  createCreateMasterEditionV3Instruction,
  Uses,
} from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { assertNftWithToken, NftWithToken } from '../models';
import { findMasterEditionV2Pda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'CreateNftOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const createNftOperation = useOperation<CreateNftOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type CreateNftOperation = Operation<
  typeof Key,
  CreateNftInput,
  CreateNftOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type CreateNftInput = {
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
};

/**
 * @group Operations
 * @category Outputs
 */
export type CreateNftOutput = {
  response: SendAndConfirmTransactionResponse;
  nft: NftWithToken;
  mintAddress: PublicKey;
  metadataAddress: PublicKey;
  masterEditionAddress: PublicKey;
  tokenAddress: PublicKey;
};

/**
 * @group Operations
 * @category Handlers
 */
export const createNftOperationHandler: OperationHandler<CreateNftOperation> = {
  handle: async (
    operation: CreateNftOperation,
    metaplex: Metaplex,
    scope: DisposableScope
  ) => {
    const {
      useNewMint = Keypair.generate(),
      useExistingMint,
      tokenOwner = metaplex.identity().publicKey,
      tokenAddress: tokenSigner,
      confirmOptions,
    } = operation.input;

    const mintAddress = useExistingMint ?? useNewMint.publicKey;
    const tokenAddress = tokenSigner
      ? toPublicKey(tokenSigner)
      : findAssociatedTokenAccountPda(mintAddress, tokenOwner);
    const tokenAccount = await metaplex.rpc().getAccount(tokenAddress);
    const tokenExists = tokenAccount.exists;

    const builder = await createNftBuilder(metaplex, {
      ...operation.input,
      useNewMint,
      tokenOwner,
      tokenExists,
    });
    scope.throwIfCanceled();

    const output = await builder.sendAndConfirm(metaplex, confirmOptions);
    scope.throwIfCanceled();

    const nft = await metaplex
      .nfts()
      .findByMint({
        mintAddress: output.mintAddress,
        tokenAddress: output.tokenAddress,
      })
      .run(scope);
    scope.throwIfCanceled();

    assertNftWithToken(nft);
    return { ...output, nft };
  },
};

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type CreateNftBuilderParams = Omit<CreateNftInput, 'confirmOptions'> & {
  tokenExists?: boolean;
  createMintAccountInstructionKey?: string;
  initializeMintInstructionKey?: string;
  createAssociatedTokenAccountInstructionKey?: string;
  createTokenAccountInstructionKey?: string;
  initializeTokenInstructionKey?: string;
  mintTokensInstructionKey?: string;
  createMetadataInstructionKey?: string;
  createMasterEditionInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CreateNftBuilderContext = Omit<CreateNftOutput, 'response' | 'nft'>;

/**
 * @group Transaction Builders
 * @category Constructors
 */
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
