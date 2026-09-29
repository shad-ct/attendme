import app from './app';
import { config } from './config';
import { connectDB } from './config/database';

async function main() {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`🚀 AttendMe server running on http://localhost:${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
