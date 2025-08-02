"use client";

import { client } from "@/consts/client";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import Link from "next/link";
import { useState } from "react";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { getNFTs as getNFTs1155 } from "thirdweb/extensions/erc1155";
import { getNFTs as getNFTs721 } from "thirdweb/extensions/erc721";
import { MediaRenderer, useReadContract } from "thirdweb/react";

export function AllNftsGrid() {
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const { nftContract, type, supplyInfo } = useMarketplaceContext();
  const startTokenId = supplyInfo?.startTokenId ?? 0n;
  const totalItems: bigint = supplyInfo
    ? supplyInfo.endTokenId - supplyInfo.startTokenId + 1n
    : 0n;
  const numberOfPages: number = Number(
    (totalItems + BigInt(itemsPerPage) - 1n) / BigInt(itemsPerPage)
  );
  const pages: { start: number; count: number }[] = [];

  for (let i = 0; i < numberOfPages; i++) {
    const currentStartTokenId = startTokenId + BigInt(i * itemsPerPage);
    const remainingItems = totalItems - BigInt(i * itemsPerPage);
    const count =
      remainingItems < BigInt(itemsPerPage)
        ? Number(remainingItems)
        : itemsPerPage;
    pages.push({ start: Number(currentStartTokenId), count: count });
  }
  const { data: allNFTs } = useReadContract(
    type === "ERC1155" ? getNFTs1155 : getNFTs721,
    {
      contract: nftContract,
      start: pages[currentPageIndex].start,
      count: pages[currentPageIndex].count,
    }
  );
  const len = allNFTs?.length ?? 0;

  console.log({ pages, currentPageIndex, length: pages.length });
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 mx-auto mt-5">
        {allNFTs && allNFTs.length > 0 ? (
          allNFTs.map((item) => (
            <Link
              key={item.id.toString()}
              href={`/collection/${nftContract.chain.id}/${nftContract.address}/token/${item.id.toString()}`}
              className="block rounded-xl bg-white shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 hover:no-underline"
            >
              <div className="flex flex-col">
                <div className="relative group">
                  <MediaRenderer 
                    client={client} 
                    src={item.metadata.image}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover"
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300" />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.metadata?.name ?? "Unknown item"}
                  </h3>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="mx-auto col-span-full text-center py-8 text-gray-500">
            Loading...
          </div>
        )}
      </div>
      <div className="mx-auto max-w-xs sm:max-w-md lg:max-w-2xl mt-5 px-2 py-1 overflow-x-auto">
        <div className="flex flex-row justify-center items-center gap-3">
          <button
            onClick={() => setCurrentPageIndex(0)}
            disabled={currentPageIndex === 0}
            className="p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <MdKeyboardDoubleArrowLeft className="w-4 h-4" />
          </button>
          <button
            disabled={currentPageIndex === 0}
            onClick={() => setCurrentPageIndex(currentPageIndex - 1)}
            className="p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <RiArrowLeftSLine className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 whitespace-nowrap">
            Page {currentPageIndex + 1} of {pages.length}
          </span>
          <button
            disabled={currentPageIndex === pages.length - 1}
            onClick={() => setCurrentPageIndex(currentPageIndex + 1)}
            className="p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <RiArrowRightSLine className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPageIndex(pages.length - 1)}
            disabled={currentPageIndex === pages.length - 1}
            className="p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <MdKeyboardDoubleArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
