import { NATIVE_TOKEN_ICON_MAP, Token } from "@/consts/supported_tokens";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { useRef, useState } from "react";
import { NATIVE_TOKEN_ADDRESS, sendAndConfirmTransaction } from "thirdweb";
import {
  isApprovedForAll as isApprovedForAll1155,
  setApprovalForAll as setApprovalForAll1155,
} from "thirdweb/extensions/erc1155";
import {
  isApprovedForAll as isApprovedForAll721,
  setApprovalForAll as setApprovalForAll721,
} from "thirdweb/extensions/erc721";
import { createListing } from "thirdweb/extensions/marketplace";
import {
  useActiveWalletChain,
  useSwitchActiveWalletChain,
} from "thirdweb/react";
import type { Account } from "thirdweb/wallets";

type Props = {
  tokenId: bigint;
  account: Account;
};

export function CreateListing(props: Props) {
  const priceRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const { tokenId, account } = props;
  const switchChain = useSwitchActiveWalletChain();
  const activeChain = useActiveWalletChain();
  const [currency, setCurrency] = useState<Token>();
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    nftContract,
    marketplaceContract,
    refetchAllListings,
    type,
    supportedTokens,
  } = useMarketplaceContext();

  const handleCreateListing = async () => {
    if (!currency) {
      alert("Please select a currency");
      return;
    }
    if (!priceRef.current?.value) {
      alert("Please enter a price");
      return;
    }
    if (activeChain?.id !== nftContract.chain.id) {
      await switchChain(nftContract.chain);
    }
    
    setIsLoading(true);
    try {
      // Check if marketplace is approved
      const isApproved = type === "ERC1155" 
        ? await isApprovedForAll1155({
            contract: nftContract,
            owner: account.address,
            operator: marketplaceContract.address,
          })
        : await isApprovedForAll721({
            contract: nftContract,
            owner: account.address,
            operator: marketplaceContract.address,
          });

      if (!isApproved) {
        const approvalTx = type === "ERC1155"
          ? setApprovalForAll1155({
              contract: nftContract,
              operator: marketplaceContract.address,
              approved: true,
            })
          : setApprovalForAll721({
              contract: nftContract,
              operator: marketplaceContract.address,
              approved: true,
            });
        
        await sendAndConfirmTransaction({
          transaction: approvalTx,
          account,
        });
      }

      // Create the listing
      const listingTx = createListing({
        contract: marketplaceContract,
        assetContractAddress: nftContract.address,
        tokenId,
        quantity: type === "ERC1155" ? BigInt(qtyRef.current?.value || "1") : 1n,
        currencyContractAddress: currency.tokenAddress as `0x${string}`,
        pricePerToken: priceRef.current?.value || "0",
        startTimestamp: new Date(),
        endTimestamp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      await sendAndConfirmTransaction({
        transaction: listingTx,
        account,
      });

      alert("Listing created successfully!");
      refetchAllListings();
      
      // Reset form
      if (priceRef.current) priceRef.current.value = "";
      if (qtyRef.current) qtyRef.current.value = "1";
      setCurrency(undefined);
      
    } catch (error) {
      console.error("Error creating listing:", error);
      alert("Failed to create listing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col w-full max-w-md gap-3">
        {type === "ERC1155" ? (
          <div className="flex flex-row flex-wrap justify-between gap-4">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="number"
                ref={priceRef}
                placeholder="Enter a price"
                step="0.001"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                ref={qtyRef}
                defaultValue={1}
                min="1"
                placeholder="Quantity to sell"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              type="number"
              ref={priceRef}
              placeholder="Enter a price for your listing"
              step="0.001"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
        
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-full min-h-12 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-between"
          >
            {currency ? (
              <div className="flex items-center">
                <img
                  src={currency.icon}
                  alt={currency.symbol}
                  className="w-8 h-8 rounded-full mr-3"
                />
                <span>{currency.symbol}</span>
              </div>
            ) : (
              <span className="text-gray-500">Select currency</span>
            )}
            <svg className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {supportedTokens.map((token) => (
                  <button
                    key={token.tokenAddress}
                    onClick={() => {
                      setCurrency(token);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center first:rounded-t-lg last:rounded-b-lg"
                  >
                    <img
                      src={token.icon}
                      alt={token.symbol}
                      className="w-6 h-6 rounded-full mr-3"
                    />
                    <span>{token.symbol}</span>
                    {currency?.tokenAddress === token.tokenAddress && (
                      <svg className="w-4 h-4 ml-auto text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          disabled={isLoading || !currency}
          onClick={handleCreateListing}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Creating Listing..." : "Create Listing"}
        </button>
      </div>
    </div>
  );
}
