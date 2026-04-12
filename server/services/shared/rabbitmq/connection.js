const amqplib = require('amqplib');

let connection = null;
let channel = null;

const getRabbitUrl = () =>
  process.env.RABBITMQ_URL || 'amqp://careline-rabbit:5672';

const connectRabbitMQ = async () => {
  if (channel) {
    return channel;
  }

  connection = await amqplib.connect(getRabbitUrl());
  channel = await connection.createChannel();
  await channel.assertExchange('careline.events', 'topic', { durable: true });
  return channel;
};

const getChannel = () => channel;

module.exports = {
  connectRabbitMQ,
  getChannel,
};
