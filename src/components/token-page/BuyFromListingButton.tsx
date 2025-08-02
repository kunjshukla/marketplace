import { client } from "@/consts/client";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { useState } from "react";
import {
	type Hex,
	NATIVE_TOKEN_ADDRESS,
	getContract,
	sendAndConfirmTransaction,
	sendTransaction,
	toTokens,
	waitForReceipt,
} from "thirdweb";
import { allowance, approve, decimals } from "thirdweb/extensions/erc20";
import {
	type DirectListing,
	buyFromListing,
} from "thirdweb/extensions/marketplace";
import {
	useActiveWalletChain,
	useSwitchActiveWalletChain,
} from "thirdweb/react";
import type { Account } from "thirdweb/wallets";

type Props = {
	listing: DirectListing;
	account: Account;
};

export default function BuyFromListingButton(props: Props) {
	const { account, listing } = props;
	const { marketplaceContract, refetchAllListings, nftContract } =
		useMarketplaceContext();
	const switchChain = useSwitchActiveWalletChain();
	const activeChain = useActiveWalletChain();
	const [isLoading, setIsLoading] = useState(false);
	
	return (
		<button
			className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
			disabled={isLoading}
			onClick={async () => {
				if (activeChain?.id !== nftContract.chain.id) {
					await switchChain(nftContract.chain);
				}
				setIsLoading(true);
				try {
					if (
						listing.currencyContractAddress.toLowerCase() !==
						NATIVE_TOKEN_ADDRESS.toLowerCase()
					) {
						const customTokenContract = getContract({
							address: listing.currencyContractAddress as Hex,
							client,
							chain: nftContract.chain,
						});
						const result = await allowance({
							contract: customTokenContract,
							owner: account.address,
							spender: marketplaceContract.address as Hex,
						});

						if (result < listing?.pricePerToken) {
							const _decimals = await decimals({
								contract: customTokenContract,
							});
							const transaction = approve({
								contract: customTokenContract,
								spender: marketplaceContract.address as Hex,
								amount: toTokens(listing?.pricePerToken, _decimals),
							});
							await sendAndConfirmTransaction({ transaction, account });
						}
					}

					const transaction = buyFromListing({
						contract: marketplaceContract,
						listingId: listing.id,
						quantity: listing.quantity,
						recipient: account.address,
					});
					console.log(transaction);
					const receipt = await sendTransaction({
						transaction,
						account,
					});
					await waitForReceipt({
						transactionHash: receipt.transactionHash,
						client,
						chain: nftContract.chain,
					});
					alert("Purchase completed! The asset(s) should arrive in your account shortly");
					refetchAllListings();
				} catch (err) {
					console.error(err);
					if ((err as Error).message.startsWith("insufficient funds for gas")) {
						alert(
							`You don't have enough funds for this purchase. Make sure you have enough gas for the transaction + ${listing.currencyValuePerToken.displayValue} ${listing.currencyValuePerToken.symbol}`
						);
					} else {
						alert("An error occurred during the purchase. Please try again.");
					}
				} finally {
					setIsLoading(false);
				}
			}}
		>
			{isLoading ? "Processing..." : "Buy"}
		</button>
	);
}
