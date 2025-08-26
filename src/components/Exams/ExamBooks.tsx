import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuestions } from '../../context/QuestionContext';
import { ExamBook, Question } from '../../types';
import { mockExamBooks } from '../../data/mockData';
import { ExamBookStorage } from '../../utils/examBookStorage';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  Users, 
  FileText,
  Calendar,
  CheckCircle,
  AlertTriangle,
  X,
  Save,
  Download
} from 'lucide-react';

interface ExamBooksProps {
  shouldOpenCreateModal?: boolean;
  onModalOpened?: () => void;
}

export const ExamBooks: React.FC<ExamBooksProps> = ({ 
  shouldOpenCreateModal = false, 
  onModalOpened 
}) => {
  const { user, hasRole } = useAuth();
  const { questions } = useQuestions();
  const [examBooks, setExamBooks] = useState<ExamBook[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedExam, setSelectedExam] = useState<ExamBook | null>(null);
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFinalizingExam, setIsFinalizingExam] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const [newExamData, setNewExamData] = useState({
    title: '',
    description: '',
    subject: 'General',
    totalPoints: 100,
    duration: 120,
    instructions: '',
    semester: '',
    academicYear: '',
    selectedQuestions: [] as string[]
  });

  const [editExamData, setEditExamData] = useState({
    title: '',
    description: '',
    subject: '',
    totalPoints: 100,
    duration: 120,
    instructions: '',
    semester: '',
    academicYear: '',
    selectedQuestions: [] as string[]
  });

  // Load exam books from storage on component mount
  useEffect(() => {
    const loadExamBooks = () => {
      const storageResult = ExamBookStorage.load();
      if (storageResult.success && storageResult.data) {
        setExamBooks(storageResult.data);
      } else {
        // If no stored data or error, use mock data
        setExamBooks(mockExamBooks);
        // Save mock data to storage for future use
        ExamBookStorage.save(mockExamBooks);
      }
    };

    loadExamBooks();
  }, []);

  // Handle external trigger to open create modal
  useEffect(() => {
    if (shouldOpenCreateModal) {
      handleCreateExam();
      if (onModalOpened) {
        onModalOpened();
      }
    }
  }, [shouldOpenCreateModal, onModalOpened]);

  if (!user) return null;

  let subjects = [...new Set(questions.map(q => q.subject))];

  // Access control: Filter exam books based on user role and ownership
  const getAccessibleExamBooks = (): ExamBook[] => {
    if (!user) return [];
    
    // Admin users can see all exam books
    if (hasRole('admin')) {
      return examBooks;
    }
    
    // Regular users can only see exam books they created
    return examBooks.filter(examBook => examBook.createdBy === user.id);
  };

  // Filter exam books - only show finalized and published exams in main list
  const getFilteredExamBooks = (): ExamBook[] => {
    const accessibleExamBooks = getAccessibleExamBooks();
    
    return accessibleExamBooks.filter(exam => {
      const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exam.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exam.subject.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSubject = selectedSubject === 'all' || exam.subject === selectedSubject;

      return matchesSearch && matchesSubject;
    });
  };

  const filteredExamBooks = getFilteredExamBooks();

  // Update subjects list to only include subjects from accessible exam books
  const accessibleExamBooks = getAccessibleExamBooks();
  subjects = [...new Set(accessibleExamBooks.map(q => q.subject))];

  const resetNewExamForm = () => {
    setNewExamData({
      title: '',
      description: '',
      subject: 'General',
      totalPoints: 100,
      duration: 120,
      instructions: '',
      semester: '',
      academicYear: '',
      selectedQuestions: []
    });
    setEditExamData({
      title: '',
      description: '',
      subject: '',
      totalPoints: 100,
      duration: 120,
      instructions: '',
      semester: '',
      academicYear: '',
      selectedQuestions: []
    });
  };

  const handleCreateExam = () => {
    setIsEditing(false);
    setSelectedExam(null); // Clear any selected exam
    resetNewExamForm();
    setShowCreateExamModal(true);
  };

  const handleEditExam = (exam: ExamBook) => {
    // Close the exam details modal first to prevent interface overlap
    setSelectedExam(null);
    
    setEditExamData({
      title: exam.title,
      description: exam.description,
      subject: exam.subject,
      totalPoints: exam.totalPoints,
      duration: exam.duration,
      instructions: exam.instructions,
      semester: exam.semester,
      academicYear: exam.academicYear,
      selectedQuestions: exam.questions
    });
    setIsEditing(true);
    setSelectedExam(exam); // Keep reference to the exam being edited
    setShowCreateExamModal(true);
  };

  const confirmFinalizeExam = () => {
    setShowFinalizeConfirm(true);
  };

  const handleFinalizeExam = async () => {
    if (!selectedExam) return;

    setIsFinalizingExam(true);
    setShowFinalizeConfirm(false);

    try {
      // Update the exam status to finalized
      const updatedExam = {
        ...selectedExam,
        status: 'finalized' as const,
        updatedAt: new Date().toISOString().split('T')[0]
      };

      // Update local state
      const updatedExamBooks = examBooks.map(exam => 
        exam.id === selectedExam.id ? updatedExam : exam
      );
      setExamBooks(updatedExamBooks);

      // Save to storage
      const saveResult = ExamBookStorage.save(updatedExamBooks);
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save exam book');
      }

      setSaveStatus('success');
      setSaveMessage('Exam book finalized successfully!');
      
      // Close the details modal and show success
      setSelectedExam(null);
      
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error finalizing exam:', error);
      setSaveStatus('error');
      setSaveMessage('Failed to finalize exam book. Please try again.');
      
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);
    } finally {
      setIsFinalizingExam(false);
    }
  };

  const handleSaveExam = async () => {
    const examData = isEditing ? editExamData : newExamData;
    
    if (!examData.title.trim() || !examData.subject.trim()) {
      setSaveStatus('error');
      setSaveMessage('Please fill in all required fields.');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    try {
      let updatedExamBooks;
      
      if (isEditing && selectedExam) {
        // Update existing exam
        const updatedExam: ExamBook = {
          ...selectedExam,
          title: examData.title,
          description: examData.description,
          subject: examData.subject,
          totalPoints: examData.totalPoints,
          duration: examData.duration,
          instructions: examData.instructions,
          semester: examData.semester,
          academicYear: examData.academicYear,
          questions: examData.selectedQuestions,
          updatedAt: new Date().toISOString().split('T')[0]
        };
        
        updatedExamBooks = examBooks.map(exam => 
          exam.id === selectedExam.id ? updatedExam : exam
        );
        
        // Update selectedExam state to reflect changes in UI
        setSelectedExam(updatedExam);
      } else {
        // Create new exam
        const newExam: ExamBook = {
          id: `exam_${Date.now()}`,
          title: examData.title,
          description: examData.description,
          subject: examData.subject,
          totalPoints: examData.totalPoints,
          duration: examData.duration,
          instructions: examData.instructions,
          questions: examData.selectedQuestions,
          createdBy: user.id,
          createdAt: new Date().toISOString().split('T')[0],
          status: 'draft',
          semester: examData.semester,
          academicYear: examData.academicYear,
        };
        
        updatedExamBooks = [...examBooks, newExam];
      }

      // Save to storage
      const saveResult = ExamBookStorage.save(updatedExamBooks);
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save exam book');
      }

      setExamBooks(updatedExamBooks);
      setSaveStatus('success');
      setSaveMessage(isEditing ? 'Exam book updated successfully!' : 'Exam book created successfully!');
      
      setShowCreateExamModal(false);
      setIsEditing(false);
      resetNewExamForm();
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving exam:', error);
      setSaveStatus('error');
      setSaveMessage('Failed to save exam book. Please try again.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam book? This action cannot be undone.')) {
      return;
    }

    try {
      const updatedExamBooks = examBooks.filter(exam => exam.id !== examId);
      
      // Save to storage
      const saveResult = ExamBookStorage.save(updatedExamBooks);
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to delete exam book');
      }

      setExamBooks(updatedExamBooks);
      setSaveStatus('success');
      setSaveMessage('Exam book deleted successfully!');
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error deleting exam:', error);
      setSaveStatus('error');
      setSaveMessage('Failed to delete exam book. Please try again.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleQuestionToggle = (questionId: string) => {
    const currentData = isEditing ? editExamData : newExamData;
    const setCurrentData = isEditing ? setEditExamData : setNewExamData;
    
    const isSelected = currentData.selectedQuestions.includes(questionId);
    const updatedQuestions = isSelected
      ? currentData.selectedQuestions.filter(id => id !== questionId)
      : [...currentData.selectedQuestions, questionId];

    setCurrentData(prev => ({
      ...prev,
      selectedQuestions: updatedQuestions
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'finalized':
        return 'bg-blue-100 text-blue-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit size={16} className="text-gray-600" />;
      case 'finalized':
        return <CheckCircle size={16} className="text-blue-600" />;
      case 'published':
        return <BookOpen size={16} className="text-green-600" />;
      default:
        return <FileText size={16} className="text-gray-600" />;
    }
  };

  /**
   * Downloads exam book content as a formatted .txt file
   * @param examBook - The exam book to download
   */
  const handleDownloadExamBook = (examBook: ExamBook) => {
    try {
      // Generate formatted content for the exam book
      const content = generateExamBookContent(examBook);
      
      // Create a blob with the content
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      
      // Create download URL
      const url = URL.createObjectURL(blob);
      
      // Create temporary download link
      const link = document.createElement('a');
      link.href = url;
      
      // Generate meaningful filename
      const sanitizedTitle = examBook.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `exam-book-${sanitizedTitle}-${dateStr}.txt`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success message
      setSaveStatus('success');
      setSaveMessage('Exam book downloaded successfully!');
      setTimeout(() => setSaveStatus('idle'), 3000);
      
    } catch (error) {
      console.error('Error downloading exam book:', error);
      setSaveStatus('error');
      setSaveMessage('Failed to download exam book. Please try again.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  /**
   * Generates formatted text content for the exam book
   * @param examBook - The exam book to format
   * @returns Formatted string content
   */
  const generateExamBookContent = (examBook: ExamBook): string => {
    const lines: string[] = [];
    
    // Header section
    lines.push('='.repeat(80));
    lines.push(`EXAM BOOK: ${examBook.title.toUpperCase()}`);
    lines.push('='.repeat(80));
    lines.push('');
    
    // Basic information
    lines.push('EXAM INFORMATION:');
    lines.push('-'.repeat(40));
    lines.push(`Subject: ${examBook.subject}`);
    lines.push(`Duration: ${examBook.duration} minutes`);
    lines.push(`Total Points: ${examBook.totalPoints}`);
    lines.push(`Status: ${examBook.status.toUpperCase()}`);
    lines.push(`Semester: ${examBook.semester}`);
    lines.push(`Academic Year: ${examBook.academicYear}`);
    lines.push(`Created: ${new Date(examBook.createdAt).toLocaleDateString()}`);
    lines.push('');
    
    // Description
    if (examBook.description) {
      lines.push('DESCRIPTION:');
      lines.push('-'.repeat(40));
      lines.push(examBook.description);
      lines.push('');
    }
    
    // Instructions
    if (examBook.instructions) {
      lines.push('INSTRUCTIONS:');
      lines.push('-'.repeat(40));
      lines.push(examBook.instructions);
      lines.push('');
    }
    
    // Questions section
    lines.push('QUESTIONS:');
    lines.push('-'.repeat(40));
    lines.push(`Total Questions: ${examBook.questions.length}`);
    lines.push('');
    
    // Individual questions
    examBook.questions.forEach((questionId, index) => {
      const question = questions.find(q => q.id === questionId);
      if (question) {
        lines.push(`QUESTION ${index + 1}:`);
        lines.push(`Subject: ${question.subject}`);
        lines.push(`Topic: ${question.topic}`);
        lines.push(`Type: ${question.type}`);
        lines.push('');
        
        // Clinical vignette
        if (question.clinicalVignette) {
          lines.push('Clinical Vignette:');
          lines.push(question.clinicalVignette);
          lines.push('');
        }
        
        // Lead question
        lines.push('Question:');
        lines.push(question.leadQuestion);
        lines.push('');
        
        // Options (for multiple choice)
        if (question.type === 'multiple-choice' && question.options) {
          lines.push('Options:');
          question.options.forEach((option, optIndex) => {
            const letter = String.fromCharCode(65 + optIndex); // A, B, C, D, E
            const isCorrect = option === question.correctAnswer ? ' (CORRECT)' : '';
            lines.push(`${letter}. ${option}${isCorrect}`);
          });
          lines.push('');
        }
        
        // Explanation
        if (question.explanation) {
          lines.push('Explanation:');
          lines.push(question.explanation);
          lines.push('');
        }
        
        // Learning objectives
        if (question.learningObjective && question.learningObjective.length > 0) {
          lines.push('Learning Objectives:');
          question.learningObjective.forEach(obj => {
            lines.push(`- ${obj}`);
          });
          lines.push('');
        }
        
        // References
        if (question.references) {
          lines.push('References:');
          lines.push(question.references);
          lines.push('');
        }
        
        lines.push('-'.repeat(60));
        lines.push('');
      } else {
        lines.push(`QUESTION ${index + 1}: [Question not found - ID: ${questionId}]`);
        lines.push('-'.repeat(60));
        lines.push('');
      }
    });
    
    // Footer
    lines.push('='.repeat(80));
    lines.push(`Generated on: ${new Date().toLocaleString()}`);
    lines.push('Educational Question Bank Management System');
    lines.push('='.repeat(80));
    
    return lines.join('\n');
  };

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {saveStatus !== 'idle' && (
        <div className={`rounded-lg p-4 flex items-center space-x-3 ${
          saveStatus === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {saveStatus === 'success' ? (
            <CheckCircle size={20} className="text-green-600" />
          ) : (
            <AlertTriangle size={20} className="text-red-600" />
          )}
          <p className={`font-medium ${
            saveStatus === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {saveMessage}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exam Books</h2>
          <p className="text-gray-600">
            {hasRole('admin') 
              ? 'Create and manage all examination books' 
              : 'Create and manage your examination books'
            }
          </p>
        </div>
        
        {hasRole('coordinator') && (
          <button
            onClick={handleCreateExam}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create Exam Book</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search exam books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredExamBooks.length} of {accessibleExamBooks.length} exam books
          {!hasRole('admin') && (
            <span className="ml-2 text-blue-600 text-xs">
              (Only showing your exam books)
            </span>
          )}
        </div>
      </div>

      {/* Exam Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExamBooks.map((exam) => (
          <div key={exam.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{exam.description}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(exam.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                    {exam.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <BookOpen size={14} />
                  <span>{exam.subject}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText size={14} />
                  <span>{exam.questions.length} questions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock size={14} />
                  <span>{exam.duration} minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users size={14} />
                  <span>{exam.totalPoints} points</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar size={14} />
                  <span>{exam.semester} {exam.academicYear}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  Created {new Date(exam.createdAt).toLocaleDateString()}
                </span>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedExam(exam)}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </button>
                  
                  {hasRole('coordinator') && (
                    <>
                      {exam.status === 'draft' && (
                        <button
                          onClick={() => handleEditExam(exam)}
                          className="text-gray-600 hover:text-gray-700 text-sm flex items-center space-x-1"
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                      )}
                      {(hasRole('admin') || exam.createdBy === user.id) && (
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="text-red-600 hover:text-red-700 text-sm flex items-center space-x-1"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredExamBooks.length === 0 && (
        <div className="text-center py-12">
          <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No exam books found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedSubject !== 'all' 
              ? 'Try adjusting your search criteria.' 
              : hasRole('admin') 
                ? 'No exam books have been created yet.'
                : 'Create your first exam book to get started.'
            }
          </p>
          {hasRole('coordinator') && (
            <button
              onClick={handleCreateExam}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Exam Book
            </button>
          )}
        </div>
      )}

      {/* Exam Details Modal */}
      {selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-xl font-bold text-gray-900">{selectedExam.title}</h2>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(selectedExam.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedExam.status)}`}>
                        {selectedExam.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600">{selectedExam.description}</p>
                </div>
                <button
                  onClick={() => setSelectedExam(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Exam Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subject:</span>
                        <span className="font-medium">{selectedExam.subject}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{selectedExam.duration} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Points:</span>
                        <span className="font-medium">{selectedExam.totalPoints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Questions:</span>
                        <span className="font-medium">{selectedExam.questions.length}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Academic Info</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Semester:</span>
                        <span className="font-medium">{selectedExam.semester}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Academic Year:</span>
                        <span className="font-medium">{selectedExam.academicYear}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{new Date(selectedExam.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                    {selectedExam.instructions || 'No specific instructions provided.'}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Questions ({selectedExam.questions.length})</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedExam.questions.map((questionId, index) => {
                    const question = questions.find(q => q.id === questionId);
                    return question ? (
                      <div key={questionId} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                            Q{index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {question.leadQuestion}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-600">
                              <span>{question.subject}</span>
                              <span>•</span>
                              <span>{question.topic}</span>
                              <span>•</span>
                              <span>{question.type}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={questionId} className="bg-red-50 p-3 rounded-lg">
                        <p className="text-sm text-red-600">Question not found (ID: {questionId})</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleDownloadExamBook(selectedExam)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <Download size={16} />
                  <span>Download</span>
                </button>
                
                {selectedExam.status === 'draft' && hasRole('coordinator') && (
                  <button
                    onClick={confirmFinalizeExam}
                    disabled={isFinalizingExam}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isFinalizingExam ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Finalizing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        <span>Finalize Exam Book</span>
                      </>
                    )}
                  </button>
                )}
                
                {hasRole('coordinator') && (
                  selectedExam.status === 'draft' && (
                    (hasRole('admin') || selectedExam.createdBy === user.id) && (
                    <button
                      onClick={() => handleEditExam(selectedExam)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Edit size={16} />
                      <span>Edit Exam</span>
                    </button>
                    )
                  )
                )}
                
                <button
                  onClick={() => setSelectedExam(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Finalize Confirmation Modal */}
      {showFinalizeConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle size={24} className="text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Finalize Exam Book</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to finalize this exam book? This action will:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Change the status from "draft" to "finalized"</li>
                <li>• Make the exam book visible in the main exam books list</li>
                <li>• Prevent further editing of the exam structure</li>
                <li>• Allow the exam to be published for student access</li>
              </ul>
              <p className="text-sm text-orange-600 mt-4 font-medium">
                Note: You can still edit exam details after finalization, but the question structure will be locked.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowFinalizeConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalizeExam}
                disabled={isFinalizingExam}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isFinalizingExam ? 'Finalizing...' : 'Finalize Exam Book'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Exam Modal */}
      {showCreateExamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditing ? 'Edit Exam Book' : 'Create New Exam Book'}
                </h2>
                <button
                  onClick={() => setShowCreateExamModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Exam Details Form */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Details</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={isEditing ? editExamData.title : newExamData.title}
                          onChange={(e) => {
                            const setData = isEditing ? setEditExamData : setNewExamData;
                            setData(prev => ({ ...prev, title: e.target.value }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter exam title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={isEditing ? editExamData.description : newExamData.description}
                          onChange={(e) => {
                            const setData = isEditing ? setEditExamData : setNewExamData;
                            setData(prev => ({ ...prev, description: e.target.value }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter exam description"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration (minutes)
                          </label>
                          <input
                            type="number"
                            value={isEditing ? editExamData.duration : newExamData.duration}
                            onChange={(e) => {
                              const setData = isEditing ? setEditExamData : setNewExamData;
                              setData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total Points
                          </label>
                          <input
                            type="number"
                            value={isEditing ? editExamData.totalPoints : newExamData.totalPoints}
                            onChange={(e) => {
                              const setData = isEditing ? setEditExamData : setNewExamData;
                              setData(prev => ({ ...prev, totalPoints: parseInt(e.target.value) || 0 }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Semester
                          </label>
                          <input
                            type="text"
                            value={isEditing ? editExamData.semester : newExamData.semester}
                            onChange={(e) => {
                              const setData = isEditing ? setEditExamData : setNewExamData;
                              setData(prev => ({ ...prev, semester: e.target.value }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Spring 2024"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Academic Year
                        </label>
                        <input
                          type="text"
                          value={isEditing ? editExamData.academicYear : newExamData.academicYear}
                          onChange={(e) => {
                            const setData = isEditing ? setEditExamData : setNewExamData;
                            setData(prev => ({ ...prev, academicYear: e.target.value }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 2023-2024"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Instructions
                        </label>
                        <textarea
                          rows={4}
                          value={isEditing ? editExamData.instructions : newExamData.instructions}
                          onChange={(e) => {
                            const setData = isEditing ? setEditExamData : setNewExamData;
                            setData(prev => ({ ...prev, instructions: e.target.value }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter exam instructions for students"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question Selection */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Select Questions ({(isEditing ? editExamData.selectedQuestions : newExamData.selectedQuestions).length} selected)
                    </h3>
                    
                    {/* Two-column layout for Available and Selected Questions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Available Questions */}
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-3">
                          Available Questions
                        </h4>
                        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                          {console.log("Questions available for selection:", questions)}
                          {console.log("Current subject filter:", isEditing ? editExamData.subject : newExamData.subject)}
                          {questions
                            .filter(q => q.status === 'approved') // Re-enabled status filter
                            .map(question => {
                              const currentData = isEditing ? editExamData : newExamData;
                              const isSelected = currentData.selectedQuestions.includes(question.id);
                              
                              return (
                                <div
                                  key={question.id}
                                  className={`p-3 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                                    isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                  }`}
                                  onClick={() => handleQuestionToggle(question.id)}
                                >
                                  <div className="flex items-start space-x-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleQuestionToggle(question.id)}
                                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 mb-1">
                                        {question.leadQuestion}
                                      </p>
                                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                                        <span>{question.subject}</span>
                                        <span>•</span>
                                        <span>{question.topic}</span>
                                        <span>•</span>
                                        <span>{question.type}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          {questions
                            .filter(q => q.status === 'approved').length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                              <FileText size={32} className="mx-auto mb-2 text-gray-400" />
                              <p className="text-sm">No approved questions available</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selected Questions */}
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-3">
                          Selected Questions ({(isEditing ? editExamData.selectedQuestions : newExamData.selectedQuestions).length})
                        </h4>
                        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
                          {(isEditing ? editExamData.selectedQuestions : newExamData.selectedQuestions).length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                              <CheckCircle size={32} className="mx-auto mb-2 text-gray-400" />
                              <p className="text-sm">No questions selected</p>
                              <p className="text-xs mt-1">Select questions from the left panel</p>
                            </div>
                          ) : (
                            <div className="p-2">
                              {(isEditing ? editExamData.selectedQuestions : newExamData.selectedQuestions).map((questionId, index) => {
                                const question = questions.find(q => q.id === questionId);
                                if (!question) return null;
                                
                                return (
                                  <div
                                    key={questionId}
                                    className="bg-white p-3 mb-2 rounded-lg border border-gray-200 shadow-sm"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                                            Q{index + 1}
                                          </span>
                                          <span className="text-xs text-gray-500">{question.subject}</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                                          {question.leadQuestion}
                                        </p>
                                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                                          <span>{question.topic}</span>
                                          <span>•</span>
                                          <span>{question.type}</span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleQuestionToggle(questionId)}
                                        className="ml-2 text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                        title="Remove question"
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowCreateExamModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveExam}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Save size={16} />
                  <span>{isEditing ? 'Update Exam Book' : 'Create Exam Book'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};