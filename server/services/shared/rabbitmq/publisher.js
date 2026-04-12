const { connectRabbitMQ, getChannel } = require('./connection');

const publishEvent = async (routingKey, payload) => {
  try {
    const channel = getChannel() || (await connectRabbitMQ());
    const message = Buffer.from(JSON.stringify(payload || {}));

    channel.publish('careline.events', routingKey, message, {
      contentType: 'application/json',
      persistent: true,
    });

    return true;
  } catch (error) {
    // Keep publish non-blocking for request paths that should still succeed without RabbitMQ.
    console.warn('[rabbitmq] publish skipped:', error?.message || error);
    return false;
  }
};

module.exports = {
  publishEvent,
};
