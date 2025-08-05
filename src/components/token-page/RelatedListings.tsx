import { client } from "@/consts/client";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import Link from "next/link";
import { useState } from "react";
import { MediaRenderer } from "thirdweb/react";

export default function RelatedListings({
	excludedListingId,
}: {
	excludedListingId: bigint;
}) {
	const { nftContract, allValidListings } = useMarketplaceContext();
	const [isOpen, setIsOpen] = useState(false);
	
	const listings = allValidListings?.filter(
		(o) =>
			o.id !== excludedListingId &&
			o.assetContractAddress.toLowerCase() ===
				nftContract.address.toLowerCase(),
	);
	
	if (!listings || !listings.length) return <></>;
	
	return (
		<div className="border border-gray-200 rounded-lg overflow-hidden">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
			>
				<span className="text-left font-medium text-gray-900">More from this collection</span>
				<svg
					className={`w-5 h-5 text-gray-500 transition-transform ${
						isOpen ? "rotate-180" : ""
					}`}
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
				</svg>
			</button>
			
			{isOpen && (
				<div className="p-4 bg-gray-50 border-t border-gray-200">
					<div className="flex overflow-x-auto gap-4 pb-2">
						{listings?.map((item) => (
							<Link
								key={item.id.toString()}
								href={`/collection/${nftContract.chain.id}/${
									nftContract.address
								}/token/${item.asset.id.toString()}`}
								className="block rounded-xl bg-white shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 hover:no-underline min-w-60 flex-shrink-0"
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
											{item.asset.metadata?.name ?? "Unknown item"}
										</h3>
									</div>
								</div>
							</Link>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
