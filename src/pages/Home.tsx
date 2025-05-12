import React, { useState, useEffect } from 'react';
import { productOperations } from '../db';
import { Product } from '../types';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { Search, ShoppingBag } from 'lucide-react';

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Load all products
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const allProducts = await productOperations.getProducts();
        setProducts(allProducts);
        setFilteredProducts(allProducts);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(allProducts.map(p => p.category))
        ).filter(Boolean) as string[];
        
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    try {
      if (query.trim() === '') {
        // If search is cleared, apply only category filter
        filterByCategory(selectedCategory);
      } else {
        // Search by query and respect category filter
        const results = await productOperations.searchProducts(query);
        
        // Apply category filter if not 'all'
        if (selectedCategory !== 'all') {
          setFilteredProducts(results.filter(product => product.category === selectedCategory));
        } else {
          setFilteredProducts(results);
        }
      }
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };
  
  const filterByCategory = async (category: string) => {
    setSelectedCategory(category);
    
    try {
      // Apply category filter
      if (category !== 'all') {
        setFilteredProducts(products.filter(product => product.category === category));
      } else {
        setFilteredProducts(products);
      }
      
      // Apply search filter if there's a search query
      if (searchQuery.trim() !== '') {
        const searchResults = await productOperations.searchProducts(searchQuery);
        
        // Filter search results by category if category is not 'all'
        if (category !== 'all') {
          setFilteredProducts(searchResults.filter(product => product.category === category));
        } else {
          setFilteredProducts(searchResults);
        }
      }
    } catch (error) {
      console.error('Error filtering products:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSearch={handleSearch} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0 flex items-center">
            <ShoppingBag className="mr-2" /> 
            Horizon Products
          </h1>
          
          {/* Mobile Search (visible only on small screens) */}
          <div className="w-full md:hidden mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="w-full md:w-auto flex overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <button
              onClick={() => filterByCategory('all')}
              className={`px-4 py-2 rounded-md mr-2 whitespace-nowrap transition-colors ${
                selectedCategory === 'all' 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Products
            </button>
            
            {categories.map(category => (
              <button
                key={category}
                onClick={() => filterByCategory(category)}
                className={`px-4 py-2 rounded-md mr-2 whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500">No products found.</p>
            <p className="text-gray-500 mt-2">
              Try changing your search or filter criteria.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;