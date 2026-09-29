import mongoose, { Schema, Document } from 'mongoose';
import { DayOfWeek, SessionStatus } from '@attendme/shared';

export interface ITimetableEntry extends Document {
  semesterId: mongoose.Types.ObjectId;
  paperId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  isActive: boolean;
}

export interface IClassSession extends Document {
  timetableEntryId?: mongoose.Types.ObjectId;
  semesterId: mongoose.Types.ObjectId;
  paperId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  status: SessionStatus;
}

const TimetableEntrySchema = new Schema<ITimetableEntry>(
  {
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
    paperId: { type: Schema.Types.ObjectId, ref: 'Paper', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dayOfWeek: { type: String, enum: Object.values(DayOfWeek), required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TimetableEntrySchema.index({ semesterId: 1, dayOfWeek: 1 });
TimetableEntrySchema.index({ teacherId: 1, dayOfWeek: 1 });

const ClassSessionSchema = new Schema<IClassSession>(
  {
    timetableEntryId: { type: Schema.Types.ObjectId, ref: 'TimetableEntry' },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
    paperId: { type: Schema.Types.ObjectId, ref: 'Paper', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: { type: String, enum: Object.values(SessionStatus), default: SessionStatus.SCHEDULED },
  },
  { timestamps: true }
);

ClassSessionSchema.index({ semesterId: 1, date: 1 });
ClassSessionSchema.index({ teacherId: 1, date: 1 });
ClassSessionSchema.index({ timetableEntryId: 1, date: 1 }, { unique: true, sparse: true });

export const TimetableEntry = mongoose.model<ITimetableEntry>('TimetableEntry', TimetableEntrySchema);
export const ClassSession = mongoose.model<IClassSession>('ClassSession', ClassSessionSchema);
