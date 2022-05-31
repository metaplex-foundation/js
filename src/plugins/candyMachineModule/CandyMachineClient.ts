import type { Metaplex } from '@/Metaplex';
import {
  findAllByAuthority,
  findAllByWallet,
  findByAddress,
  findByAuthorityAndUuid,
} from './Client.queries';
import { create, createFromConfig } from './Client.create';
import { update, updateAuthority } from './Client.update';
import {
  uploadAssetForCandyMachine,
  uploadAssetsForCandyMachine,
} from './Client.upload';
import { addAssets } from './Client.add';

export class CandyMachineClient {
  constructor(readonly metaplex: Metaplex) {}

  // -----------------
  // Queries
  // -----------------
  findByAddress = findByAddress;
  findAllByWallet = findAllByWallet;
  findAllByAuthority = findAllByAuthority;
  findByAuthorityAndUuid = findByAuthorityAndUuid;

  // -----------------
  // Create
  // -----------------
  create = create;
  createFromConfig = createFromConfig;

  // -----------------
  // Update
  // -----------------
  update = update;
  updateAuthority = updateAuthority;

  // -----------------
  // Add Assets
  // -----------------
  addAssets = addAssets;

  // -----------------
  // Upload Assets
  // -----------------
  uploadAssetForCandyMachine = uploadAssetForCandyMachine;
  uploadAssetsForCandyMachine = uploadAssetsForCandyMachine;
}
