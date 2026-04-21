const { Kafka } = require('kafkajs');

const kafka = new Kafka({ clientId: 'test-app', brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'test-group' });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'time-logs-topic', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log('\n--- Message Received ---');
      console.log(`Key: ${message.key.toString()}`);
      console.log(`Value: ${message.value.toString()}`);
    },
  });
};

run().catch(console.error);