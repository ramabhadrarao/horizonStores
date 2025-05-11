import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { User, Product, CartItem, Cart, Order } from '../types';

// Initialize database and operations based on environment
const isBrowser = typeof window !== 'undefined';

// Define operations for browser environment
const browserOperations = {
  userOperations: {
    createUser: () => { throw new Error('Database operations are not supported in the browser') },
    getUserByEmail: () => { throw new Error('Database operations are not supported in the browser') },
    getUserById: () => { throw new Error('Database operations are not supported in the browser') }
  },
  productOperations: {
    addProduct: () => { throw new Error('Database operations are not supported in the browser') },
    getProducts: () => { throw new Error('Database operations are not supported in the browser') },
    getProductById: () => { throw new Error('Database operations are not supported in the browser') },
    searchProducts: () => { throw new Error('Database operations are not supported in the browser') },
    updateProduct: () => { throw new Error('Database operations are not supported in the browser') }
  },
  cartOperations: {
    getCart: () => { throw new Error('Database operations are not supported in the browser') },
    addToCart: () => { throw new Error('Database operations are not supported in the browser') },
    updateCartItem: () => { throw new Error('Database operations are not supported in the browser') },
    removeCartItem: () => { throw new Error('Database operations are not supported in the browser') },
    clearCart: () => { throw new Error('Database operations are not supported in the browser') }
  },
  orderOperations: {
    createOrder: () => { throw new Error('Database operations are not supported in the browser') },
    getOrders: () => { throw new Error('Database operations are not supported in the browser') },
    getUserOrders: () => { throw new Error('Database operations are not supported in the browser') },
    updateOrderStatus: () => { throw new Error('Database operations are not supported in the browser') },
    updatePaymentStatus: () => { throw new Error('Database operations are not supported in the browser') },
    getOrdersForDateRange: () => { throw new Error('Database operations are not supported in the browser') }
  }
};

// Initialize the database for Node.js environment
const initDb = () => {
  if (isBrowser) return null;
  
  const db = new Database('horizon-stores.db');
  
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      mobile TEXT NOT NULL,
      address TEXT NOT NULL,
      password TEXT NOT NULL,
      isAdmin INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      imageUrl TEXT NOT NULL,
      mrp REAL NOT NULL,
      horizonPrice REAL NOT NULL,
      details TEXT,
      category TEXT,
      inStock INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS carts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users (id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS cartItems (
      id TEXT PRIMARY KEY,
      cartId TEXT NOT NULL,
      productId TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      FOREIGN KEY (cartId) REFERENCES carts (id),
      FOREIGN KEY (productId) REFERENCES products (id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      paymentReceived INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users (id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orderItems (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      productId TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (orderId) REFERENCES orders (id),
      FOREIGN KEY (productId) REFERENCES products (id)
    )
  `);

  // Create admin user if not exists
  const adminExists = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@horizonstores.com');
  
  if (!adminExists) {
    const adminUser = {
      id: uuidv4(),
      name: 'Admin',
      email: 'admin@horizonstores.com',
      mobile: '1234567890',
      address: 'Horizon Stores HQ',
      password: 'admin123', // In a real app, this should be hashed
      isAdmin: 1,
      createdAt: new Date().toISOString()
    };
    
    db.prepare(
      'INSERT INTO users (id, name, email, mobile, address, password, isAdmin, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      adminUser.id, 
      adminUser.name, 
      adminUser.email, 
      adminUser.mobile, 
      adminUser.address, 
      adminUser.password, 
      adminUser.isAdmin, 
      adminUser.createdAt
    );
  }

  return db;
};

// Initialize database
const db = initDb();

// Define Node.js operations
const nodeOperations = {
  userOperations: {
    createUser: (user: Omit<User, 'id' | 'isAdmin' | 'createdAt'>): User => {
      const newUser = {
        id: uuidv4(),
        ...user,
        isAdmin: false,
        createdAt: new Date().toISOString()
      };
      
      db?.prepare(
        'INSERT INTO users (id, name, email, mobile, address, password, isAdmin, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        newUser.id, 
        newUser.name, 
        newUser.email, 
        newUser.mobile, 
        newUser.address, 
        newUser.password, 
        newUser.isAdmin ? 1 : 0, 
        newUser.createdAt
      );
      
      return newUser;
    },
    
    getUserByEmail: (email: string): User | undefined => {
      const user = db?.prepare('SELECT * FROM users WHERE email = ?').get(email);
      return user ? {
        ...user,
        isAdmin: !!user.isAdmin
      } : undefined;
    },
    
    getUserById: (id: string): User | undefined => {
      const user = db?.prepare('SELECT * FROM users WHERE id = ?').get(id);
      return user ? {
        ...user,
        isAdmin: !!user.isAdmin
      } : undefined;
    }
  },

  productOperations: {
    addProduct: (product: Omit<Product, 'id' | 'createdAt'>): Product => {
      const newProduct = {
        id: uuidv4(),
        ...product,
        createdAt: new Date().toISOString()
      };
      
      db?.prepare(
        'INSERT INTO products (id, name, imageUrl, mrp, horizonPrice, details, category, inStock, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        newProduct.id,
        newProduct.name,
        newProduct.imageUrl,
        newProduct.mrp,
        newProduct.horizonPrice,
        newProduct.details,
        newProduct.category,
        newProduct.inStock ? 1 : 0,
        newProduct.createdAt
      );
      
      return newProduct;
    },
    
    getProducts: (): Product[] => {
      const products = db?.prepare('SELECT * FROM products').all() || [];
      return products.map(product => ({
        ...product,
        inStock: !!product.inStock,
        mrp: Number(product.mrp),
        horizonPrice: Number(product.horizonPrice)
      }));
    },
    
    getProductById: (id: string): Product | undefined => {
      const product = db?.prepare('SELECT * FROM products WHERE id = ?').get(id);
      return product ? {
        ...product,
        inStock: !!product.inStock,
        mrp: Number(product.mrp),
        horizonPrice: Number(product.horizonPrice)
      } : undefined;
    },
    
    searchProducts: (query: string): Product[] => {
      const products = db?.prepare(
        'SELECT * FROM products WHERE name LIKE ? OR details LIKE ? OR category LIKE ?'
      ).all(`%${query}%`, `%${query}%`, `%${query}%`) || [];
      
      return products.map(product => ({
        ...product,
        inStock: !!product.inStock,
        mrp: Number(product.mrp),
        horizonPrice: Number(product.horizonPrice)
      }));
    },
    
    updateProduct: (product: Product): Product => {
      db?.prepare(`
        UPDATE products 
        SET name = ?, imageUrl = ?, mrp = ?, horizonPrice = ?, 
            details = ?, category = ?, inStock = ?
        WHERE id = ?
      `).run(
        product.name,
        product.imageUrl,
        product.mrp,
        product.horizonPrice,
        product.details,
        product.category,
        product.inStock ? 1 : 0,
        product.id
      );
      
      return product;
    }
  },

  cartOperations: {
    getCart: (userId: string): Cart | null => {
      // Get or create cart
      let cart = db?.prepare('SELECT * FROM carts WHERE userId = ?').get(userId);
      
      if (!cart) {
        const cartId = uuidv4();
        const now = new Date().toISOString();
        
        db?.prepare(
          'INSERT INTO carts (id, userId, createdAt) VALUES (?, ?, ?)'
        ).run(cartId, userId, now);
        
        cart = { id: cartId, userId, createdAt: now };
      }
      
      // Get cart items
      const cartItems = db?.prepare(`
        SELECT ci.id, ci.productId, ci.quantity, p.*
        FROM cartItems ci
        JOIN products p ON ci.productId = p.id
        WHERE ci.cartId = ?
      `).all(cart.id) || [];
      
      const items: CartItem[] = cartItems.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: {
          id: item.productId,
          name: item.name,
          imageUrl: item.imageUrl,
          mrp: Number(item.mrp),
          horizonPrice: Number(item.horizonPrice),
          details: item.details,
          category: item.category,
          inStock: !!item.inStock,
          createdAt: item.createdAt
        }
      }));
      
      return {
        id: cart.id,
        userId: cart.userId,
        items,
        createdAt: cart.createdAt
      };
    },
    
    addToCart: (cartId: string, productId: string, quantity: number): void => {
      // Check if item already in cart
      const existingItem = db?.prepare(
        'SELECT * FROM cartItems WHERE cartId = ? AND productId = ?'
      ).get(cartId, productId);
      
      if (existingItem) {
        db?.prepare(
          'UPDATE cartItems SET quantity = quantity + ? WHERE id = ?'
        ).run(quantity, existingItem.id);
      } else {
        db?.prepare(
          'INSERT INTO cartItems (id, cartId, productId, quantity) VALUES (?, ?, ?, ?)'
        ).run(uuidv4(), cartId, productId, quantity);
      }
    },
    
    updateCartItem: (itemId: string, quantity: number): void => {
      db?.prepare(
        'UPDATE cartItems SET quantity = ? WHERE id = ?'
      ).run(quantity, itemId);
    },
    
    removeCartItem: (itemId: string): void => {
      db?.prepare('DELETE FROM cartItems WHERE id = ?').run(itemId);
    },
    
    clearCart: (cartId: string): void => {
      db?.prepare('DELETE FROM cartItems WHERE cartId = ?').run(cartId);
    }
  },

  orderOperations: {
    createOrder: (userId: string, items: CartItem[]): Order => {
      const orderId = uuidv4();
      const now = new Date().toISOString();
      
      // Calculate total
      const total = items.reduce(
        (sum, item) => sum + (item.product.horizonPrice * item.quantity), 
        0
      );
      
      // Create order
      db?.prepare(
        'INSERT INTO orders (id, userId, total, status, paymentReceived, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(orderId, userId, total, 'pending', 0, now);
      
      // Add order items
      for (const item of items) {
        db?.prepare(
          'INSERT INTO orderItems (id, orderId, productId, quantity, price) VALUES (?, ?, ?, ?, ?)'
        ).run(
          uuidv4(), 
          orderId, 
          item.product.id, 
          item.quantity, 
          item.product.horizonPrice
        );
      }
      
      // Clear cart after order
      const cart = db?.prepare('SELECT id FROM carts WHERE userId = ?').get(userId);
      if (cart) {
        nodeOperations.cartOperations.clearCart(cart.id);
      }
      
      // Return the created order
      const user = nodeOperations.userOperations.getUserById(userId);
      
      return {
        id: orderId,
        userId,
        user: user as User,
        items,
        total,
        status: 'pending',
        paymentReceived: false,
        createdAt: now
      };
    },
    
    getOrders: (): Order[] => {
      const orders = db?.prepare(`
        SELECT o.*, u.name as userName, u.email, u.mobile, u.address
        FROM orders o
        JOIN users u ON o.userId = u.id
        ORDER BY o.createdAt DESC
      `).all() || [];
      
      return orders.map(order => {
        // Get order items
        const orderItems = db?.prepare(`
          SELECT oi.*, p.name, p.imageUrl, p.details, p.category
          FROM orderItems oi
          JOIN products p ON oi.productId = p.id
          WHERE oi.orderId = ?
        `).all(order.id) || [];
        
        const items: CartItem[] = orderItems.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          product: {
            id: item.productId,
            name: item.name,
            imageUrl: item.imageUrl,
            mrp: 0,
            horizonPrice: item.price,
            details: item.details,
            category: item.category,
            inStock: true,
            createdAt: ''
          }
        }));
        
        return {
          id: order.id,
          userId: order.userId,
          user: {
            id: order.userId,
            name: order.userName,
            email: order.email,
            mobile: order.mobile,
            address: order.address,
            password: '',
            isAdmin: false,
            createdAt: ''
          },
          items,
          total: Number(order.total),
          status: order.status as 'pending' | 'completed',
          paymentReceived: !!order.paymentReceived,
          createdAt: order.createdAt
        };
      });
    },
    
    getUserOrders: (userId: string): Order[] => {
      const orders = db?.prepare(`
        SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC
      `).all(userId) || [];
      
      return orders.map(order => {
        // Get order items
        const orderItems = db?.prepare(`
          SELECT oi.*, p.name, p.imageUrl, p.details, p.category
          FROM orderItems oi
          JOIN products p ON oi.productId = p.id
          WHERE oi.orderId = ?
        `).all(order.id) || [];
        
        const items: CartItem[] = orderItems.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          product: {
            id: item.productId,
            name: item.name,
            imageUrl: item.imageUrl,
            mrp: 0,
            horizonPrice: item.price,
            details: item.details,
            category: item.category,
            inStock: true,
            createdAt: ''
          }
        }));
        
        // Get user
        const user = nodeOperations.userOperations.getUserById(userId) as User;
        
        return {
          id: order.id,
          userId,
          user,
          items,
          total: Number(order.total),
          status: order.status as 'pending' | 'completed',
          paymentReceived: !!order.paymentReceived,
          createdAt: order.createdAt
        };
      });
    },
    
    updateOrderStatus: (orderId: string, status: 'pending' | 'completed'): void => {
      db?.prepare(
        'UPDATE orders SET status = ? WHERE id = ?'
      ).run(status, orderId);
    },
    
    updatePaymentStatus: (orderId: string, received: boolean): void => {
      db?.prepare(
        'UPDATE orders SET paymentReceived = ? WHERE id = ?'
      ).run(received ? 1 : 0, orderId);
    },
    
    getOrdersForDateRange: (startDate: string, endDate: string): Order[] => {
      const orders = db?.prepare(`
        SELECT o.*, u.name as userName, u.email, u.mobile, u.address
        FROM orders o
        JOIN users u ON o.userId = u.id
        WHERE o.createdAt BETWEEN ? AND ?
        ORDER BY o.createdAt DESC
      `).all(startDate, endDate) || [];
      
      return orders.map(order => {
        // Get order items (simplified for reporting)
        const orderItems = db?.prepare(`
          SELECT oi.id, oi.productId, oi.quantity, oi.price, p.name
          FROM orderItems oi
          JOIN products p ON oi.productId = p.id
          WHERE oi.orderId = ?
        `).all(order.id) || [];
        
        const items: CartItem[] = orderItems.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          product: {
            id: item.productId,
            name: item.name,
            imageUrl: '',
            mrp: 0,
            horizonPrice: item.price,
            details: '',
            category: '',
            inStock: true,
            createdAt: ''
          }
        }));
        
        return {
          id: order.id,
          userId: order.userId,
          user: {
            id: order.userId,
            name: order.userName,
            email: order.email,
            mobile: order.mobile,
            address: order.address,
            password: '',
            isAdmin: false,
            createdAt: ''
          },
          items,
          total: Number(order.total),
          status: order.status as 'pending' | 'completed',
          paymentReceived: !!order.paymentReceived,
          createdAt: order.createdAt
        };
      });
    }
  }
};

// Export operations based on environment
export const userOperations = isBrowser ? browserOperations.userOperations : nodeOperations.userOperations;
export const productOperations = isBrowser ? browserOperations.productOperations : nodeOperations.productOperations;
export const cartOperations = isBrowser ? browserOperations.cartOperations : nodeOperations.cartOperations;
export const orderOperations = isBrowser ? browserOperations.orderOperations : nodeOperations.orderOperations;

export default db;