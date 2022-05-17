import { Test } from 'tape';
import spok from 'spok';
import { Creator } from '@metaplex-foundation/mpl-token-metadata';
import { CreatorsConfig } from '@/plugins/candyMachineModule/config';

export function assertCreators(
  t: Test,
  creators: Creator[],
  config: CreatorsConfig
) {
  t.equal(creators.length, config.length, 'creators.length');

  creators = Array.from(creators);
  creators.sort((a, b) =>
    a.address.toBase58().localeCompare(b.address.toBase58())
  );
  config = Array.from(config);
  config.sort((a, b) => a.address.localeCompare(b.address));

  for (let i = 0; i < creators.length; i++) {
    const creator = creators[i];
    const conf = config[i];
    spok(t, creator, {
      verified: conf.verified,
      share: conf.share,
    });
    t.equal(creator.address.toBase58(), conf.address);
  }
}
