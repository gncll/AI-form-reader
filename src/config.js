const config = {
  API_BASE_URL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8001' 
    : ''
};

export default config;