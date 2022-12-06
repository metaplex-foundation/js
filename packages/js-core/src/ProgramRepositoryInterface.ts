import type { Program } from './Program';

export interface ProgramRepositoryInterface {
  get<T extends Program = Program>(name: string): T;
  get<T extends Program = Program>(address: { toBase58: () => string }): T;
  all(): Program[];
  add(program: Program): void;
}
