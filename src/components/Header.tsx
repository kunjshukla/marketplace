'use client';

import { useState } from 'react';
import { Menu, X, Palette, Heart, User } from 'lucide-react';
// Update the import path if Button is located elsewhere, for example:
import { Button } from '../ui/Button';
// Or, if Button is in the same folder:
 // import { Button } from './Button';
// Or, create the Button component at './ui/Button.tsx' if it does not exist.

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                NFT Showcase
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                Digital Art Gallery
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Gallery
            </a>
            <a href="#collections" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Collections
            </a>
            <a href="#artists" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Artists
            </a>
            <a href="#about" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              About
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Favorites
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Connect
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
            <nav className="flex flex-col space-y-4">
              <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors px-2 py-1">
                Gallery
              </a>
              <a href="#collections" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors px-2 py-1">
                Collections
              </a>
              <a href="#artists" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors px-2 py-1">
                Artists
              </a>
              <a href="#about" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors px-2 py-1">
                About
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="sm" className="justify-start">
                  <Heart className="w-4 h-4 mr-2" />
                  Favorites
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
