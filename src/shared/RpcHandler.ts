import { Connection } from '@solana/web3.js';

export type RpcHandler = {
  // ...
};

export class Web3RpcHandler implements RpcHandler {
  readonly connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }
}
