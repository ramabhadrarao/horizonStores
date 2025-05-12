import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { User, Product, CartItem, Cart, Order } from '../types';

// MongoDB connection function
export const connectDB = async () => {
  const MONGO_URI =
    import.meta.env.VITE_MONGODB_URI || 'mongodb://127.0.0.1:27017/horizon_stores?replicaSet=rs0';

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected (backend)');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    throw err; // Re-throw to handle in main.tsx
  }
};

// Rest of your db/index.ts file remains the same...
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
const CartItemSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  productId: { type: String, ref: 'Product', required: true },
  quantity: { type: Number, default: 1 },
  product: { type: mongoose.Schema.Types.Mixed, required: true }
});

const CartSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, ref: 'User', required: true },
  items: [CartItemSchema],
  createdAt: { type: Date, default: Date.now }
}, { 
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id;
      ret.items = ret.items.map(item => ({
        ...item,
        id: item._id,
      }));
      delete ret._id;
      delete ret.__v;
      return ret;
    } 
  }
});

const CartModel = mongoose.model('Cart', CartSchema);

// Order Schema and Model
const OrderItemSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  productId: { type: String, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  product: { type: mongoose.Schema.Types.Mixed, required: true }
});

const OrderSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, ref: 'User', required: true },
  user: { type: mongoose.Schema.Types.Mixed, required: true },
  items: [OrderItemSchema],
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
        ...item,
        id: item._id,
      }));
      delete ret._id;
      delete ret.__v;
      return ret;
    } 
  }
});

const OrderModel = mongoose.model('Order', OrderSchema);

// MongoDB Operations implementation
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

  getUserByEmail: async (email: string): Promise<User | null> => {
    const user = await UserModel.findOne({ email });
    return user ? user.toJSON() as User : null;
  },

  getUserById: async (id: string): Promise<User | null> => {
    const user = await UserModel.findById(id);
    return user ? user.toJSON() as User : null;
  }
};

export const productOperations = {
  addProduct: async (product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
    const newProduct = new ProductModel({
      ...product,
      createdAt: new Date()
    });
    await newProduct.save();
    return newProduct.toJSON() as Product;
  },

  getProducts: async (): Promise<Product[]> => {
    const products = await ProductModel.find();
    return products.map(p => p.toJSON() as Product);
  },

  getProductById: async (id: string): Promise<Product | null> => {
    const product = await ProductModel.findById(id);
    return product ? product.toJSON() as Product : null;
  },

  searchProducts: async (query: string): Promise<Product[]> => {
    const products = await ProductModel.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { details: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    });
    return products.map(p => p.toJSON() as Product);
  },

  updateProduct: async (product: Product): Promise<Product> => {
    const { id, ...updateData } = product;
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );
    if (!updatedProduct) throw new Error('Product not found');
    return updatedProduct.toJSON() as Product;
  }
};

export const cartOperations = {
  getCart: async (userId: string): Promise<Cart> => {
    let cart = await CartModel.findOne({ userId });
    
    if (!cart) {
      cart = new CartModel({ userId, items: [] });
      await cart.save();
    }
    
    return cart.toJSON() as Cart;
  },

  addToCart: async (cartId: string, productId: string, quantity: number): Promise<void> => {
    const cart = await CartModel.findById(cartId);
    if (!cart) throw new Error('Cart not found');

    const product = await ProductModel.findById(productId);
    if (!product) throw new Error('Product not found');

    const productData = product.toJSON();
    
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === productId
    );

    if (existingItemIndex !== -1) {
      // Using MongoDB update to modify the quantity
      await CartModel.updateOne(
        { _id: cartId, "items.productId": productId },
        { $inc: { "items.$.quantity": quantity } }
      );
    } else {
      // Add new item to cart
      await CartModel.updateOne(
        { _id: cartId },
        { 
          $push: { 
            items: {
              _id: uuidv4(),
              productId,
              quantity,
              product: productData
            }
          } 
        }
      );
    }
  },

  updateCartItem: async (itemId: string, quantity: number): Promise<void> => {
    if (quantity <= 0) {
      await CartModel.updateOne(
        { "items._id": itemId },
        { $pull: { items: { _id: itemId } } }
      );
    } else {
      await CartModel.updateOne(
        { "items._id": itemId },
        { $set: { "items.$.quantity": quantity } }
      );
    }
  },

  removeCartItem: async (itemId: string): Promise<void> => {
    await CartModel.updateOne(
      { "items._id": itemId },
      { $pull: { items: { _id: itemId } } }
    );
  },

  clearCart: async (cartId: string): Promise<void> => {
    await CartModel.updateOne(
      { _id: cartId },
      { $set: { items: [] } }
    );
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
      user: user.toJSON(),
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
    await CartModel.updateOne(
      { userId }, 
      { $set: { items: [] } }
    );

    return newOrder.toJSON() as Order;
  },

  getOrders: async (): Promise<Order[]> => {
    const orders = await OrderModel.find().sort({ createdAt: -1 });
    return orders.map(order => order.toJSON() as Order);
  },

  getUserOrders: async (userId: string): Promise<Order[]> => {
    const orders = await OrderModel.find({ userId }).sort({ createdAt: -1 });
    return orders.map(order => order.toJSON() as Order);
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
    
    return orders.map(order => order.toJSON() as Order);
  }
};

// Initialize default admin user
async function initializeAdminUser() {
  try {
    const existingAdmin = await UserModel.findOne({ 
      email: 'admin@horizonstores.com' 
    });

    if (!existingAdmin) {
      const newAdmin = new UserModel({
        name: 'Admin',
        email: 'admin@horizonstores.com',
        mobile: '1234567890',
        address: 'Horizon Stores HQ',
        password: 'admin123',
        isAdmin: true // Important: set isAdmin to true
      });
      await newAdmin.save();
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
          imageUrl: 'https://via.placeholder.com/300/3B82F6/FFFFFF?text=Wireless+Headphones',
          mrp: 5999,
          horizonPrice: 4499,
          details: 'High-quality wireless headphones with noise cancellation',
          category: 'Electronics',
          inStock: true
        },
        {
          name: 'Smart Watch',
          imageUrl: 'https://via.placeholder.com/300/10B981/FFFFFF?text=Smart+Watch',
          mrp: 7999,
          horizonPrice: 5999,
          details: 'Advanced fitness tracking and smart notifications',
          category: 'Electronics',
          inStock: true
        },
        {
          name: 'Bluetooth Speaker',
          imageUrl: 'https://via.placeholder.com/300/6366F1/FFFFFF?text=Bluetooth+Speaker',
          mrp: 3999,
          horizonPrice: 2999,
          details: 'Portable Bluetooth speaker with deep bass and 12-hour battery life',
          category: 'Electronics',
          inStock: true
        },
        {
          name: 'Cotton T-Shirt',
          imageUrl: 'https://via.placeholder.com/300/F59E0B/FFFFFF?text=Cotton+T-Shirt',
          mrp: 999,
          horizonPrice: 699,
          details: 'Premium cotton t-shirt, comfortable for all-day wear',
          category: 'Clothing',
          inStock: true
        },
        {
          name: 'Yoga Mat',
          imageUrl: 'https://via.placeholder.com/300/EC4899/FFFFFF?text=Yoga+Mat',
          mrp: 1499,
          horizonPrice: 1199,
          details: 'Non-slip yoga mat, perfect for home workouts',
          category: 'Fitness',
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

// Export a function to initialize the database
export const initializeDatabase = async () => {
  try {
    await connectDB();
    await initializeAdminUser();
    await initializeProducts();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export default { initializeDatabase };