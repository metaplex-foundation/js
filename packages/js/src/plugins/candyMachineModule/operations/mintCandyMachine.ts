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
  // Models and Accounts.
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
  payer?: Signer; // Defaults to mx.identity().
  newMint?: Signer; // Defaults to Keypair.generate().
  newOwner?: PublicKey; // Defaults to mx.identity().
  newToken?: Signer; // Defaults to associated token.
  payerToken?: PublicKey; // Defaults to associated token.
  whitelistToken?: PublicKey; // Defaults to associated token.

  // Programs.
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;
  tokenMetadataProgram?: PublicKey;
  candyMachineProgram?: PublicKey;

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type MintCandyMachineOutput = {
  response: SendAndConfirmTransactionResponse;
  nft: NftWithToken;
  mintSigner: Signer;
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
  createMintAccountInstructionKey?: string;
  initializeMintInstructionKey?: string;
  createAssociatedTokenAccountInstructionKey?: string;
  createTokenAccountInstructionKey?: string;
  initializeTokenInstructionKey?: string;
  mintTokensInstructionKey?: string;
  mintNftInstructionKey?: string;
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
