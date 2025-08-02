import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";
import { Navbar } from "@/components/shared/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "NFT Showcase Platform",
	description: "Discover and showcase amazing NFT collections",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="dark">
			<body className={`${inter.className} bg-gray-900 text-white`}>
				<Providers>
					<Navbar />
					<main className="min-h-screen bg-gray-900">{children}</main>
				</Providers>
			</body>
		</html>
	);
}