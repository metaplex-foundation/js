import { Metaplex } from './Metaplex';
import { coreProgramsPlugin } from '@/drivers';
import { candyMachinePlugin, nftPlugin } from '@/modules';

export const corePlugin = () => ({
  install(metaplex: Metaplex) {
    metaplex.use(coreProgramsPlugin());
    metaplex.use(nftPlugin());
    metaplex.use(candyMachinePlugin());
  },
});
