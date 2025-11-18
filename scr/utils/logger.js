/**
 * 중앙 로깅 시스템
 */
export const logger = {
  logs: [],

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { message, type, timestamp };
    this.logs.push(entry);
    console.log(`[${type.toUpperCase()}] ${message}`);
    return entry;
  },

  info(message) {
    return this.log(message, 'info');
  },

  success(message) {
    return this.log(message, 'success');
  },

  error(message) {
    return this.log(message, 'error');
  },

  getLogs() {
    return this.logs;
  },

  clearLogs() {
    this.logs = [];
  }
};
