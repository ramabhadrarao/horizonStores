import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ClipboardList, CheckCircle, Clock, DollarSign, X } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { orderOperations } from '../../db';
import { Order } from '../../types';
import toast from 'react-hot-toast';

const OrderManager: React.FC = () => {
  const { state } = useAppContext();
  const { isAuthenticated, isAdmin } = state;
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
      return;
    }
    
    loadOrders();
  }, [isAuthenticated, isAdmin, navigate]);
  
  const loadOrders = () => {
    const allOrders = orderOperations.getOrders();
    setOrders(allOrders);
    setIsLoading(false);
  };
  
  const handleStatusChange = (orderId: string, status: 'pending' | 'completed') => {
    try {
      orderOperations.updateOrderStatus(orderId, status);
      loadOrders();
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
      
      toast.success(`Order status updated to ${status}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };
  
  const handlePaymentChange = (orderId: string, received: boolean) => {
    try {
      orderOperations.updatePaymentStatus(orderId, received);
      loadOrders();
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, paymentReceived: received });
      }
      
      toast.success(`Payment status updated to ${received ? 'received' : 'pending'}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };
  
  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };
  
  if (!isAuthenticated || !isAdmin) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <ClipboardList className="mr-2" />
          Order Management
        </h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500">No orders found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div>{order.user.name}</div>
                        <div className="text-xs text-gray-500">{order.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-teal-700">
                        ₹{order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.status === 'pending' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.paymentReceived ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Received
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => viewOrderDetails(order)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View
                          </button>
                          <span className="text-gray-300">|</span>
                          {order.status === 'pending' ? (
                            <button
                              onClick={() => handleStatusChange(order.id, 'completed')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Complete
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(order.id, 'pending')}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              Reopen
                            </button>
                          )}
                          <span className="text-gray-300">|</span>
                          {order.paymentReceived ? (
                            <button
                              onClick={() => handlePaymentChange(order.id, false)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Mark Unpaid
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePaymentChange(order.id, true)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-teal-700 text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
                <h3 className="text-xl font-semibold">
                  Order Details #{selectedOrder.id.slice(0, 8)}
                </h3>
                <button 
                  onClick={() => setShowOrderDetails(false)}
                  className="text-white hover:text-teal-200"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      Customer Information
                    </h4>
                    <p><span className="font-medium">Name:</span> {selectedOrder.user.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedOrder.user.email}</p>
                    <p><span className="font-medium">Phone:</span> {selectedOrder.user.mobile}</p>
                    <p><span className="font-medium">Address:</span> {selectedOrder.user.address}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      Order Information
                    </h4>
                    <p>
                      <span className="font-medium">Date:</span> {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                    <p className="flex items-center">
                      <span className="font-medium mr-2">Status:</span>
                      {selectedOrder.status === 'pending' ? (
                        <span className="flex items-center text-yellow-600">
                          <Clock size={16} className="mr-1" />
                          Pending
                        </span>
                      ) : (
                        <span className="flex items-center text-green-600">
                          <CheckCircle size={16} className="mr-1" />
                          Completed
                        </span>
                      )}
                    </p>
                    <p className="flex items-center">
                      <span className="font-medium mr-2">Payment:</span>
                      {selectedOrder.paymentReceived ? (
                        <span className="flex items-center text-green-600">
                          <DollarSign size={16} className="mr-1" />
                          Received
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <DollarSign size={16} className="mr-1" />
                          Pending
                        </span>
                      )}
                    </p>
                    <p><span className="font-medium">Total:</span> ₹{selectedOrder.total.toFixed(2)}</p>
                  </div>
                </div>
                
                <h4 className="text-lg font-semibold text-gray-800 mb-4 border-t border-gray-200 pt-4">
                  Order Items
                </h4>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img 
                                  className="h-10 w-10 rounded-full object-cover" 
                                  src={item.product.imageUrl} 
                                  alt={item.product.name} 
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.product.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            ₹{item.product.horizonPrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{(item.quantity * item.product.horizonPrice).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="px-6 py-4 text-right font-bold text-gray-900">
                          Total:
                        </td>
                        <td className="px-6 py-4 font-bold text-teal-700">
                          ₹{selectedOrder.total.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                <div className="flex justify-end mt-6 space-x-3">
                  <button
                    onClick={() => handlePaymentChange(
                      selectedOrder.id, 
                      !selectedOrder.paymentReceived
                    )}
                    className={`px-4 py-2 rounded-md text-white ${
                      selectedOrder.paymentReceived 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {selectedOrder.paymentReceived ? 'Mark as Unpaid' : 'Mark as Paid'}
                  </button>
                  
                  <button
                    onClick={() => handleStatusChange(
                      selectedOrder.id,
                      selectedOrder.status === 'pending' ? 'completed' : 'pending'
                    )}
                    className={`px-4 py-2 rounded-md text-white ${
                      selectedOrder.status === 'completed'
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {selectedOrder.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}
                  </button>
                  
                  <button
                    onClick={() => setShowOrderDetails(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Close
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

export default OrderManager;