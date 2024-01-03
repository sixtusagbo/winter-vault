/* eslint-disable @next/next/no-img-element */
import {
  action,
  autoCompound,
  claimHolderRewards,
  getHolderDetails,
  getPoolDetails,
  updateHolderRewards,
} from '@/components/config';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { connectWallet } from '@/components/config';
import { switchChain } from '@/components/config';
import StormCardSkeleton from '@/components/StormCardSkeleton';
import ConfettiExplosion from 'react-confetti-explosion';
import { info } from 'sass';
import numeral from 'numeral';

const CHAIN_ID = 5;

export default function Home() {
  const [poolInfo, setPoolInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [holderInfo, setHolderInfo] = useState({});
  const [infoIntervalId, setInfoIntervalId] = useState(null);
  const [connected, setConnected] = useState(false);
  const [currentChainId, setChainId] = useState(null);
  const [isExploding, setIsExploding] = useState(false);

  const largeConfetti = {
    force: 0.8,
    duration: 3000,
    particleCount: 300,
    width: 1600,
    colors: ['#041E43', '#1471BF', '#5BB4DC', '#FC027B', '#66D805'],
  };

  const connect = async () => {
    if (currentChainId !== CHAIN_ID) {
      const result = await switchChain(CHAIN_ID);
      if (result) {
        localStorage.setItem('currentChainId', CHAIN_ID);
      }
    }
    try {
      const { connection } = await connectWallet();
      if (connection?.account?.address !== undefined) {
        const walletAddress = connection.account.address;
        localStorage.setItem('wallet', walletAddress);
        setConnected(true);
        setChainId(CHAIN_ID);
        setLoading(true);
      }
    } catch (err) {
      // Handle errors, such as user rejecting the connection request
      console.error('Connection request was rejected by the user.', err);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User has disconnected
      localStorage.removeItem('wallet');
      setConnected(false);
    } else {
      setConnected(true);
    }
  };

  const handleChainChanged = (chainId) => {
    const newChainId = Number(chainId.toString());
    setChainId(newChainId);
    localStorage.setItem('currentChainId', newChainId);
    if (newChainId !== CHAIN_ID) {
      disconnect();
    }
  };

  const getInterfaceInfo = async () => {
    const id = setInterval(async () => {
      const fetchData = async () => {
        if (localStorage.getItem('wallet')) {
          try {
            const poolDetails = await getPoolDetails();
            const holderDetails = await getHolderDetails();
            setPoolInfo(poolDetails);
            setHolderInfo(holderDetails);
          } catch (err) {
            console.log(err);
          }
        }
      };

      await fetchData().then((_) => setLoading(false));
    }, 3000);

    setInfoIntervalId(id);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setError('Input is empty');
    } else if (Number(value) > poolInfo.userBalance) {
      setError('Insufficient balance');
    } else {
      setError('');
    }
    setInputValue(value);
  };

  const stake = async (tokenAddress) => {
    const amount = document.querySelector('#stakeAmount').value;
    const result = await action('stake', amount, tokenAddress);
    if (result) {
      const output = 'Stake successful!';
      document.querySelector('#result').innerHTML = output;
    }
  };

  const unstake = async (tokenAddress) => {
    const amount = document.querySelector('#stakeAmount').value;
    const result = await action('unstake', amount, tokenAddress);
    if (result) {
      const output = 'Unstaked successfully!';
      document.querySelector('#result').innerHTML = output;
    }
  };

  const disconnect = async () => {
    localStorage.removeItem('wallet');
    setConnected(false);
    setPoolInfo({});
    setHolderInfo({});
  };

  const updateHolder = async (e) => {
    e.target.disabled = true;

    try {
      await updateHolderRewards();
    } catch (err) {
      console.log(err);
    }

    e.target.disabled = false;
  };

  const claimForHolder = async (e) => {
    e.target.disabled = true;

    try {
      await claimHolderRewards().then((_) => setIsExploding(true));

      setTimeout(() => setIsExploding(false), 3000);
    } catch (err) {
      console.log(err);
    }

    e.target.disabled = false;
  };

  const getFormattedWalletAddress = () => {
    return localStorage.getItem('wallet')
      ? `${localStorage.getItem('wallet').slice(0, 5)}...${localStorage
          .getItem('wallet')
          .slice(-4)}`
      : '0x0...00';
  };

  const formatNumber = (number) => {
    return numeral(number).format('0.0a').toUpperCase();
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener(
          'accountsChanged',
          handleAccountsChanged
        );
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem('wallet')) {
      setChainId(localStorage.getItem('currentChainId') ?? CHAIN_ID);
      setConnected(true);
      getInterfaceInfo();
    } else if (infoIntervalId) {
      clearInterval(infoIntervalId);
    } else {
      setLoading(false);
    }
  }, [currentChainId, connected]);

  return (
    <>
      <Head>
        <title>Stake & Hold Storm</title>
      </Head>

      <div id="wrapper" style={{ marginBottom: '4%' }}>
        {/* Navbar */}

        <div id="menu" className="our_nav">
          <div className="nav_inner">
            <nav className="storm-navbar">
              <div className="d-flex">
                <ul className="logo_container">
                  <li>
                    <div className="font_extrabold text_xl">
                      <Link href="https://winterstorm.finance">
                        <span className="logo">
                          <span className="logo_image">
                            <img src="logo_with_word.svg" alt="" />
                          </span>
                        </span>
                      </Link>
                    </div>
                  </li>
                </ul>
              </div>

              <span className="primary_links">
                <ul className="menu_right">
                  <li>
                    <a href="https://winterstorm.finance/#about">
                      about<span className="fillerTxt"></span>
                    </a>
                  </li>
                  <li>
                    <a href="https://winterstorm.finance/#tokenomics">
                      TOKENOMICS
                    </a>
                  </li>
                  <li>
                    <a href="https://winterstorm.finance/#roadmap">
                      ROAD MAP<span className="fillerTxt"></span>
                    </a>
                  </li>
                  <li>
                    <a href="https://winterstorm.finance/#community">
                      Community
                    </a>
                  </li>
                  <li>
                    <a href="https://docs.winterstorm.finance/" target="_blank">
                      WHITEPAPER
                    </a>
                  </li>
                </ul>
              </span>
            </nav>
            <div className="d-flex justify-content-around">
              <div className="d-flex align-items-center">
                <div className="mi-dropdown">
                  <button
                    className="mi-dropbtn d-flex align-items-center connect-btn"
                    onClick={() => !connected && connect()}>
                    {connected ? (
                      <>{getFormattedWalletAddress()} &nbsp;</>
                    ) : (
                      'Connect Wallet'
                    )}

                    {connected && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="#fff"
                        className="bi bi-chevron-down connectArrow"
                        viewBox="0 0 16 16">
                        <path
                          fillRule="evenodd"
                          d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
                        />
                      </svg>
                    )}
                  </button>

                  {connected && (
                    <div className="mi-dropdown-content">
                      <div className="d-flex justify-content-center align-items-center flex-column">
                        <img
                          className="mini-storm"
                          src="Storm_150x150.png"
                          alt=""
                        />
                        <p>{formatNumber(holderInfo?.tokenBalance)} STM</p>
                      </div>
                      <a
                        href=""
                        className="btn btn-info w-100"
                        style={{ borderRadius: '12px', fontSize: '14px' }}>
                        Buy STM
                      </a>
                      <button
                        className="btn btn-primary w-100"
                        style={{ borderRadius: '12px', fontSize: '14px' }}
                        onClick={disconnect}>
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div id="hamburger">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span>Menu</span>
              </div>
            </div>
          </div>
        </div>
        {/* Page Content */}
        <main className="content">
          <section className="roadmap">
            <div className="roadmap-title">
              <div className="con">
                <div className="desc">
                  <h2 className="pc">Storm Stake</h2>
                  <p className="p">
                    Staking of the people, by the people and for the people.
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <StormCardSkeleton />
            ) : (
              <div className="column d-flex justify-content-center position-relative">
                <div className="storm_main">
                  <div className="storm_title d-flex align-items-center">
                    <img
                      className="mini-storm"
                      src="Storm_150x150.png"
                      alt=""
                    />
                    Stake STM to Earn STM
                  </div>
                  <div className="operate">
                    <div className="stake-info w-100">
                      <div className="d-flex justify-content-between">
                        <p>APY&nbsp;</p>
                        <p className="fw-bold">100% &#126; 400%</p>
                      </div>
                      <div className="d-flex justify-content-between">
                        <p>Available $STM</p>
                        <p className="fw-bold">{poolInfo.userBalance ?? 0}</p>
                      </div>
                      <div className="d-flex justify-content-between">
                        <p>My Stakings</p>
                        <p className="fw-bold">{poolInfo.userStaked ?? 0}</p>
                      </div>
                      <div className="d-flex justify-content-between">
                        <p>Pending Rewards</p>
                        <p className="fw-bold">{poolInfo.reward ?? 0}</p>
                      </div>
                      <div className="d-flex justify-content-between">
                        <p>Multiplier</p>
                        <p className="fw-bold">{poolInfo.multiplier ?? 0}</p>
                      </div>
                      <div className="d-flex justify-content-between">
                        <p>Total Staked</p>
                        <p className="fw-bold">{poolInfo.totalStaked ?? 0}</p>
                      </div>
                    </div>

                    <div className="storm_btns mt-3">
                      <button
                        className="btn btn-primary"
                        data-bs-toggle="modal"
                        data-bs-target="#stateModal">
                        Open Pool
                      </button>
                      <a
                        href=""
                        className="btn btn-outline-primary text-primary"
                        style={{ background: 'transparent' }}>
                        GET STM
                      </a>
                    </div>
                  </div>

                  {/* STM/STM modal */}
                  <div
                    className="modal fade"
                    id="stateModal"
                    tabIndex="-1"
                    aria-labelledby="stateModalLabel"
                    aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered">
                      <div className="modal-content">
                        <div className="modal-header">
                          <div className="modal-title d-flex">
                            <h1 className="fs-5" id="stateModalLabel">
                              Stake <span className="fw-bold">STM</span>
                            </h1>
                            <p className="ms-5" id="result"></p>
                          </div>
                          <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                          <div className="d-flex flex-column">
                            <div className="d-flex">
                              <input
                                type="number"
                                placeholder="0"
                                className={`form-control stake-amount me-2 w-100 ${
                                  error
                                    ? 'text-danger border border-danger'
                                    : ''
                                }`}
                                id="stakeAmount"
                                value={inputValue}
                                onChange={handleInputChange}
                              />
                              <button
                                className="btn btn-secondary"
                                onClick={() =>
                                  setInputValue(poolInfo.userBalance ?? 0)
                                }>
                                MAX
                              </button>
                            </div>
                            {error && (
                              <div className="text-danger">{error}</div>
                            )}

                            <div className="d-flex justify-content-around my-3">
                              <button
                                className="btn btn-primary"
                                onClick={() => stake(poolInfo.tokenAddress)}
                                disabled={!connected}>
                                STAKE
                              </button>
                              <button
                                className="btn btn-primary"
                                onClick={() => unstake(poolInfo.tokenAddress)}
                                disabled={!connected}>
                                UNSTAKE
                              </button>
                            </div>
                            <div className="d-flex justify-content-center mb-1">
                              <button
                                onClick={autoCompound}
                                className="btn btn-success"
                                disabled={!connected}>
                                Auto Compound
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer d-flex justify-content-around text-center">
                          {/* Stake Info */}
                          <div className="d-flex flex-column">
                            <p>Your Stakings</p>
                            <p>{poolInfo.userStaked ?? 0}</p>
                          </div>
                          <div className="d-flex flex-column">
                            <p>Your Earnings</p>
                            <p>{poolInfo.reward ?? 0}</p>
                          </div>
                          <div className="d-flex flex-column">
                            <p>Wallet Balance</p>
                            <p>{poolInfo.userBalance ?? 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="roadmap-title">
              <div className="con">
                <div className="desc">
                  <h2 className="pc" style={{ marginTop: '100px' }}>
                    BLIZZARD REWARDS SYSTEM
                  </h2>
                  <p className="p">Storm Holders reward panel.</p>
                </div>
              </div>
            </div>
            <div className="column d-flex justify-content-center">
              {loading ? (
                <StormCardSkeleton lineCount={4} />
              ) : (
                <div className="storm_main">
                  <div className="storm_title d-flex align-items-center">
                    <img
                      className="mini-storm"
                      src="Storm_150x150.png"
                      alt=""
                    />
                    Hold STM to Earn STM
                  </div>
                  <div className="operate">
                    <div className="stake-info w-100">
                      <div className="d-flex justify-content-between">
                        <p>Accumulated Points</p>
                        <p className="fw-bold">
                          {holderInfo.accumulatedPoints ?? 0} PTS
                        </p>
                      </div>
                      <div className="d-flex justify-content-between">
                        <p>Pending Rewards</p>
                        <p className="fw-bold">
                          {holderInfo.pendingRewards ?? 0} ETH
                        </p>
                      </div>
                      <div className="d-flex justify-content-between">
                        <p>Blocks till next Blizzard</p>
                        <p className="fw-bold">
                          {holderInfo.blocksTillNextBlizzard ?? 0} BLOCKS
                        </p>
                      </div>
                      <div className="d-flex justify-content-between">
                        <p>$STM in Wallet</p>
                        <p className="fw-bold">
                          {holderInfo.tokenBalance ?? 0} STM
                        </p>
                      </div>
                    </div>

                    <div className="storm_btns mt-3">
                      <button
                        className="btn btn-primary"
                        onClick={updateHolder}
                        disabled={!connected}>
                        Update Points
                      </button>
                      <button
                        className="btn btn-outline-primary d-flex justify-content-center align-items-center"
                        onClick={claimForHolder}
                        disabled={!connected}>
                        {isExploding && (
                          <ConfettiExplosion {...largeConfetti} />
                        )}
                        Claim Rewards
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
