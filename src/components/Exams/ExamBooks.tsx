import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuestions } from '../../context/QuestionContext';
import { ExamBook, Question } from '../../types';
import { ExamBookStorage } from '../../utils/examBookStorage';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  CheckCircle,
  AlertTriangle,
  Calendar,
  Clock,
  FileText,
  Users,
  Settings,
  Check
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [selectedExamBook, setSelectedExamBook] = useState<ExamBook | null>(null);
  const [examBookToDelete, setExamBookToDelete] = useState<string | null>(null);
  const [examBookToFinalize, setExamBookToFinalize] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  
  // Question selection and filtering
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [questionSearchTerm, setQuestionSearchTerm] = useState('');
  const [questionSubjectFilter, setQuestionSubjectFilter] = useState('all');
  const [showQuestionDetails, setShowQuestionDetails] = useState(false);
  const [selectedQuestionForDetails, setSelectedQuestionForDetails] = useState<Question | null>(null);

  // Form data for create/edit
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    duration: 120,
    instructions: '',
    semester: '',
    academicYear: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!user || !hasRole('coordinator')) {
    return (
      <div className="text-center py-12">
        <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">Only coordinators can access exam book management.</p>
      </div>
    );
  }

  // Load exam books on component mount
  useEffect(() => {
    loadExamBooks();
  }, []);

  // Handle external modal trigger
  useEffect(() => {
    if (shouldOpenCreateModal) {
      setShowCreateModal(true);
      if (onModalOpened) {
        onModalOpened();
      }
    }
  }, [shouldOpenCreateModal, onModalOpened]);

  const loadExamBooks = () => {
    const result = ExamBookStorage.load();
    if (result.success && result.data) {
      setExamBooks(result.data);
      console.log(`Loaded ${result.data.length} exam books`);
    } else {
      console.error('Failed to load exam books:', result.error);
      setExamBooks([]);
    }
  };

  const saveExamBooks = (updatedExamBooks: ExamBook[]) => {
    const result = ExamBookStorage.save(updatedExamBooks);
    if (result.success) {
      setExamBooks(updatedExamBooks);
      return true;
    } else {
      console.error('Failed to save exam books:', result.error);
      return false;
    }
  };

  // Get filtered questions for selection
  const getFilteredQuestions = (): Question[] => {
    return questions.filter(question => {
      if (question.status !== 'approved') return false;
      
      const matchesSearch = question.subject.toLowerCase().includes(questionSearchTerm.toLowerCase()) ||
                          question.topic.toLowerCase().includes(questionSearchTerm.toLowerCase()) ||
                          question.leadQuestion.toLowerCase().includes(questionSearchTerm.toLowerCase());
      
      const matchesSubject = questionSubjectFilter === 'all' || question.subject === questionSubjectFilter;

      return matchesSearch && matchesSubject;
    });
  };

  const subjects = [...new Set(questions.map(q => q.subject))];
  const filteredQuestions = getFilteredQuestions();

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.semester.trim()) {
      newErrors.semester = 'Semester is required';
    }

    if (!formData.academicYear.trim()) {
      newErrors.academicYear = 'Academic year is required';
    }

    if (formData.duration < 30) {
      newErrors.duration = 'Duration must be at least 30 minutes';
    }

    if (selectedQuestions.length === 0) {
      newErrors.questions = 'At least one question must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject: '',
      duration: 120,
      instructions: '',
      semester: '',
      academicYear: '',
    });
    setSelectedQuestions([]);
    setQuestionSearchTerm('');
    setQuestionSubjectFilter('all');
    setErrors({});
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle question selection
  const handleQuestionSelect = (questionId: string, selected: boolean) => {
    if (selected) {
      setSelectedQuestions(prev => [...prev, questionId]);
    } else {
      setSelectedQuestions(prev => prev.filter(id => id !== questionId));
    }
  };

  // Calculate total points (assuming 1 point per question for now)
  const calculateTotalPoints = () => {
    return selectedQuestions.length;
  };

  // View exam book
  const handleViewExamBook = (examBook: ExamBook) => {
    console.log('Viewing exam book:', examBook.id);
    setSelectedExamBook(examBook);
    setShowViewModal(true);
  };

  // Edit exam book
  const handleEditExamBook = (examBook: ExamBook) => {
    console.log('Editing exam book:', examBook.id);
    if (examBook.status !== 'draft') {
      setSubmitStatus('error');
      setSubmitMessage('Only draft exam books can be edited');
      setTimeout(() => {
        setSubmitStatus('idle');
        setSubmitMessage('');
      }, 3000);
      return;
    }

    // Populate form with existing data
    setFormData({
      title: examBook.title,
      description: examBook.description,
      subject: examBook.subject,
      duration: examBook.duration,
      instructions: examBook.instructions,
      semester: examBook.semester,
      academicYear: examBook.academicYear,
    });
    setSelectedQuestions(examBook.questions);
    setSelectedExamBook(examBook);
    setShowEditModal(true);
  };

  // Delete exam book
  const handleDeleteExamBook = (examBookId: string) => {
    console.log('Initiating delete for exam book:', examBookId);
    setExamBookToDelete(examBookId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteExamBook = () => {
    if (!examBookToDelete) return;

    console.log('Confirming delete for exam book:', examBookToDelete);
    const updatedExamBooks = examBooks.filter(book => book.id !== examBookToDelete);
    
    if (saveExamBooks(updatedExamBooks)) {
      setSubmitStatus('success');
      setSubmitMessage('Exam book deleted successfully!');
      console.log('Exam book deleted successfully');
    } else {
      setSubmitStatus('error');
      setSubmitMessage('Failed to delete exam book. Please try again.');
    }

    setShowDeleteConfirm(false);
    setExamBookToDelete(null);
    
    setTimeout(() => {
      setSubmitStatus('idle');
      setSubmitMessage('');
    }, 3000);
  };

  // Finalize exam book
  const handleFinalizeExamBook = (examBookId: string) => {
    console.log('Initiating finalize for exam book:', examBookId);
    setExamBookToFinalize(examBookId);
    setShowFinalizeConfirm(true);
  };

  const confirmFinalizeExamBook = () => {
    if (!examBookToFinalize) return;

    console.log('Confirming finalize for exam book:', examBookToFinalize);
    const updatedExamBooks = examBooks.map(book => 
      book.id === examBookToFinalize 
        ? { ...book, status: 'finalized' as const }
        : book
    );
    
    if (saveExamBooks(updatedExamBooks)) {
      setSubmitStatus('success');
      setSubmitMessage('Exam book finalized successfully!');
      console.log('Exam book finalized successfully');
    } else {
      setSubmitStatus('error');
      setSubmitMessage('Failed to finalize exam book. Please try again.');
    }

    setShowFinalizeConfirm(false);
    setExamBookToFinalize(null);
    
    setTimeout(() => {
      setSubmitStatus('idle');
      setSubmitMessage('');
    }, 3000);
  };

  // Create exam book
  const handleCreateExamBook = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    console.log('Creating new exam book with data:', formData, 'Selected questions:', selectedQuestions);

    try {
      const newExamBook: ExamBook = {
        id: `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        totalPoints: calculateTotalPoints(),
        duration: formData.duration,
        instructions: formData.instructions,
        questions: selectedQuestions,
        createdBy: user.id,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'draft',
        semester: formData.semester,
        academicYear: formData.academicYear,
      };

      const updatedExamBooks = [newExamBook, ...examBooks];
      
      if (saveExamBooks(updatedExamBooks)) {
        setSubmitStatus('success');
        setSubmitMessage('Exam book created successfully!');
        setShowCreateModal(false);
        resetForm();
        console.log('Exam book created successfully:', newExamBook.id);
      } else {
        throw new Error('Failed to save exam book');
      }
    } catch (error) {
      console.error('Error creating exam book:', error);
      setSubmitStatus('error');
      setSubmitMessage('Failed to create exam book. Please try again.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setSubmitStatus('idle');
        setSubmitMessage('');
      }, 3000);
    }
  };

  // Update exam book
  const handleUpdateExamBook = async () => {
    if (!validateForm() || !selectedExamBook) return;

    setIsSubmitting(true);
    console.log('Updating exam book:', selectedExamBook.id, 'with data:', formData);

    try {
      const updatedExamBook: ExamBook = {
        ...selectedExamBook,
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        totalPoints: calculateTotalPoints(),
        duration: formData.duration,
        instructions: formData.instructions,
        questions: selectedQuestions,
        semester: formData.semester,
        academicYear: formData.academicYear,
      };

      const updatedExamBooks = examBooks.map(book => 
        book.id === selectedExamBook.id ? updatedExamBook : book
      );
      
      if (saveExamBooks(updatedExamBooks)) {
        setSubmitStatus('success');
        setSubmitMessage('Exam book updated successfully!');
        setShowEditModal(false);
        setSelectedExamBook(null);
        resetForm();
        console.log('Exam book updated successfully:', updatedExamBook.id);
      } else {
        throw new Error('Failed to save exam book');
      }
    } catch (error) {
      console.error('Error updating exam book:', error);
      setSubmitStatus('error');
      setSubmitMessage('Failed to update exam book. Please try again.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setSubmitStatus('idle');
        setSubmitMessage('');
      }, 3000);
    }
  };

  // View question details
  const handleViewQuestionDetails = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      setSelectedQuestionForDetails(question);
      setShowQuestionDetails(true);
    }
  };

  // Get question by ID
  const getQuestionById = (questionId: string): Question | undefined => {
    return questions.find(q => q.id === questionId);
  };

  // Test functionality
  const runTests = () => {
    console.log('🧪 Running ExamBooks functionality tests...');
    
    // Test 1: Load exam books
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exam Books</h2>
          <p className="text-gray-600">Create and manage examination question books</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={runTests}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <Settings size={20} />
            <span>Test</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create Exam Book</span>
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {submitStatus !== 'idle' && (
        <div className={`rounded-lg p-4 flex items-center space-x-3 ${
          submitStatus === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {submitStatus === 'success' ? (
            <CheckCircle size={20} className="text-green-600" />
          ) : (
            <AlertTriangle size={20} className="text-red-600" />
          )}
          <p className={`font-medium ${
            submitStatus === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {submitMessage}
          </p>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <BookOpen size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Exam Books</p>
              <p className="text-xl font-semibold text-gray-900">{examBooks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-100 p-2 rounded-full">
              <Edit size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Draft</p>
              <p className="text-xl font-semibold text-gray-900">
                {examBooks.filter(book => book.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Finalized</p>
              <p className="text-xl font-semibold text-gray-900">
                {examBooks.filter(book => book.status === 'finalized').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-xl font-semibold text-gray-900">
                {examBooks.filter(book => book.status === 'published').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Exam Books List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Your Exam Books</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exam Book
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {examBooks.map((examBook) => (
                <tr key={examBook.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{examBook.title}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{examBook.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{examBook.subject}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <FileText size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-900">{examBook.questions.length}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-900">{examBook.duration} min</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      examBook.status === 'draft' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : examBook.status === 'finalized'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {examBook.status.charAt(0).toUpperCase() + examBook.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {new Date(examBook.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewExamBook(examBook)}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                        title="View exam book details"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                      
                      <button
                        onClick={() => handleEditExamBook(examBook)}
                        disabled={examBook.status !== 'draft'}
                        className={`text-sm flex items-center space-x-1 ${
                          examBook.status === 'draft'
                            ? 'text-green-600 hover:text-green-700'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={examBook.status === 'draft' ? 'Edit exam book' : 'Only draft exam books can be edited'}
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                      
                      <button
                        onClick={() => handleDeleteExamBook(examBook.id)}
                        className="text-red-600 hover:text-red-700 text-sm flex items-center space-x-1"
                        title="Delete exam book"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {examBooks.length === 0 && (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No exam books yet</h3>
            <p className="text-gray-600 mb-4">Create your first exam book to get started.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Exam Book
            </button>
          </div>
        )}
      </div>

      {/* Create Exam Book Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create New Exam Book</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Exam Details */}
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
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="Enter exam book title"
                        />
                        {errors.title && (
                          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description *
                        </label>
                        <textarea
                          rows={3}
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="Enter exam book description"
                        />
                        {errors.description && (
                          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subject *
                          </label>
                          <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => handleInputChange('subject', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.subject ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="e.g., Mathematics"
                          />
                          {errors.subject && (
                            <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration (minutes) *
                          </label>
                          <input
                            type="number"
                            value={formData.duration}
                            onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.duration ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            min="30"
                            placeholder="120"
                          />
                          {errors.duration && (
                            <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Semester *
                          </label>
                          <input
                            type="text"
                            value={formData.semester}
                            onChange={(e) => handleInputChange('semester', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.semester ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="e.g., Spring 2024"
                          />
                          {errors.semester && (
                            <p className="mt-1 text-sm text-red-600">{errors.semester}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Academic Year *
                          </label>
                          <input
                            type="text"
                            value={formData.academicYear}
                            onChange={(e) => handleInputChange('academicYear', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.academicYear ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="e.g., 2023-2024"
                          />
                          {errors.academicYear && (
                            <p className="mt-1 text-sm text-red-600">{errors.academicYear}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Instructions
                        </label>
                        <textarea
                          rows={4}
                          value={formData.instructions}
                          onChange={(e) => handleInputChange('instructions', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter exam instructions for students..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Selected Questions Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Selected Questions ({selectedQuestions.length})
                    </h3>
                    {errors.questions && (
                      <p className="mb-2 text-sm text-red-600">{errors.questions}</p>
                    )}
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      {selectedQuestions.length === 0 ? (
                        <p className="text-gray-500 text-sm">No questions selected yet</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedQuestions.map(questionId => {
                            const question = getQuestionById(questionId);
                            return question ? (
                              <div key={questionId} className="flex items-center justify-between bg-white p-3 rounded border">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {question.leadQuestion}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {question.subject} • {question.topic}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleQuestionSelect(questionId, false)}
                                  className="text-red-600 hover:text-red-700 ml-2"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Total Points: {calculateTotalPoints()}
                    </div>
                  </div>
                </div>

                {/* Right Column - Question Selection */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Questions</h3>
                    
                    {/* Question Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="relative">
                        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search questions..."
                          value={questionSearchTerm}
                          onChange={(e) => setQuestionSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <select
                        value={questionSubjectFilter}
                        onChange={(e) => setQuestionSubjectFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Subjects</option>
                        {subjects.map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>

                    {/* Questions List */}
                    <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                      {filteredQuestions.map(question => (
                        <div key={question.id} className="p-4 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedQuestions.includes(question.id)}
                              onChange={(e) => handleQuestionSelect(question.id, e.target.checked)}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {question.leadQuestion}
                                </p>
                                <button
                                  onClick={() => handleViewQuestionDetails(question.id)}
                                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1 ml-2"
                                >
                                  <Eye size={14} />
                                  <span>View</span>
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {question.subject} • {question.topic} • {question.status}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                By {question.authorName}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredQuestions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Filter size={48} className="mx-auto mb-4 text-gray-400" />
                        <p>No approved questions found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateExamBook}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save size={16} />
                  <span>{isSubmitting ? 'Creating...' : 'Create Exam Book'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Exam Book Modal */}
      {showViewModal && selectedExamBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedExamBook.title}
                  </h2>
                  <p className="text-gray-600">{selectedExamBook.description}</p>
                </div>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedExamBook(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subject:</span>
                        <span className="font-medium">{selectedExamBook.subject}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{selectedExamBook.duration} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Points:</span>
                        <span className="font-medium">{selectedExamBook.totalPoints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Questions:</span>
                        <span className="font-medium">{selectedExamBook.questions.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Exam Details</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Semester:</span>
                        <span className="font-medium">{selectedExamBook.semester}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Academic Year:</span>
                        <span className="font-medium">{selectedExamBook.academicYear}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedExamBook.status === 'draft' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : selectedExamBook.status === 'finalized'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedExamBook.status.charAt(0).toUpperCase() + selectedExamBook.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{new Date(selectedExamBook.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedExamBook.instructions && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedExamBook.instructions}</p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-900 mb-4">Questions ({selectedExamBook.questions.length})</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedExamBook.questions.map((questionId, index) => {
                    const question = getQuestionById(questionId);
                    return question ? (
                      <div key={questionId} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                Q{index + 1}
                              </span>
                              <span className="text-xs text-gray-500">{question.subject} • {question.topic}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {question.leadQuestion}
                            </p>
                            <p className="text-xs text-gray-600">
                              By {question.authorName}
                            </p>
                          </div>
                          <button
                            onClick={() => handleViewQuestionDetails(questionId)}
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1 ml-4"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div key={questionId} className="bg-red-50 rounded-lg p-4">
                        <p className="text-red-600 text-sm">Question not found (ID: {questionId})</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between">
                <div className="flex space-x-3">
                  {selectedExamBook.status === 'draft' && (
                    <>
                      <button
                        onClick={() => {
                          setShowViewModal(false);
                          handleEditExamBook(selectedExamBook);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <Edit size={16} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleFinalizeExamBook(selectedExamBook.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Check size={16} />
                        <span>Finalize</span>
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedExamBook(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Exam Book Modal */}
      {showEditModal && selectedExamBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Edit Exam Book</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedExamBook(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Exam Details */}
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
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="Enter exam book title"
                        />
                        {errors.title && (
                          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description *
                        </label>
                        <textarea
                          rows={3}
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="Enter exam book description"
                        />
                        {errors.description && (
                          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subject *
                          </label>
                          <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => handleInputChange('subject', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.subject ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="e.g., Mathematics"
                          />
                          {errors.subject && (
                            <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration (minutes) *
                          </label>
                          <input
                            type="number"
                            value={formData.duration}
                            onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.duration ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            min="30"
                            placeholder="120"
                          />
                          {errors.duration && (
                            <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Semester *
                          </label>
                          <input
                            type="text"
                            value={formData.semester}
                            onChange={(e) => handleInputChange('semester', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.semester ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="e.g., Spring 2024"
                          />
                          {errors.semester && (
                            <p className="mt-1 text-sm text-red-600">{errors.semester}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Academic Year *
                          </label>
                          <input
                            type="text"
                            value={formData.academicYear}
                            onChange={(e) => handleInputChange('academicYear', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.academicYear ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="e.g., 2023-2024"
                          />
                          {errors.academicYear && (
                            <p className="mt-1 text-sm text-red-600">{errors.academicYear}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Instructions
                        </label>
                        <textarea
                          rows={4}
                          value={formData.instructions}
                          onChange={(e) => handleInputChange('instructions', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter exam instructions for students..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Selected Questions Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Selected Questions ({selectedQuestions.length})
                    </h3>
                    {errors.questions && (
                      <p className="mb-2 text-sm text-red-600">{errors.questions}</p>
                    )}
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      {selectedQuestions.length === 0 ? (
                        <p className="text-gray-500 text-sm">No questions selected yet</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedQuestions.map(questionId => {
                            const question = getQuestionById(questionId);
                            return question ? (
                              <div key={questionId} className="flex items-center justify-between bg-white p-3 rounded border">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {question.leadQuestion}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {question.subject} • {question.topic}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleQuestionSelect(questionId, false)}
                                  className="text-red-600 hover:text-red-700 ml-2"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Total Points: {calculateTotalPoints()}
                    </div>
                  </div>
                </div>

                {/* Right Column - Question Selection */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Questions</h3>
                    
                    {/* Question Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="relative">
                        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search questions..."
                          value={questionSearchTerm}
                          onChange={(e) => setQuestionSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <select
                        value={questionSubjectFilter}
                        onChange={(e) => setQuestionSubjectFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Subjects</option>
                        {subjects.map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>

                    {/* Questions List */}
                    <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                      {filteredQuestions.map(question => (
                        <div key={question.id} className="p-4 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedQuestions.includes(question.id)}
                              onChange={(e) => handleQuestionSelect(question.id, e.target.checked)}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {question.leadQuestion}
                                </p>
                                <button
                                  onClick={() => handleViewQuestionDetails(question.id)}
                                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1 ml-2"
                                >
                                  <Eye size={14} />
                                  <span>View</span>
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {question.subject} • {question.topic} • {question.status}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                By {question.authorName}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredQuestions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Filter size={48} className="mx-auto mb-4 text-gray-400" />
                        <p>No approved questions found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleFinalizeExamBook(selectedExamBook.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Check size={16} />
                    <span>Finalize</span>
                  </button>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedExamBook(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateExamBook}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Save size={16} />
                    <span>{isSubmitting ? 'Updating...' : 'Update Exam Book'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Details Modal */}
      {showQuestionDetails && selectedQuestionForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Question Details</h2>
                  <p className="text-gray-600">
                    {selectedQuestionForDetails.subject} • {selectedQuestionForDetails.topic}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowQuestionDetails(false);
                    setSelectedQuestionForDetails(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Clinical Vignette */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Clinical Vignette</h4>
                  <p className="text-gray-700 bg-blue-50 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedQuestionForDetails.clinicalVignette}
                  </p>
                </div>

                {/* Lead Question */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Lead Question</h4>
                  <p className="text-gray-700 font-medium">{selectedQuestionForDetails.leadQuestion}</p>
                </div>

                {/* Answer Options */}
                {selectedQuestionForDetails.options && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Answer Options</h4>
                    <div className="space-y-2">
                      {selectedQuestionForDetails.options.map((option, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${
                            option === selectedQuestionForDetails.correctAnswer
                              ? 'bg-green-100 text-green-800 font-medium border border-green-200'
                              : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          {String.fromCharCode(65 + index)}. {option}
                          {option === selectedQuestionForDetails.correctAnswer && (
                            <span className="ml-2 text-green-600 font-bold">(CORRECT)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {selectedQuestionForDetails.explanation && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Explanation</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedQuestionForDetails.explanation}
                    </p>
                  </div>
                )}

                {/* Learning Objectives */}
                {selectedQuestionForDetails.learningObjective && selectedQuestionForDetails.learningObjective.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Learning Objectives</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedQuestionForDetails.learningObjective.map(objective => (
                        <span key={objective} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          {objective}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* References */}
                {selectedQuestionForDetails.references && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">References</h4>
                    <p className="text-gray-600 text-sm italic">{selectedQuestionForDetails.references}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Aspect</h4>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {selectedQuestionForDetails.aspect?.replace('-', ' ')}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Pathomechanism</h4>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                      {selectedQuestionForDetails.pathomecanism}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                {selectedQuestionForDetails.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedQuestionForDetails.tags.map(tag => (
                        <span
                          key={tag}
                          className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Question Selection from Details Modal */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(selectedQuestionForDetails.id)}
                    onChange={(e) => handleQuestionSelect(selectedQuestionForDetails.id, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {selectedQuestions.includes(selectedQuestionForDetails.id) 
                      ? 'Selected for exam book' 
                      : 'Select for exam book'
                    }
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowQuestionDetails(false);
                    setSelectedQuestionForDetails(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle size={24} className="text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete this exam book? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setExamBookToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteExamBook}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finalize Confirmation Modal */}
      {showFinalizeConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Check size={24} className="text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Finalize</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to finalize this exam book? Once finalized, it cannot be edited.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowFinalizeConfirm(false);
                  setExamBookToFinalize(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmFinalizeExamBook}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Finalize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};