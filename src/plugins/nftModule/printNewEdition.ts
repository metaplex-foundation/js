import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Metaplex } from '@/Metaplex';
import { findAssociatedTokenAccountPda } from '../tokenModule';
import {
  createMintNewEditionFromMasterEditionViaTokenInstructionWithSigners,
  createMintNewEditionFromMasterEditionViaVaultProxyInstructionWithSigners,
  findEditionMarkerPda,
  findEditionPda,
  findMasterEditionV2Pda,
  findMetadataPda,
  toOriginalEditionAccount,
} from '@/programs';
import {
  useOperation,
  Operation,
  OperationHandler,
  Signer,
  token,
  toBigNumber,
} from '@/types';
import { InstructionWithSigners, TransactionBuilder } from '@/utils';

// -----------------
// Operation
// -----------------

const Key = 'PrintNewEditionOperation' as const;
export const printNewEditionOperation =
  useOperation<PrintNewEditionOperation>(Key);
export type PrintNewEditionOperation = Operation<
  typeof Key,
  PrintNewEditionInput,
  PrintNewEditionOutput
>;

export type PrintNewEditionInput = PrintNewEditionSharedInput &
  PrintNewEditionViaInput;

export type PrintNewEditionSharedInput = {
  originalMint: PublicKey;
  newMint?: Signer;
  newMintAuthority?: Signer;
  newUpdateAuthority?: PublicKey;
  newOwner?: PublicKey;
  newFreezeAuthority?: PublicKey;
  payer?: Signer;
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;
  confirmOptions?: ConfirmOptions;
};

export type PrintNewEditionViaInput =
  | {
      via?: 'token';
      originalTokenAccountOwner?: Signer;
      originalTokenAccount?: PublicKey;
    }
  | {
      via: 'vault';
      vaultAuthority: Signer;
      safetyDepositStore: PublicKey;
      safetyDepositBox: PublicKey;
      vault: PublicKey;
      tokenVaultProgram?: PublicKey;
    };

export type PrintNewEditionOutput = {
  mint: Signer;
  metadata: PublicKey;
  edition: PublicKey;
  associatedToken: PublicKey;
  transactionId: string;
};

// -----------------
// Handler
// -----------------

export const printNewEditionOperationHandler: OperationHandler<PrintNewEditionOperation> =
  {
    handle: async (operation: PrintNewEditionOperation, metaplex: Metaplex) => {
      const {
        originalMint,
        newMint = Keypair.generate(),
        newMintAuthority = metaplex.identity(),
        newUpdateAuthority = newMintAuthority.publicKey,
        newOwner = newMintAuthority.publicKey,
        newFreezeAuthority,
        payer = metaplex.identity(),
        tokenProgram,
        associatedTokenProgram,
        confirmOptions,
      } = operation.input;

      // Original NFT.
      const originalMetadata = findMetadataPda(originalMint);
      const originalEdition = findMasterEditionV2Pda(originalMint);
      const originalEditionAccount = toOriginalEditionAccount(
        await metaplex.rpc().getAccount(originalEdition),
        `Ensure the provided mint address for the original NFT [${originalMint.toBase58()}] ` +
          `is correct and that it has an associated OriginalEdition PDA.`
      );

      const edition = new BN(originalEditionAccount.data.supply, 'le').add(
        new BN(1)
      );
      const originalEditionMarkPda = findEditionMarkerPda(
        originalMint,
        toBigNumber(edition)
      );

      // New NFT.
      const newMetadata = findMetadataPda(newMint.publicKey);
      const newEdition = findEditionPda(newMint.publicKey);
      const sharedInput = {
        edition,
        newMint,
        newMetadata,
        newEdition,
        newMintAuthority,
        newUpdateAuthority,
        newOwner,
        newFreezeAuthority,
        payer,
        originalMetadata,
        originalEdition,
        originalEditionMarkPda,
        tokenProgram,
        associatedTokenProgram,
      };

      let transactionBuilder: TransactionBuilder<PrintNewEditionBuilderContext>;
      if (operation.input.via === 'vault') {
        transactionBuilder = await printNewEditionBuilder(metaplex, {
          via: 'vault',
          vaultAuthority: operation.input.vaultAuthority,
          safetyDepositStore: operation.input.safetyDepositStore,
          safetyDepositBox: operation.input.safetyDepositBox,
          vault: operation.input.vault,
          tokenVaultProgram: operation.input.tokenVaultProgram,
          ...sharedInput,
        });
      } else {
        const originalTokenAccountOwner =
          operation.input.originalTokenAccountOwner ?? metaplex.identity();
        const originalTokenAccount =
          operation.input.originalTokenAccount ??
          findAssociatedTokenAccountPda(
            originalMint,
            originalTokenAccountOwner.publicKey,
            tokenProgram,
            associatedTokenProgram
          );

        transactionBuilder = await printNewEditionBuilder(metaplex, {
          via: 'token',
          originalTokenAccountOwner,
          originalTokenAccount,
          ...sharedInput,
        });
      }

      const { tokenAddress } = transactionBuilder.getContext();

      const { signature } = await metaplex
        .rpc()
        .sendAndConfirmTransaction(
          transactionBuilder,
          undefined,
          confirmOptions
        );

      return {
        mint: newMint,
        metadata: newMetadata,
        edition: newEdition,
        associatedToken: tokenAddress,
        transactionId: signature,
      };
    },
  };

// -----------------
// Builder
// -----------------

type PrintNewEditionBuilderSharedParams = {
  // Data.
  edition: number | BN;

  // New NFT.
  newMint: Signer;
  newMetadata: PublicKey;
  newEdition: PublicKey;
  newMintAuthority: Signer;
  newUpdateAuthority: PublicKey;
  newOwner: PublicKey;
  newFreezeAuthority?: PublicKey;
  payer: Signer;

  // Master NFT.
  originalMetadata: PublicKey;
  originalEdition: PublicKey;
  originalEditionMarkPda: PublicKey;

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
  printNewEditionInstructionKey?: string;
};

export type PrintNewEditionBuilderParams = PrintNewEditionBuilderSharedParams &
  (
    | {
        via: 'token';
        originalTokenAccountOwner: Signer;
        originalTokenAccount: PublicKey;
      }
    | {
        via: 'vault';
        vaultAuthority: Signer;
        safetyDepositStore: PublicKey;
        safetyDepositBox: PublicKey;
        vault: PublicKey;
        tokenVaultProgram?: PublicKey;
      }
  );

export type PrintNewEditionBuilderContext = {
  tokenAddress: PublicKey;
};

export const printNewEditionBuilder = async (
  metaplex: Metaplex,
  params: PrintNewEditionBuilderParams
): Promise<TransactionBuilder<PrintNewEditionBuilderContext>> => {
  const {
    // Data.
    edition,

    // New NFT.
    newMint,
    newMetadata,
    newEdition,
    newMintAuthority,
    newUpdateAuthority,
    newOwner,
    newFreezeAuthority,
    payer,

    // Master NFT.
    originalMetadata,
    originalEdition,
    originalEditionMarkPda,

    // Programs.
    tokenProgram,
    associatedTokenProgram,

    // Instruction keys.
    printNewEditionInstructionKey = 'printNewEdition',
  } = params;

  const tokenWithMintBuilder = await metaplex
    .tokens()
    .builders()
    .createTokenWithMint({
      decimals: 0,
      initialSupply: token(1),
      mint: newMint,
      mintAuthority: newMintAuthority,
      freezeAuthority: newFreezeAuthority ?? null,
      owner: newOwner,
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

  let printNewEditionInstructionWithSigners: InstructionWithSigners;
  if (params.via === 'vault') {
    printNewEditionInstructionWithSigners =
      createMintNewEditionFromMasterEditionViaVaultProxyInstructionWithSigners({
        edition,
        newMetadata,
        newEdition,
        masterEdition: originalEdition,
        newMint,
        editionMarkPda: originalEditionMarkPda,
        newMintAuthority,
        payer,
        vaultAuthority: params.vaultAuthority,
        safetyDepositStore: params.safetyDepositStore,
        safetyDepositBox: params.safetyDepositBox,
        vault: params.vault,
        newMetadataUpdateAuthority: newUpdateAuthority,
        metadata: originalMetadata,
        tokenVaultProgram: params.tokenVaultProgram,
        instructionKey: printNewEditionInstructionKey,
      });
  } else {
    printNewEditionInstructionWithSigners =
      createMintNewEditionFromMasterEditionViaTokenInstructionWithSigners({
        edition,
        newMetadata,
        newEdition,
        masterEdition: originalEdition,
        newMint,
        editionMarkPda: originalEditionMarkPda,
        newMintAuthority,
        payer,
        tokenAccountOwner: params.originalTokenAccountOwner,
        tokenAccount: params.originalTokenAccount,
        newMetadataUpdateAuthority: newUpdateAuthority,
        metadata: originalMetadata,
        instructionKey: printNewEditionInstructionKey,
      });
  }

  return (
    TransactionBuilder.make<PrintNewEditionBuilderContext>()
      .setFeePayer(payer)
      .setContext({ tokenAddress })

      // Create the mint and token accounts before minting 1 token to the owner.
      .add(tokenWithMintBuilder)

      // Mint new edition.
      .add(printNewEditionInstructionWithSigners)
  );
};
