import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Cart, AppState } from '../types';
import { userOperations, cartOperations } from '../db';
import toast from 'react-hot-toast';

interface AppContextProps {
  state: AppState;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (user: Omit<User, 'id' | 'isAdmin' | 'createdAt'>) => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const initialState: AppState = {
  user: null,
  cart: null,
  isAuthenticated: false,
  isAdmin: false
};

const AppContext = createContext<AppContextProps>({
  state: initialState,
  login: async () => false,
  logout: () => {},
  register: async () => false,
  refreshCart: async () => {}
});

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check for saved user session on load
  useEffect(() => {
    const restoreSession = async () => {
      const savedUser = localStorage.getItem('horizonUser');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser) as User;
          setState({
            user,
            cart: null,
            isAuthenticated: true,
            isAdmin: user.isAdmin
          });
          
          // Fetch cart data after restoring session for non-admin users
          if (user && !user.isAdmin) {
            try {
              const cart = await cartOperations.getCart(user.id);
              setState(prev => ({ ...prev, cart }));
            } catch (error) {
              console.error('Failed to fetch cart:', error);
            }
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('horizonUser');
        }
      }
      setIsInitializing(false);
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = await userOperations.getUserByEmail(email);
      
      if (user && user.password === password) {
        // In a real app, we would never store the password in localStorage
        // We're doing it here for simplicity, but in production, you'd store a token
        const userToStore = { ...user };
        localStorage.setItem('horizonUser', JSON.stringify(userToStore));
        
        // Fetch cart for regular users
        let cart = null;
        if (!user.isAdmin) {
          cart = await cartOperations.getCart(user.id);
        }
        
        setState({
          user,
          cart,
          isAuthenticated: true,
          isAdmin: user.isAdmin
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('horizonUser');
    setState(initialState);
  };

  const register = async (userData: Omit<User, 'id' | 'isAdmin' | 'createdAt'>): Promise<boolean> => {
    try {
      // Check if user already exists
      const existingUser = await userOperations.getUserByEmail(userData.email);
      if (existingUser) {
        return false;
      }
      
      // Create new user
      const newUser = await userOperations.createUser(userData);
      
      // Auto login after registration
      localStorage.setItem('horizonUser', JSON.stringify(newUser));
      
      // Create an empty cart for the new user
      const cart = await cartOperations.getCart(newUser.id);
      
      setState({
        user: newUser,
        cart,
        isAuthenticated: true,
        isAdmin: false
      });
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const refreshCart = async () => {
    if (state.user && !state.isAdmin) {
      try {
        const cart = await cartOperations.getCart(state.user.id);
        setState(prev => ({ ...prev, cart }));
      } catch (error) {
        console.error('Failed to refresh cart:', error);
        toast.error('Error refreshing cart');
      }
    }
  };

  // Show a loading indicator while restoring the session
  if (isInitializing) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ state, login, logout, register, refreshCart }}>
      {children}
    </AppContext.Provider>
  );
};