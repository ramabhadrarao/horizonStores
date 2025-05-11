import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Cart from './pages/user/Cart';
import OrderList from './pages/user/OrderList';
import ProductManager from './pages/admin/ProductManager';
import OrderManager from './pages/admin/OrderManager';
import Reports from './pages/admin/Reports';

// Auth Guards
const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLoggedIn = localStorage.getItem('horizonUser') !== null;
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userStr = localStorage.getItem('horizonUser');
  let isAdmin = false;
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      isAdmin = user.isAdmin;
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* User Routes */}
          <Route 
            path="/cart" 
            element={
              <UserRoute>
                <Cart />
              </UserRoute>
            } 
          />
          <Route 
            path="/orders" 
            element={
              <UserRoute>
                <OrderList />
              </UserRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/products" 
            element={
              <AdminRoute>
                <ProductManager />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/orders" 
            element={
              <AdminRoute>
                <OrderManager />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/reports" 
            element={
              <AdminRoute>
                <Reports />
              </AdminRoute>
            } 
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </AppProvider>
  );
}

export default App;