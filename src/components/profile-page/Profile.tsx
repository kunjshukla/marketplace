import { blo } from "blo";
import { shortenAddress } from "thirdweb/utils";
import type { Account } from "thirdweb/wallets";
import { ProfileMenu } from "./Menu";
import { useState } from "react";
import { NFT_CONTRACTS, type NftContract } from "@/consts/nft_contracts";
import {
  MediaRenderer,
  useActiveAccount,
  useReadContract,
} from "thirdweb/react";
import { getContract, toEther } from "thirdweb";
import { client } from "@/consts/client";
import { getOwnedERC721s } from "@/extensions/getOwnedERC721s";
import { OwnedItem } from "./OwnedItem";
import { getAllValidListings } from "thirdweb/extensions/marketplace";
import { MARKETPLACE_CONTRACTS } from "@/consts/marketplace_contract";
import Link from "next/link";
import { getOwnedERC1155s } from "@/extensions/getOwnedERC1155s";
import { useGetENSAvatar } from "@/hooks/useGetENSAvatar";
import { useGetENSName } from "@/hooks/useGetENSName";

type Props = {
  address: string;
};

export function ProfileSection(props: Props) {
  const { address } = props;
  const account = useActiveAccount();
  const isYou = address.toLowerCase() === account?.address.toLowerCase();
  const { data: ensName } = useGetENSName({ address });
  const { data: ensAvatar } = useGetENSAvatar({ ensName });
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [selectedCollection, setSelectedCollection] = useState<NftContract>(
    NFT_CONTRACTS[0]
  );
  const contract = getContract({
    address: selectedCollection.address,
    chain: selectedCollection.chain,
    client,
  });

  const {
    data,
    error,
    isLoading: isLoadingOwnedNFTs,
  } = useReadContract(
    selectedCollection.type === "ERC1155" ? getOwnedERC1155s : getOwnedERC721s,
    {
      contract,
      owner: address,
      requestPerSec: 50,
      queryOptions: {
        enabled: !!address,
      },
    }
  );

  const chain = contract.chain;
  const marketplaceContractAddress = MARKETPLACE_CONTRACTS.find(
    (o) => o.chain.id === chain.id
  )?.address;
  if (!marketplaceContractAddress) throw Error("No marketplace contract found");
  const marketplaceContract = getContract({
    address: marketplaceContractAddress,
    chain,
    client,
  });
  const { data: allValidListings, isLoading: isLoadingValidListings } =
    useReadContract(getAllValidListings, {
      contract: marketplaceContract,
      queryOptions: { enabled: data && data.length > 0 },
    });
  const listings = allValidListings?.length
    ? allValidListings.filter(
        (item) =>
          item.assetContractAddress.toLowerCase() ===
            contract.address.toLowerCase() &&
          item.creatorAddress.toLowerCase() === address.toLowerCase()
      )
    : [];
  
  return (
    <div className="px-5 lg:px-12">
      <div className="flex flex-col lg:flex-row gap-5">
        <img
          src={ensAvatar ?? blo(address as `0x${string}`)}
          className="w-24 lg:w-36 rounded-lg"
          alt="Profile"
        />
        <div className="my-auto">
          <h1 className="text-2xl font-bold text-gray-900">{ensName ?? "Unnamed"}</h1>
          <p className="text-gray-500">{shortenAddress(address)}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 mt-5">
        <ProfileMenu
          selectedCollection={selectedCollection}
          setSelectedCollection={setSelectedCollection}
        />
        {isLoadingOwnedNFTs ? (
          <div>
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="flex-1">
            <div className="flex flex-row justify-between px-3 mb-4">
              <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setTabIndex(0)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    tabIndex === 0
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Owned ({data?.length})
                </button>
                <button
                  onClick={() => setTabIndex(1)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    tabIndex === 1
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Listings ({listings.length || 0})
                </button>
              </div>
              <Link
                href={`/collection/${selectedCollection.chain.id}/${selectedCollection.address}`}
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
              >
                View collection 
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                  <path d="M5 5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-2a1 1 0 10-2 0v2H5V7h2a1 1 0 000-2H5z"></path>
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {tabIndex === 0 ? (
                <>
                  {data && data.length > 0 ? (
                    <>
                      {data?.map((item) => (
                        <OwnedItem
                          key={item.id.toString()}
                          nftCollection={contract}
                          nft={item}
                        />
                      ))}
                    </>
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500">
                        {isYou
                          ? "You"
                          : ensName
                          ? ensName
                          : shortenAddress(address)}{" "}
                        {isYou ? "do" : "does"} not own any NFT in this
                        collection
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {listings && listings.length > 0 ? (
                    <>
                      {listings?.map((item) => (
                        <Link
                          key={item.id.toString()}
                          href={`/collection/${contract.chain.id}/${
                            contract.address
                          }/token/${item.asset.id.toString()}`}
                          className="block rounded-xl bg-white shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 hover:no-underline max-w-xs"
                        >
                          <div className="flex flex-col">
                            <div className="relative group">
                              <MediaRenderer
                                client={client}
                                src={item.asset.metadata.image}
                                style={{
                                  width: "100%",
                                  height: "200px",
                                  objectFit: "cover"
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300" />
                            </div>
                            <div className="p-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {item.asset?.metadata?.name ?? "Unknown item"}
                              </h3>
                              <p className="text-sm text-gray-500 mb-1">Price</p>
                              <p className="text-lg font-bold text-blue-600">
                                {toEther(item.pricePerToken)}{" "}
                                {item.currencyValuePerToken.symbol}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </>
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500">
                        You do not have any listing with this collection
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
