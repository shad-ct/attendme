import mongoose, { Schema, Document } from 'mongoose';

export interface IPaper extends Document {
  code: string;
  name: string;
  credits?: number;
  semesterId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  isActive: boolean;
}

const PaperSchema = new Schema<IPaper>(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    credits: { type: Number },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PaperSchema.index({ semesterId: 1, isActive: 1 });
PaperSchema.index({ teacherId: 1, isActive: 1 });
// A single paper code should be unique per semester
PaperSchema.index({ code: 1, semesterId: 1 }, { unique: true });

export const Paper = mongoose.model<IPaper>('Paper', PaperSchema);
