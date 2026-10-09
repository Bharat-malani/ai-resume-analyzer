const axios = require('axios');

function getAiServiceUrl() {
  let url = (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000').trim();
  // Ensure http or https protocol exists
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  // Strip trailing slashes
  return url.replace(/\/+$/, '');
}

/**
 * Executes an AI service HTTP request with automatic retry for cloud cold-starts.
 * Free tier hosting (e.g. Render) spins down inactive containers and returns 502/503
 * while booting up (30-50s). This retries gracefully with backoff.
 */
async function callAiWithRetry(requestFn, maxRetries = 3, initialDelayMs = 4000) {
  let lastErr = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (err) {
      lastErr = err;
      const status = err.response?.status;
      // Retry on 502 (Bad Gateway), 503 (Service Unavailable), 504 (Gateway Timeout), or connection errors
      const isRecoverable = (status >= 502 && status <= 504) ||
                            err.code === 'ECONNRESET' ||
                            err.code === 'ECONNREFUSED' ||
                            err.code === 'ETIMEDOUT';

      if (!isRecoverable || attempt === maxRetries) {
        throw err;
      }
      const delay = initialDelayMs * attempt;
      console.warn(`[AI Service Cold-Start] Attempt ${attempt} failed (${status ? 'HTTP ' + status : err.code}). Retrying in ${delay / 1000}s while Render container wakes up...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastErr;
}

module.exports = { getAiServiceUrl, callAiWithRetry };

