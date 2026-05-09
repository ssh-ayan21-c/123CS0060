import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Log, initLog } from 'logging-middleware';
import { runPriorityAlgorithm } from './utils/algorithm';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Initialize the logging middleware with the token from .env
const APP_TOKEN = process.env.APP_TOKEN || '';
if (APP_TOKEN) {
  initLog(APP_TOKEN);
} else {
  console.warn('Warning: APP_TOKEN not found in .env. Logs will not be sent to test server.');
}

app.get('/api/health', async (req, res) => {
  await Log('backend', 'info', 'route', 'Health check endpoint accessed.');
  res.json({ status: 'ok', message: 'Notification backend is running.' });
});

app.post('/api/notifications', async (req, res) => {
  const { title, body, userId } = req.body;
  
  if (!title || !body || !userId) {
    await Log('backend', 'error', 'handler', 'Missing required fields for notification.');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Simulate processing
    await Log('backend', 'info', 'service', `Processing notification for user ${userId}`);
    
    // Simulate DB interaction
    await Log('backend', 'debug', 'db', `Saving notification to database for user ${userId}`);
    
    res.status(201).json({ message: 'Notification created successfully' });
  } catch (error: any) {
    await Log('backend', 'fatal', 'handler', `Critical error while creating notification: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint for the Backend Track: Postman testing of the algorithm
app.post('/api/v1/priority', async (req, res) => {
  const { notifications, limit } = req.body;
  
  if (!notifications || !Array.isArray(notifications)) {
    await Log('backend', 'error', 'handler', 'Invalid payload for priority algorithm test.');
    return res.status(400).json({ error: 'Please provide an array of notifications in the request body.' });
  }

  try {
    await Log('backend', 'info', 'service', `Running priority algorithm on ${notifications.length} items`);
    const t0 = process.hrtime();
    
    const sorted = runPriorityAlgorithm(notifications, limit || 10);
    
    const t1 = process.hrtime(t0);
    const executionTimeMs = (t1[0] * 1000) + (t1[1] / 1000000);
    
    res.status(200).json({
      message: 'Algorithm executed successfully',
      executionTimeMs: executionTimeMs.toFixed(3),
      data: sorted
    });
  } catch (error: any) {
    await Log('backend', 'error', 'handler', `Algorithm error: ${error.message}`);
    res.status(500).json({ error: 'Algorithm execution failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  Log('backend', 'info', 'config', `Server started on port ${PORT}`);
});
