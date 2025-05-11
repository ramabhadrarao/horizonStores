import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';

interface NavbarProps {
  onSearch?: (query: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch }) => {
  const { state, logout } = useAppContext();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const { isAuthenticated, isAdmin, cart } = state;
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };
  
  const cartItemCount = cart?.items.reduce((count, item) => count + item.quantity, 0) || 0;
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  return (
    <nav className="bg-teal-700 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-2xl font-bold"
          >
            <ShoppingCart size={28} />
            <span>Horizon Stores</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Search Bar */}
            {!isAdmin && onSearch && (
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="py-2 px-4 pr-10 rounded-full bg-teal-600 text-white placeholder-teal-200 focus:outline-none focus:ring-2 focus:ring-white w-64"
                />
                <button 
                  type="submit" 
                  className="absolute right-3 top-2.5 text-teal-200 hover:text-white"
                >
                  <Search size={18} />
                </button>
              </form>
            )}
            
            {/* Menu Links */}
            <div className="flex items-center space-x-4">
              <Link to="/" className="hover:text-teal-200 transition-colors">
                Home
              </Link>
              
              {isAuthenticated ? (
                <>
                  {isAdmin ? (
                    <>
                      <Link to="/admin/products" className="hover:text-teal-200 transition-colors">
                        Products
                      </Link>
                      <Link to="/admin/orders" className="hover:text-teal-200 transition-colors">
                        Orders
                      </Link>
                      <Link to="/admin/reports" className="hover:text-teal-200 transition-colors">
                        Reports
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/orders" className="hover:text-teal-200 transition-colors">
                        My Orders
                      </Link>
                      <Link to="/cart" className="relative hover:text-teal-200 transition-colors">
                        <ShoppingCart size={20} />
                        {cartItemCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {cartItemCount}
                          </span>
                        )}
                      </Link>
                    </>
                  )}
                  
                  <button
                    onClick={logout}
                    className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="flex items-center space-x-1 hover:text-teal-200 transition-colors"
                  >
                    <User size={18} />
                    <span>Login</span>
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-4 py-1.5 bg-white text-teal-700 hover:bg-teal-100 rounded-md transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <button className="md:hidden" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 bg-teal-800 rounded-lg p-4 space-y-3">
            {!isAdmin && onSearch && (
              <form onSubmit={handleSearch} className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="py-2 px-4 pr-10 rounded-full bg-teal-700 text-white placeholder-teal-200 focus:outline-none focus:ring-2 focus:ring-white w-full"
                />
                <button 
                  type="submit" 
                  className="absolute right-3 top-2.5 text-teal-200 hover:text-white"
                >
                  <Search size={18} />
                </button>
              </form>
            )}
            
            <Link 
              to="/" 
              className="block py-2 hover:bg-teal-700 px-3 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <>
                    <Link 
                      to="/admin/products" 
                      className="block py-2 hover:bg-teal-700 px-3 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Products
                    </Link>
                    <Link 
                      to="/admin/orders" 
                      className="block py-2 hover:bg-teal-700 px-3 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Orders
                    </Link>
                    <Link 
                      to="/admin/reports" 
                      className="block py-2 hover:bg-teal-700 px-3 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Reports
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/orders" 
                      className="block py-2 hover:bg-teal-700 px-3 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    <Link 
                      to="/cart" 
                      className="block py-2 hover:bg-teal-700 px-3 rounded-md flex items-center justify-between"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>Cart</span>
                      {cartItemCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {cartItemCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                    navigate('/');
                  }}
                  className="block w-full text-left py-2 px-3 bg-teal-900 hover:bg-teal-950 rounded-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block py-2 hover:bg-teal-700 px-3 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block py-2 bg-white text-teal-700 hover:bg-teal-100 px-3 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;