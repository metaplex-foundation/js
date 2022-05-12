import { amman, SKIP_PREFLIGHT } from '../../../helpers';
import { CandyMachineConfigWithoutStorage } from '@/plugins/candyMachineModule/config';
import { Metaplex } from '@/Metaplex';

/**
 * Creates a candy machine using the mx.identity as signer as well as
 * solTreasurySigner aka wallet.
 */
export async function createCandyMachineWithMinimalConfig(mx: Metaplex) {
  const payer = mx.identity();

  const solTreasurySigner = payer;
  await amman.airdrop(mx.connection, solTreasurySigner.publicKey, 100);

  const config: CandyMachineConfigWithoutStorage = {
    price: 1.0,
    number: 10,
    sellerFeeBasisPoints: 0,
    solTreasuryAccount: solTreasurySigner.publicKey.toBase58(),
    goLiveDate: '25 Dec 2021 00:00:00 GMT',
    retainAuthority: true,
    isMutable: false,
  };

  const opts = { confirmOptions: SKIP_PREFLIGHT };
  await amman.addr.addLabels({ ...config, payer });

  const cm = mx.candyMachines();
  const {
    transactionId,
    confirmResponse,
    candyMachine,
    payerSigner,
    candyMachineSigner,
    authorityAddress,
    walletAddress,
  } = await cm.createFromConfig(config, opts);
  await amman.addr.addLabel('candy-machine', candyMachineSigner.publicKey);
  await amman.addr.addLabel('tx: create candy-machine', transactionId);

  return {
    cm,

    transactionId,
    confirmResponse,
    candyMachine,
    config,

    solTreasurySigner,
    payerSigner,
    candyMachineSigner,
    authorityAddress,
    walletAddress,
  };
}
