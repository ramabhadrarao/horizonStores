import React from 'react';
import { Product } from '../types';
import { useAppContext } from '../context/AppContext';
import { ShoppingCart, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  isAdmin?: boolean;
  onEdit?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  isAdmin = false,
  onEdit
}) => {
  const { state, refreshCart } = useAppContext();
  const { cart, isAuthenticated } = state;
  
  const discountPercentage = Math.round(
    ((product.mrp - product.horizonPrice) / product.mrp) * 100
  );
  
  const handleAddToCart = async () => {
    if (!isAuthenticated || !cart) {
      toast.error('You need to be logged in to add items to cart');
      return;
    }
    
    try {
      await import('../db').then(module => {
        const cartOperations = module.cartOperations;
        cartOperations.addToCart(cart.id, product.id, 1);
      });
      
      await refreshCart();
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
        {discountPercentage > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
            {discountPercentage}% OFF
          </span>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {product.details}
        </p>
        
        <div className="flex justify-between items-center mt-3">
          <div>
            <span className="text-lg font-bold text-teal-700">
              ₹{product.horizonPrice.toFixed(2)}
            </span>
            {product.mrp > product.horizonPrice && (
              <span className="text-sm text-gray-500 line-through ml-2">
                ₹{product.mrp.toFixed(2)}
              </span>
            )}
          </div>
          
          {isAdmin ? (
            <button
              onClick={() => onEdit && onEdit(product)}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
            >
              <Edit size={16} />
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={!isAuthenticated || !product.inStock}
              className={`p-2 rounded-full ${
                !isAuthenticated || !product.inStock
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
              title={!isAuthenticated ? 'Login to add to cart' : !product.inStock ? 'Out of stock' : 'Add to cart'}
            >
              <ShoppingCart size={16} />
            </button>
          )}
        </div>
        
        {!product.inStock && (
          <p className="text-red-500 text-sm font-medium mt-2">
            Out of stock
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;