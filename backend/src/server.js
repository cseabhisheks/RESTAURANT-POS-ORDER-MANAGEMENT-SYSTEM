import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

async function startServer() {
  try {
    await connectDB(env.mongoUri);
    console.log('Connected to MongoDB');

    const app = createApp();
    app.listen(env.port, () => {
      console.log(`POS Backend API running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
