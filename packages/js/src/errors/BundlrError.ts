import {
  MetaplexError,
  MetaplexErrorInputWithoutSource,
} from './MetaplexError';

export class BundlrError extends MetaplexError {
  constructor(input: MetaplexErrorInputWithoutSource) {
    super({
      ...input,
      key: `plugin.bundlr.${input.key}`,
      title: `Bundlr > ${input.title}`,
      source: 'plugin',
      sourceDetails: 'Bundlr',
    });
  }
}

export class FailedToInitializeBundlrError extends BundlrError {
  constructor(cause: Error) {
    super({
      cause,
      key: 'failed_to_initialize_bundlr',
      title: 'Failed to Initialize Bundlr',
      problem: 'Bundlr could not be initialized.',
      solution:
        'This could happen for a variety of reasons. ' +
        'Check the underlying error below for more information.',
    });
  }
}

export class FailedToConnectToBundlrAddressError extends BundlrError {
  constructor(address: string, cause?: Error) {
    super({
      cause,
      key: 'failed_to_connect_to_bundlr_address',
      title: 'Failed to Connect to Bundlr Address',
      problem: `Bundlr could not connect to the provided address [${address}].`,
      solution:
        'Ensure the provided address is valid. Some valid addresses include: ' +
        '"https://node1.bundlr.network" for mainnet and "https://devnet.bundlr.network" for devnet',
    });
  }
}

export class AssetUploadFailedError extends BundlrError {
  constructor(status: number, cause?: Error) {
    super({
      cause,
      key: 'asset_upload_failed',
      title: 'Asset Upload Failed',
      problem:
        `The asset could not be uploaded to the Bundlr network and ` +
        `returned the following status code [${status}].`,
      solution:
        'Check the provided status code for more information. For now, this is all we get ' +
        "from Bundlr's API but we'll improve this error message as we get more information.",
    });
  }
}

export class BundlrWithdrawError extends BundlrError {
  constructor(status: number, cause?: Error) {
    super({
      cause,
      key: 'bundlr_withdraw_error',
      title: 'Bundlr Withdraw Error',
      problem:
        `The balance could not be withdrawn from the Bundlr network and ` +
        `returned the following status code [${status}].`,
      solution:
        'Check the provided status code for more information. For now, this is all we get ' +
        "from Bundlr's API but we'll improve this error message as we get more information.",
    });
  }
}
