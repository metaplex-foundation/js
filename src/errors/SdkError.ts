import { PublicKey } from '@solana/web3.js';
import { Cluster, Program } from '@/types';
import { MetaplexError, MetaplexErrorInputWithoutSource } from './MetaplexError';

export class SdkError extends MetaplexError {
  constructor(input: MetaplexErrorInputWithoutSource) {
    super({
      ...input,
      key: `sdk.${input.key}`,
      source: 'sdk',
    });
  }
}

export class OperationHandlerMissingError extends SdkError {
  constructor(operationKey: string, cause?: Error) {
    super({
      cause,
      key: 'operation_handler_missing',
      title: 'Operation Handler Missing',
      problem: `No operation handler was registered for the [${operationKey}] operation.`,
      solution:
        'Did you forget to register it? You may do this by using: ' +
        '"metaplex.register(operation, operationHandler)".',
    });
  }
}

export class InvalidJsonVariableError extends SdkError {
  constructor(cause?: Error) {
    super({
      cause,
      key: 'invalid_json_variable',
      title: 'Invalid JSON Variable',
      problem: 'The provided JSON variable could not be parsed into a string.',
      solution:
        'Ensure the variable can be parsed as a JSON string using "JSON.stringify(myVariable)".',
    });
  }
}

export class InvalidJsonStringError extends SdkError {
  constructor(cause?: Error) {
    super({
      cause,
      key: 'invalid_json_string',
      title: 'Invalid JSON String',
      problem: 'The provided string could not be parsed into a JSON variable.',
      solution: 'Ensure the provided string uses a valid JSON syntax.',
    });
  }
}

export class OperationUnauthorizedForGuestsError extends SdkError {
  constructor(operation: string, cause?: Error) {
    super({
      cause,
      key: 'operation_unauthorized_for_guests',
      title: 'Operation Unauthorized For Guests',
      problem: `Trying to access the [${operation}] operation as a guest.`,
      solution:
        'Ensure your wallet is connected using the identity driver. ' +
        'For instance, by using "metaplex.use(walletAdapterIdentity(wallet))" or ' +
        '"metaplex.use(keypairIdentity(keypair))".',
    });
  }
}

export class UninitializedWalletAdapterError extends SdkError {
  constructor(cause?: Error) {
    super({
      cause,
      key: 'uninitialized_wallet_adapter',
      title: 'Uninitialized Wallet Adapter',
      problem: 'The current wallet adapter is not initialized.',
      solution:
        'You likely have selected a wallet adapter but forgot to initialize it. ' +
        'You may do this by running the following asynchronous method: "walletAdater.connect();".',
    });
  }
}

export class OperationNotSupportedByWalletAdapterError extends SdkError {
  constructor(operation: string, cause?: Error) {
    super({
      cause,
      key: 'operation_not_supported_by_wallet_adapter',
      title: 'Operation Not Supported By Wallet Adapter',
      problem: `The current wallet adapter does not support the following operation: [${operation}].`,
      solution: 'Ensure your wallet is connected using a compatible wallet adapter.',
    });
  }
}

export class TaskIsAlreadyRunningError extends SdkError {
  constructor(cause?: Error) {
    super({
      cause,
      key: 'task_is_already_running',
      title: 'Task Is Already Running',
      problem: "Trying to re-run a task that hasn't completed yet.",
      solution: 'Ensure the task has completed using "await" before trying to run it again.',
    });
  }
}

export class AssetNotFoundError extends SdkError {
  constructor(location: string, cause?: Error) {
    super({
      cause,
      key: 'asset_not_found',
      title: 'Asset Not Found',
      problem: `The asset at [${location}] could not be found.`,
      solution: 'Ensure the asset exists at the given path or URI.',
    });
  }
}

export class AccountNotFoundError extends SdkError {
  constructor(address: PublicKey, accountType?: string, solution?: string, cause?: Error) {
    super({
      cause,
      key: 'account_not_found',
      title: 'Account Not Found',
      problem:
        (accountType
          ? `The account of type [${accountType}] was not found`
          : 'No account was found') + ` at the provided address [${address.toBase58()}].`,
      solution:
        solution ??
        'Ensure the provided address is correct and that an account exists at this address.',
    });
  }
}

export class UnexpectedAccountError extends SdkError {
  constructor(address: PublicKey, accountType: string, cause?: Error) {
    super({
      cause,
      key: 'unexpected_account',
      title: 'Unexpected Account',
      problem:
        `The account at the provided address [${address.toBase58()}] ` +
        `is not of the expected type [${accountType}].`,
      solution: `Ensure the provided address is correct and that it holds an account of type [${accountType}].`,
    });
  }
}

export class ProgramNotRecognizedError extends SdkError {
  nameOrAddress: string | PublicKey;
  cluster: Cluster;
  constructor(nameOrAddress: string | PublicKey, cluster: Cluster, cause?: Error) {
    const isName = typeof nameOrAddress === 'string';
    const toString = isName ? nameOrAddress : nameOrAddress.toBase58();
    super({
      cause,
      key: 'program_not_recognized',
      title: 'Program Not Recognized',
      problem:
        `The provided program ${isName ? 'name' : 'address'} [${toString}] ` +
        `is not recognized in the [${cluster}] cluster.`,
      solution:
        'Did you forget to register this program? ' +
        'If so, you may use "metaplex.programs().register(myProgram)" to fix this.',
    });
    this.nameOrAddress = nameOrAddress;
    this.cluster = cluster;
  }
}

export class MissingGpaBuilderError extends SdkError {
  program: Program;
  constructor(program: Program, cause?: Error) {
    super({
      cause,
      key: 'missing_gpa_builder',
      title: 'Missing "getProgramAccount" Builder',
      problem: `The program [${program.name}] does not have a registered "getProgramAccount" builder.`,
      solution:
        'When registering a program, make sure you provide a "gpaResolver" ' +
        'before trying to access its "getProgramAccount" builder.',
    });
    this.program = program;
  }
}

export class NotYetImplementedError extends SdkError {
  constructor(cause?: Error) {
    super({
      cause,
      key: 'not_yet_implemented',
      title: 'Not Yet Implemented',
      problem: 'This feature is not yet implemented.',
      solution: 'Please check back later.',
    });
  }
}

export class UnreachableCaseError extends SdkError {
  constructor(value: never, cause?: Error) {
    super({
      cause,
      key: 'unreachable_case',
      title: 'A Case in a Switch or If Statement Is Unreachable.',
      problem: 'The developer is not handling that case yet.',
      solution: 'Check your inputs or file an issue to have all cases handled.',
    });
  }
}
