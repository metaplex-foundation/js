import {
  createCreateMetadataAccountV3Instruction,
  Uses,
} from '@metaplex-foundation/mpl-token-metadata';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { assertSft, Sft, SftWithToken } from '../models';
import { Option, TransactionBuilder, TransactionBuilderOptions } from '@/utils';
import {
  Creator,
  CreatorInput,
  isSigner,
  makeConfirmOptionsFinalizedOnMainnet,
  Operation,
  OperationHandler,
  OperationScope,
  Signer,
  SplTokenAmount,
  toPublicKey,
  useOperation,
} from '@/types';
import { Metaplex } from '@/Metaplex';

// -----------------
// Operation
// -----------------

const Key = 'CreateSftOperation' as const;

/**
 * Creates a new SFT.
 *
 * ```ts
 * const { sft } = await metaplex
 *   .nfts()
 *   .createSft({
 *     name: 'My SFT',
 *     uri: 'https://example.com/my-sft',
 *     sellerFeeBasisPoints: 250, // 2.5%
 *   };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const createSftOperation = useOperation<CreateSftOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type CreateSftOperation = Operation<
  typeof Key,
  CreateSftInput,
  CreateSftOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type CreateSftInput = {
  /**
   * The authority that will be able to make changes
   * to the created SFT.
   *
   * This is required as a Signer because creating the
   * metadata account requires the update authority to be part
   * of the creators array as a verified creator.
   *
   * @defaultValue `metaplex.identity()`
   */
  updateAuthority?: Signer;

  /**
   * The authority allowed to mint new tokens for the mint account
   * that is either explicitly provided or about to be created.
   *
   * @defaultValue `metaplex.identity()`
   */
  mintAuthority?: Signer;

  /**
   * The authority allowed to freeze token account associated with the
   * mint account that is either explicitly provided or about to be created.
   *
   * @defaultValue `metaplex.identity().publicKey`
   */
  freezeAuthority?: Option<PublicKey>;

  /**
   * The address of the new mint account as a Signer.
   * This is useful if you already have a generated Keypair
   * for the mint account of the SFT to create.
   *
   * @defaultValue `Keypair.generate()`
   */
  useNewMint?: Signer;

  /**
   * The address of the existing mint account that should be converted
   * into an SFT. The account at this address should have the right
   * requirements to become an SFT, e.g. it shouldn't already have
   * a metadata account associated with it.
   *
   * @defaultValue Defaults to creating a new mint account with the
   * right requirements.
   */
  useExistingMint?: PublicKey;

  /**
   * The owner of a token account associated with the SFT to create.
   *
   * This is completely optional as creating an SFT does not require
   * the existence of a token account. When provided, an associated
   * token account will be created from the given owner.
   *
   * You may alternatively pass the `tokenAddress` parameter instead.
   *
   * @defaultValue Defaults to not creating and/or minting
   * any token account.
   */
  tokenOwner?: PublicKey;

  /**
   * An explicit token account associated with the SFT to create.
   *
   * This is completely optional as creating an SFT does not require
   * the existence of a token account.
   *
   * When provided, the token account will be created if and only
   * if no account exists at the given address. When that's the case,
   * the `tokenAddress` must be provided as a Signer as we're creating
   * and initializing the account at this address.
   *
   * You may alternatively pass the `tokenOwner` parameter instead.
   *
   * @defaultValue Defaults to not creating and/or minting
   * any token account.
   */
  tokenAddress?: PublicKey | Signer;

  /**
   * The amount of tokens to mint to the token account initially
   * if a token account is created.
   *
   * This is only relevant if either the `tokenOwner` or `tokenAddress`
   * is provided.
   *
   * @defaultValue Defaults to not minting any tokens.
   */
  tokenAmount?: SplTokenAmount;

  /**
   * The number of decimal points used to define token amounts.
   *
   * @defaultValue `0`
   */
  decimals?: number;

  /** The URI that points to the JSON metadata of the asset. */
  uri: string;

  /** The on-chain name of the asset, e.g. "My SFT". */
  name: string;

  /**
   * The royalties in percent basis point (i.e. 250 is 2.5%) that
   * should be paid to the creators on each secondary sale.
   */
  sellerFeeBasisPoints: number;

  /**
   * The on-chain symbol of the asset, stored in the Metadata account.
   * E.g. "MYSFT".
   *
   * @defaultValue `""`
   */
  symbol?: string;

  /**
   * {@inheritDoc CreatorInput}
   * @defaultValue
   * Defaults to using the provided `updateAuthority` as the only verified creator.
   * ```ts
   * [{
   *   address: updateAuthority.publicKey,
   *   authority: updateAuthority,
   *   share: 100,
   * }]
   * ```
   */
  creators?: CreatorInput[];

  /**
   * Whether or not the SFT's metadata is mutable.
   * When set to `false` no one can update the Metadata account,
   * not even the update authority.
   *
   * @defaultValue `true`
   */
  isMutable?: boolean;

  /**
   * When this field is not `null`, it indicates that the SFT
   * can be "used" by its owner or any approved "use authorities".
   *
   * @defaultValue `null`
   */
  uses?: Option<Uses>;

  /**
   * Whether the created SFT is a Collection SFT.
   * When set to `true`, the SFT will be created as a
   * Sized Collection SFT with an initial size of 0.
   *
   * @defaultValue `false`
   */
  isCollection?: boolean;

  /**
   * The Collection NFT that this new SFT belongs to.
   * When `null`, the created SFT will not be part of a collection.
   *
   * @defaultValue `null`
   */
  collection?: Option<PublicKey>;

  /**
   * The collection authority that should sign the created SFT
   * to prove that it is part of the provided collection.
   * When `null`, the provided `collection` will not be verified.
   *
   * @defaultValue `null`
   */
  collectionAuthority?: Option<Signer>;

  /**
   * Whether or not the provided `collectionAuthority` is a delegated
   * collection authority, i.e. it was approved by the update authority
   * using `metaplex.nfts().approveCollectionAuthority()`.
   *
   * @defaultValue `false`
   */
  collectionAuthorityIsDelegated?: boolean;

  /**
   * Whether or not the provided `collection` is a sized collection
   * and not a legacy collection.
   *
   * @defaultValue `true`
   */
  collectionIsSized?: boolean;
};

/**
 * @group Operations
 * @category Outputs
 */
export type CreateSftOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;

  /** The newly created SFT and, potentially, its associated token. */
  sft: Sft | SftWithToken;

  /** The address of the mint account. */
  mintAddress: PublicKey;

  /** The address of the metadata account. */
  metadataAddress: PublicKey;

  /** The address of the token account if any. */
  tokenAddress: PublicKey | null;
};

/**
 * @group Operations
 * @category Handlers
 */
export const createSftOperationHandler: OperationHandler<CreateSftOperation> = {
  handle: async (
    operation: CreateSftOperation,
    metaplex: Metaplex,
    scope: OperationScope
  ) => {
    const {
      useNewMint = Keypair.generate(),
      useExistingMint,
      tokenOwner,
      tokenAddress: tokenSigner,
    } = operation.input;

    const mintAddress = useExistingMint ?? useNewMint.publicKey;
    const associatedTokenAddress = tokenOwner
      ? metaplex.tokens().pdas().associatedTokenAccount({
          mint: mintAddress,
          owner: tokenOwner,
          programs: scope.programs,
        })
      : null;
    const tokenAddress = tokenSigner
      ? toPublicKey(tokenSigner)
      : associatedTokenAddress;

    let tokenExists: boolean;
    if (!!useExistingMint && !!tokenAddress) {
      const tokenAccount = await metaplex.rpc().getAccount(tokenAddress);
      tokenExists = tokenAccount.exists;
    } else {
      tokenExists = false;
    }

    const builder = await createSftBuilder(
      metaplex,
      { ...operation.input, useNewMint, tokenExists },
      scope
    );
    scope.throwIfCanceled();

    const confirmOptions = makeConfirmOptionsFinalizedOnMainnet(
      metaplex,
      scope.confirmOptions
    );
    const output = await builder.sendAndConfirm(metaplex, confirmOptions);
    scope.throwIfCanceled();

    const sft = await metaplex.nfts().findByMint(
      {
        mintAddress: output.mintAddress,
        tokenAddress: output.tokenAddress ?? undefined,
      },
      scope
    );
    scope.throwIfCanceled();

    assertSft(sft);
    return { ...output, sft };
  },
};

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type CreateSftBuilderParams = Omit<CreateSftInput, 'confirmOptions'> & {
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
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CreateSftBuilderContext = Omit<CreateSftOutput, 'response' | 'sft'>;

/**
 * Creates a new SFT.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .nfts()
 *   .builders()
 *   .createSft({
 *     name: 'My SFT',
 *     uri: 'https://example.com/my-sft',
 *     sellerFeeBasisPoints: 250, // 2.5%
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const createSftBuilder = async (
  metaplex: Metaplex,
  params: CreateSftBuilderParams,
  options: TransactionBuilderOptions = {}
): Promise<TransactionBuilder<CreateSftBuilderContext>> => {
  const { programs, payer = metaplex.rpc().getDefaultFeePayer() } = options;
  const {
    useNewMint = Keypair.generate(),
    updateAuthority = metaplex.identity(),
    mintAuthority = metaplex.identity(),
  } = params;

  const mintAndTokenBuilder = await createMintAndTokenForSftBuilder(
    metaplex,
    params,
    { programs, payer },
    useNewMint
  );
  const { mintAddress, tokenAddress } = mintAndTokenBuilder.getContext();

  const tokenMetadataProgram = metaplex.programs().getTokenMetadata(programs);
  const metadataPda = metaplex.nfts().pdas().metadata({
    mint: mintAddress,
    programs,
  });
  const creatorsInput: CreatorInput[] = params.creators ?? [
    {
      address: updateAuthority.publicKey,
      authority: updateAuthority,
      share: 100,
    },
  ];
  const creators: Option<Creator[]> =
    creatorsInput.length > 0
      ? creatorsInput.map((creator) => ({
          ...creator,
          verified: creator.address.equals(updateAuthority.publicKey),
        }))
      : null;

  const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataPda,
      mint: mintAddress,
      mintAuthority: mintAuthority.publicKey,
      payer: payer.publicKey,
      updateAuthority: updateAuthority.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: params.name,
          symbol: params.symbol ?? '',
          uri: params.uri,
          sellerFeeBasisPoints: params.sellerFeeBasisPoints,
          creators,
          collection: params.collection
            ? { key: params.collection, verified: false }
            : null,
          uses: params.uses ?? null,
        },
        isMutable: params.isMutable ?? true,
        collectionDetails: params.isCollection
          ? { __kind: 'V1', size: 0 } // Program will hardcode size to zero anyway.
          : null,
      },
    },
    tokenMetadataProgram.address
  );

  // When the payer is different than the update authority, the latter will
  // not be marked as a signer and therefore signing as a creator will fail.
  createMetadataInstruction.keys[4].isSigner = true;

  const verifyAdditionalCreatorInstructions = creatorsInput
    .filter((creator) => {
      return (
        !!creator.authority &&
        !creator.address.equals(updateAuthority.publicKey)
      );
    })
    .map((creator) => {
      return metaplex.nfts().builders().verifyCreator(
        {
          mintAddress,
          creator: creator.authority,
        },
        { programs, payer }
      );
    });

  return (
    TransactionBuilder.make<CreateSftBuilderContext>()
      .setFeePayer(payer)
      .setContext({
        mintAddress,
        metadataAddress: metadataPda,
        tokenAddress,
      })

      // Create the mint and token accounts before minting 1 token to the owner.
      .add(mintAndTokenBuilder)

      // Create metadata account.
      .add({
        instruction: createMetadataInstruction,
        signers: [payer, mintAuthority, updateAuthority],
        key: params.createMetadataInstructionKey ?? 'createMetadata',
      })

      // Verify additional creators.
      .add(...verifyAdditionalCreatorInstructions)

      // Verify collection.
      .when(!!params.collection && !!params.collectionAuthority, (builder) =>
        builder.add(
          metaplex
            .nfts()
            .builders()
            .verifyCollection(
              {
                mintAddress,
                collectionMintAddress: params.collection as PublicKey,
                collectionAuthority: params.collectionAuthority as Signer,
                isDelegated: params.collectionAuthorityIsDelegated ?? false,
                isSizedCollection: params.collectionIsSized ?? true,
              },
              { payer, programs }
            )
        )
      )
  );
};

const createMintAndTokenForSftBuilder = async (
  metaplex: Metaplex,
  params: CreateSftBuilderParams,
  options: TransactionBuilderOptions,
  useNewMint: Signer
): Promise<
  TransactionBuilder<{ mintAddress: PublicKey; tokenAddress: PublicKey | null }>
> => {
  const { programs, payer = metaplex.rpc().getDefaultFeePayer() } = options;
  const {
    mintAuthority = metaplex.identity(),
    freezeAuthority = metaplex.identity().publicKey,
    tokenExists = false,
  } = params;

  const mintAddress = params.useExistingMint ?? useNewMint.publicKey;
  const associatedTokenAddress = params.tokenOwner
    ? metaplex.tokens().pdas().associatedTokenAccount({
        mint: mintAddress,
        owner: params.tokenOwner,
        programs,
      })
    : null;
  const tokenAddress = params.tokenAddress
    ? toPublicKey(params.tokenAddress)
    : associatedTokenAddress;

  const builder = TransactionBuilder.make<{
    mintAddress: PublicKey;
    tokenAddress: PublicKey | null;
  }>()
    .setFeePayer(payer)
    .setContext({
      mintAddress,
      tokenAddress,
    });

  // Create the mint account if it doesn't exist.
  if (!params.useExistingMint) {
    builder.add(
      await metaplex
        .tokens()
        .builders()
        .createMint(
          {
            decimals: params.decimals ?? 0,
            mint: useNewMint,
            mintAuthority: mintAuthority.publicKey,
            freezeAuthority,
            createAccountInstructionKey: params.createMintAccountInstructionKey,
            initializeMintInstructionKey: params.initializeMintInstructionKey,
          },
          { programs, payer }
        )
    );
  }

  // Create the token account if it doesn't exist.
  const isNewToken = !!params.tokenAddress && isSigner(params.tokenAddress);
  const isNewAssociatedToken = !!params.tokenOwner;
  if (!tokenExists && (isNewToken || isNewAssociatedToken)) {
    builder.add(
      await metaplex
        .tokens()
        .builders()
        .createToken(
          {
            mint: mintAddress,
            owner: params.tokenOwner,
            token: params.tokenAddress as Signer | undefined,
            createAssociatedTokenAccountInstructionKey:
              params.createAssociatedTokenAccountInstructionKey,
            createAccountInstructionKey:
              params.createTokenAccountInstructionKey,
            initializeTokenInstructionKey: params.initializeTokenInstructionKey,
          },
          { programs, payer }
        )
    );
  }

  // Mint provided amount to the token account.
  if (tokenAddress && params.tokenAmount) {
    builder.add(
      await metaplex.tokens().builders().mint(
        {
          mintAddress,
          toToken: tokenAddress,
          toTokenExists: true,
          amount: params.tokenAmount,
          mintAuthority,
          mintTokensInstructionKey: params.mintTokensInstructionKey,
        },
        { programs, payer }
      )
    );
  }

  return builder;
};
