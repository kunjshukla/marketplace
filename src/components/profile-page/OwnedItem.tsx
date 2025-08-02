import { client } from "@/consts/client";
import Link from "next/link";
import type { NFT, ThirdwebContract } from "thirdweb";
import { MediaRenderer } from "thirdweb/react";

export function OwnedItem(props: {
  nft: NFT;
  nftCollection: ThirdwebContract;
}) {
  const { nft, nftCollection } = props;
  return (
    <Link
      href={`/collection/${nftCollection.chain.id}/${
        nftCollection.address
      }/token/${nft.id.toString()}`}
      className="block rounded-xl bg-white shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 hover:no-underline max-w-xs"
    >
      <div className="flex flex-col">
        <div className="relative group">
          <MediaRenderer 
            client={client} 
            src={nft.metadata.image}
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
            {nft.metadata?.name ?? "Unknown item"}
          </h3>
        </div>
      </div>
    </Link>
  );
}
