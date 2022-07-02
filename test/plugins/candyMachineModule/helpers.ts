import { amman } from '../../helpers';
import { Metaplex, CreateCandyMachineInput, sol } from '@/index';

export async function createCandyMachine(
  mx: Metaplex,
  input: Partial<CreateCandyMachineInput>
) {
  const { candyMachine, response } = await mx
    .candyMachines()
    .create({
      price: sol(1),
      sellerFeeBasisPoints: 500,
      itemsAvailable: 100,
      ...input,
    })
    .run();

  await amman.addr.addLabel('candy-machine', candyMachine.address);
  await amman.addr.addLabel('tx: create candy-machine', response.signature);

  return {
    response,
    candyMachine,
  };
}
