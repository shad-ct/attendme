const mongoose = require('mongoose');
const { User } = require('./apps/server/dist/modules/users/user.model.js');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendme';
  await mongoose.connect(uri);
  const users = await mongoose.connection.collection('users').find({}).toArray();
  for (const u of users) {
    console.log(`${u.role}: ${u.email}`);
  }
  process.exit(0);
}
main().catch(console.error);
