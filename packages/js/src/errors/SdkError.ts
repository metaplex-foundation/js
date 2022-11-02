import { PublicKey } from '@solana/web3.js';
import {
  MetaplexError,
  MetaplexErrorInputWithoutSource,
  MetaplexErrorOptions,
} from './MetaplexError';
import { Cluster, Program, Currency } from '@/types';

/** @group Errors */
export class SdkError extends MetaplexError {
  constructor(input: MetaplexErrorInputWithoutSource) {
    super({
      ...input,
      key: `sdk.${input.key}`,
      source: 'sdk',
    });
  }
}

/** @group Errors */
export class OperationHandlerMissingError extends SdkError {
  constructor(operationKey: string, options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'operation_handler_missing',
      title: 'Operation Handler Missing',
      problem: `No operation handler was registered for the [${operationKey}] operation.`,
      solution:
        'Did you forget to register it? You may do this by using: ' +
        '"metaplex.register(operation, operationHandler)".',
    });
  }
}

/** @group Errors */
export class DriverNotProvidedError extends SdkError {
  constructor(driver: string, options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'driver_not_provided',
      title: 'Driver Not Provided',
      problem: `The SDK tried to access the driver [${driver}] but was not provided.`,
      solution:
        'Make sure the driver is registered by using the "setDriver(myDriver)" method.',
    });
  }
}

/** @group Errors */
export class UnexpectedCurrencyError extends SdkError {
  actual: Currency;
  expected: Currency;
  constructor(
    actual: Currency,
    expected: Currency,
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'unexpected_currency',
      title: 'Unexpected Currency',
      problem: `Expected currency [${expected}] but got [${actual}].`,
      solution:
        'Ensure the provided Amount or Currency is of the expected type.',
    });
    this.actual = actual;
    this.expected = expected;
  }
}

/** @group Errors */
export class CurrencyMismatchError extends SdkError {
  left: Currency;
  right: Currency;
  operation?: string;
  constructor(
    left: Currency,
    right: Currency,
    operation?: string,
    options?: MetaplexErrorOptions
  ) {
    const wrappedOperation = operation ? ` [${operation}]` : '';
    super({
      options,
      key: 'currency_mismatch',
      title: 'Currency Mismatch',
      problem:
        `The SDK tried to execute an operation${wrappedOperation} on two different currencies: ` +
        `${left.symbol} and ${right.symbol}.`,
      solution:
        'Provide both amounts in the same currency to perform this operation.',
    });
    this.left = left;
    this.right = right;
    this.operation = operation;
  }
}

/** @group Errors */
export class InvalidJsonVariableError extends SdkError {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'invalid_json_variable',
      title: 'Invalid JSON Variable',
      problem: 'The provided JSON variable could not be parsed into a string.',
      solution:
        'Ensure the variable can be parsed as a JSON string using "JSON.stringify(myVariable)".',
    });
  }
}

/** @group Errors */
export class InvalidJsonStringError extends SdkError {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'invalid_json_string',
      title: 'Invalid JSON String',
      problem: 'The provided string could not be parsed into a JSON variable.',
      solution: 'Ensure the provided string uses a valid JSON syntax.',
    });
  }
}

/** @group Errors */
export class OperationUnauthorizedForGuestsError extends SdkError {
  constructor(operation: string, options?: MetaplexErrorOptions) {
    super({
      options,
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

/** @group Errors */
export class UninitializedWalletAdapterError extends SdkError {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'uninitialized_wallet_adapter',
      title: 'Uninitialized Wallet Adapter',
      problem: 'The current wallet adapter is not initialized.',
      solution:
        'You likely have selected a wallet adapter but forgot to initialize it. ' +
        'You may do this by running the following asynchronous method: "walletAdapter.connect();".',
    });
  }
}

/** @group Errors */
export class OperationNotSupportedByWalletAdapterError extends SdkError {
  constructor(operation: string, options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'operation_not_supported_by_wallet_adapter',
      title: 'Operation Not Supported By Wallet Adapter',
      problem: `The current wallet adapter does not support the following operation: [${operation}].`,
      solution:
        'Ensure your wallet is connected using a compatible wallet adapter.',
    });
  }
}

/** @group Errors */
export class TaskIsAlreadyRunningError extends SdkError {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'task_is_already_running',
      title: 'Task Is Already Running',
      problem: "Trying to re-run a task that hasn't completed yet.",
      solution:
        'Ensure the task has completed using "await" before trying to run it again.',
    });
  }
}

/** @group Errors */
export class AssetNotFoundError extends SdkError {
  constructor(location: string, options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'asset_not_found',
      title: 'Asset Not Found',
      problem: `The asset at [${location}] could not be found.`,
      solution: 'Ensure the asset exists at the given path or URI.',
    });
  }
}

/** @group Errors */
export class AccountNotFoundError extends SdkError {
  constructor(
    address: PublicKey,
    accountType?: string,
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'account_not_found',
      title: 'Account Not Found',
      problem:
        (accountType
          ? `The account of type [${accountType}] was not found`
          : 'No account was found') +
        ` at the provided address [${address.toBase58()}].`,
      solution:
        'Ensure the provided address is correct and that an account exists at this address.',
    });
  }
}

/** @group Errors */
export class UnexpectedAccountError extends SdkError {
  constructor(
    address: PublicKey,
    expectedType: string,
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'unexpected_account',
      title: 'Unexpected Account',
      problem:
        `The account at the provided address [${address.toBase58()}] ` +
        `is not of the expected type [${expectedType}].`,
      solution: `Ensure the provided address is correct and that it holds an account of type [${expectedType}].`,
    });
  }
}

/** @group Errors */
export class UnexpectedTypeError extends SdkError {
  constructor(
    variable: string,
    actualType: string,
    expectedType: string,
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'unexpected_type',
      title: 'Unexpected Type',
      problem: `Expected variable [${variable}] to be of type [${expectedType}] but got [${actualType}].`,
      solution: `Please check that you are providing the right variable for this use case.`,
    });
  }
}

/** @group Errors */
export class ExpectedSignerError extends SdkError {
  constructor(
    variable: string,
    actualType: string,
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'expected_signer',
      title: 'Expected Signer',
      problem: `Expected variable [${variable}] to be of type [Signer] but got [${actualType}].`,
      solution:
        'Please check that you are providing the variable as a signer. ' +
        'Note that, it may be allowed to provide a non-signer variable for certain use cases but not this one.',
    });
  }
}

/** @group Errors */
export class ProgramNotRecognizedError extends SdkError {
  nameOrAddress: string | PublicKey;
  cluster: Cluster;
  constructor(
    nameOrAddress: string | PublicKey,
    cluster: Cluster,
    options?: MetaplexErrorOptions
  ) {
    const isName = typeof nameOrAddress === 'string';
    const toString = isName ? nameOrAddress : nameOrAddress.toBase58();
    super({
      options,
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

/** @group Errors */
export class MissingGpaBuilderError extends SdkError {
  program: Program;
  constructor(program: Program, options?: MetaplexErrorOptions) {
    super({
      options,
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

/** @group Errors */
export class NoInstructionsToSendError extends SdkError {
  constructor(
    operation: string,
    solution?: string,
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'no_instructions_to_send',
      title: 'No Instructions To Send',
      problem:
        `The input provided to the [${operation}] resulted ` +
        `in a Transaction containing no Instructions.`,
      solution:
        solution ??
        `Ensure that the provided input has an effect on the operation. ` +
          `This typically happens when trying to update an account with ` +
          `the same data it already contains.`,
    });
  }
}

/** @group Errors */
export class FailedToSerializeDataError extends SdkError {
  constructor(dataDescription: string, options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'failed_to_serialize_data',
      title: 'Failed To Serialize Data',
      problem: `The received data could not be serialized as a [${dataDescription}].`,
      solution:
        'Ensure the data is of the expected type so it can be serialized.',
    });
  }
}

/** @group Errors */
export class MissingInputDataError extends SdkError {
  constructor(missingParameters: string[], options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'missing_input_data',
      title: 'Missing Input Data',
      problem: 'Some parameters are missing from the provided input object.',
      solution:
        'Please provide the following missing parameters: [' +
        missingParameters.join(', ') +
        '].',
    });
  }
}

/** @group Errors */
export class FailedToDeserializeDataError extends SdkError {
  constructor(dataDescription: string, options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'failed_to_deserialize_data',
      title: 'Failed To Deserialize Data',
      problem: `The received serialized data could not be deserialized to a [${dataDescription}].`,
      solution:
        'Ensure the serialized data is not corrupted and complies with the expected type.',
    });
  }
}

/** @group Errors */
export class NotYetImplementedError extends SdkError {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'not_yet_implemented',
      title: 'Not Yet Implemented',
      problem: 'This feature is not yet implemented.',
      solution: 'Please check back later.',
    });
  }
}

/** @group Errors */
export class UnreachableCaseError extends SdkError {
  constructor(value: never, options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'unreachable_case',
      title: `The Case '${value}' in a Switch or If Statement went Unhandled.`,
      problem:
        'The developer is not handling that case yet or is missing a `break` or `return` statement.',
      solution:
        'Check your inputs or file an issue to have all cases handled properly.',
    });
  }
}
