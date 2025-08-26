import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuestions } from '../../context/QuestionContext';
import { Question, ExamBook } from '../../types';
import { ExamBookStorage } from '../../utils/examBookStorage';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  FileText,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  X,
  Save,
  Calendar,
  User,
  Building
} from 'lucide-react';

interface ExamBooksProps {
  shouldOpenCreateModal?: boolean;
  onModalOpened?: () => void;
}

interface CreateExamBookData {
  title: string;
  description: string;
  subject: string;
  duration: number;
  instructions: string;
  semester: string;
  academicYear: string;
  selectedQuestions: string[];
}

export const ExamBooks: React.FC<ExamBooksProps> = ({ 
  shouldOpenCreateModal = false, 
  onModalOpened 
}) => {
  const { user, hasRole } = useAuth();
  const { questions } = useQuestions();
  const [examBooks, setExamBooks] = useState<ExamBook[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuestionDetails, setShowQuestionDetails] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [createExamData, setCreateExamData] = useState<CreateExamBookData>({
    title: '',
    description: '',
    subject: '',
    duration: 120,
    instructions: '',
    semester: '',
    academicYear: '',
    selectedQuestions: []
  });

  // Question search and filter states for the modal
  const [questionSearchTerm, setQuestionSearchTerm] = useState('');
  const [questionSubjectFilter, setQuestionSubjectFilter] = useState('all');
  const [questionStatusFilter, setQuestionStatusFilter] = useState('approved');

  useEffect(() => {
    loadExamBooks();
  }, []);

  useEffect(() => {
    if (shouldOpenCreateModal && !showCreateModal) {
      setShowCreateModal(true);
      if (onModalOpened) {
        onModalOpened();
      }
    }
  }, [shouldOpenCreateModal, showCreateModal, onModalOpened]);

  const loadExamBooks = () => {
    const result = ExamBookStorage.load();
    if (result.success && result.data) {
      setExamBooks(result.data);
    }
  };

  const saveExamBooks = (books: ExamBook[]) => {
    const result = ExamBookStorage.save(books);
    if (result.success) {
      setExamBooks(books);
    }
  };

  // Filter questions for the create exam modal
  const getFilteredQuestionsForExam = (): Question[] => {
    return questions.filter(question => {
      const matchesSearch = (question.subject || '').toLowerCase().includes(questionSearchTerm.toLowerCase()) ||
                          (question.disease || '').toLowerCase().includes(questionSearchTerm.toLowerCase()) ||
                          (question.topic || '').toLowerCase().includes(questionSearchTerm.toLowerCase()) ||
                          (question.leadQuestion || '').toLowerCase().includes(questionSearchTerm.toLowerCase());
      
      const matchesSubject = questionSubjectFilter === 'all' || question.subject === questionSubjectFilter;
      const matchesStatus = questionStatusFilter === 'all' || question.status === questionStatusFilter;

      return matchesSearch && matchesSubject && matchesStatus;
    });
  };

  const handleCreateExam = async () => {
    if (!createExamData.title.trim() || !createExamData.subject.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (createExamData.selectedQuestions.length === 0) {
      alert('Please select at least one question for the exam');
      return;
    }

    setIsLoading(true);

    try {
      const newExamBook: ExamBook = {
        id: `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: createExamData.title,
        description: createExamData.description,
        subject: createExamData.subject,
        totalPoints: createExamData.selectedQuestions.length * 10, // 10 points per question
        duration: createExamData.duration,
        instructions: createExamData.instructions,
        questions: createExamData.selectedQuestions,
        createdBy: user?.id || '',
        createdAt: new Date().toISOString().split('T')[0],
        status: 'draft',
        semester: createExamData.semester,
        academicYear: createExamData.academicYear,
      };

      const updatedExamBooks = [newExamBook, ...examBooks];
      saveExamBooks(updatedExamBooks);

      // Reset form
      setCreateExamData({
        title: '',
        description: '',
        subject: '',
        duration: 120,
        instructions: '',
        semester: '',
        academicYear: '',
        selectedQuestions: []
      });

      setShowCreateModal(false);
      alert('Exam book created successfully!');
    } catch (error) {
      console.error('Error creating exam book:', error);
      alert('Failed to create exam book. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionSelect = (questionId: string) => {
    setCreateExamData(prev => ({
      ...prev,
      selectedQuestions: prev.selectedQuestions.includes(questionId)
        ? prev.selectedQuestions.filter(id => id !== questionId)
        : [...prev.selectedQuestions, questionId]
    }));
  };

  const handleViewQuestionDetails = (question: Question) => {
    setSelectedQuestion(question);
    setShowQuestionDetails(true);
  };

  const subjects = [...new Set(questions.map(q => q.subject))];
  const filteredQuestionsForExam = getFilteredQuestionsForExam();

  if (!user || !hasRole('coordinator')) {
    return (
      <div className="text-center py-12">
        <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">Only coordinators can access exam book management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exam Books</h2>
          <p className="text-gray-600">Create and manage examination books</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Exam Book</span>
        </button>
      </div>

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
            <div className="bg-orange-100 p-2 rounded-full">
              <Clock size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Draft Exams</p>
              <p className="text-xl font-semibold text-gray-900">
                {examBooks.filter(e => e.status === 'draft').length}
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
              <p className="text-sm text-gray-600">Finalized Exams</p>
              <p className="text-xl font-semibold text-gray-900">
                {examBooks.filter(e => e.status === 'finalized').length}
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
              <p className="text-sm text-gray-600">Available Questions</p>
              <p className="text-xl font-semibold text-gray-900">
                {questions.filter(q => q.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Exam Books List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Your Exam Books</h3>
        </div>
        
        <div className="p-6">
          {examBooks.length === 0 ? (
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
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {examBooks.map(examBook => (
                <div key={examBook.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{examBook.title}</h4>
                      <p className="text-gray-600 text-sm mb-3">{examBook.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Building size={14} />
                          <span>{examBook.subject}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>{examBook.duration} min</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <FileText size={14} />
                          <span>{examBook.questions.length} questions</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        examBook.status === 'draft' 
                          ? 'bg-orange-100 text-orange-800'
                          : examBook.status === 'finalized'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {examBook.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Created {new Date(examBook.createdAt).toLocaleDateString()}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1">
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                      <button className="text-gray-600 hover:text-gray-700 text-sm flex items-center space-x-1">
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                      <button className="text-red-600 hover:text-red-700 text-sm flex items-center space-x-1">
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Exam Book Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create New Exam Book</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
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
                          Exam Title *
                        </label>
                        <input
                          type="text"
                          value={createExamData.title}
                          onChange={(e) => setCreateExamData(prev => ({ ...prev, title: e.target.value }))}
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
                          value={createExamData.description}
                          onChange={(e) => setCreateExamData(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter exam description"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subject *
                          </label>
                          <select
                            value={createExamData.subject}
                            onChange={(e) => setCreateExamData(prev => ({ ...prev, subject: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select subject</option>
                            {subjects.map(subject => (
                              <option key={subject} value={subject}>{subject}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration (minutes)
                          </label>
                          <input
                            type="number"
                            value={createExamData.duration}
                            onChange={(e) => setCreateExamData(prev => ({ ...prev, duration: parseInt(e.target.value) || 120 }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="30"
                            max="300"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Semester
                          </label>
                          <input
                            type="text"
                            value={createExamData.semester}
                            onChange={(e) => setCreateExamData(prev => ({ ...prev, semester: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Spring 2024"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Academic Year
                          </label>
                          <input
                            type="text"
                            value={createExamData.academicYear}
                            onChange={(e) => setCreateExamData(prev => ({ ...prev, academicYear: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 2023-2024"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Instructions
                        </label>
                        <textarea
                          rows={4}
                          value={createExamData.instructions}
                          onChange={(e) => setCreateExamData(prev => ({ ...prev, instructions: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter exam instructions for students"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Selected Questions Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Selected Questions ({createExamData.selectedQuestions.length})
                    </h3>
                    
                    {createExamData.selectedQuestions.length === 0 ? (
                      <p className="text-gray-500 text-sm">No questions selected yet</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {createExamData.selectedQuestions.map(questionId => {
                          const question = questions.find(q => q.id === questionId);
                          return question ? (
                            <div key={questionId} className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                              <span className="text-sm text-gray-700 truncate">
                                {question.subject} - {question.topic}
                              </span>
                              <button
                                onClick={() => handleQuestionSelect(questionId)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Question Selection */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Questions</h3>
                    
                    {/* Question Filters */}
                    <div className="space-y-4 mb-6">
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

                      <div className="grid grid-cols-2 gap-4">
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

                        <select
                          value={questionStatusFilter}
                          onChange={(e) => setQuestionStatusFilter(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="approved">Approved Only</option>
                          <option value="all">All Statuses</option>
                        </select>
                      </div>
                    </div>

                    {/* Questions List */}
                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                      {filteredQuestionsForExam.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No questions found matching your criteria
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {filteredQuestionsForExam.map(question => (
                            <div key={question.id} className="p-4 hover:bg-gray-50">
                              <div className="flex items-start space-x-3">
                                <input
                                  type="checkbox"
                                  checked={createExamData.selectedQuestions.includes(question.id)}
                                  onChange={() => handleQuestionSelect(question.id)}
                                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                                        {question.subject} - {question.topic}
                                      </h4>
                                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                        {question.leadQuestion}
                                      </p>
                                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                          {question.status}
                                        </span>
                                        <span>By {question.authorName}</span>
                                      </div>
                                    </div>
                                    
                                    <button
                                      onClick={() => handleViewQuestionDetails(question)}
                                      className="ml-2 text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                    >
                                      <Eye size={14} />
                                      <span className="text-xs">View</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-8">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateExam}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save size={16} />
                  <span>{isLoading ? 'Creating...' : 'Create Exam Book'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Details Modal */}
      {showQuestionDetails && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Question Details</h2>
                  <p className="text-gray-600">
                    {selectedQuestion.subject} - {selectedQuestion.topic}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowQuestionDetails(false);
                    setSelectedQuestion(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Question Metadata */}
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="text-gray-600">Author:</span>
                    <span className="ml-2 font-medium">{selectedQuestion.authorName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2">{new Date(selectedQuestion.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      selectedQuestion.status === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : selectedQuestion.status === 'under-review'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedQuestion.status.replace('-', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Disease:</span>
                    <span className="ml-2">{selectedQuestion.disease || 'Not specified'}</span>
                  </div>
                </div>

                {/* Clinical Vignette */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Clinical Vignette</h4>
                  <p className="text-gray-700 bg-blue-50 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedQuestion.clinicalVignette}
                  </p>
                </div>

                {/* Lead Question */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Lead Question</h4>
                  <p className="text-gray-700 font-medium">{selectedQuestion.leadQuestion}</p>
                </div>

                {/* Answer Options */}
                {selectedQuestion.options && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Answer Options</h4>
                    <div className="space-y-2">
                      {selectedQuestion.options.map((option, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${
                            option === selectedQuestion.correctAnswer
                              ? 'bg-green-100 text-green-800 font-medium border border-green-200'
                              : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          {String.fromCharCode(65 + index)}. {option}
                          {option === selectedQuestion.correctAnswer && (
                            <span className="ml-2 text-green-600 font-bold">(CORRECT)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {selectedQuestion.explanation && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Explanation</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedQuestion.explanation}
                    </p>
                  </div>
                )}

                {/* Learning Objectives */}
                {selectedQuestion.learningObjective && selectedQuestion.learningObjective.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Learning Objectives</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedQuestion.learningObjective.map(objective => (
                        <span key={objective} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          {objective}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* References */}
                {selectedQuestion.references && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">References</h4>
                    <p className="text-gray-600 text-sm italic">{selectedQuestion.references}</p>
                  </div>
                )}

                {/* Metadata */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Question Metadata</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Aspect:</span>
                      <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {selectedQuestion.aspect?.replace('-', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pathomechanism:</span>
                      <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {selectedQuestion.pathomecanism}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {selectedQuestion.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedQuestion.tags.map(tag => (
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

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={createExamData.selectedQuestions.includes(selectedQuestion.id)}
                    onChange={() => handleQuestionSelect(selectedQuestion.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {createExamData.selectedQuestions.includes(selectedQuestion.id) 
                      ? 'Selected for exam' 
                      : 'Select for exam'
                    }
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    setShowQuestionDetails(false);
                    setSelectedQuestion(null);
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
    </div>
  );
};