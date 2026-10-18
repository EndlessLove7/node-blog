const app = require('./src/app');
const prisma = require('./src/repository/prisma');
const { PORT } = require('./src/config');

let server;

prisma.$connect().then(() => {
  server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`Blog API server is running at http://127.0.0.1:${PORT}`);
  });
}).catch(async (error) => {
  console.error('Database connection failed; API server was not started:', error);
  process.exitCode = 1;
  await prisma.$disconnect();
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  if (!server) {
    await prisma.$disconnect();
    return;
  }
  server.close(async (error) => {
    if (error) {
      console.error('HTTP server shutdown failed:', error);
      process.exitCode = 1;
    }
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Database shutdown failed:', disconnectError);
      process.exitCode = 1;
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
