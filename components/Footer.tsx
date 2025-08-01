import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">NFT Showcase</h3>
            <p className="text-gray-400 mb-4">
              Discover, collect, and showcase amazing NFTs from talented artists around the world.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                Twitter
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                Discord
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                Instagram
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Marketplace</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-400 hover:text-white">All NFTs</Link></li>
              <li><Link href="/collections" className="text-gray-400 hover:text-white">Collections</Link></li>
              <li><Link href="/artists" className="text-gray-400 hover:text-white">Artists</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link href="/help" className="text-gray-400 hover:text-white">Help Center</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-white">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 NFT Showcase. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
