function getAiServiceUrl() {
  let url = (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000').trim();
  // Ensure http or https protocol exists
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  // Strip trailing slashes
  return url.replace(/\/+$/, '');
}

module.exports = { getAiServiceUrl };
