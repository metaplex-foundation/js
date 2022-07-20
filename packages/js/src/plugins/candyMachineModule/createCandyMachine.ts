import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import {
  createInitializeCandyMachineInstruction,
  createSetCollectionInstruction,
  Creator,
} from '@metaplex-foundation/mpl-candy-machine';
import { Metaplex } from '@/Metaplex';
import {
  Operation,
  useOperation,
  Signer,
  OperationHandler,
  assertSameCurrencies,
  SOL,
  toBigNumber,
  toUniformCreators,
  toPublicKey,
  isSigner,
} from '@/types';
import {
  DisposableScope,
  Option,
  RequiredKeys,
  TransactionBuilder,
} from '@/utils';
import { CandyMachineProgram } from './program';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { getCandyMachineAccountSizeFromData } from './helpers';
import {
  CandyMachineConfigs,
  toCandyMachineInstructionData,
} from './CandyMachine';
import {
  findCollectionAuthorityRecordPda,
  findMasterEditionV2Pda,
  findMetadataPda,
  isLazyNft,
  isNft,
  LazyNft,
  Nft,
  TokenMetadataProgram,
} from '../nftModule';
import { findCandyMachineCollectionPda } from './pdas';
import { CandyMachineAuthorityRequiredAsASignerError } from './errors';

// -----------------
// Operation
// -----------------

const Key = 'CreateCandyMachineOperation' as const;
export const createCandyMachineOperation =
  useOperation<CreateCandyMachineOperation>(Key);
export type CreateCandyMachineOperation = Operation<
  typeof Key,
  CreateCandyMachineInput,
  CreateCandyMachineOutput
>;

export type CreateCandyMachineInputWithoutConfigs = {
  // Accounts and Models.
  candyMachine?: Signer; // Defaults to Keypair.generate().
  payer?: Signer; // Defaults to mx.identity().
  authority?: Signer | PublicKey; // Defaults to mx.identity().
  collection?: Option<PublicKey | Nft | LazyNft>; // Defaults to no collection.

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

export type CreateCandyMachineInput = CreateCandyMachineInputWithoutConfigs &
  RequiredKeys<
    Partial<CandyMachineConfigs>,
    'price' | 'sellerFeeBasisPoints' | 'itemsAvailable'
  >;

export type CreateCandyMachineOutput = {
  response: SendAndConfirmTransactionResponse;
  candyMachineSigner: Signer;
  payer: Signer;
  wallet: PublicKey;
  authority: PublicKey;
  creators: Creator[];
};

// -----------------
// Handler
// -----------------

export const createCandyMachineOperationHandler: OperationHandler<CreateCandyMachineOperation> =
  {
    async handle(
      operation: CreateCandyMachineOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<CreateCandyMachineOutput> {
      const builder = await createCandyMachineBuilder(
        metaplex,
        operation.input
      );
      scope.throwIfCanceled();
      return builder.sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

export type CreateCandyMachineBuilderParams = Omit<
  CreateCandyMachineInput,
  'confirmOptions'
> & {
  createAccountInstructionKey?: string;
  initializeCandyMachineInstructionKey?: string;
  setCollectionInstructionKey?: string;
};

export type CreateCandyMachineBuilderContext = Omit<
  CreateCandyMachineOutput,
  'response'
>;

export const createCandyMachineBuilder = async (
  metaplex: Metaplex,
  params: CreateCandyMachineBuilderParams
): Promise<TransactionBuilder<CreateCandyMachineBuilderContext>> => {
  const candyMachine = params.candyMachine ?? Keypair.generate();
  const payer: Signer = params.payer ?? metaplex.identity();
  const authority = params.authority ?? metaplex.identity();
  const collection: PublicKey | null =
    params.collection &&
    (isNft(params.collection) || isLazyNft(params.collection))
      ? params.collection.mintAddress
      : params.collection ?? null;

  const { data, wallet, tokenMint } = toCandyMachineInstructionData(
    candyMachine.publicKey,
    {
      ...params,
      wallet: params.wallet ?? metaplex.identity().publicKey,
      tokenMint: params.tokenMint ?? null,
      symbol: params.symbol ?? '',
      maxEditionSupply: params.maxEditionSupply ?? toBigNumber(0),
      isMutable: params.isMutable ?? true,
      retainAuthority: params.retainAuthority ?? true,
      goLiveDate: params.goLiveDate ?? null,
      endSettings: params.endSettings ?? null,
      creators:
        params.creators ?? toUniformCreators(metaplex.identity().publicKey),
      hiddenSettings: params.hiddenSettings ?? null,
      whitelistMintSettings: params.whitelistMintSettings ?? null,
      gatekeeper: params.gatekeeper ?? null,
    }
  );

  const initializeInstruction = createInitializeCandyMachineInstruction(
    {
      candyMachine: candyMachine.publicKey,
      wallet,
      authority: toPublicKey(authority),
      payer: payer.publicKey,
    },
    { data }
  );

  if (tokenMint) {
    initializeInstruction.keys.push({
      pubkey: tokenMint,
      isWritable: false,
      isSigner: false,
    });
  } else {
    assertSameCurrencies(params.price, SOL);
  }

  return (
    TransactionBuilder.make<CreateCandyMachineBuilderContext>()
      .setFeePayer(payer)
      .setContext({
        candyMachineSigner: candyMachine,
        payer,
        wallet,
        authority: toPublicKey(authority),
        creators: data.creators,
      })

      // Create an empty account for the candy machine.
      .add(
        await metaplex
          .system()
          .builders()
          .createAccount({
            payer,
            newAccount: candyMachine,
            space: getCandyMachineAccountSizeFromData(data),
            program: CandyMachineProgram.publicKey,
            instructionKey:
              params.createAccountInstructionKey ?? 'createAccount',
          })
      )

      // Initialize the candy machine account.
      .add({
        instruction: initializeInstruction,
        signers: [candyMachine, payer],
        key:
          params.initializeCandyMachineInstructionKey ??
          'initializeCandyMachine',
      })

      // Set the collection.
      .when(!!collection, (builder) => {
        if (!isSigner(authority)) {
          throw new CandyMachineAuthorityRequiredAsASignerError();
        }

        const collectionMint = collection as PublicKey;
        const metadata = findMetadataPda(collectionMint);
        const edition = findMasterEditionV2Pda(collectionMint);
        const collectionPda = findCandyMachineCollectionPda(
          candyMachine.publicKey
        );
        const collectionAuthorityRecord = findCollectionAuthorityRecordPda(
          collectionMint,
          collectionPda
        );

        return builder.add({
          instruction: createSetCollectionInstruction({
            candyMachine: candyMachine.publicKey,
            authority: toPublicKey(authority),
            collectionPda,
            payer: payer.publicKey,
            metadata,
            mint: collectionMint,
            edition,
            collectionAuthorityRecord,
            tokenMetadataProgram: TokenMetadataProgram.publicKey,
          }),
          signers: [authority],
          key: params.setCollectionInstructionKey ?? 'setCollection',
        });
      })
  );
};
