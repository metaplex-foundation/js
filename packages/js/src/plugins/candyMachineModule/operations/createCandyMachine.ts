import { Metaplex } from '@/Metaplex';
import {
  assertSameCurrencies,
  isSigner,
  Operation,
  OperationHandler,
  Signer,
  SOL,
  toBigNumber,
  toPublicKey,
  useOperation,
} from '@/types';
import {
  DisposableScope,
  Option,
  RequiredKeys,
  TransactionBuilder,
} from '@/utils';
import {
  createInitializeCandyMachineInstruction,
  createSetCollectionInstruction,
  Creator,
} from '@metaplex-foundation/mpl-candy-machine';
import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import {
  findCollectionAuthorityRecordPda,
  findMasterEditionV2Pda,
  findMetadataPda,
  TokenMetadataProgram,
} from '../../nftModule';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import {
  CandyMachine,
  CandyMachineConfigs,
  toCandyMachineInstructionData,
} from '../models/CandyMachine';
import { ExpectedSignerError } from '@/errors';
import { getCandyMachineAccountSizeFromData } from '../helpers';
import { findCandyMachineCollectionPda } from '../pdas';
import { CandyMachineProgram } from '../program';

// -----------------
// Operation
// -----------------

const Key = 'CreateCandyMachineOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const createCandyMachineOperation =
  useOperation<CreateCandyMachineOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
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
  collection?: Option<PublicKey>; // Defaults to no collection.

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Inputs
 */
export type CreateCandyMachineInput = CreateCandyMachineInputWithoutConfigs &
  RequiredKeys<
    Partial<CandyMachineConfigs>,
    'price' | 'sellerFeeBasisPoints' | 'itemsAvailable'
  >;

/**
 * @group Operations
 * @category Outputs
 */
export type CreateCandyMachineOutput = {
  response: SendAndConfirmTransactionResponse;
  candyMachine: CandyMachine;
  candyMachineSigner: Signer;
  payer: Signer;
  wallet: PublicKey;
  authority: PublicKey;
  creators: Creator[];
};

/**
 * @group Operations
 * @category Handlers
 */
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

      const output = await builder.sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      );
      scope.throwIfCanceled();

      const candyMachine = await metaplex
        .candyMachines()
        .findByAddress({ address: output.candyMachineSigner.publicKey })
        .run(scope);

      return { ...output, candyMachine };
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type CreateCandyMachineBuilderParams = Omit<
  CreateCandyMachineInput,
  'confirmOptions'
> & {
  createAccountInstructionKey?: string;
  initializeCandyMachineInstructionKey?: string;
  setCollectionInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CreateCandyMachineBuilderContext = Omit<
  CreateCandyMachineOutput,
  'response' | 'candyMachine'
>;

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const createCandyMachineBuilder = async (
  metaplex: Metaplex,
  params: CreateCandyMachineBuilderParams
): Promise<TransactionBuilder<CreateCandyMachineBuilderContext>> => {
  const candyMachine = params.candyMachine ?? Keypair.generate();
  const payer: Signer = params.payer ?? metaplex.identity();
  const authority = params.authority ?? metaplex.identity();
  const collection: PublicKey | null = params.collection ?? null;

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
      creators: params.creators ?? [
        {
          address: metaplex.identity().publicKey,
          share: 100,
          verified: false,
        },
      ],
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
          throw new ExpectedSignerError('authority', 'PublicKey', {
            problemSuffix:
              'You are trying to create a Candy Machine with a Collection NFT. ' +
              'In order for the Collection NFT to be set successfully, you must provide the authority as a Signer.',
            solution:
              'Please provide the "authority" parameter as a Signer if you want to set the Collection NFT upon creation. ' +
              'Alternatively, you may remove the "collection" parameter to create a Candy Machine without an associated Collection NFT.',
          });
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
