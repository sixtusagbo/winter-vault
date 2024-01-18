export const stormStakeAddr = '0xC120Cf83c4426B9567f4dEa9556f5E47000CFC6A';

export const holderBonusAddr = '0x2F1f8d725c90aAEBBfbE575c4BBfE190D9999B4c';

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