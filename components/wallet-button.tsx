"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BrowserProvider } from "ethers";
import { Wallet } from "lucide-react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not installed!");
      return;
    }

    setIsLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAddress(accounts[0]);
      localStorage.setItem("walletAddress", accounts[0]);
    } catch {
      alert("Wallet connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  const checkConnection = async () => {
    if (!window.ethereum) return;

    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.listAccounts();

    if (accounts.length > 0) {
      const addr = accounts[0].address;
      setAddress(addr);
      localStorage.setItem("walletAddress", addr);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <Button
      size="sm"
      variant={address ? "outline" : "default"}
      onClick={connectWallet}
      disabled={isLoading}
      className={
        address
          ? "border-border/50 text-foreground hover:bg-secondary bg-transparent"
          : "bg-primary text-primary-foreground hover:bg-primary/90"
      }
    >
      <Wallet className="h-4 w-4 mr-2" />
      {isLoading
        ? "Connecting..."
        : address
        ? truncate(address)
        : "Connect Wallet"}
    </Button>
  );
}
