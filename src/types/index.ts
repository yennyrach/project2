export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  isVerified: boolean;
  createdAt: string;
  department?: string;
  phoneNumber?: string;
  lastLogin?: string;
  isActive?: boolean;
}

export interface Role {
  type: 'admin' | 'coordinator' | 'reviewer' | 'lecturer';
  permissions: string[];
}

export interface Question {
  id: string;
  clinicalVignette: string; // Mandatory: Clinical scenario or case presentation
  leadQuestion: string; // Mandatory: Main question based on the vignette
  type: 'multiple-choice' | 'short-answer' | 'essay' | 'true-false';
  subject: string;
  topic: string;
  options: string[]; // Exactly 5 options (1 correct + 4 distractors)
  correctAnswer?: string;
  distractorOptions: string[]; // Exactly 4 distractor options
  explanation?: string;
  authorId: string;
  authorName: string;
  status: 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected' | 'needs-revision';
  reviewerId?: string;
  reviewerName?: string;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  additionalPictureLink?: string;
  references?: string;
  learningObjective: string[]; // Multiple choice allowed, mandatory
  pathomecanism: 'congenital' | 'infection' | 'inflammation' | 'degenerative' | 'neoplasm' | 'trauma' | 'metabolism' | 'non-applicable'; // Single choice, mandatory
  aspect: 'knowledge' | 'procedural-knowledge' | 'attitude' | 'health-system'; // Single choice, mandatory
  disease?: string;
  reviewer1?: string;
  reviewer2?: string;
  reviewerComment?: string;
}

export interface ExamBook {
  id: string;
  title: string;
  description: string;
  subject: string;
  totalPoints: number;
  duration: number; // in minutes
  instructions: string;
  questions: string[]; // question IDs
  createdBy: string;
  createdAt: string;
  status: 'draft' | 'finalized' | 'published';
  semester: string;
  academicYear: string;
}

export interface ReviewAssignment {
  id: string;
  questionId: string;
  reviewerId: string;
  assignedAt: string;
  dueDate: string;
  status: 'pending' | 'completed';
}

export interface Notification {
  id: string;
  userId: string;
  type: 'question-submitted' | 'review-assigned' | 'question-approved' | 'question-rejected' | 'revision-requested';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface ExamBookQuestion {
  questionId: string;
  points: number;
  order: number;
}

export interface ExamBookTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  questions: ExamBookQuestion[];
  totalPoints: number;
  duration: number; // in minutes
  instructions: string;
  createdBy: string;
  createdAt: string;
  status: 'draft' | 'published';
}