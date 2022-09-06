import type { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { CandyGuardClient } from './CandyGuardClient';
import {
  allowListGuardManifest,
  botTaxGuardManifest,
  endSettingsGuardManifest,
  gatekeeperGuardManifest,
  lamportsGuardManifest,
  liveDateGuardManifest,
  mintLimitGuardManifest,
  splTokenGuardManifest,
  thirdPartySignerGuardManifest,
  whitelistGuardManifest,
} from './guards';
import {
  createCandyGuardOperation,
  createCandyGuardOperationHandler,
  findCandyGuardByAddressOperation,
  findCandyGuardByAddressOperationHandler,
  findCandyGuardsByPublicKeyFieldOperation,
  findCandyGuardsByPublicKeyFieldOperationHandler,
  mintFromCandyGuardOperation,
  mintFromCandyGuardOperationHandler,
  updateCandyGuardOperation,
  updateCandyGuardOperationHandler,
} from './operations';
import { DefaultCandyGuardProgram } from './program';

/** @group Plugins */
export const candyGuardModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    // Client.
    const client = new CandyGuardClient(metaplex);
    metaplex.candyGuards = () => client;

    // Program.
    metaplex.programs().register(DefaultCandyGuardProgram);

    // Default Guards.
    client.guards().register(botTaxGuardManifest);
    client.guards().register(liveDateGuardManifest);
    client.guards().register(lamportsGuardManifest);
    client.guards().register(splTokenGuardManifest);
    client.guards().register(thirdPartySignerGuardManifest);
    client.guards().register(whitelistGuardManifest);
    client.guards().register(gatekeeperGuardManifest);
    client.guards().register(endSettingsGuardManifest);
    client.guards().register(allowListGuardManifest);
    client.guards().register(mintLimitGuardManifest);

    // Operations.
    const op = metaplex.operations();
    op.register(createCandyGuardOperation, createCandyGuardOperationHandler);
    op.register(
      findCandyGuardByAddressOperation(),
      findCandyGuardByAddressOperationHandler
    );
    op.register(
      findCandyGuardsByPublicKeyFieldOperation,
      findCandyGuardsByPublicKeyFieldOperationHandler
    );
    op.register(
      mintFromCandyGuardOperation,
      mintFromCandyGuardOperationHandler
    );
    op.register(updateCandyGuardOperation, updateCandyGuardOperationHandler);
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    candyGuards(): CandyGuardClient;
  }
}
