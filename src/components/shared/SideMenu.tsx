"use client";

import { client } from "@/consts/client";
import { useGetENSAvatar } from "@/hooks/useGetENSAvatar";
import { useGetENSName } from "@/hooks/useGetENSName";
import Link from "next/link";
import { useState } from "react";
import { HiMenu, HiX } from "react-icons/hi";
import {
  ConnectButton,
  useActiveAccount,
  useActiveWallet,
  useDisconnect,
} from "thirdweb/react";

export function SideMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { disconnect } = useDisconnect();
  const account = useActiveAccount();
  const { data: ensName } = useGetENSName({ address: account?.address });
  const { data: ensAvatar } = useGetENSAvatar({ ensName });
  const wallet = useActiveWallet();

  return (
    <>
      <button
        className="lg:hidden p-2 text-gray-400 hover:text-white"
        onClick={() => setIsOpen(true)}
      >
        <HiMenu className="w-6 h-6" />
      </button>
      
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-gray-800 shadow-lg transform transition-transform duration-300 z-50 lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-white"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <ConnectButton theme="dark" client={client} />
          </div>
          
          {account && (
            <Link
              href="/profile"
              className="block text-gray-300 hover:text-white hover:no-underline"
              onClick={() => setIsOpen(false)}
            >
              Profile {ensName ? `(${ensName})` : ""}
            </Link>
          )}
        </div>
        
        {account && (
          <div className="absolute bottom-4 left-4 right-4">
            <button
              onClick={() => {
                if (wallet) disconnect(wallet);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
