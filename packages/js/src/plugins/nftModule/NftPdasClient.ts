import { Buffer } from 'buffer';
import { DelegateType, getDelegateRoleSeed } from './DelegateType';
import type { Metaplex } from '@/Metaplex';
import { BigNumber, Pda, Program, PublicKey, toBigNumber } from '@/types';

/**
 * This client allows you to build PDAs related to the NFT module.
 *
 * @see {@link NftClient}
 * @group Module Pdas
 */
export class NftPdasClient {
  constructor(protected readonly metaplex: Metaplex) {}

  /** Finds the Metadata PDA of a given mint address. */
  metadata({ mint, programs }: MintAddressPdaInput): Pda {
    const programId = this.programId(programs);
    return Pda.find(programId, [
      Buffer.from('metadata', 'utf8'),
      programId.toBuffer(),
      mint.toBuffer(),
    ]);
  }

  /** Finds the Master Edition PDA of a given mint address. */
  masterEdition({ mint, programs }: MintAddressPdaInput): Pda {
    const programId = this.programId(programs);
    return Pda.find(programId, [
      Buffer.from('metadata', 'utf8'),
      programId.toBuffer(),
      mint.toBuffer(),
      Buffer.from('edition', 'utf8'),
    ]);
  }

  /** Finds the Edition PDA of a given mint address. */
  edition(input: MintAddressPdaInput): Pda {
    return this.masterEdition(input);
  }

  /** Finds the Edition Marker PDA of a given edition number. */
  editionMarker({
    mint,
    edition,
    programs,
  }: {
    /** The address of the mint account of the edition NFT. */
    mint: PublicKey;
    /** The edition number of the NFT. */
    edition: BigNumber;
    /** An optional set of programs that override the registered ones. */
    programs?: Program[];
  }): Pda {
    const programId = this.programId(programs);
    return Pda.find(programId, [
      Buffer.from('metadata', 'utf8'),
      programId.toBuffer(),
      mint.toBuffer(),
      Buffer.from('edition', 'utf8'),
      Buffer.from(edition.div(toBigNumber(248)).toString()),
    ]);
  }

  /** Finds the collection authority PDA for a given NFT and authority. */
  collectionAuthorityRecord({
    mint,
    collectionAuthority,
    programs,
  }: {
    /** The address of the NFT's mint account. */
    mint: PublicKey;
    /** The address of the collection authority. */
    collectionAuthority: PublicKey;
    /** An optional set of programs that override the registered ones. */
    programs?: Program[];
  }): Pda {
    const programId = this.programId(programs);
    return Pda.find(programId, [
      Buffer.from('metadata', 'utf8'),
      programId.toBuffer(),
      mint.toBuffer(),
      Buffer.from('collection_authority', 'utf8'),
      collectionAuthority.toBuffer(),
    ]);
  }

  /** Finds the use authority PDA for a given NFT and user. */
  useAuthorityRecord({
    mint,
    useAuthority,
    programs,
  }: {
    /** The address of the NFT's mint account. */
    mint: PublicKey;
    /** The address of the use authority. */
    useAuthority: PublicKey;
    /** An optional set of programs that override the registered ones. */
    programs?: Program[];
  }): Pda {
    const programId = this.programId(programs);
    return Pda.find(programId, [
      Buffer.from('metadata', 'utf8'),
      programId.toBuffer(),
      mint.toBuffer(),
      Buffer.from('user', 'utf8'),
      useAuthority.toBuffer(),
    ]);
  }

  /** Finds the burner PDA of the Token Metadata program. */
  burner({
    programs,
  }: {
    /** An optional set of programs that override the registered ones. */
    programs?: Program[];
  }): Pda {
    const programId = this.programId(programs);
    return Pda.find(programId, [
      Buffer.from('metadata', 'utf8'),
      programId.toBuffer(),
      Buffer.from('burn', 'utf8'),
    ]);
  }

  /** Finds the record PDA for a given NFT and delegate authority. */
  persistentDelegateRecord(
    input: Omit<DelegateRecordPdaInput, 'delegate' | 'type' | 'namespace'> & {
      /** The address of the asset's owner. */
      owner: PublicKey;
    }
  ): Pda {
    return this.delegateRecord({
      ...input,
      type: 'TransferV1',
      namespace: input.owner,
    });
  }

  /** Finds the record PDA for a given NFT and delegate authority. */
  delegateRecord(input: DelegateRecordPdaInput): Pda {
    const programId = this.programId(input.programs);
    return Pda.find(programId, [
      Buffer.from('metadata', 'utf8'),
      programId.toBuffer(),
      input.mint.toBuffer(),
      Buffer.from(getDelegateRoleSeed(input.type), 'utf8'),
      input.namespace.toBuffer(),
      ...(input.delegate ? [input.delegate.toBuffer()] : []),
    ]);
  }

  private programId(programs?: Program[]) {
    return this.metaplex.programs().getTokenMetadata(programs).address;
  }
}

type MintAddressPdaInput = {
  /** The address of the mint account. */
  mint: PublicKey;

  /** An optional set of programs that override the registered ones. */
  programs?: Program[];
};

type DelegateRecordPdaInput = {
  /** The address of the NFT's mint account. */
  mint: PublicKey;
  /** The role of the delegate authority. */
  type: DelegateType;
  /**
   * Depending on the role, this should either be
   * the update authority or the token owner.
   * This ensures that changing ownership or authority on
   * an assets, disable any previous delegate authorities.
   */
  namespace: PublicKey;
  /**
   * The address of delegate authority. Depending on the role,
   * this can be omitted as the delegate authority will be stored
   * inside the PDA account instead of being part of the PDA seeds.
   * This pattern enables us to have "unique" delegates for some roles
   * and "multiple" delegates for other roles.
   */
  delegate?: PublicKey;
  /** An optional set of programs that override the registered ones. */
  programs?: Program[];
};
