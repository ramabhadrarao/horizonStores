import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { BarChart, FileText, Download, Calendar } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { orderOperations } from '../../db';
import { Order, ReportData } from '../../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const Reports: React.FC = () => {
  const { state } = useAppContext();
  const { isAuthenticated, isAdmin } = state;
  const navigate = useNavigate();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const generateReport = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Add time to dates to include the entire day
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      
      const orders = orderOperations.getOrdersForDateRange(
        startDateTime.toISOString(),
        endDateTime.toISOString()
      );
      
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      
      setReportData({
        startDate,
        endDate,
        totalOrders: orders.length,
        totalRevenue,
        orders
      });
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };
  
  const downloadPdf = () => {
    if (!reportData) return;
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Horizon Stores - Sales Report', 14, 22);
    
    // Add report period
    doc.setFontSize(12);
    doc.text(`Report Period: ${reportData.startDate} to ${reportData.endDate}`, 14, 32);
    
    // Add summary
    doc.text(`Total Orders: ${reportData.totalOrders}`, 14, 42);
    doc.text(`Total Revenue: ₹${reportData.totalRevenue.toFixed(2)}`, 14, 52);
    
    // Add orders table
    const tableColumn = ['Order ID', 'Customer', 'Date', 'Status', 'Payment', 'Total'];
    const tableRows = reportData.orders.map(order => [
      order.id.slice(0, 8),
      order.user.name,
      new Date(order.createdAt).toLocaleDateString(),
      order.status,
      order.paymentReceived ? 'Received' : 'Pending',
      `₹${order.total.toFixed(2)}`
    ]);
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 62,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [13, 148, 136] } // Teal color
    });
    
    // Save the PDF
    doc.save(`HorizonStores_Report_${reportData.startDate}_to_${reportData.endDate}.pdf`);
  };
  
  // Check for authentication and admin status
  React.useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
    }
  }, [isAuthenticated, isAdmin, navigate]);
  
  if (!isAuthenticated || !isAdmin) {
    return null; // Will redirect in useEffect
  }
  
  // Helper function to format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <BarChart className="mr-2" />
          Sales Reports
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="mr-2" />
            Generate Report
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="startDate" className="block text-gray-700 font-medium mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || undefined}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-gray-700 font-medium mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={generateReport}
                disabled={isLoading || !startDate || !endDate}
                className={`w-full px-4 py-2 bg-teal-600 text-white rounded-md font-medium transition-colors 
                  ${(isLoading || !startDate || !endDate) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-teal-700'}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin h-5 w-5 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <FileText size={18} className="mr-2" />
                    Generate Report
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {reportData && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-teal-700 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                Sales Report: {formatDate(reportData.startDate)} to {formatDate(reportData.endDate)}
              </h3>
              
              <button
                onClick={downloadPdf}
                className="px-4 py-2 bg-white text-teal-700 rounded-md hover:bg-teal-50 flex items-center"
              >
                <Download size={18} className="mr-2" />
                Download PDF
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Summary
                  </h4>
                  <p><span className="font-medium">Total Orders:</span> {reportData.totalOrders}</p>
                  <p>
                    <span className="font-medium">Total Revenue:</span> ₹{reportData.totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
              
              {reportData.orders.length > 0 ? (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Orders
                  </h4>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
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
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Items
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{order.id.slice(0, 8)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {order.user.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {formatDate(order.createdAt)}
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-teal-700">
                              ₹{order.total.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No orders found for the selected date range.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;