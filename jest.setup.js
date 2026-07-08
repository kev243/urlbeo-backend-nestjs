// Set up environment variables for tests
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/urlbeo_test';
process.env.NODE_ENV = 'test';
