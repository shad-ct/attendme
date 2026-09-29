import mongoose, { Schema, Document } from 'mongoose';
import { EventType, EventStatus } from '@attendme/shared';

export interface IEvent extends Document {
  type: EventType;
  title: string;
  semesterId: mongoose.Types.ObjectId;
  paperId?: mongoose.Types.ObjectId;
  description?: string;
  eventDate?: Date;
  dueDate?: Date;
  expectedMarks?: number;
  status: EventStatus;
  createdBy: mongoose.Types.ObjectId;
}

const EventSchema = new Schema<IEvent>(
  {
    type: { type: String, enum: Object.values(EventType), required: true },
    title: { type: String, required: true, trim: true },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
    paperId: { type: Schema.Types.ObjectId, ref: 'Paper' },
    description: { type: String, trim: true },
    eventDate: { type: Date },
    dueDate: { type: Date },
    expectedMarks: { type: Number },
    status: { type: String, enum: Object.values(EventStatus), default: EventStatus.DRAFT },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

EventSchema.index({ semesterId: 1, status: 1 });
EventSchema.index({ semesterId: 1, dueDate: 1 });

export const Event = mongoose.model<IEvent>('Event', EventSchema);
