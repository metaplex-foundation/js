import { MetaplexError, MetaplexErrorInputWithoutSource } from '@/errors';

/** @group Errors */
export class FusionError extends MetaplexError {
  constructor(input: MetaplexErrorInputWithoutSource) {
    super({
      ...input,
      key: `plugin.fusion.${input.key}`,
      title: `AuctionHouse > ${input.title}`,
      source: 'plugin',
      sourceDetails: 'Fusion',
    });
  }
}
