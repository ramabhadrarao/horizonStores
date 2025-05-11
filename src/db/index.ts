import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { User, Product, CartItem, Cart, Order } from '../types';

// MongoDB connection function
export const connectDB = async () => {
  try {
    // Replace with your actual MongoDB connection string
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/horizon-stores';
    
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// User Schema and Model
const UserSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  address: { type: String, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { 
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    } 
  }
});

const UserModel = mongoose.model('User', UserSchema);

// Product Schema and Model
const ProductSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  mrp: { type: Number, required: true },
  horizonPrice: { type: Number, required: true },
  details: { type: String },
  category: { type: String },
  inStock: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { 
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    } 
  }
});

const ProductModel = mongoose.model('Product', ProductSchema);

// Cart Schema and Model
const CartSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, ref: 'User', required: true },
  items: [{
    _id: { type: String, default: uuidv4 },
    productId: { type: String, ref: 'Product', required: true },
    quantity: { type: Number, default: 1 },
    product: { type: ProductSchema, required: true }
  }],
  createdAt: { type: Date, default: Date.now }
}, { 
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id;
      ret.items = ret.items.map(item => ({
        ...item.toObject(),
        id: item._id,
        productId: item.productId
      }));
      delete ret._id;
      delete ret.__v;
      return ret;
    } 
  }
});

const CartModel = mongoose.model('Cart', CartSchema);

// Order Schema and Model
const OrderSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, ref: 'User', required: true },
  user: { type: UserSchema, required: true },
  items: [{
    _id: { type: String, default: uuidv4 },
    productId: { type: String, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    product: { type: ProductSchema, required: true }
  }],
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed'], 
    default: 'pending' 
  },
  paymentReceived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { 
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id;
      ret.items = ret.items.map(item => ({
        ...item.toObject(),
        id: item._id,
        productId: item.productId
      }));
      delete ret._id;
      delete ret.__v;
      return ret;
    } 
  }
});

const OrderModel = mongoose.model('Order', OrderSchema);

// Operations implementation
export const userOperations = {
  createUser: async (user: Omit<User, 'id' | 'isAdmin' | 'createdAt'>): Promise<User> => {
    try {
      const newUser = new UserModel({
        ...user,
        isAdmin: false,
        createdAt: new Date()
      });
      await newUser.save();
      return newUser.toJSON();
    } catch (error) {
      if ((error as any).code === 11000) {
        throw new Error('User already exists');
      }
      throw error;
    }
  },

  getUserByEmail: async (email: string): Promise<User | undefined> => {
    const user = await UserModel.findOne({ email });
    return user ? user.toJSON() : undefined;
  },

  getUserById: async (id: string): Promise<User | undefined> => {
    const user = await UserModel.findById(id);
    return user ? user.toJSON() : undefined;
  }
};

export const productOperations = {
  addProduct: async (product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
    const newProduct = new ProductModel({
      ...product,
      createdAt: new Date()
    });
    await newProduct.save();
    return newProduct.toJSON();
  },

  getProducts: async (): Promise<Product[]> => {
    const products = await ProductModel.find();
    return products.map(p => p.toJSON());
  },

  getProductById: async (id: string): Promise<Product | undefined> => {
    const product = await ProductModel.findById(id);
    return product ? product.toJSON() : undefined;
  },

  searchProducts: async (query: string): Promise<Product[]> => {
    const products = await ProductModel.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { details: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    });
    return products.map(p => p.toJSON());
  },

  updateProduct: async (product: Product): Promise<Product> => {
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      product.id, 
      product, 
      { new: true }
    );
    if (!updatedProduct) throw new Error('Product not found');
    return updatedProduct.toJSON();
  }
};

export const cartOperations = {
  getCart: async (userId: string): Promise<Cart> => {
    let cart = await CartModel.findOne({ userId });
    
    if (!cart) {
      cart = new CartModel({ userId });
      await cart.save();
    }
    
    return cart.toJSON();
  },

  addToCart: async (cartId: string, productId: string, quantity: number): Promise<void> => {
    const cart = await CartModel.findById(cartId);
    if (!cart) throw new Error('Cart not found');

    const product = await ProductModel.findById(productId);
    if (!product) throw new Error('Product not found');

    const existingItemIndex = cart.items.findIndex(
      item => item.productId === productId
    );

    if (existingItemIndex !== -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId,
        quantity,
        product: product.toObject()
      });
    }

    await cart.save();
  },

  updateCartItem: async (itemId: string, quantity: number): Promise<void> => {
    const cart = await CartModel.findOne({ 'items._id': itemId });
    if (!cart) throw new Error('Cart not found');

    const itemIndex = cart.items.findIndex(item => item._id === itemId);
    if (itemIndex !== -1) {
      if (quantity > 0) {
        cart.items[itemIndex].quantity = quantity;
      } else {
        cart.items.splice(itemIndex, 1);
      }
      await cart.save();
    }
  },

  removeCartItem: async (itemId: string): Promise<void> => {
    const cart = await CartModel.findOne({ 'items._id': itemId });
    if (!cart) throw new Error('Cart not found');

    cart.items = cart.items.filter(item => item._id !== itemId);
    await cart.save();
  },

  clearCart: async (cartId: string): Promise<void> => {
    const cart = await CartModel.findById(cartId);
    if (!cart) throw new Error('Cart not found');

    cart.items = [];
    await cart.save();
  }
};

export const orderOperations = {
  createOrder: async (userId: string, items: CartItem[]): Promise<Order> => {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error('User not found');

    const total = items.reduce(
      (sum, item) => sum + (item.product.horizonPrice * item.quantity), 
      0
    );

    const newOrder = new OrderModel({
      userId,
      user: user.toObject(),
      items: items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        product: item.product
      })),
      total,
      status: 'pending',
      paymentReceived: false
    });

    await newOrder.save();

    // Clear cart after order
    await CartModel.findOneAndUpdate(
      { userId }, 
      { items: [] }
    );

    return newOrder.toJSON();
  },

  getOrders: async (): Promise<Order[]> => {
    const orders = await OrderModel.find().sort({ createdAt: -1 });
    return orders.map(order => order.toJSON());
  },

  getUserOrders: async (userId: string): Promise<Order[]> => {
    const orders = await OrderModel.find({ userId }).sort({ createdAt: -1 });
    return orders.map(order => order.toJSON());
  },

  updateOrderStatus: async (orderId: string, status: 'pending' | 'completed'): Promise<void> => {
    await OrderModel.findByIdAndUpdate(orderId, { status });
  },

  updatePaymentStatus: async (orderId: string, received: boolean): Promise<void> => {
    await OrderModel.findByIdAndUpdate(orderId, { paymentReceived: received });
  },

  getOrdersForDateRange: async (startDate: string, endDate: string): Promise<Order[]> => {
    const orders = await OrderModel.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ createdAt: -1 });
    
    return orders.map(order => order.toJSON());
  }
};

// Initialize default admin user
async function initializeAdminUser() {
  try {
    const existingAdmin = await UserModel.findOne({ 
      email: 'admin@horizonstores.com' 
    });

    if (!existingAdmin) {
      await userOperations.createUser({
        name: 'Admin',
        email: 'admin@horizonstores.com',
        mobile: '1234567890',
        address: 'Horizon Stores HQ',
        password: 'admin123'
      });
      console.log('Admin user created');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Initialize default products
async function initializeProducts() {
  try {
    const existingProducts = await ProductModel.countDocuments();

    if (existingProducts === 0) {
      const initialProducts = [
        {
          name: 'Wireless Headphones',
          imageUrl: 'https://example.com/headphones.jpg',
          mrp: 5999,
          horizonPrice: 4499,
          details: 'High-quality wireless headphones with noise cancellation',
          category: 'Electronics',
          inStock: true
        },
        {
          name: 'Smart Watch',
          imageUrl: 'https://example.com/smartwatch.jpg',
          mrp: 7999,
          horizonPrice: 5999,
          details: 'Advanced fitness tracking and smart notifications',
          category: 'Electronics',
          inStock: true
        }
      ];

      await ProductModel.insertMany(initialProducts);
      console.log('Initial products added');
    }
  } catch (error) {
    console.error('Error initializing products:', error);
  }
}

// Run initializations
connectDB().then(() => {
  initializeAdminUser();
  initializeProducts();
});

export default null; // No default export needed