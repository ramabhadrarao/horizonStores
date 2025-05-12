// File: check-mongoose.js
import mongoose from 'mongoose';

console.log(`Current mongoose version: ${mongoose.version}`);
console.log(`Mongoose connect type: ${typeof mongoose.connect}`);
console.log(`Is mongoose.connect a function: ${typeof mongoose.connect === 'function'}`);

// Check if we're using mongoose in ESM mode
console.log(`Is mongoose default used: ${mongoose === mongoose.default}`);

// Print mongoose object structure
console.log('\nMongoose object keys:');
console.log(Object.keys(mongoose));

// Try connection with different methods
const MONGO_URI = 'mongodb://127.0.0.1:27017/test';

try {
  if (typeof mongoose.connect === 'function') {
    console.log('Using mongoose.connect directly');
    mongoose.connect(MONGO_URI)
      .then(() => console.log('Connected successfully with mongoose.connect'))
      .catch(err => console.error('Connection failed with mongoose.connect:', err));
  } else if (mongoose.default && typeof mongoose.default.connect === 'function') {
    console.log('Using mongoose.default.connect');
    mongoose.default.connect(MONGO_URI)
      .then(() => console.log('Connected successfully with mongoose.default.connect'))
      .catch(err => console.error('Connection failed with mongoose.default.connect:', err));
  } else {
    console.error('Could not find a valid connect method on mongoose');
  }
} catch (err) {
  console.error('Error during connection attempt:', err);
}