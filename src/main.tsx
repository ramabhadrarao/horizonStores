import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeDatabase } from './db';

console.log('Starting database initialization...');

// Initialize MongoDB connection and seed data
initializeDatabase()
  .then(() => {
    console.log('✅ Database initialized successfully, rendering application');
    const rootElement = document.getElementById('root');

    if (rootElement) {
      createRoot(rootElement).render(
        <StrictMode>
          <App />
        </StrictMode>
      );
    } else {
      console.error('❌ Root element not found');
    }
  })
  .catch((error) => {
    console.error('❌ Failed to initialize database:', error);
    const rootElement = document.getElementById('root');

    if (rootElement) {
      rootElement.innerHTML = `
        <div style="color: red; text-align: center; margin-top: 50px; font-family: Arial, sans-serif;">
          <h1>Database Connection Error</h1>
          <p>Failed to connect to the MongoDB database. Please ensure MongoDB is running.</p>
          <p><strong>Error:</strong> ${error.message}</p>
          <div style="margin-top: 20px; padding: 10px; background-color: #f8f8f8; border-radius: 5px; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto;">
            <p><strong>Troubleshooting Steps:</strong></p>
            <ol style="padding-left: 20px; text-align: left;">
              <li>Run <code>mongosh</code> and check if MongoDB is active</li>
              <li>Confirm the replica set is initialized with <code>rs.status()</code></li>
              <li>Verify <code>VITE_MONGODB_URI</code> in your <code>.env.local</code></li>
              <li>If using multiple nodes before, update URI to single node: <br><code>mongodb://127.0.0.1:27017/horizon_stores</code></li>
            </ol>
          </div>
        </div>
      `;
    }
  });