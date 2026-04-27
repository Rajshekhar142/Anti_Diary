import 'dotenv/config';
import cors from 'cors';
import express, { Request, Response } from 'express';
import { Kafka, Producer, CompressionTypes, CompressionCodecs } from 'kafkajs';
import SnappyCodec from 'kafkajs-snappy';

CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;

const app = express();
app.use(cors());
app.use(express.json());

// 1. Direct Kafka setup
const kafka = new Kafka({
  clientId: 'ingestion-api',
  brokers: [process.env.REDPANDA_BROKER!],
  ssl: true,
  sasl: {
    mechanism: 'scram-sha-256',
    username: process.env.REDPANDA_USERNAME!,
    password: process.env.REDPANDA_PASSWORD!,
  },
  retry: {
    initialRetryTime: 300,
    retries: 3,
  },
});

const producer: Producer = kafka.producer();

const initKafka = async () => {
  console.log(`Connecting to Redpanda at ${process.env.REDPANDA_BROKER}...`);
  await producer.connect();
  console.log('✅ Connected to Redpanda');
};

// 2. Request body type
interface LogBody {
  userId: string;
  taskName: string;
  startTime: string;
  endTime: string;
  logText?: string;
  category?: string;
}

// 3. API Endpoint
app.post('/api/logs', async (req: Request<{}, {}, LogBody>, res: Response) => {
  const { userId, taskName, startTime, endTime } = req.body;

  if (!userId || !taskName || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await producer.send({
      topic: 'time-logs-topic',
      messages: [{ key: userId, value: JSON.stringify(req.body) }],
    });
    console.log(`✅ Queued log for user=${userId} task=${taskName}`);
    res.status(202).json({ status: 'Log accepted and queued via Redpanda' });
  } catch (error) {
    console.error('❌ Error publishing to Redpanda:', error);
    res.status(500).json({ error: 'Failed to queue log' });
  }
});

// 4. Start Server
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, async () => {
  console.log(`Ingestion API running on port ${PORT}`);
  await initKafka().catch((err) => {
    console.error('❌ Redpanda connection failed:', err.message);
    process.exit(1);
  });
});

// 5. Graceful Shutdown
const shutdown = async () => {
  console.log('\nShutting down Ingestion API gracefully...');
  await producer.disconnect();
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);