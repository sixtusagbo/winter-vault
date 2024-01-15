import tokenABI from '../abi/erc20abi.json';
import stormStakeABI from '../abi/stormStakeABI.json';
import holderBonusABI from '../abi/holderBonusABI.json';
import { ethers } from 'ethers';
import { stormStakeAddr, holderBonusAddr } from './ConstantsUtil';

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


export async function connectWallet(walletProvider) {
  const provider = new ethers.providers.Web3Provider(walletProvider);
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

  return { signer, stormStakeContract, holderContract };
}

export const fetchTokenBalance = async (signer, tokenAddress, userWalletAddress) => {
  const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
  const poolBalance = await tokenContract.balanceOf(stormStakeAddr);
  const pool = await convertToEth(null, poolBalance);
  const userBalance = await tokenContract.balanceOf(userWalletAddress);
  const user = await convertToEth(null, userBalance);

  return { pool, user };
};

export const getPoolDetails = async (walletProvider, address) => {
  const { signer, stormStakeContract } = await connectWallet(walletProvider);
  const poolInfo = await stormStakeContract?.poolInfo(0);
  const poolId = 0;
  const tokenAddress = poolInfo[poolId];
  const rewardPerToken = poolInfo[3].toString();
  const tokenBalances = await fetchTokenBalance(
    signer,
    tokenAddress,
    address
  );
  const userStakedArray = await stormStakeContract?.userInfo(
    poolId,
    address
  );
  const userRewardRaw = (
    await stormStakeContract?.pendingReward(poolId, address)
  ).toString();
  const bonusMultiplier = (
    await stormStakeContract?.BONUS_MULTIPLIER()
  ).toString();
  const userReward = Number(await convertToEth('szabo', userRewardRaw)).toFixed(
    '2'
  );
  const userStaked = Number(
    await convertToEth('szabo', userStakedArray['amount'].toString())
  ).toFixed('4');
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

export const action = async (walletProvider, action, amount, tokenAddress) => {
  try {
    const amountToWei = (await convertToWei(amount)).toString();
    const { stormStakeContract, signer } = await connectWallet(walletProvider);
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

export const autoCompound = async (walletProvider) => {
  const { stormStakeContract } = await connectWallet(walletProvider);

  try {
    const result = await stormStakeContract?.autoCompound().then((_) => true);
    return result;
  } catch (err) {
    console.log(err);
  }
};

export const getHolderDetails = async (walletProvider, address) => {
  const { holderContract } = await connectWallet(walletProvider);

  const holderInfo = await holderContract?.getUserView(address);

  const holderStats = {
    tokenBalance: Number(
      await convertToEth(null, holderInfo[0].toString())
    ).toFixed('2'),
    accumulatedPoints: Number(
      await convertToEth('gether', holderInfo[1].toString())
    ).toFixed('2'),
    pendingRewards: Number(
      await convertToEth(null, holderInfo[2].toString())
    ).toFixed('2'),
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
    // This error code indicates that the chain has not been added.
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

export const updateHolderRewards = async (walletProvider, address) => {
  const { holderContract } = await connectWallet(walletProvider);

  return await holderContract
    ?.updatePoints(address)
    .then((_) => true);
};

export const claimHolderRewards = async (walletProvider) => {
  const { holderContract } = await connectWallet(walletProvider);

  return await holderContract?.claim().then((_) => true);
};
