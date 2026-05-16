// ─── ROLES ────────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'directivo' | 'docente';

export type DirectivoSubRole =
  | 'director'
  | 'subdirector'
  | 'coordinador'
  | 'psicologo'
  | 'otro';

// ─── USUARIO ──────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  username: string;
  role: UserRole;
  subRole?: DirectivoSubRole;
  fullName: string;
  photoUrl?: string;
  courseId?: string;       // Curso principal asignado (solo docentes)
  assignedCourses?: string[];
  assignedSubjects?: string[];
  institutionId: string;
  createdAt: string;
  updatedAt: string;
}

// ─── INSTITUCIÓN ──────────────────────────────────────────────────────────────
export interface Institution {
  id: string;
  name: string;
  primaryColor: string;    // Hex, ej: "#1A3C5E"
  secondaryColor: string;
  logoUrl?: string;
  dataTermsAccepted: boolean;
  dataTermsAcceptedAt?: string;
  dataTermsAcceptedBy?: string;
  createdAt: string;
}

// ─── TOKEN DE ACCESO ──────────────────────────────────────────────────────────
export interface AccessToken {
  id: string;
  token: string;           // Código alfanumérico, ej: "EMAI-XXXX-YYYY"
  institutionName?: string;
  used: boolean;
  usedAt?: string;
  usedBy?: string;
  createdAt: string;
  expiresAt?: string;
}

// ─── CURSO ────────────────────────────────────────────────────────────────────
export interface Course {
  id: string;
  name: string;            // Ej: "2-2", "3-5"
  grade: string;           // Ej: "2"
  group: string;           // Ej: "2"
  institutionId: string;
  teacherId?: string;
  createdAt: string;
}

// ─── MATERIA ──────────────────────────────────────────────────────────────────
export interface Subject {
  id: string;
  name: string;            // Ej: "Matemáticas", "Geometría"
  baseType: 'matematicas' | 'otro';
  institutionId: string;
  courseId?: string;
}

// ─── ESTUDIANTE ───────────────────────────────────────────────────────────────
export interface Student {
  id: string;
  fullName: string;
  photoUrl?: string;
  courseId: string;
  institutionId: string;
  createdBy: string;       // userId del docente
  createdAt: string;
  updatedAt: string;
}

// ─── EXAMEN ───────────────────────────────────────────────────────────────────
export type ExamStatus = 'pending' | 'processing' | 'reviewed' | 'graded';

export interface Exam {
  id: string;
  name: string;            // Ej: "Examen factores segundo periodo"
  courseId: string;
  subjectId: string;
  teacherId: string;
  institutionId: string;
  status: ExamStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── RESULTADO DE EXAMEN POR ESTUDIANTE ───────────────────────────────────────
export type GradeColor = 'green' | 'red';

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  imageUrls: string[];     // 1–3 fotos del examen
  ocrRawText?: string;
  problems?: ExamProblem[];
  finalScore?: number;     // 1.0 – 5.0
  gradeColor?: GradeColor; // green >= 3.0
  teacherNotes?: string;
  status: ExamStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExamProblem {
  id: string;
  originalText: string;
  isCorrect: boolean;
  autoScore: number;
  teacherOverride?: boolean;
  teacherScore?: number;
}

// ─── SOPORTE ──────────────────────────────────────────────────────────────────
export interface SupportMessage {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromRole: UserRole;
  institutionId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  institution: Institution | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
