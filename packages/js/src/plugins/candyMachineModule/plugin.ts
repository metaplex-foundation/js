import type { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { CandyMachineClient } from './CandyMachineClient';
import {
  allowListGuardManifest,
  botTaxGuardManifest,
  endSettingsGuardManifest,
  gatekeeperGuardManifest,
  lamportsGuardManifest,
  liveDateGuardManifest,
  mintLimitGuardManifest,
  nftPaymentGuardManifest,
  splTokenGuardManifest,
  thirdPartySignerGuardManifest,
  whitelistGuardManifest,
} from './guards';
import {
  createCandyGuardOperation,
  createCandyGuardOperationHandler,
  createCandyMachineOperation,
  createCandyMachineOperationHandler,
  deleteCandyGuardOperation,
  deleteCandyGuardOperationHandler,
  deleteCandyMachineOperation,
  deleteCandyMachineOperationHandler,
  findCandyGuardByAddressOperation,
  findCandyGuardByAddressOperationHandler,
  findCandyGuardsByAuthorityOperation,
  findCandyGuardsByAuthorityOperationHandler,
  findCandyMachineByAddressOperation,
  findCandyMachineByAddressOperationHandler,
  insertCandyMachineItemsOperation,
  InsertCandyMachineItemsOperationHandler,
  unwrapCandyGuardOperation,
  unwrapCandyGuardOperationHandler,
  updateCandyGuardOperation,
  updateCandyGuardOperationHandler,
  updateCandyMachineOperation,
  updateCandyMachineOperationHandler,
  wrapCandyGuardOperation,
  wrapCandyGuardOperationHandler,
} from './operations';
import { candyMachineProgram, defaultCandyGuardProgram } from './programs';

/** @group Plugins */
export const candyMachineModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    // Client.
    const client = new CandyMachineClient(metaplex);
    metaplex.candyMachines = () => client;

    // Program.
    metaplex.programs().register(candyMachineProgram);
    metaplex.programs().register(defaultCandyGuardProgram);

    // Default Guards.
    client.guards().register(botTaxGuardManifest);
    client.guards().register(lamportsGuardManifest);
    client.guards().register(splTokenGuardManifest);
    client.guards().register(liveDateGuardManifest);
    client.guards().register(thirdPartySignerGuardManifest);
    client.guards().register(whitelistGuardManifest);
    client.guards().register(gatekeeperGuardManifest);
    client.guards().register(endSettingsGuardManifest);
    client.guards().register(allowListGuardManifest);
    client.guards().register(mintLimitGuardManifest);
    client.guards().register(nftPaymentGuardManifest);

    // Operations.
    const op = metaplex.operations();
    op.register(createCandyGuardOperation, createCandyGuardOperationHandler);
    op.register(
      createCandyMachineOperation,
      createCandyMachineOperationHandler
    );
    op.register(deleteCandyGuardOperation, deleteCandyGuardOperationHandler);
    op.register(
      deleteCandyMachineOperation,
      deleteCandyMachineOperationHandler
    );
    op.register(
      findCandyGuardByAddressOperation,
      findCandyGuardByAddressOperationHandler
    );
    op.register(
      findCandyGuardsByAuthorityOperation,
      findCandyGuardsByAuthorityOperationHandler
    );
    op.register(
      findCandyMachineByAddressOperation,
      findCandyMachineByAddressOperationHandler
    );
    op.register(
      insertCandyMachineItemsOperation,
      InsertCandyMachineItemsOperationHandler
    );
    op.register(wrapCandyGuardOperation, wrapCandyGuardOperationHandler);
    op.register(updateCandyGuardOperation, updateCandyGuardOperationHandler);
    op.register(
      updateCandyMachineOperation,
      updateCandyMachineOperationHandler
    );
    op.register(unwrapCandyGuardOperation, unwrapCandyGuardOperationHandler);
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    candyMachines(): CandyMachineClient;
  }
}
