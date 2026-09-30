/**
 * seed-s5-timetable.ts
 *
 * Seeds the V FYIMP Semester 5 timetable (Odd Semester 2026-27) into MongoDB.
 *
 * Schedule (all slots are 1 hour):
 *   09:30–10:30 | 10:30–11:30 | 11:30–12:30 | (Lunch 12:30–13:30) | 13:30–14:30 | 14:30–15:30 | 15:30–16:30
 *
 * Subject mapping:
 *   S5_JAVA  – Java Technologies        (sreekala pola)
 *   S5_SE    – Software Engineering     (newteacher / SA)
 *   S5_ML    – Machine Learning         (arunodhaya / AKN)
 *   S5_CN    – Computer Network         (Athulya / NK)
 *   S5_PY    – Data Processing (Python) (reema / RIV)  ← SEC: PY
 *   S5_CLOUD – Cloud, Edge & Fog        (shyma / SPV)  ← DSE: Cloud
 *
 * Usage:
 *   MONGODB_URI="<uri>" npx tsx apps/server/src/scripts/seed-s5-timetable.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from '../config';
import { Semester } from '../modules/courses/course.model';
import { Paper } from '../modules/papers/paper.model';
import { TimetableEntry } from '../modules/timetable/timetable.model';
import { DayOfWeek } from '@attendme/shared';

async function seed() {
  await mongoose.connect(config.mongoUri);
  console.log('✅ Connected to MongoDB.');

  // ── Locate Semester 5 ───────────────────────────────────────────────────────
  const semester = await Semester.findOne({ name: /Semester 5/i });
  if (!semester) {
    console.error('❌ Semester 5 not found. Run seed-fyimp.ts first.');
    process.exit(1);
  }
  console.log(`📚 Found semester: ${semester.name} (${semester._id})`);

  // ── Locate Papers ──────────────────────────────────────────────────────────
  const papers = await Paper.find({ semesterId: semester._id });
  if (papers.length === 0) {
    console.error('❌ No papers found for Semester 5.');
    process.exit(1);
  }

  const find = (codePart: string) => {
    const p = papers.find(
      (x) => x.code.toUpperCase().includes(codePart.toUpperCase())
    );
    if (!p) throw new Error(`Paper containing code "${codePart}" not found.`);
    return p;
  };

  const JAVA  = find('JAVA');
  const SE    = find('SE');
  const ML    = find('ML');
  const CN    = find('CN');
  const PY    = find('PY');    // SEC: Python
  const CLOUD = find('CLOUD'); // DSE: Cloud

  // ── Wipe old entries for this semester ─────────────────────────────────────
  const deleted = await TimetableEntry.deleteMany({ semesterId: semester._id });
  console.log(`🗑  Removed ${deleted.deletedCount} old timetable entries.`);

  // ── Build schedule from the image ─────────────────────────────────────────
  // Rows: 09:30 | 10:30 | 11:30 | --- lunch --- | 13:30 | 14:30 | 15:30
  // Slots labelled "(Lab)" span two columns in the image; we model each column
  // as an identical separate entry so the grid shows it in both slots.

  const T1 = '09:30'; const T1E = '10:30';
  const T2 = '10:30'; const T2E = '11:30';
  const T3 = '11:30'; const T3E = '12:30';
  const T4 = '13:30'; const T4E = '14:30';
  const T5 = '14:30'; const T5E = '15:30';
  const T6 = '15:30'; const T6E = '16:30';

  const schedule: Array<{
    day: DayOfWeek;
    startTime: string;
    endTime: string;
    paper: typeof JAVA;
  }> = [
    // ── MONDAY ────────────────────────────────────────────────────────────────
    // 09:30–10:30  Java Lab (SRP/SA)
    { day: DayOfWeek.MONDAY, startTime: T1, endTime: T1E, paper: JAVA },
    // 10:30–11:30  Java Lab (SRP/SA)
    { day: DayOfWeek.MONDAY, startTime: T2, endTime: T2E, paper: JAVA },
    // 11:30–12:30  DSE (SPV) → Cloud
    { day: DayOfWeek.MONDAY, startTime: T3, endTime: T3E, paper: CLOUD },
    // 13:30–14:30  CN (NK)
    { day: DayOfWeek.MONDAY, startTime: T4, endTime: T4E, paper: CN },
    // 14:30–15:30  ML Lab (AKN/SCV)
    { day: DayOfWeek.MONDAY, startTime: T5, endTime: T5E, paper: ML },
    // 15:30–16:30  ML Lab (AKN/SCV)
    { day: DayOfWeek.MONDAY, startTime: T6, endTime: T6E, paper: ML },

    // ── TUESDAY ───────────────────────────────────────────────────────────────
    // 09:30–10:30  SE (SA)
    { day: DayOfWeek.TUESDAY, startTime: T1, endTime: T1E, paper: SE },
    // 10:30–11:30  SE (SA)
    { day: DayOfWeek.TUESDAY, startTime: T2, endTime: T2E, paper: SE },
    // 11:30–12:30  Java (SRP)
    { day: DayOfWeek.TUESDAY, startTime: T3, endTime: T3E, paper: JAVA },
    // 13:30–14:30  DSE (SPV) → Cloud
    { day: DayOfWeek.TUESDAY, startTime: T4, endTime: T4E, paper: CLOUD },
    // 14:30–15:30  CN Lab (NK/RIV)
    { day: DayOfWeek.TUESDAY, startTime: T5, endTime: T5E, paper: CN },
    // 15:30–16:30  CN Lab (NK/RIV)
    { day: DayOfWeek.TUESDAY, startTime: T6, endTime: T6E, paper: CN },

    // ── WEDNESDAY ─────────────────────────────────────────────────────────────
    // 09:30–10:30  CN Lab (NK/SA)
    { day: DayOfWeek.WEDNESDAY, startTime: T1, endTime: T1E, paper: CN },
    // 10:30–11:30  CN Lab (NK/SA)
    { day: DayOfWeek.WEDNESDAY, startTime: T2, endTime: T2E, paper: CN },
    // 11:30–12:30  ML (AKN)
    { day: DayOfWeek.WEDNESDAY, startTime: T3, endTime: T3E, paper: ML },
    // 13:30–14:30  DSE (SPV) → Cloud
    { day: DayOfWeek.WEDNESDAY, startTime: T4, endTime: T4E, paper: CLOUD },
    // 14:30–15:30  ML Lab (AKN/RIV)
    { day: DayOfWeek.WEDNESDAY, startTime: T5, endTime: T5E, paper: ML },
    // 15:30–16:30  ML Lab (AKN/RIV)
    { day: DayOfWeek.WEDNESDAY, startTime: T6, endTime: T6E, paper: ML },

    // ── THURSDAY ──────────────────────────────────────────────────────────────
    // 09:30–10:30  ML (AKN)
    { day: DayOfWeek.THURSDAY, startTime: T1, endTime: T1E, paper: ML },
    // 10:30–11:30  Java (SRP)
    { day: DayOfWeek.THURSDAY, startTime: T2, endTime: T2E, paper: JAVA },
    // 11:30–12:30  DSE (SPV) → Cloud
    { day: DayOfWeek.THURSDAY, startTime: T3, endTime: T3E, paper: CLOUD },
    // 13:30–14:30  SEC (RIV) → PY
    { day: DayOfWeek.THURSDAY, startTime: T4, endTime: T4E, paper: PY },
    // 14:30–15:30  SEC Lab (RIV/SPV)
    { day: DayOfWeek.THURSDAY, startTime: T5, endTime: T5E, paper: PY },
    // 15:30–16:30  SEC Lab (RIV/SPV)
    { day: DayOfWeek.THURSDAY, startTime: T6, endTime: T6E, paper: PY },

    // ── FRIDAY ────────────────────────────────────────────────────────────────
    // 09:30–10:30  SE (SA)
    { day: DayOfWeek.FRIDAY, startTime: T1, endTime: T1E, paper: SE },
    // 10:30–11:30  SE (SA)
    { day: DayOfWeek.FRIDAY, startTime: T2, endTime: T2E, paper: SE },
    // 11:30–12:30  SEC (RIV) → PY
    { day: DayOfWeek.FRIDAY, startTime: T3, endTime: T3E, paper: PY },
    // 13:30–14:30  CN (NK)
    { day: DayOfWeek.FRIDAY, startTime: T4, endTime: T4E, paper: CN },
    // 14:30–15:30  Java Lab (SRP/SMT)
    { day: DayOfWeek.FRIDAY, startTime: T5, endTime: T5E, paper: JAVA },
    // 15:30–16:30  Java Lab (SRP/SMT)
    { day: DayOfWeek.FRIDAY, startTime: T6, endTime: T6E, paper: JAVA },
  ];

  // ── Insert ─────────────────────────────────────────────────────────────────
  await Promise.all(
    schedule.map((s) =>
      TimetableEntry.create({
        semesterId: semester._id,
        paperId:    s.paper._id,
        teacherId:  s.paper.teacherId,
        dayOfWeek:  s.day,
        startTime:  s.startTime,
        endTime:    s.endTime,
      })
    )
  );

  console.log(`✅ Inserted ${schedule.length} timetable entries for Semester 5.`);
  console.log('\n📅 Schedule summary:');
  console.log('  MON: Java Lab · Java Lab · Cloud · CN · ML Lab · ML Lab');
  console.log('  TUE: SE · SE · Java · Cloud · CN Lab · CN Lab');
  console.log('  WED: CN Lab · CN Lab · ML · Cloud · ML Lab · ML Lab');
  console.log('  THU: ML · Java · Cloud · PY(SEC) · PY Lab · PY Lab');
  console.log('  FRI: SE · SE · PY(SEC) · CN · Java Lab · Java Lab');

  await mongoose.disconnect();
  console.log('\n🎉 Done!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
