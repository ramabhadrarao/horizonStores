import { connectDB } from './index';
import { initializeDatabase } from './index';

// This file is a script to initialize the MongoDB database
// It will connect to MongoDB and seed initial data

async function init() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  }
}

// Run the initialization if this script is executed directly
if (require.main === module) {
  init();
}

export default init;