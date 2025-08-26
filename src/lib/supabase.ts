import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (will be generated from your schema)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          department: string | null
          phone_number: string | null
          title: string | null
          bio: string | null
          office_location: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          department?: string | null
          phone_number?: string | null
          title?: string | null
          bio?: string | null
          office_location?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          department?: string | null
          phone_number?: string | null
          title?: string | null
          bio?: string | null
          office_location?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_type: 'admin' | 'coordinator' | 'reviewer' | 'lecturer'
          permissions: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role_type: 'admin' | 'coordinator' | 'reviewer' | 'lecturer'
          permissions: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role_type?: 'admin' | 'coordinator' | 'reviewer' | 'lecturer'
          permissions?: string[]
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          clinical_vignette: string
          lead_question: string
          type: 'multiple-choice' | 'short-answer' | 'essay' | 'true-false'
          subject: string
          topic: string
          options: string[]
          correct_answer: string | null
          distractor_options: string[]
          explanation: string | null
          author_id: string
          status: 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected' | 'needs-revision'
          reviewer_id: string | null
          feedback: string | null
          created_at: string
          updated_at: string
          tags: string[]
          additional_picture_link: string | null
          references: string | null
          learning_objective: string[]
          pathomecanism: 'congenital' | 'infection' | 'inflammation' | 'degenerative' | 'neoplasm' | 'trauma' | 'metabolism' | 'non-applicable'
          aspect: 'knowledge' | 'procedural-knowledge' | 'attitude' | 'health-system'
          disease: string | null
          reviewer1: string | null
          reviewer2: string | null
          reviewer_comment: string | null
        }
        Insert: {
          id?: string
          clinical_vignette: string
          lead_question: string
          type?: 'multiple-choice' | 'short-answer' | 'essay' | 'true-false'
          subject: string
          topic: string
          options?: string[]
          correct_answer?: string | null
          distractor_options?: string[]
          explanation?: string | null
          author_id: string
          status?: 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected' | 'needs-revision'
          reviewer_id?: string | null
          feedback?: string | null
          created_at?: string
          updated_at?: string
          tags?: string[]
          additional_picture_link?: string | null
          references?: string | null
          learning_objective?: string[]
          pathomecanism?: 'congenital' | 'infection' | 'inflammation' | 'degenerative' | 'neoplasm' | 'trauma' | 'metabolism' | 'non-applicable'
          aspect?: 'knowledge' | 'procedural-knowledge' | 'attitude' | 'health-system'
          disease?: string | null
          reviewer1?: string | null
          reviewer2?: string | null
          reviewer_comment?: string | null
        }
        Update: {
          id?: string
          clinical_vignette?: string
          lead_question?: string
          type?: 'multiple-choice' | 'short-answer' | 'essay' | 'true-false'
          subject?: string
          topic?: string
          options?: string[]
          correct_answer?: string | null
          distractor_options?: string[]
          explanation?: string | null
          author_id?: string
          status?: 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected' | 'needs-revision'
          reviewer_id?: string | null
          feedback?: string | null
          created_at?: string
          updated_at?: string
          tags?: string[]
          additional_picture_link?: string | null
          references?: string | null
          learning_objective?: string[]
          pathomecanism?: 'congenital' | 'infection' | 'inflammation' | 'degenerative' | 'neoplasm' | 'trauma' | 'metabolism' | 'non-applicable'
          aspect?: 'knowledge' | 'procedural-knowledge' | 'attitude' | 'health-system'
          disease?: string | null
          reviewer1?: string | null
          reviewer2?: string | null
          reviewer_comment?: string | null
        }
      }
      exam_books: {
        Row: {
          id: string
          title: string
          description: string
          subject: string
          total_points: number
          duration: number
          instructions: string
          questions: string[]
          created_by: string
          created_at: string
          status: 'draft' | 'finalized' | 'published'
          semester: string
          academic_year: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          subject: string
          total_points?: number
          duration?: number
          instructions?: string
          questions?: string[]
          created_by: string
          created_at?: string
          status?: 'draft' | 'finalized' | 'published'
          semester?: string
          academic_year?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          subject?: string
          total_points?: number
          duration?: number
          instructions?: string
          questions?: string[]
          created_by?: string
          created_at?: string
          status?: 'draft' | 'finalized' | 'published'
          semester?: string
          academic_year?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}