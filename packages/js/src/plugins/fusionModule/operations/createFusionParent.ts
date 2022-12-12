import { Uses } from '@metaplex-foundation/mpl-token-metadata';
import {
  // Keypair,
  PublicKey,
  // SystemProgram,
  // SYSVAR_INSTRUCTIONS_PUBKEY,
} from '@solana/web3.js';
// import { createCreateTrifleAccountInstruction } from 'mpl-trifle';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
// import { assertNftWithToken, NftWithToken } from '../../nftModule';
import { TransactionBuilder, TransactionBuilderOptions, Option } from '@/utils';
import {
  makeConfirmOptionsFinalizedOnMainnet,
  Operation,
  OperationHandler,
  OperationScope,
  Signer,
  useOperation,
  CreatorInput,
  BigNumber,
} from '@/types';
import type { Metaplex } from '@/Metaplex';

// -----------------
// Operation
// -----------------

const Key = 'CreateFusionParentOperation' as const;

/**
 * Creates a Fusion parent.
 *
 * ```ts
 * await metaplex
 *   .fusion()
 *   .create();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const createFusionParentOperation =
  useOperation<CreateFusionParentOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type CreateFusionParentOperation = Operation<
  typeof Key,
  CreateFusionParentInput,
  CreateFusionParentOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type CreateFusionParentInput = {
  /**
   * The Public Key of the Escrow Constraint Model
   */
  constraintModel: PublicKey;

  /**
   * The authority that will be able to make changes
   * to the created NFT.
   *
   * This is required as a Signer because creating the master
   * edition account requires the update authority to sign
   * the transaction.
   *
   * @defaultValue `metaplex.identity()`
   */
  updateAuthority?: Signer;

  /**
   * The authority that is currently allowed to mint new tokens
   * for the provided mint account.
   *
   * Note that this is only relevant if the `useExistingMint` parameter
   * if provided.
   *
   * @defaultValue `metaplex.identity()`
   */
  mintAuthority?: Signer;

  /**
   * The address of the existing mint account that should be converted
   * into an NFT. The account at this address should have the right
   * requirements to become an NFT, e.g. its supply should contains
   * exactly 1 token.
   *
   * @defaultValue Defaults to creating a new mint account with the
   * right requirements.
   */
  useExistingMint?: PublicKey;

  /**
   * The owner of the NFT to create.
   *
   * @defaultValue `metaplex.identity().publicKey`
   */
  tokenOwner?: PublicKey;

  /**
   * The token account linking the mint account and the token owner
   * together. By default, the associated token account will be used.
   *
   * If the provided token account does not exist, it must be passed as
   * a Signer as we will need to create it before creating the NFT.
   *
   * @defaultValue Defaults to creating a new associated token account
   * using the `mintAddress` and `tokenOwner` parameters.
   */
  tokenAddress?: PublicKey | Signer;

  /** The URI that points to the JSON metadata of the asset. */
  uri: string;

  /** The on-chain name of the asset, e.g. "My NFT #123". */
  name: string;

  /**
   * The royalties in percent basis point (i.e. 250 is 2.5%) that
   * should be paid to the creators on each secondary sale.
   */
  sellerFeeBasisPoints: number;

  /**
   * The on-chain symbol of the asset, stored in the Metadata account.
   * E.g. "MYNFT".
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
   * Whether or not the NFT's metadata is mutable.
   * When set to `false` no one can update the Metadata account,
   * not even the update authority.
   *
   * @defaultValue `true`
   */
  isMutable?: boolean;

  /**
   * The maximum supply of printed editions.
   * When this is `null`, an unlimited amount of editions
   * can be printed from the original edition.
   *
   * @defaultValue `toBigNumber(0)`
   */
  maxSupply?: Option<BigNumber>;

  /**
   * When this field is not `null`, it indicates that the NFT
   * can be "used" by its owner or any approved "use authorities".
   *
   * @defaultValue `null`
   */
  uses?: Option<Uses>;

  /**
   * Whether the created NFT is a Collection NFT.
   * When set to `true`, the NFT will be created as a
   * Sized Collection NFT with an initial size of 0.
   *
   * @defaultValue `false`
   */
  isCollection?: boolean;

  /**
   * The Collection NFT that this new NFT belongs to.
   * When `null`, the created NFT will not be part of a collection.
   *
   * @defaultValue `null`
   */
  collection?: Option<PublicKey>;

  /**
   * The collection authority that should sign the created NFT
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
export type CreateFusionParentOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;

  /** The newly created NFT and its associated token. */
  //nft: NftWithToken;

  /** The address of the mint account. */
  // mintAddress: PublicKey;

  /** The address of the metadata account. */
  // metadataAddress: PublicKey;

  /** The address of the master edition account. */
  // masterEditionAddress: PublicKey;

  /** The address of the token account. */
  // tokenAddress: PublicKey;
};

/**
 * @group Operations
 * @category Handlers
 */
export const createFusionParentOperationHandler: OperationHandler<CreateFusionParentOperation> =
  {
    async handle(
      operation: CreateFusionParentOperation,
      metaplex: Metaplex,
      scope: OperationScope
    ): Promise<CreateFusionParentOutput> {
      const builder = await createFusionParentBuilder(
        metaplex,
        operation.input,
        scope
      );
      scope.throwIfCanceled();

      const confirmOptions = makeConfirmOptionsFinalizedOnMainnet(
        metaplex,
        scope.confirmOptions
      );
      const output = await builder.sendAndConfirm(metaplex, confirmOptions);
      scope.throwIfCanceled();

      // const nft = (await metaplex.nfts().findByMint(
      //   {
      //     mintAddress: output.mintAddress,
      //     tokenAddress: output.tokenAddress,
      //   },
      //   scope
      // )) as NftWithToken;

      // const fusionParent = {
      //   nft,
      //   mintAddress: nft.mint.address,
      //   metadataAddress: nft.metadataAddress,
      //   masterEditionAddress: nft.edition.address,
      //   tokenAddress: nft.token.address,
      // };
      // scope.throwIfCanceled();

      // assertNftWithToken(nft);

      return Promise.resolve<CreateFusionParentOutput>({
        ...output,
        //nft,
        //...fusionParent,
      });
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type CreateFusionParentBuilderParams = Omit<
  CreateFusionParentInput,
  'confirmOptions'
> & {
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
export type CreateFusionParentBuilderContext = Omit<
  CreateFusionParentOutput,
  'response' | 'nft'
>;

/**
 * Creates a Fusion parent.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .fusion()
 *   .builders()
 *   .createFusionParent()
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const createFusionParentBuilder = async (
  metaplex: Metaplex,
  params: CreateFusionParentBuilderParams,
  options: TransactionBuilderOptions = {}
): Promise<TransactionBuilder<CreateFusionParentBuilderContext>> => {
  const { payer = metaplex.rpc().getDefaultFeePayer() } = options;
  // const {
  //   updateAuthority = metaplex.identity(),
  //   mintAuthority = metaplex.identity(),
  //   tokenOwner = metaplex.identity().publicKey,
  // } = params;

  // const tokenMetadataProgram = metaplex.programs().getTokenMetadata(programs);
  // const trifleProgram = metaplex.programs().getFusion(programs);

  // const useNewMint = Keypair.generate();
  // const nftBuilder = await metaplex
  //   .nfts()
  //   .builders()
  //   .create(
  //     {
  //       ...params,
  //       //useNewMint,
  //     },
  //     { programs, payer }
  //   );

  // const { mintAddress, metadataAddress, masterEditionAddress, tokenAddress } =
  //   nftBuilder.getContext();
  // const fusionAddress = metaplex.fusion().pdas().fusion({
  //   mint: mintAddress,
  //   creator: payer.publicKey,
  //   programs,
  // });
  // const escrowAddress = metaplex.fusion().pdas().escrow({
  //   mint: mintAddress,
  //   creator: fusionAddress,
  //   programs,
  // });

  return (
    TransactionBuilder.make<CreateFusionParentBuilderContext>()
      .setFeePayer(payer)
      .setContext({
        // mintAddress,
        // metadataAddress,
        // masterEditionAddress,
        // tokenAddress: tokenAddress as PublicKey,
      })

      // Create the mint, the token and the metadata.
      // .add(nftBuilder)

      // Create master edition account (prevents further minting).
      // .add({
      //   instruction: createCreateTrifleAccountInstruction(
      //     {
      //       escrow: escrowAddress,
      //       metadata: metadataAddress,
      //       mint: mintAddress,
      //       tokenAccount: tokenAddress as PublicKey,
      //       edition: masterEditionAddress,
      //       trifleAccount: fusionAddress,
      //       trifleAuthority: payer.publicKey,
      //       constraintModel: params.constraintModel,
      //       payer: payer.publicKey,
      //       tokenMetadataProgram: tokenMetadataProgram.address,
      //       systemProgram: SystemProgram.programId,
      //       sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      //     },
      //     trifleProgram.address
      //   ),
      //   signers: [payer],
      // })
  );
};
