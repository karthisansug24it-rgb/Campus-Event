const app = require('./app');
const { testConnection } = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('----------------------------------------------------');
  console.log(' Francis Xavier Engineering College (FXEC)');
  console.log(' Campus Event Management System - Server Booting');
  console.log('----------------------------------------------------');

  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.warn('[DB Warning] MySQL database is currently not reachable.');
    console.warn('[DB Warning] Ensure MySQL is running and execute "npm run db:setup" to initialize tables.');
  }

  const server = app.listen(PORT, () => {
    console.log(`[Server] API running at: http://localhost:${PORT}`);
    console.log(`[Server] Health check:    http://localhost:${PORT}/api/health`);
    console.log(`[Server] Uploads served:  http://localhost:${PORT}/uploads`);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('Server process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

startServer();
