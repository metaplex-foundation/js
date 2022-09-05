import type { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { CandyGuardClient } from './CandyGuardClient';
import {
  createCandyGuardOperation,
  createCandyGuardOperationHandler,
  deleteCandyGuardOperation,
  deleteCandyGuardOperationHandler,
  findCandyGuardByAddressOperation,
  findCandyGuardByAddressOperationHandler,
  findCandyGuardsByPublicKeyFieldOperation,
  findCandyGuardsByPublicKeyFieldOperationHandler,
  findMintedNftsByCandyGuardOperation,
  findMintedNftsByCandyGuardOperationHandler,
  insertItemsToCandyGuardOperation,
  InsertItemsToCandyGuardOperationHandler,
  mintCandyGuardOperation,
  mintCandyGuardOperationHandler,
  updateCandyGuardOperation,
  updateCandyGuardOperationHandler,
} from './operations';
import { DefaultCandyGuardProgram } from './program';

/** @group Plugins */
export const candyGuardModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.programs().register(DefaultCandyGuardProgram);

    const op = metaplex.operations();
    op.register(createCandyGuardOperation, createCandyGuardOperationHandler);
    op.register(deleteCandyGuardOperation, deleteCandyGuardOperationHandler);
    op.register(
      findCandyGuardByAddressOperation(),
      findCandyGuardByAddressOperationHandler
    );
    op.register(
      findCandyGuardsByPublicKeyFieldOperation,
      findCandyGuardsByPublicKeyFieldOperationHandler
    );
    op.register(
      findMintedNftsByCandyGuardOperation,
      findMintedNftsByCandyGuardOperationHandler
    );
    op.register(
      insertItemsToCandyGuardOperation,
      InsertItemsToCandyGuardOperationHandler
    );
    op.register(mintCandyGuardOperation, mintCandyGuardOperationHandler);
    op.register(updateCandyGuardOperation, updateCandyGuardOperationHandler);

    const client = new CandyGuardClient(metaplex);
    metaplex.candyGuards = () => client;
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    candyGuards(): CandyGuardClient;
  }
}
