const logger = {
  info: (message, data = {}) => {
    console.log(`[INFO] ${message}`, data);
  },
  error: (message, error = {}) => {
    console.error(`[ERROR] ${message}`, error);
  },
  warn: (message, data = {}) => {
    console.warn(`[WARN] ${message}`, data);
  }
};

module.exports = logger;