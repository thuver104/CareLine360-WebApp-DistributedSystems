const format = (level, message, meta) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service: process.env.SERVICE_NAME || 'service',
    message,
    ...(meta && Object.keys(meta).length ? { meta } : {}),
  };
  return JSON.stringify(payload);
};

module.exports = {
  info: (message, meta = {}) => console.log(format('info', message, meta)),
  warn: (message, meta = {}) => console.warn(format('warn', message, meta)),
  error: (message, meta = {}) => console.error(format('error', message, meta)),
  debug: (message, meta = {}) => console.debug(format('debug', message, meta)),
};
