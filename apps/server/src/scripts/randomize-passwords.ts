import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../modules/users/user.model';
import { Role } from '@attendme/shared';
import crypto from 'crypto';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/attendme';

async function randomize() {
  await mongoose.connect(MONGODB_URI);
  
  const users = await User.find({ role: { $in: [Role.TEACHER, Role.STUDENT] } });
  
  const results: string[] = [];
  results.push('# Generated Credentials\n');
  results.push('## Teachers');
  
  const teacherResults = [];
  const studentResults = [];

  for (const u of users) {
    const rawPassword = crypto.randomBytes(4).toString('hex'); // 8 char hex string
    const passwordHash = await bcrypt.hash(rawPassword, 12);
    
    await User.updateOne({ _id: u._id }, { passwordHash });
    
    const entry = `- **Email:** \`${u.email}\` | **Password:** \`${rawPassword}\``;
    if (u.role === Role.TEACHER) teacherResults.push(entry);
    if (u.role === Role.STUDENT) studentResults.push(entry);
  }
  
  console.log(results.join('\n'));
  console.log(teacherResults.join('\n'));
  console.log('\n## Students');
  console.log(studentResults.join('\n'));

  await mongoose.disconnect();
}

randomize().catch(console.error);
