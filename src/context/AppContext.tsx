import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Cart, AppState } from '../types';
import { userOperations, cartOperations } from '../db';

interface AppContextProps {
  state: AppState;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (user: Omit<User, 'id' | 'isAdmin' | 'createdAt'>) => Promise<boolean>;
  refreshCart: () => void;
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
  refreshCart: () => {}
});

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);

  // Check for saved user session on load
  useEffect(() => {
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
        
        // Fetch cart data after restoring session
        if (user && !user.isAdmin) {
          const cart = cartOperations.getCart(user.id);
          setState(prev => ({ ...prev, cart }));
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('horizonUser');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = userOperations.getUserByEmail(email);
      
      if (user && user.password === password) {
        // In a real app, we would never store the password in localStorage
        // We're doing it here for simplicity, but in production, you'd store a token
        const userToStore = { ...user };
        localStorage.setItem('horizonUser', JSON.stringify(userToStore));
        
        // Fetch cart for regular users
        let cart = null;
        if (!user.isAdmin) {
          cart = cartOperations.getCart(user.id);
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
      const existingUser = userOperations.getUserByEmail(userData.email);
      if (existingUser) {
        return false;
      }
      
      // Create new user
      const newUser = userOperations.createUser(userData);
      
      // Auto login after registration
      localStorage.setItem('horizonUser', JSON.stringify(newUser));
      
      // Create an empty cart for the new user
      const cart = cartOperations.getCart(newUser.id);
      
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

  const refreshCart = () => {
    if (state.user && !state.isAdmin) {
      const cart = cartOperations.getCart(state.user.id);
      setState(prev => ({ ...prev, cart }));
    }
  };

  return (
    <AppContext.Provider value={{ state, login, logout, register, refreshCart }}>
      {children}
    </AppContext.Provider>
  );
};