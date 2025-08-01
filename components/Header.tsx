import React from 'react';
import Link from 'next/link';
import { Button } from './ui/Button';

export function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
              NFT Showcase
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              Home
            </Link>
            <Link href="/collections" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              Collections
            </Link>
            <Link href="/artists" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              Artists
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Button variant="outline">Connect Wallet</Button>
            <Button>Sign In</Button>
          </div>
        </div>
      </div>
    </header>
  );
}
