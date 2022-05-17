import test from 'tape';
import { killStuckProcess, metaplex, spokSamePubkey } from '../../helpers';
import spok from 'spok';
import { createCandyMachineWithMinimalConfig } from './helpers';
import {
  MoreThanOneCandyMachineFoundByAuthorityAndUuidError,
  NoCandyMachineFoundForAuthorityMatchesUuidError,
} from '../../../src';

killStuckProcess();

test('candyMachineGPA: candyMachineByAuthorityAndUuid', async (t) => {
  const mx = await metaplex();
  let firstUuid;
  {
    // Given I create one candy machine with a particular authority
    const { authorityAddress, candyMachine } =
      await createCandyMachineWithMinimalConfig(mx);

    firstUuid = candyMachine.uuid;

    // When I get the candy machines for the authority and uuid
    const cm = await mx
      .candyMachines()
      .findByAuthorityAndUuid(authorityAddress, candyMachine.uuid);

    // It returns that candy machine
    t.ok(cm != null, 'returns candy machine');
    spok(t, cm, {
      $topic: 'candyMachine',
      authorityAddress: spokSamePubkey(authorityAddress),
      uuid: candyMachine.uuid,
    });
  }
  {
    // Given I create another candy machine with the same authority
    const { authorityAddress, walletAddress, candyMachine } =
      await createCandyMachineWithMinimalConfig(mx);

    // When I get the candy machines for the authority and uuid
    const cm = await mx
      .candyMachines()
      .findByAuthorityAndUuid(authorityAddress, candyMachine.uuid);

    // It returns the other candy machine
    t.ok(cm != null, 'returns candy machine');
    spok(t, cm, {
      $topic: 'candyMachine',
      authorityAddress: spokSamePubkey(authorityAddress),
      uuid: candyMachine.uuid,
    });

    // When I then set the uuid of the other candy machine to equal to the first
    t.comment(
      'Updating second candy machine to have the same uuid as the first'
    );
    await mx.candyMachines().update({
      candyMachineAddress: cm.candyMachineAddress,
      walletAddress,
      authoritySigner: mx.identity(),
      uuid: firstUuid,
    });

    // And I get the candy machines for the authority for previuous uuid again
    try {
      t.comment('Getting cany machine for authority and second uuid');
      await mx
        .candyMachines()
        .findByAuthorityAndUuid(authorityAddress, candyMachine.uuid);
      t.fail('should have thrown');
    } catch (err: any) {
      // Then it does not find that candy machine
      t.ok(
        err instanceof NoCandyMachineFoundForAuthorityMatchesUuidError,
        'throws NoCandyMachineFoundForAuthorityMatchesUuidError'
      );
    }

    // And when I get the candy machines for the authority for first uuid again
    try {
      t.comment('Getting cany machine for authority and first uuid');
      await mx
        .candyMachines()
        .findByAuthorityAndUuid(authorityAddress, firstUuid);
      t.fail('should have thrown');
    } catch (err: any) {
      // Then it finds two candy machines and throws
      t.ok(
        err instanceof MoreThanOneCandyMachineFoundByAuthorityAndUuidError,
        'throws MoreThanOneCandyMachineFoundByAuthorityAndUuidError'
      );
    }
  }
});
