import type {Metaplex} from '@/Metaplex';
import {MetaplexPlugin} from '@/types';
import {CandyMachinesClient} from './CandyMachinesClient';
import {
    createCandyMachineV2Operation,
    createCandyMachineV2OperationHandler,
    deleteCandyMachineOperation,
    deleteCandyMachineOperationHandler,
    findCandyMachineByAddressOperation,
    findCandyMachineByAddressOperationHandler,
    findCandyMachinesByPublicKeyFieldOperation,
    findCandyMachinesByPublicKeyFieldOperationHandler,
    findMintedNftsByCandyMachineOperation,
    findMintedNftsByCandyMachineOperationHandler,
    insertItemsToCandyMachineOperation,
    InsertItemsToCandyMachineOperationHandler,
    mintCandyMachineOperation,
    mintCandyMachineOperationHandler,
    updateCandyMachineOperation,
    updateCandyMachineOperationHandler,
} from './operations';

/** @group Plugins */
export const candyMachineModule = (): MetaplexPlugin => ({
    install(metaplex: Metaplex) {
        const op = metaplex.operations();
        op.register(
            createCandyMachineV2Operation,
            createCandyMachineV2OperationHandler
        );
        op.register(
            deleteCandyMachineOperation,
            deleteCandyMachineOperationHandler
        );
        op.register(
            findCandyMachineByAddressOperation,
            findCandyMachineByAddressOperationHandler
        );
        op.register(
            findCandyMachinesByPublicKeyFieldOperation,
            findCandyMachinesByPublicKeyFieldOperationHandler
        );
        op.register(
            findMintedNftsByCandyMachineOperation,
            findMintedNftsByCandyMachineOperationHandler
        );
        op.register(
            insertItemsToCandyMachineOperation,
            InsertItemsToCandyMachineOperationHandler
        );
        op.register(mintCandyMachineOperation, mintCandyMachineOperationHandler);
        op.register(
            updateCandyMachineOperation,
            updateCandyMachineOperationHandler
        );

        metaplex.candyMachinesV2 = function () {
            return new CandyMachinesClient(this);
        };
    },
});

declare module '../../Metaplex' {
    interface Metaplex {
        candyMachinesV2(): CandyMachinesClient;
    }
}
