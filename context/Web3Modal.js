"use client"

import { defaultChainId, defaultNet } from '@/utils/ConstantsUtil'
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers5/react'

// Get projectId
const projectId = process.env.NEXT_PUBLIC_WC_CLOUD_ID

// Create modal
const metadata = {
  name: 'Winter Storm',
  description: 'Winter is Here',
  url: 'https://vault.winterstorm.finance',
  icons: ['https://raw.githubusercontent.com/Coded-Bro/Winter-Storm/main/storm_logo.png']
}

createWeb3Modal({
  ethersConfig: defaultConfig({ metadata }),
  chains: [defaultNet],
  themeMode: 'dark',
  tokens: {
    [defaultChainId]: {
      address: '0x47d6DbC99827cB929F274cd62Be2013c76E54a6a',
      image: 'https://raw.githubusercontent.com/Coded-Bro/Winter-Storm/main/storm_logo.png' //optional
    },
  },
  projectId
})

export function Web3ModalProvider({ children }) {
  return children;
}