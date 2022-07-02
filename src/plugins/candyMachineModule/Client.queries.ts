import { PublicKey } from '@solana/web3.js';
import type { CandyMachinesClient } from './CandyMachinesClient';
import { findCandyMachineByAddressOperation } from './findCandyMachineByAddress';
import { findCandyMachinesByPublicKeyFieldOperation } from './findCandyMachinesByPublicKeyField';
import { CandyMachine } from './CandyMachine';
import {
  CandyMachinesNotFoundByAuthorityError,
  MoreThanOneCandyMachineFoundByAuthorityAndUuidError,
  NoCandyMachineFoundForAuthorityMatchesUuidError,
} from '../../errors/CandyMachineError';

export function findAllByWallet(
  this: CandyMachinesClient,
  walletAddress: PublicKey
): Promise<CandyMachine[]> {
  return this.metaplex.operations().execute(
    findCandyMachinesByPublicKeyFieldOperation({
      type: 'wallet',
      publicKey: walletAddress,
    })
  );
}

export function findAllByAuthority(
  this: CandyMachinesClient,
  authorityAddress: PublicKey
): Promise<CandyMachine[]> {
  return this.metaplex.operations().execute(
    findCandyMachinesByPublicKeyFieldOperation({
      type: 'authority',
      publicKey: authorityAddress,
    })
  );
}

export async function findByAuthorityAndUuid(
  this: CandyMachinesClient,
  authorityAddress: PublicKey,
  uuid: string
): Promise<CandyMachine> {
  const candyMachinesForAuthority = await this.findAllByAuthority(
    authorityAddress
  );
  if (candyMachinesForAuthority.length === 0) {
    throw new CandyMachinesNotFoundByAuthorityError(authorityAddress);
  }
  const matchingUUid = candyMachinesForAuthority.filter(
    (candyMachine) => candyMachine.uuid === uuid
  );
  if (matchingUUid.length === 0) {
    const addresses = candyMachinesForAuthority.map(
      (candyMachine) => candyMachine.address
    );
    throw new NoCandyMachineFoundForAuthorityMatchesUuidError(
      authorityAddress,
      uuid,
      addresses
    );
  }
  if (matchingUUid.length > 1) {
    const addresses = matchingUUid.map((candyMachine) => candyMachine.address);
    throw new MoreThanOneCandyMachineFoundByAuthorityAndUuidError(
      authorityAddress,
      uuid,
      addresses
    );
  }
  return matchingUUid[0];
}
