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
 * Creates a new NFT.
 *
 * ```ts
 * const { nft } = await metaplex
 *   .nfts()
 *   .create({
 *     name: 'My NFT',
 *     uri: 'https://example.com/my-nft',
 *     sellerFeeBasisPoints: 250, // 2.5%
 *   })
 *   .run();
 * ```
 *
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

  /** The address of the SPL Token program to override if necessary. */
  tokenProgram?: PublicKey;

  /** The address of the SPL Associated Token program to override if necessary. */
  associatedTokenProgram?: PublicKey;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type CreateNftOutput = {
  /** The blockchain response from sending and confirming the transaction. */
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
  /**
   * Whether or not the provided token account already exists.
   * If `false`, we'll add another instruction to create it.
   *
   * @defaultValue `true`
   */
  tokenExists?: boolean;

  /** A key to distinguish the instruction that creates the mint account. */
  createMintAccountInstructionKey?: string;

  /** A key to distinguish the instruction that initializes the mint account. */
  initializeMintInstructionKey?: string;

  /** A key to distinguish the instruction that creates the associated token account. */
  createAssociatedTokenAccountInstructionKey?: string;

  /** A key to distinguish the instruction that creates the token account. */
  createTokenAccountInstructionKey?: string;

  /** A key to distinguish the instruction that initializes the token account. */
  initializeTokenInstructionKey?: string;

  /** A key to distinguish the instruction that mints tokens. */
  mintTokensInstructionKey?: string;

  /** A key to distinguish the instruction that creates the metadata account. */
  createMetadataInstructionKey?: string;

  /** A key to distinguish the instruction that creates the master edition account. */
  createMasterEditionInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CreateNftBuilderContext = Omit<CreateNftOutput, 'response' | 'nft'>;

/**
 * Creates a new NFT.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .nfts()
 *   .builders()
 *   .create({
 *     name: 'My NFT',
 *     uri: 'https://example.com/my-nft',
 *     sellerFeeBasisPoints: 250, // 2.5%
 *   });
 * ```
 *
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
