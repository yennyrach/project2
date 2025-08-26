import React, { createContext, useContext, useState, useEffect } from 'react';
import { Question } from '../types';
import { mockQuestions } from '../data/mockData';
import { QuestionStorage } from '../utils/storage';

interface QuestionContextType {
  questions: Question[];
  addQuestion: (question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateQuestion: (id: string, updates: Partial<Question>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  getQuestionsByAuthor: (authorId: string) => Question[];
  getQuestionsByStatus: (status: Question['status']) => Question[];
  refreshQuestions: () => void;
  exportQuestions: () => void;
}

const QuestionContext = createContext<QuestionContextType | undefined>(undefined);

export const QuestionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize with mock data and load from localStorage
  useEffect(() => {
    const savedQuestions = QuestionStorage.loadQuestions();
    
    if (savedQuestions && savedQuestions.length > 0) {
      setQuestions(savedQuestions);
      console.log(`Loaded ${savedQuestions.length} questions from storage`);
    } else {
      console.log('No saved questions found, loading mock data');
      setQuestions(mockQuestions);
    }
    
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever questions change
  useEffect(() => {
    if (isInitialized && questions.length > 0) {
      const success = QuestionStorage.saveQuestions(questions);
      if (!success) {
        console.error('Failed to save questions - data may be lost');
        // Could trigger a user notification here
      }
    }
  }, [questions, isInitialized]);

  const addQuestion = async (questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    return new Promise((resolve) => {
      console.log('Adding new question:', questionData);
      
      // Validate required fields
      if (!questionData.clinicalVignette || !questionData.leadQuestion || !questionData.subject) {
        reject(new Error('Missing required fields'));
        return;
      }
      
      const newQuestion: Question = {
        ...questionData,
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };

      console.log('Created question object:', newQuestion);
      
      setQuestions(prev => {
        const updated = [newQuestion, ...prev];
        console.log('Question added to state, new total:', updated.length);
        return updated;
      });
      
      // Small delay to ensure state update completes
      setTimeout(() => {
        resolve(newQuestion.id);
      }, 100);
    });
  };

  const updateQuestion = async (id: string, updates: Partial<Question>): Promise<void> => {
    return new Promise((resolve) => {
      setQuestions(prev => prev.map(q => 
        q.id === id 
          ? { ...q, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
          : q
      ));
      resolve();
    });
  };

  const deleteQuestion = async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      setQuestions(prev => prev.filter(q => q.id !== id));
      resolve();
    });
  };

  const getQuestionsByAuthor = (authorId: string): Question[] => {
    return questions.filter(q => q.authorId === authorId);
  };

  const getQuestionsByStatus = (status: Question['status']): Question[] => {
    return questions.filter(q => q.status === status);
  };

  const refreshQuestions = () => {
    const savedQuestions = QuestionStorage.loadQuestions();
    if (savedQuestions) {
      setQuestions(savedQuestions);
      console.log('Questions refreshed from storage');
    }
  };

  const exportQuestions = () => {
    QuestionStorage.exportQuestions(questions);
  };
  return (
    <QuestionContext.Provider value={{
      questions,
      addQuestion,
      updateQuestion,
      deleteQuestion,
      getQuestionsByAuthor,
      getQuestionsByStatus,
      refreshQuestions,
      exportQuestions,
    }}>
      {children}
    </QuestionContext.Provider>
  );
};

export const useQuestions = () => {
  const context = useContext(QuestionContext);
  if (context === undefined) {
    throw new Error('useQuestions must be used within a QuestionProvider');
  }
  return context;
};