import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { cartOperations, orderOperations } from '../../db';
import toast from 'react-hot-toast';

const Cart: React.FC = () => {
  const { state, refreshCart } = useAppContext();
  const { user, cart, isAuthenticated } = state;
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
    refreshCart();
  }, [isAuthenticated, navigate, refreshCart]);
  
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      await cartOperations.updateCartItem(itemId, newQuantity);
      await refreshCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };
  
  const removeItem = async (itemId: string) => {
    try {
      await cartOperations.removeCartItem(itemId);
      await refreshCart();
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };
  
  const checkout = async () => {
    if (!user || !cart || cart.items.length === 0) return;
    
    try {
      setIsProcessing(true);
      await orderOperations.createOrder(user.id, cart.items);
      await refreshCart();
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const totalAmount = cart?.items.reduce(
    (sum, item) => sum + (item.product.horizonPrice * item.quantity),
    0
  ) || 0;
  
  const totalMRP = cart?.items.reduce(
    (sum, item) => sum + (item.product.mrp * item.quantity),
    0
  ) || 0;
  
  const totalSavings = totalMRP - totalAmount;
  
  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <ShoppingCart className="mr-2" />
          Your Shopping Cart
        </h1>
        
        {!cart || cart.items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-4 flex justify-center">
              <ShoppingCart size={64} className="text-gray-300" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Looks like you haven't added any products to your cart yet.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
            >
              <ArrowRight size={18} className="mr-2" />
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Cart Items ({cart.items.reduce((count, item) => count + item.quantity, 0)})
                  </h2>
                  
                  <div className="divide-y divide-gray-200">
                    {cart.items.map((item) => (
                      <div key={item.id} className="py-4 flex flex-col sm:flex-row">
                        <div className="flex-shrink-0 w-full sm:w-24 h-24 mb-4 sm:mb-0">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        </div>
                        
                        <div className="flex-grow sm:ml-6 flex flex-col justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-800">
                              {item.product.name}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                              {item.product.details}
                            </p>
                            
                            <div className="flex items-center">
                              <span className="text-lg font-bold text-teal-700">
                                ₹{item.product.horizonPrice.toFixed(2)}
                              </span>
                              {item.product.mrp > item.product.horizonPrice && (
                                <>
                                  <span className="text-sm text-gray-500 line-through ml-2">
                                    ₹{item.product.mrp.toFixed(2)}
                                  </span>
                                  <span className="text-sm text-green-600 ml-2">
                                    Save ₹{(item.product.mrp - item.product.horizonPrice).toFixed(2)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center mt-4">
                            <div className="flex items-center border border-gray-300 rounded-md">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="px-4 py-1 border-x border-gray-300">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            
                            <button
                              onClick={() => removeItem(item.id)}
                              className="flex items-center text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={18} className="mr-1" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Order Summary
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal ({cart.items.length} items)</span>
                    <span className="text-gray-800">₹{totalMRP.toFixed(2)}</span>
                  </div>
                  
                  {totalSavings > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>- ₹{totalSavings.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-3 mt-3"></div>
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-teal-700">₹{totalAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="text-sm text-gray-500 italic">
                    * Cash on delivery only
                  </div>
                  
                  <button
                    onClick={checkout}
                    disabled={isProcessing}
                    className={`w-full mt-6 py-3 ${
                      isProcessing 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-teal-600 hover:bg-teal-700'
                    } text-white rounded-md font-medium transition-colors`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin h-5 w-5 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                        Processing...
                      </span>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;