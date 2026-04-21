const express = require('express');
const { Kafka } = require('kafkajs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());


// 1. Connect to Kafka using the Docker environment variable
const kafkaBroker = process.env.KAFKA_BROKER || 'localhost:9092';
const kafka = new Kafka({
  clientId: 'ingestion-api',
  brokers: [kafkaBroker] 
});

const producer = kafka.producer();

const initKafka = async () => {
  try {
    await producer.connect();
    console.log(`Kafka Producer connected securely to ${kafkaBroker}`);
  } catch (error) {
    console.error('Kafka connection error:', error);
  }
};
initKafka();

// 2. API Endpoint
app.post('/api/logs', async (req, res) => {
  const { userId, taskName, startTime, endTime, logText, category } = req.body;

  if (!userId || !taskName || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await producer.send({
      topic: 'time-logs-topic',
      messages: [
        {
          key: userId, 
          value: JSON.stringify(req.body)
        }
      ],
    });
    res.status(202).json({ status: 'Log accepted and queued via new broker' }); 
  } catch (error) {
    console.error('Error publishing to Kafka:', error);
    res.status(500).json({ error: 'Failed to queue log' });
  }
});

const PORT = 3001;
const server = app.listen(PORT, () => console.log(`Ingestion API running on port ${PORT}`));

// 3. Graceful Shutdown
const shutdown = async () => {
  console.log('\nShutting down Ingestion API gracefully...');
  await producer.disconnect();
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);