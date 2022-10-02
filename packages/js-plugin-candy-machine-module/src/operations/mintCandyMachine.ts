import { Metaplex } from '@/Metaplex';
import {
  assertAccountExists,
  Operation,
  OperationHandler,
  Signer,
  token,
  useOperation,
} from '@/types';
import { DisposableScope, TransactionBuilder } from '@/utils';
import {
  createMintNftInstruction,
  createSetCollectionDuringMintInstruction,
} from '@metaplex-foundation/mpl-candy-machine';
import {
  ConfirmOptions,
  Keypair,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_SLOT_HASHES_PUBKEY,
} from '@solana/web3.js';
import {
  findCollectionAuthorityRecordPda,
  findMasterEditionV2Pda,
  findMetadataPda,
  NftWithToken,
  TokenMetadataProgram,
} from '../../nftModule';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findAssociatedTokenAccountPda } from '../../tokenModule';
import { parseCandyMachineCollectionAccount } from '../accounts';
import { assertCanMintCandyMachine } from '../asserts';
import { CandyMachineBotTaxError } from '../errors';
import { CandyMachine } from '../models/CandyMachine';
import {
  findCandyMachineCollectionPda,
  findCandyMachineCreatorPda,
} from '../pdas';
import { CandyMachineProgram } from '../program';

// -----------------
// Operation
// -----------------

const Key = 'MintCandyMachineOperation' as const;

/**
 * Mint an NFT from an existing Candy Machine.
 *
 * ```ts
 * const { nft } = await metaplex
 *   .candyMachines()
 *   .mint({ candyMachine })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const mintCandyMachineOperation =
  useOperation<MintCandyMachineOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type MintCandyMachineOperation = Operation<
  typeof Key,
  MintCandyMachineInput,
  MintCandyMachineOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type MintCandyMachineInput = {
  /**
   * The Candy Machine to mint from.
   * We only need a subset of the `CandyMachine` model but we
   * need enough information regarding its settings to know how
   * to mint from it.
   *
   * This includes, its wallet address, its item statistics, it live date,
   * its whitelist settings, etc.
   */
  candyMachine: Pick<
    CandyMachine,
    | 'address'
    | 'walletAddress'
    | 'authorityAddress'
    | 'tokenMintAddress'
    | 'itemsRemaining'
    | 'itemsAvailable'
    | 'itemsMinted'
    | 'whitelistMintSettings'
    | 'goLiveDate'
    | 'endSettings'
  >;

  /**
   * The account that should pay for the minted NFT
   * and for the transaction fee.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /**
   * The mint account to create as a Signer.
   * This expects a brand new Keypair with no associated account.
   *
   * @defaultValue `Keypair.generate()`
   */
  newMint?: Signer;

  /**
   * The owner of the minted NFT.
   *
   * @defaultValue `metaplex.identity().publicKey`
   */
  newOwner?: PublicKey;

  /**
   * The new token account to create as a Signer.
   *
   * This property would typically be ignored as, by default, it will create a
   * associated token account from the `newOwner` and `newMint` properties.
   *
   * When provided, the `newOwner` property will be ignored.
   *
   * @defaultValue associated token address of `newOwner` and `newMint`.
   */
  newToken?: Signer;

  /**
   * The token account that should pay for the minted NFT.
   *
   * This is only relevant when the Candy Machine uses a mint treasury
   * (i.e. payments are made using SPL tokens and not SOL).
   *
   * @defaultValue associated token address of `payer` and
   * `candyMachine.tokenMintAddress`.
   */
  payerToken?: PublicKey;

  /**
   * The token account that contains whitelist tokens.
   *
   * This is only relevant when the Candy Machine uses
   * whitelist settings.
   *
   * @defaultValue associated token address of `payer` and
   * `candyMachine.whitelistMintSettings.mint`.
   */
  whitelistToken?: PublicKey; // Defaults to associated token.

  /** The address of the SPL Token program to override if necessary. */
  tokenProgram?: PublicKey;

  /** The address of the SPL Associated Token program to override if necessary. */
  associatedTokenProgram?: PublicKey;

  /** The address of the Token Metadata program to override if necessary. */
  tokenMetadataProgram?: PublicKey;

  /** The address of the Candy Machine program to override if necessary. */
  candyMachineProgram?: PublicKey;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type MintCandyMachineOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;

  /** The minted NFT. */
  nft: NftWithToken;

  /** The mint account of the minted NFT as a Signer. */
  mintSigner: Signer;

  /** The token account's address of the minted NFT. */
  tokenAddress: PublicKey;
};

/**
 * @group Operations
 * @category Handlers
 */
export const mintCandyMachineOperationHandler: OperationHandler<MintCandyMachineOperation> =
  {
    async handle(
      operation: MintCandyMachineOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<MintCandyMachineOutput> {
      assertCanMintCandyMachine(
        operation.input.candyMachine,
        operation.input.payer ?? metaplex.identity()
      );

      const builder = await mintCandyMachineBuilder(metaplex, operation.input);
      scope.throwIfCanceled();

      const output = await builder.sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      );
      scope.throwIfCanceled();

      let nft: NftWithToken;
      try {
        nft = (await metaplex
          .nfts()
          .findByMint({
            mintAddress: output.mintSigner.publicKey,
            tokenAddress: output.tokenAddress,
          })
          .run(scope)) as NftWithToken;
      } catch (error) {
        throw new CandyMachineBotTaxError(
          metaplex.rpc().getSolanaExporerUrl(output.response.signature),
          error as Error
        );
      }

      return { nft, ...output };
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type MintCandyMachineBuilderParams = Omit<
  MintCandyMachineInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that creates the mint account of the NFT. */
  createMintAccountInstructionKey?: string;

  /** A key to distinguish the instruction that initializes the mint account of the NFT. */
  initializeMintInstructionKey?: string;

  /** A key to distinguish the instruction that creates the associated token account of the NFT. */
  createAssociatedTokenAccountInstructionKey?: string;

  /** A key to distinguish the instruction that creates the token account of the NFT. */
  createTokenAccountInstructionKey?: string;

  /** A key to distinguish the instruction that initializes the token account of the NFT. */
  initializeTokenInstructionKey?: string;

  /** A key to distinguish the instruction that mints the one token. */
  mintTokensInstructionKey?: string;

  /** A key to distinguish the instruction that mints the NFT. */
  mintNftInstructionKey?: string;

  /** A key to distinguish the instruction that sets the collection on the minted NFT. */
  setCollectionInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type MintCandyMachineBuilderContext = Omit<
  MintCandyMachineOutput,
  'response' | 'nft'
>;

/**
 * Mint an NFT from an existing Candy Machine.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachines()
 *   .builders()
 *   .mint({ candyMachine });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const mintCandyMachineBuilder = async (
  metaplex: Metaplex,
  params: MintCandyMachineBuilderParams
): Promise<TransactionBuilder<MintCandyMachineBuilderContext>> => {
  const {
    candyMachine,
    payer = metaplex.identity(),
    newMint = Keypair.generate(),
    newOwner = metaplex.identity().publicKey,
    newToken,
    tokenProgram,
    associatedTokenProgram,
    tokenMetadataProgram = TokenMetadataProgram.publicKey,
    candyMachineProgram = CandyMachineProgram.publicKey,
  } = params;

  const newMetadata = findMetadataPda(newMint.publicKey, tokenMetadataProgram);
  const newEdition = findMasterEditionV2Pda(
    newMint.publicKey,
    tokenMetadataProgram
  );
  const candyMachineCreator = findCandyMachineCreatorPda(
    candyMachine.address,
    candyMachineProgram
  );
  const candyMachineCollectionAddress = findCandyMachineCollectionPda(
    candyMachine.address,
    candyMachineProgram
  );
  const candyMachineCollectionAccount = parseCandyMachineCollectionAccount(
    await metaplex.rpc().getAccount(candyMachineCollectionAddress)
  );

  const tokenWithMintBuilder = await metaplex
    .tokens()
    .builders()
    .createTokenWithMint({
      decimals: 0,
      initialSupply: token(1),
      mint: newMint,
      mintAuthority: payer,
      freezeAuthority: payer.publicKey,
      owner: newOwner,
      token: newToken,
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

  const mintNftInstruction = createMintNftInstruction(
    {
      candyMachine: candyMachine.address,
      candyMachineCreator: candyMachineCreator,
      payer: payer.publicKey,
      wallet: candyMachine.walletAddress,
      metadata: newMetadata,
      mint: newMint.publicKey,
      mintAuthority: payer.publicKey,
      updateAuthority: payer.publicKey,
      masterEdition: newEdition,
      tokenMetadataProgram,
      clock: SYSVAR_CLOCK_PUBKEY,
      recentBlockhashes: SYSVAR_SLOT_HASHES_PUBKEY,
      instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
    },
    { creatorBump: candyMachineCreator.bump }
  );

  if (candyMachine.whitelistMintSettings) {
    const whitelistToken =
      params.whitelistToken ??
      findAssociatedTokenAccountPda(
        candyMachine.whitelistMintSettings.mint,
        payer.publicKey,
        associatedTokenProgram
      );

    mintNftInstruction.keys.push(
      {
        pubkey: whitelistToken,
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: candyMachine.whitelistMintSettings.mint,
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: payer.publicKey,
        isWritable: false,
        isSigner: true,
      }
    );
  }

  if (candyMachine.tokenMintAddress) {
    const payerToken =
      params.payerToken ??
      findAssociatedTokenAccountPda(
        candyMachine.tokenMintAddress,
        payer.publicKey,
        associatedTokenProgram
      );

    mintNftInstruction.keys.push(
      {
        pubkey: payerToken,
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: payer.publicKey,
        isWritable: false,
        isSigner: true,
      }
    );
  }

  return (
    TransactionBuilder.make<MintCandyMachineBuilderContext>()
      .setFeePayer(payer)
      .setContext({
        mintSigner: newMint,
        tokenAddress,
      })

      // Create token and mint accounts.
      .add(tokenWithMintBuilder)

      // Create the new NFT.
      .add({
        instruction: mintNftInstruction,
        signers: [payer, newMint],
        key: params.mintNftInstructionKey ?? 'mintNft',
      })

      // Set the collection on the NFT.
      .when(candyMachineCollectionAccount.exists, (builder) => {
        assertAccountExists(candyMachineCollectionAccount);
        const collectionMint = candyMachineCollectionAccount.data.mint;
        const collectionMetadata = findMetadataPda(
          collectionMint,
          tokenMetadataProgram
        );
        const collectionMasterEdition = findMasterEditionV2Pda(
          collectionMint,
          tokenMetadataProgram
        );
        const collectionAuthorityRecord = findCollectionAuthorityRecordPda(
          collectionMint,
          candyMachineCollectionAccount.publicKey,
          tokenMetadataProgram
        );

        return builder.add({
          instruction: createSetCollectionDuringMintInstruction({
            candyMachine: candyMachine.address,
            metadata: newMetadata,
            payer: payer.publicKey,
            collectionPda: candyMachineCollectionAccount.publicKey,
            tokenMetadataProgram,
            instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            collectionMint: candyMachineCollectionAccount.data.mint,
            collectionMetadata,
            collectionMasterEdition,
            authority: candyMachine.authorityAddress,
            collectionAuthorityRecord,
          }),
          signers: [payer],
          key: params.setCollectionInstructionKey ?? 'setCollection',
        });
      })
  );
};
