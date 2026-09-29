import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
}

export interface ISemester extends Document {
  courseId: mongoose.Types.ObjectId;
  name: string;
  academicYear: string;
  sequence: number;
  isActive: boolean;
}

export interface IStudentSemesterMembership extends Document {
  studentId: mongoose.Types.ObjectId;
  semesterId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
}

const CourseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SemesterSchema = new Schema<ISemester>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    name: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    sequence: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const StudentSemesterMembershipSchema = new Schema<IStudentSemesterMembership>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: true },
  },
  { timestamps: true }
);

StudentSemesterMembershipSchema.index({ studentId: 1, isCurrent: 1 });
StudentSemesterMembershipSchema.index({ semesterId: 1 });

export const Course = mongoose.model<ICourse>('Course', CourseSchema);
export const Semester = mongoose.model<ISemester>('Semester', SemesterSchema);
export const StudentSemesterMembership = mongoose.model<IStudentSemesterMembership>(
  'StudentSemesterMembership',
  StudentSemesterMembershipSchema
);
