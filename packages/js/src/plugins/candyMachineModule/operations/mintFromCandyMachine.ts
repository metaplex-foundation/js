import { Metaplex } from '@/Metaplex';
import { NftWithToken } from '@/plugins/nftModule';
import {
  Operation,
  OperationHandler,
  Program,
  PublicKey,
  Signer,
  useOperation,
  token as tokenAmount,
} from '@/types';
import { DisposableScope, TransactionBuilder } from '@/utils';
import { ConfirmOptions, Keypair } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { CandyMachineBotTaxError } from '../errors';
import { CandyMachine } from '../models';

// -----------------
// Operation
// -----------------

const Key = 'MintFromCandyMachineOperation' as const;

/**
 * Mints the next NFT from a given candy machine.
 *
 * ```ts
 * const { nft } = await metaplex
 *   .candyMachines()
 *   .mint({
 *     // TODO
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const mintFromCandyMachineOperation =
  useOperation<MintFromCandyMachineOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type MintFromCandyMachineOperation = Operation<
  typeof Key,
  MintFromCandyMachineInput,
  MintFromCandyMachineOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type MintFromCandyMachineInput = {
  /**
   * The Candy Machine to mint from.
   * We only need a subset of the `CandyMachine` model but we
   * need enough information regarding its settings to know how
   * to mint from it.
   *
   * TODO: This includes ...
   */
  candyMachine: Pick<
    CandyMachine,
    | 'address'
    | 'authorityAddress'
    | 'itemsRemaining'
    | 'itemsAvailable'
    | 'itemsMinted'
  >;

  /**
   * The mint account to create as a Signer.
   * This expects a brand new Keypair with no associated account.
   *
   * @defaultValue `Keypair.generate()`
   */
  mint?: Signer;

  /**
   * The owner of the minted NFT.
   *
   * @defaultValue `metaplex.identity().publicKey`
   */
  owner?: PublicKey;

  /**
   * The new token account to create as a Signer.
   *
   * This property would typically be ignored as, by default, it will create a
   * associated token account from the `owner` and `mint` properties.
   *
   * When provided, the `owner` property will be ignored.
   *
   * @defaultValue associated token address of `owner` and `mint`.
   */
  token?: Signer;

  /**
   * The account that should pay for the minted NFT
   * and for the transaction fee.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /** An optional set of programs that override the registered ones. */
  programs?: Program[];

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type MintFromCandyMachineOutput = {
  /** The minted NFT. */
  nft: NftWithToken;

  /** The mint account of the minted NFT as a Signer. */
  mintSigner: Signer;

  /** The address of the minted NFT's token account. */
  tokenAddress: PublicKey;

  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const mintFromCandyMachineOperationHandler: OperationHandler<MintFromCandyMachineOperation> =
  {
    async handle(
      operation: MintFromCandyMachineOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<MintFromCandyMachineOutput> {
      const builder = await mintFromCandyMachineBuilder(
        metaplex,
        operation.input
      );
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
        // TODO: Only throw if the CM has a bot tax guard. Otherwise, `throw error`.
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
export type MintFromCandyMachineBuilderParams = Omit<
  MintFromCandyMachineInput,
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

  /** A key to distinguish the instruction that mints from the Candy Machine. */
  mintFromCandyMachineInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type MintFromCandyMachineBuilderContext = Omit<
  MintFromCandyMachineOutput,
  'response' | 'nft'
>;

/**
 * Mints the next NFT from a given candy machine.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachines()
 *   .builders()
 *   .mint({
 *     // TODO
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const mintFromCandyMachineBuilder = async (
  metaplex: Metaplex,
  params: MintFromCandyMachineBuilderParams
): Promise<TransactionBuilder<MintFromCandyMachineBuilderContext>> => {
  const {
    candyMachine,
    payer = metaplex.identity(),
    mint = Keypair.generate(),
    owner = metaplex.identity().publicKey,
    token,
    programs,
  } = params;

  // TODO: Ensure these programs are registered.
  const tokenProgram = metaplex.programs().get('TokenProgram', programs);
  const associatedTokenProgram = metaplex
    .programs()
    .get('AssociatedTokenProgram', programs);

  const tokenWithMintBuilder = await metaplex
    .tokens()
    .builders()
    .createTokenWithMint({
      decimals: 0,
      initialSupply: tokenAmount(1),
      mint,
      mintAuthority: payer,
      freezeAuthority: payer.publicKey,
      owner,
      token,
      payer,
      tokenProgram: tokenProgram.address,
      associatedTokenProgram: associatedTokenProgram.address,
      createMintAccountInstructionKey: params.createMintAccountInstructionKey,
      initializeMintInstructionKey: params.initializeMintInstructionKey,
      createAssociatedTokenAccountInstructionKey:
        params.createAssociatedTokenAccountInstructionKey,
      createTokenAccountInstructionKey: params.createTokenAccountInstructionKey,
      initializeTokenInstructionKey: params.initializeTokenInstructionKey,
      mintTokensInstructionKey: params.mintTokensInstructionKey,
    });

  const { tokenAddress } = tokenWithMintBuilder.getContext();

  return TransactionBuilder.make<MintFromCandyMachineBuilderContext>()
    .setFeePayer(payer)
    .setContext({ tokenAddress })
    .add(tokenWithMintBuilder);
};
