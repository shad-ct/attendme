import mongoose, { Schema, Document } from 'mongoose';
import { AssessmentStatus, AssessmentType } from '@attendme/shared';

export interface IAssessment extends Document {
  paperId: mongoose.Types.ObjectId;
  semesterId: mongoose.Types.ObjectId;
  title: string;
  type: AssessmentType;
  date?: Date;
  maxMarks: number;
  weightage?: number;
  description?: string;
  status: AssessmentStatus;
  createdBy: mongoose.Types.ObjectId;
}

export interface IAssessmentMark extends Document {
  assessmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  marks: number;
  enteredBy: mongoose.Types.ObjectId;
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    paperId: { type: Schema.Types.ObjectId, ref: 'Paper', required: true },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(AssessmentType), required: true },
    date: { type: Date },
    maxMarks: { type: Number, required: true, min: 0 },
    weightage: { type: Number },
    description: { type: String, trim: true },
    status: { type: String, enum: Object.values(AssessmentStatus), default: AssessmentStatus.DRAFT },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

AssessmentSchema.index({ paperId: 1, status: 1 });

const AssessmentMarkSchema = new Schema<IAssessmentMark>(
  {
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    marks: { type: Number, required: true, min: 0 },
    enteredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

AssessmentMarkSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });

export const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema);
export const AssessmentMark = mongoose.model<IAssessmentMark>('AssessmentMark', AssessmentMarkSchema);
