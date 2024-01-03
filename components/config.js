import { createWalletClient, custom } from 'viem';
import { goerli } from 'viem/chains';
import tokenABI from './erc20abi.json';
import stormStakeABI from './stormStakeABI.json';
import holderBonusABI from './holderBonusABI.json';
import { ethers } from 'ethers';

const stormStakeAddr = '0xC120Cf83c4426B9567f4dEa9556f5E47000CFC6A';

const holderBonusAddr = '0x2F1f8d725c90aAEBBfbE575c4BBfE190D9999B4c';

const web3Provider = async () => {
  const [account] = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  const client = createWalletClient({
    account,
    chain: goerli,
    transport: custom(window.ethereum),
  });

  return client;
};

const convertToEth = async (type, value) => {
  switch (type) {
    case 'szabo':
      // Covert Szabo to ether
      return Number(ethers.utils.formatEther(value)).toFixed(8);
    case 'gether':
      // Convert from wei to gether
      return Number(ethers.utils.formatUnits(value, 27)).toFixed(2);
    default:
      // Convert from Wei to ether
      return Number(ethers.utils.formatEther(value));
  }
};

const convertToWei = async (value) => {
  return ethers.utils.parseEther(value);
};

export async function connectWallet() {
  const connection = await web3Provider();
  const provider = new ethers.providers.Web3Provider(connection);
  const signer = provider.getSigner();
  const stormStakeContract = new ethers.Contract(
    stormStakeAddr,
    stormStakeABI,
    signer
  );
  const holderContract = new ethers.Contract(
    holderBonusAddr,
    holderBonusABI,
    signer
  );

  return { connection, signer, stormStakeContract, holderContract };
}

export const fetchTokenBalance = async (tokenAddress, userWalletAddress) => {
  const { signer } = await connectWallet();
  const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
  const poolBalance = await tokenContract.balanceOf(stormStakeAddr);
  const pool = await convertToEth(null, poolBalance);
  const userBalance = await tokenContract.balanceOf(userWalletAddress);
  const user = await convertToEth(null, userBalance);

  return { pool, user };
};

export const getPoolDetails = async () => {
  const { connection, stormStakeContract } = await connectWallet();
  const userWalletAddress = connection?.account?.address;
  const poolInfo = await stormStakeContract?.poolInfo(0);
  const poolId = 0;
  const tokenAddress = poolInfo[poolId];
  const rewardPerToken = poolInfo[3].toString();
  const tokenBalances = await fetchTokenBalance(
    tokenAddress,
    userWalletAddress
  );
  const userStakedArray = await stormStakeContract?.userInfo(
    poolId,
    userWalletAddress
  );
  const userRewardRaw = (
    await stormStakeContract?.pendingReward(poolId, userWalletAddress)
  ).toString();
  const bonusMultiplier = (
    await stormStakeContract?.BONUS_MULTIPLIER()
  ).toString();
  const userReward = Number(await convertToEth('szabo', userRewardRaw)).toFixed(
    '2'
  );
  const userStaked = Number(
    await convertToEth('szabo', userStakedArray['amount'].toString())
  );
  const totalStaked = tokenBalances.pool.toFixed('2');

  const poolStats = {
    totalStaked,
    userStaked: userStaked,
    reward: userReward,
    multiplier: bonusMultiplier,
    userBalance: tokenBalances.user.toFixed('2'),
    tokenAddress: tokenAddress,
  };

  return poolStats;
};

export const action = async (action, amount, tokenAddress) => {
  try {
    const amountToWei = (await convertToWei(amount)).toString();
    const { stormStakeContract, signer } = await connectWallet();
    if (action === 'unstake') {
      const result = await stormStakeContract
        ?.unstake(0, amountToWei)
        .then((_) => true);
      return result;
    } else {
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
      const approveTransfer = await tokenContract.approve(
        stormStakeAddr,
        amountToWei
      );
      const waitApproval = approveTransfer.wait();
      if (waitApproval) {
        const result = await stormStakeContract
          ?.stake(0, amountToWei)
          .then((_) => true);
        return result;
      }
    }
  } catch (err) {
    console.log(err);
  }
};

export const autoCompound = async () => {
  const { stormStakeContract } = await connectWallet();

  try {
    const result = await stormStakeContract?.autoCompound().then((_) => true);
    return result;
  } catch (err) {
    console.log(err);
  }
};

export const getHolderDetails = async () => {
  const { connection, holderContract } = await connectWallet();
  const userWalletAddress = connection?.account?.address;

  const holderInfo = await holderContract?.getUserView(userWalletAddress);

  const holderStats = {
    tokenBalance: Number(
      await convertToEth(null, holderInfo[0].toString())
    ).toFixed('2'),
    accumulatedPoints: Number(
      await convertToEth('gether', holderInfo[1].toString())
    ).toFixed('2'),
    pendingRewards: Number(
      await convertToEth(null, holderInfo[2].toString())
    ).toFixed('4'),
    blocksTillNextBlizzard: Number(holderInfo[3].toString()),
  };

  return holderStats;
};

export const switchChain = async (targetChainId) => {
  let result = false;

  try {
    await window.ethereum
      .request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      })
      .then(() => (result = true));

    return result;
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await window.ethereum
          .request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${targetChainId.toString(16)}`,
              },
            ],
          })
          .then(() => (result = true));

        return result;
      } catch (addError) {
        console.log(addError);

        return result;
      }
    } else {
      return result;
    }
  }
};

export const updateHolderRewards = async () => {
  const { connection, holderContract } = await connectWallet();
  const userWalletAddress = connection?.account?.address;

  return await holderContract
    ?.updatePoints(userWalletAddress)
    .then((_) => true);
};

export const claimHolderRewards = async () => {
  const { holderContract } = await connectWallet();

  return await holderContract?.claim().then((_) => true);
};
