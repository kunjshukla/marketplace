"use client";

import { client } from "@/consts/client";
import { useGetENSAvatar } from "@/hooks/useGetENSAvatar";
import { useGetENSName } from "@/hooks/useGetENSName";
import Link from "next/link";
import { useState } from "react";
import { FiUser, FiChevronDown } from "react-icons/fi";
import {
  ConnectButton,
  useActiveAccount,
  useActiveWallet,
  useDisconnect,
} from "thirdweb/react";
import type { Wallet } from "thirdweb/wallets";
import { SideMenu } from "./SideMenu";

export function Navbar() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  
  return (
    <div className="bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-row justify-between items-center">
          <div className="my-auto">
            <Link href="/" className="hover:no-underline">
              <h1 className="text-2xl lg:text-3xl font-bold text-white">
                NFT Showcase
              </h1>
            </Link>
          </div>
          <div className="hidden lg:flex items-center gap-8">
            {account && wallet ? (
              <ProfileButton address={account.address} wallet={wallet} />
            ) : (
              <ConnectButton
                client={client}
                theme="dark"
                connectButton={{ 
                  style: { 
                    height: "48px",
                    backgroundColor: "#7c3aed",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600"
                  } 
                }}
              />
            )}
          </div>
          <SideMenu />
        </div>
      </div>
    </div>
  );
}

function ProfileButton({
  address,
  wallet,
}: {
  address: string;
  wallet: Wallet;
}) {
  const { disconnect } = useDisconnect();
  const { data: ensName } = useGetENSName({ address });
  const { data: ensAvatar } = useGetENSAvatar({ ensName });
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 h-14 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            {ensAvatar ? (
              <img
                src={ensAvatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <FiUser className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <FiChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-3 border-b border-gray-100">
              <ConnectButton client={client} theme="light" />
            </div>
            <Link
              href="/profile"
              className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:no-underline"
              onClick={() => setIsOpen(false)}
            >
              Profile {ensName ? `(${ensName})` : ""}
            </Link>
            <button
              onClick={() => {
                if (wallet) disconnect(wallet);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
