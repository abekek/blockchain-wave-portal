import React, { useEffect, useState } from "react";
import './App.css';
import { ethers } from "ethers";
import abi from "./utils/WavePortal.json";

export default function App() {

  const [allWaves, setAllWaves] = useState([]);
  const [message, setMessage] = useState("Hi!");
  const [currentAccount, setCurrentAccount] = useState("");
  const [countWaves, setCountWaves] = useState(0);
  const [loading, setLoading] = useState(false);
  const contractAddress = "0xC4A9B52b363fe14Ece74D390F7aa7151df9B6bf3";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        await getAllWaves();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();


        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        /*
         * Store our data in React State
         */
        setCountWaves(wavesCleaned.length);
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave(message);
        console.log("Mining...", waveTxn.hash);

        setLoading(true);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        setLoading(false);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        await getAllWaves();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
}

  /*
  * This runs our function when the page loads.
  */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
          { /* eslint-disable-next-line */}
          <span role="img">👋</span> Hey there!
        </div>

        <div className="bio">
          I am <a href="https://github.com/abekek">Alibek</a>! Connect your Ethereum MetaMask (Rinkeby Test Network) wallet and wave at me with any message!
          There is a 30% chance you will win 0.0001 ETH! You can wave once every 2 minutes.
        </div>

        <br></br>

        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {currentAccount && (
          <form>
            <textarea 
              type="text"
              className="input"
              contentEditable={true}
              onChange={(e) => setMessage(e.target.value)}
              suppressContentEditableWarning={true}
              placeholder="Enter your message" 
              size="50" required />
          </form>
        )}

        <button onClick={wave} className="waveButton">
          Wave at Me
        </button>

        {loading && (
          <div className="bio">
            { /* eslint-disable-next-line */}
            <span role="img">⛏️ Mining...</span>
          </div>
        )}

        <div className="bio">Number of waves: {countWaves}</div>

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        }).reverse()}
      </div>
    </div>
  );
}