"use client";

import { ProfileSection } from "@/components/profile-page/Profile";
import { client } from "@/consts/client";
import { useEffect } from "react";
import { useActiveAccount, useConnectModal } from "thirdweb/react";

export default function ProfilePage() {
  const account = useActiveAccount();
  const { connect } = useConnectModal();
  useEffect(() => {
    if (!account) {
      connect({ client });
    }
  }, [account, connect]);
  if (!account)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <h1 className="text-3xl font-bold text-white">Log in to continue</h1>
      </div>
    );
  return <ProfileSection address={account.address} />;
}
