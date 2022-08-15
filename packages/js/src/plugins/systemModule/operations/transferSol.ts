import { ConfirmOptions, PublicKey, SystemProgram } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import {
  assertSol,
  Operation,
  OperationHandler,
  Signer,
  SolAmount,
  useOperation,
} from '@/types';
import { DisposableScope, TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';

// -----------------
// Operation
// -----------------

const Key = 'TransferSolOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const transferSolOperation = useOperation<TransferSolOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type TransferSolOperation = Operation<
  typeof Key,
  TransferSolInput,
  TransferSolOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type TransferSolInput = {
  from?: Signer; // Defaults to mx.identity().
  to: PublicKey;
  amount: SolAmount;
  basePubkey?: PublicKey;
  seed?: string;
  program?: PublicKey;
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type TransferSolOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const transferSolOperationHandler: OperationHandler<TransferSolOperation> =
  {
    async handle(
      operation: TransferSolOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<TransferSolOutput> {
      const builder = transferSolBuilder(metaplex, operation.input);
      return builder.sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type TransferSolBuilderParams = Omit<
  TransferSolInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const transferSolBuilder = (
  metaplex: Metaplex,
  params: TransferSolBuilderParams
): TransactionBuilder => {
  const {
    from = metaplex.identity(),
    to,
    amount,
    basePubkey,
    seed,
    program = SystemProgram.programId,
  } = params;

  assertSol(amount);

  return TransactionBuilder.make().add({
    instruction: SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: amount.basisPoints.toNumber(),
      ...(basePubkey ? { basePubkey, seed } : {}),
      programId: program,
    }),
    signers: [from],
    key: params.instructionKey ?? 'transferSol',
  });
};
