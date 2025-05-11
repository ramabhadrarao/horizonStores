import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Package, Plus, Upload, X } from 'lucide-react';
import Navbar from '../../components/Navbar';
import ProductCard from '../../components/ProductCard';
import { productOperations } from '../../db';
import { Product } from '../../types';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

const ProductManager: React.FC = () => {
  const { state } = useAppContext();
  const { isAuthenticated, isAdmin } = state;
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    mrp: 0,
    horizonPrice: 0,
    details: '',
    category: '',
    inStock: true
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
      return;
    }
    
    loadProducts();
  }, [isAuthenticated, isAdmin, navigate]);
  
  const loadProducts = () => {
    const allProducts = productOperations.getProducts();
    setProducts(allProducts);
    setIsLoading(false);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      imageUrl: '',
      mrp: 0,
      horizonPrice: 0,
      details: '',
      category: '',
      inStock: true
    });
    setEditingProduct(null);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        // Update existing product
        const updatedProduct = {
          ...editingProduct,
          ...formData
        };
        
        productOperations.updateProduct(updatedProduct);
        toast.success('Product updated successfully');
      } else {
        // Add new product
        productOperations.addProduct(formData);
        toast.success('Product added successfully');
      }
      
      // Reset form and refresh product list
      resetForm();
      setShowAddForm(false);
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };
  
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      imageUrl: product.imageUrl,
      mrp: product.mrp,
      horizonPrice: product.horizonPrice,
      details: product.details,
      category: product.category,
      inStock: product.inStock
    });
    setShowAddForm(true);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as any[];
          let successCount = 0;
          
          data.forEach((row) => {
            if (!row.name || !row.imageUrl) return;
            
            const product = {
              name: row.name,
              imageUrl: row.imageUrl,
              mrp: parseFloat(row.mrp) || 0,
              horizonPrice: parseFloat(row.horizonPrice) || 0,
              details: row.details || '',
              category: row.category || '',
              inStock: row.inStock === 'true'
            };
            
            productOperations.addProduct(product);
            successCount++;
          });
          
          toast.success(`Imported ${successCount} products successfully`);
          loadProducts();
          
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error) {
          console.error('Error importing products:', error);
          toast.error('Failed to import products');
        }
      },
      error: () => {
        toast.error('Error parsing CSV file');
      }
    });
  };
  
  if (!isAuthenticated || !isAdmin) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0 flex items-center">
            <Package className="mr-2" />
            Product Management
          </h1>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(!showAddForm);
              }}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 flex items-center justify-center"
            >
              {showAddForm ? (
                <>
                  <X size={18} className="mr-1" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus size={18} className="mr-1" />
                  Add Product
                </>
              )}
            </button>
            
            <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center cursor-pointer">
              <Upload size={18} className="mr-1" />
              Bulk Import (CSV)
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
        
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                    Product Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="imageUrl" className="block text-gray-700 font-medium mb-2">
                    Image URL*
                  </label>
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="mrp" className="block text-gray-700 font-medium mb-2">
                    M.R.P.*
                  </label>
                  <input
                    type="number"
                    id="mrp"
                    name="mrp"
                    value={formData.mrp}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="horizonPrice" className="block text-gray-700 font-medium mb-2">
                    Horizon Price*
                  </label>
                  <input
                    type="number"
                    id="horizonPrice"
                    name="horizonPrice"
                    value={formData.horizonPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-gray-700 font-medium mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                
                <div>
                  <label className="flex items-center text-gray-700 font-medium mb-2">
                    <input
                      type="checkbox"
                      name="inStock"
                      checked={formData.inStock}
                      onChange={handleChange}
                      className="mr-2 rounded"
                    />
                    In Stock
                  </label>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="details" className="block text-gray-700 font-medium mb-2">
                    Product Details
                  </label>
                  <textarea
                    id="details"
                    name="details"
                    value={formData.details}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowAddForm(false);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                isAdmin={true}
                onEdit={handleEdit}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500">No products found.</p>
            <p className="text-gray-500 mt-2">
              Start by adding products or importing them via CSV.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManager;