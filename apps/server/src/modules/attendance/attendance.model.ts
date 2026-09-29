import mongoose, { Schema, Document } from 'mongoose';
import { AttendanceStatus } from '@attendme/shared';

export interface IAttendanceRecord extends Document {
  classSessionId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: AttendanceStatus;
  markedBy: mongoose.Types.ObjectId;
  markedAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    classSessionId: { type: Schema.Types.ObjectId, ref: 'ClassSession', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(AttendanceStatus), required: true },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    markedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AttendanceRecordSchema.index({ classSessionId: 1, studentId: 1 }, { unique: true });
AttendanceRecordSchema.index({ studentId: 1, classSessionId: 1 });

export const AttendanceRecord = mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);
