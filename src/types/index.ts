export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  password: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  mrp: number;
  horizonPrice: number;
  details: string;
  category: string;
  inStock: boolean;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  user: User;
  items: CartItem[];
  total: number;
  status: 'pending' | 'completed';
  paymentReceived: boolean;
  createdAt: string;
}

export interface AppState {
  user: User | null;
  cart: Cart | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export interface ReportData {
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalRevenue: number;
  orders: Order[];
}