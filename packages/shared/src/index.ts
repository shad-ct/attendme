// ============================================================
// Roles
// ============================================================
export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

// ============================================================
// Attendance statuses
// ============================================================
export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
}

// ============================================================
// Class session statuses
// ============================================================
export enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// ============================================================
// Assessment lifecycle
// ============================================================
export enum AssessmentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  LOCKED = 'LOCKED',
}

// ============================================================
// Assessment types
// ============================================================
export enum AssessmentType {
  CE = 'CE',
  ASSIGNMENT = 'ASSIGNMENT',
  INTERNAL_EXAM = 'INTERNAL_EXAM',
  QUIZ = 'QUIZ',
  SEMINAR = 'SEMINAR',
  OTHER = 'OTHER',
}

// ============================================================
// Event types
// ============================================================
export enum EventType {
  ASSIGNMENT = 'ASSIGNMENT',
  EXAM = 'EXAM',
  QUIZ = 'QUIZ',
  SEMINAR = 'SEMINAR',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  OTHER = 'OTHER',
}

// ============================================================
// Event lifecycle
// ============================================================
export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

// ============================================================
// Notification types
// ============================================================
export enum NotificationType {
  NEW_ASSIGNMENT = 'NEW_ASSIGNMENT',
  NEW_EXAM = 'NEW_EXAM',
  TIMETABLE_CHANGE = 'TIMETABLE_CHANGE',
  MARKS_PUBLISHED = 'MARKS_PUBLISHED',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  ATTENDANCE_WARNING = 'ATTENDANCE_WARNING',
}

// ============================================================
// Days of week
// ============================================================
export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

// ============================================================
// API response shapes
// ============================================================
export interface ApiSuccess<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ============================================================
// Common DTO types
// ============================================================
export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}
