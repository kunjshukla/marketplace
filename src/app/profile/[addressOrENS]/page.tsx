"use client";

import { ProfileSection } from "@/components/profile-page/Profile";
import { useResolveENSAddress } from "@/hooks/useResolveENSAddress";
import { notFound } from "next/navigation";
import { isAddress } from "thirdweb/utils";

export default function PublicProfilePage({
  params,
}: {
  params: { addressOrENS: string };
}) {
  const { addressOrENS } = params;
  const isValidEvmAddress = isAddress(addressOrENS);
  const { data: resolvedAddress, isLoading } = useResolveENSAddress({
    text: addressOrENS,
    enabled: !isValidEvmAddress,
  });
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }
  if (!isValidEvmAddress && !resolvedAddress) return notFound();
  const address = isValidEvmAddress ? addressOrENS : resolvedAddress!;
  return <ProfileSection address={address} />;
}
