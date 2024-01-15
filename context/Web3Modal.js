"use client"

import { createWeb3Modal, defaultConfig } from '@web3modal/ethers5/react'

// 1. Get projectId
const projectId = process.env.NEXT_PUBLIC_WC_CLOUD_ID

// 2. Set chains
const arbitrum = {
  chainId: 42161,
  name: 'Arbitrum',
  currency: 'ETH',
  explorerUrl: 'https://arbiscan.io',
  rpcUrl: 'https://arb1.arbitrum.io/rpc'
}

// 3. Create modal
const metadata = {
  name: 'Storm',
  description: 'My Website description',
  url: 'https://mywebsite.com',
  icons: ['https://avatars.mywebsite.com/']
}

createWeb3Modal({
  ethersConfig: defaultConfig({ metadata }),
  chains: [arbitrum],
  themeMode: 'dark',
  tokens: {
    42161: {
      address: '0x47d6DbC99827cB929F274cd62Be2013c76E54a6a',
      // image: 'token_image_url' //optional
    },
  },
  projectId
})

export function Web3ModalProvider({ children }) {
  return children;
}