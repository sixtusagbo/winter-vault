export const stormStakeAddr = '0x08dE56a97387e672B9bD82409DBeBD185D7e71DC';

export const holderBonusAddr = '0x3F82A6cF6aD145Db14A6aA833A5c2dBDCfbD84FC';

export const STM_BUY_URL = '';

const mainnetChainId = 42161;

const testnetChainId = 421614;

export const defaultChainId = testnetChainId;

// Chains
const mainnet = {
  chainId: mainnetChainId,
  name: 'Arbitrum',
  currency: 'ETH',
  explorerUrl: 'https://arbiscan.io',
  rpcUrl: 'https://arb1.arbitrum.io/rpc'
}

const testnet = {
  chainId: testnetChainId,
  name: 'Arbitrum Sepolia',
  currency: 'ETH',
  explorerUrl: 'https://sepolia-explorer.arbitrum.io',
  rpcUrl: 'https://arbitrum-sepolia.blockpi.network/v1/rpc/public'
}

export const defaultNet = testnet;