import { CreateCandyGuardInput, Metaplex } from '@/index';

export const createCandyGuard = async (
  metaplex: Metaplex,
  input: CreateCandyGuardInput
) => {
  const { candyGuard } = await metaplex.candyGuards().create(input).run();
  return candyGuard;
};
