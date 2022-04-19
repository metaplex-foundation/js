import { MetaplexError, MetaplexErrorInputWithoutSource } from './MetaplexError';

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

  static assetUploadFailed(status: number, cause?: Error) {
    return new this({
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
