import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ShoppingBag, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { orderOperations } from '../../db';
import { Order } from '../../types';

const OrderList: React.FC = () => {
  const { state } = useAppContext();
  const { user, isAuthenticated } = state;
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    
    // Load user orders
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const userOrders = await orderOperations.getUserOrders(user.id);
        setOrders(userOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, [isAuthenticated, user, navigate]);
  
  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <ShoppingBag className="mr-2" />
          Your Orders
        </h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-4 flex justify-center">
              <Package size={64} className="text-gray-300" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              No orders yet
            </h2>
            <p className="text-gray-600">
              You haven't placed any orders yet. Start shopping to place your first order!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-100 p-4 border-b border-gray-200">
                  <div className="flex flex-wrap justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Order #{order.id.slice(0, 8)}
                      </h2>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center mt-2 sm:mt-0">
                      {order.status === 'pending' ? (
                        <span className="flex items-center text-amber-600">
                          <Clock size={18} className="mr-1" />
                          Pending
                        </span>
                      ) : (
                        <span className="flex items-center text-green-600">
                          <CheckCircle size={18} className="mr-1" />
                          Completed
                        </span>
                      )}
                      
                      <span className="mx-3 text-gray-300">|</span>
                      
                      {order.paymentReceived ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle size={18} className="mr-1" />
                          Payment Received
                        </span>
                      ) : (
                        <span className="flex items-center text-amber-600">
                          <AlertCircle size={18} className="mr-1" />
                          Payment Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Order Items
                  </h3>
                  
                  <div className="divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-4 flex">
                        <div className="flex-shrink-0 w-16 h-16">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        </div>
                        <div className="ml-4 flex-grow">
                          <h4 className="text-md font-medium text-gray-800">
                            {item.product.name}
                          </h4>
                          <div className="flex justify-between items-start mt-1">
                            <div>
                              <p className="text-sm text-gray-600">
                                Qty: {item.quantity} × ₹{item.product.horizonPrice.toFixed(2)}
                              </p>
                            </div>
                            <span className="text-md font-medium text-gray-800">
                              ₹{(item.quantity * item.product.horizonPrice).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-teal-700">₹{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderList;