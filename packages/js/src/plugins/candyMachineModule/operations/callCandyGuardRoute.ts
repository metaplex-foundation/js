import { createRouteInstruction } from '@metaplex-foundation/mpl-candy-guard';
import * as beet from '@metaplex-foundation/beet';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import {
  CandyGuardsRouteSettings,
  CandyGuardsSettings,
  DefaultCandyGuardRouteSettings,
  DefaultCandyGuardSettings,
} from '../guards';
import { CandyMachine } from '../models';
import { Option, TransactionBuilder, TransactionBuilderOptions } from '@/utils';
import { Operation, OperationHandler, OperationScope, Signer } from '@/types';
import { Metaplex } from '@/Metaplex';

// -----------------
// Operation
// -----------------

const Key = 'CallCandyGuardRouteOperation' as const;

/**
 * TODO
 *
 * ```ts
 * const { nft } = await metaplex
 *   .candyMachines()
 *   .callGuardRoute({
 *     candyMachine,
 *     guard: 'allowList',
 *     settings: {
 *       path: 'proof',
 *       merkleProof: getMerkleProof(data, leaf)
 *     },
 *   };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const callCandyGuardRouteOperation = _callCandyGuardRouteOperation;
// eslint-disable-next-line @typescript-eslint/naming-convention
function _callCandyGuardRouteOperation<
  Guard extends keyof RouteSettings & string,
  Settings extends CandyGuardsSettings = DefaultCandyGuardSettings,
  RouteSettings extends CandyGuardsRouteSettings = DefaultCandyGuardRouteSettings
>(
  input: CallCandyGuardRouteInput<Guard, Settings, RouteSettings>
): CallCandyGuardRouteOperation<Guard, Settings, RouteSettings> {
  return { key: Key, input };
}
_callCandyGuardRouteOperation.key = Key;

/**
 * @group Operations
 * @category Types
 */
export type CallCandyGuardRouteOperation<
  Guard extends keyof RouteSettings & string,
  Settings extends CandyGuardsSettings = DefaultCandyGuardSettings,
  RouteSettings extends CandyGuardsRouteSettings = DefaultCandyGuardRouteSettings
> = Operation<
  typeof Key,
  CallCandyGuardRouteInput<Guard, Settings, RouteSettings>,
  CallCandyGuardRouteOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type CallCandyGuardRouteInput<
  Guard extends keyof RouteSettings & string,
  Settings extends CandyGuardsSettings = DefaultCandyGuardSettings,
  RouteSettings extends CandyGuardsRouteSettings = DefaultCandyGuardRouteSettings
> = {
  /**
   * The Candy Machine containing the guard we are interested in.
   * We only need a subset of the `CandyMachine` model but we
   * need enough information regarding its settings to know how
   * to execute the route instruction on the guard.
   *
   * This includes its address and the Candy Guard account associated with it.
   */
  candyMachine: Pick<CandyMachine<Settings>, 'address' | 'candyGuard'>;

  /**
   * TODO: Document.
   */
  guard: Guard;

  /**
   * TODO: Document.
   */
  settings: RouteSettings[Guard];

  /**
   * The label of the group to mint from.
   *
   * If groups are configured on the Candy Machine,
   * you must specify a group label to mint from.
   *
   * When set to `null` it will mint using the default
   * guards, provided no groups are configured.
   *
   * @defaultValue `null`
   */
  group?: Option<string>;
};

/**
 * @group Operations
 * @category Outputs
 */
export type CallCandyGuardRouteOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const callCandyGuardRouteOperationHandler: OperationHandler<
  CallCandyGuardRouteOperation<any>
> = {
  async handle<
    Guard extends keyof RouteSettings & string,
    Settings extends CandyGuardsSettings = DefaultCandyGuardSettings,
    RouteSettings extends CandyGuardsRouteSettings = DefaultCandyGuardRouteSettings
  >(
    operation: CallCandyGuardRouteOperation<Guard, Settings, RouteSettings>,
    metaplex: Metaplex,
    scope: OperationScope
  ): Promise<CallCandyGuardRouteOutput> {
    const builder = callCandyGuardRouteBuilder<Guard, Settings, RouteSettings>(
      metaplex,
      operation.input,
      scope
    );

    return builder.sendAndConfirm(metaplex, scope.confirmOptions);
  },
};

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type CallCandyGuardRouteBuilderParams<
  Guard extends keyof RouteSettings & string,
  Settings extends CandyGuardsSettings = DefaultCandyGuardSettings,
  RouteSettings extends CandyGuardsRouteSettings = DefaultCandyGuardRouteSettings
> = Omit<
  CallCandyGuardRouteInput<Guard, Settings, RouteSettings>,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that mints from the Candy Machine. */
  instructionKey?: string;
};

/**
 * TODO
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachines()
 *   .builders()
 *   .callGuardRoute({
 *     candyMachine,
 *     guard: 'allowList',
 *     settings: {
 *       path: 'proof',
 *       merkleProof: getMerkleProof(data, leaf)
 *     },
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const callCandyGuardRouteBuilder = <
  Guard extends keyof RouteSettings & string,
  Settings extends CandyGuardsSettings = DefaultCandyGuardSettings,
  RouteSettings extends CandyGuardsRouteSettings = DefaultCandyGuardRouteSettings
>(
  metaplex: Metaplex,
  params: CallCandyGuardRouteBuilderParams<Guard, Settings, RouteSettings>,
  options: TransactionBuilderOptions = {}
): TransactionBuilder => {
  const { programs, payer = metaplex.rpc().getDefaultFeePayer() } = options;
  const { candyMachine, guard, settings, group = null } = params;

  if (!candyMachine.candyGuard) {
    // TODO: custom error.
    throw new Error('Candy Machine must have a Candy Guard');
  }

  // Route instruction.
  const parsedRouteSettings = metaplex
    .candyMachines()
    .guards()
    .parseRouteSettings(
      candyMachine.address,
      candyMachine.candyGuard,
      payer,
      guard,
      settings,
      group,
      programs
    );

  const routeSigners: Signer[] = [payer, ...parsedRouteSettings.signers];
  const routeInstruction = createRouteInstruction(
    {
      candyGuard: candyMachine.candyGuard.address,
      candyMachine: candyMachine.address,
      payer: payer.publicKey,
    },
    {
      args: {
        // "GuardType" is an enum for default guards only and will assert this
        // whereas we want to allow custom guards, so we need to pass anything
        // here to create the instruction and override this data afterwards.
        guard: 0,
        data: parsedRouteSettings.arguments,
      },
      label: group,
    },
    metaplex.programs().getCandyGuard(programs).address
  );
  routeInstruction.keys.push(...parsedRouteSettings.accountMetas);

  // As promised, we override the guard index here.
  const availableGuards = metaplex
    .candyMachines()
    .guards()
    .forCandyGuardProgram(programs);
  const guardIndex = availableGuards.findIndex((g) => g.name === guard);
  beet.u8.write(routeInstruction.data, 8, guardIndex);

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Route instruction.
      .add({
        instruction: routeInstruction,
        signers: routeSigners,
        key: params.instructionKey ?? 'callGuardRoute',
      })
  );
};
