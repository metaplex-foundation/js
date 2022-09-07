import { CreateCandyGuardInput, Metaplex } from '@/index';

export const createCandyGuard = async (
  metaplex: Metaplex,
  input?: Partial<CreateCandyGuardInput>
) => {
  const { candyGuard } = await metaplex
    .candyGuards()
    .create({ guards: {}, ...input })
    .run();

  return candyGuard;
};
