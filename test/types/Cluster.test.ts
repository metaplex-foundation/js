import { clusterApiUrl } from '@solana/web3.js';
import test, { Test } from 'tape';
import { Cluster, resolveClusterFromEndpoint } from '@/index';

const assertCluster = (t: Test, endpoint: string, expected: Cluster) => {
  t.equal(resolveClusterFromEndpoint(endpoint), expected);
};

test('[Cluster] it can be resolved from the connection', async (t: Test) => {
  // It can resolve the mainnet cluster.
  assertCluster(t, clusterApiUrl('mainnet-beta'), 'mainnet-beta');
  assertCluster(t, 'https://api.mainnet-beta.solana.com', 'mainnet-beta');
  assertCluster(t, 'https://api.mainnet-beta.solana.com/', 'mainnet-beta');
  assertCluster(
    t,
    'https://api.mainnet-beta.solana.com?foo=bar',
    'mainnet-beta'
  );
  assertCluster(t, 'http://api.mainnet-beta.solana.com', 'mainnet-beta');
  assertCluster(t, 'http://api.mainnet-beta.solana.com/', 'mainnet-beta');
  assertCluster(t, 'https://ssc-dao.genesysgo.net', 'mainnet-beta');
  assertCluster(t, 'http://mainnet.solana.com/', 'custom');

  // It can resolve the devnet cluster.
  assertCluster(t, clusterApiUrl('devnet'), 'devnet');
  assertCluster(t, 'https://api.devnet.solana.com', 'devnet');
  assertCluster(t, 'https://api.devnet.solana.com/', 'devnet');
  assertCluster(t, 'https://api.devnet.solana.com?foo=bar', 'devnet');
  assertCluster(t, 'http://api.devnet.solana.com', 'devnet');
  assertCluster(t, 'http://api.devnet.solana.com/', 'devnet');
  assertCluster(
    t,
    'https://psytrbhymqlkfrhudd.dev.genesysgo.net:8899',
    'devnet'
  );
  assertCluster(t, 'http://devnet.solana.com/', 'custom');

  // It can resolve the testnet cluster.
  assertCluster(t, clusterApiUrl('testnet'), 'testnet');
  assertCluster(t, 'https://api.testnet.solana.com', 'testnet');
  assertCluster(t, 'https://api.testnet.solana.com/', 'testnet');
  assertCluster(t, 'https://api.testnet.solana.com?foo=bar', 'testnet');
  assertCluster(t, 'http://api.testnet.solana.com', 'testnet');
  assertCluster(t, 'http://api.testnet.solana.com/', 'testnet');
  assertCluster(t, 'http://testnet.solana.com/', 'custom');

  // It can resolve local clusters.
  assertCluster(t, 'http://localhost', 'localnet');
  assertCluster(t, 'http://localhost:8899', 'localnet');
  assertCluster(t, 'https://localhost:8899', 'localnet');
  assertCluster(t, 'https://localhost:8899/', 'localnet');
  assertCluster(t, 'https://localhost:8899?foo=bar', 'localnet');
  assertCluster(t, 'https://localhost:1234?foo=bar', 'localnet');
  assertCluster(t, 'http://127.0.0.1', 'localnet');
  assertCluster(t, 'http://127.0.0.1:8899', 'localnet');
  assertCluster(t, 'https://127.0.0.1:8899', 'localnet');
  assertCluster(t, 'https://127.0.0.1:8899/', 'localnet');
  assertCluster(t, 'https://127.0.0.1:8899?foo=bar', 'localnet');
  assertCluster(t, 'https://127.0.0.1:1234?foo=bar', 'localnet');
  assertCluster(t, 'https://123.45.67.89', 'custom');
});
