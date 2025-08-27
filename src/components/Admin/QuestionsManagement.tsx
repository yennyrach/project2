import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuestions } from '../../context/QuestionContext';
import { Question, User, Role } from '../../types';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  UserPlus, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus
} from 'lucide-react';

interface ReviewAssignment {
  questionId: string;
  reviewer1: string;
  reviewer2: string;
}

interface QuestionsManagementProps {
  onCreateExamBookRequest?: () => void;
}

export const QuestionsManagement: React.FC<QuestionsManagementProps> = ({ onCreateExamBookRequest }) => {
  const { user, hasRole, getAllUsers } = useAuth();
  const { questions, updateQuestion } = useQuestions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentData, setAssignmentData] = useState<ReviewAssignment>({
    questionId: '',
    reviewer1: '',
    reviewer2: ''
  });
  const [availableReviewers, setAvailableReviewers] = useState<User[]>([]);
  const [isLoadingReviewers, setIsLoadingReviewers] = useState(false);

  const itemsPerPage = 10;

  if (!user || !hasRole('admin')) {
    return (
      <div className="text-center py-12">
        <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">Only administrators can access question management.</p>
      </div>
    );
  }

  /**
   * Load available reviewers from the user database
   * Filters users who have the 'reviewer' role and are verified
   */
  const loadAvailableReviewers = async () => {
    console.log('QuestionsManagement: Loading available reviewers...');
    setIsLoadingReviewers(true);
    
    try {
      // Get all users from the database
      const allUsers = await getAllUsers();
      console.log('QuestionsManagement: Total users found:', allUsers.length);
      
      // Filter users who have reviewer role and are verified
      const reviewers = allUsers.filter(user => {
        const hasReviewerRole = user.roles.some((role: Role) => role.type === 'reviewer');
        const isVerified = user.is_verified;
        
        console.log(`User ${user.first_name} ${user.last_name}:`, {
          hasReviewerRole,
          isVerified,
          roles: user.roles.map(r => r.type)
        });
        
        return hasReviewerRole && isVerified;
      });
      
      console.log('QuestionsManagement: Available reviewers found:', reviewers.length);
      console.log('QuestionsManagement: Reviewer details:', reviewers.map(r => ({
        id: r.id,
        name: `${r.first_name} ${r.last_name}`,
        department: r.department
      })));
      
      setAvailableReviewers(reviewers);
    } catch (error) {
      console.error('QuestionsManagement: Error loading reviewers:', error);
      setAvailableReviewers([]);
    } finally {
      setIsLoadingReviewers(false);
    }
  };

  // Load reviewers on component mount
  useEffect(() => {
    loadAvailableReviewers();
  }, []);

  // Listen for user database updates to refresh reviewer list
  useEffect(() => {
    const handleUserDatabaseUpdate = () => {
      console.log('QuestionsManagement: User database updated, refreshing reviewers...');
      loadAvailableReviewers();
    };

    const handleUserProfileUpdate = () => {
      console.log('QuestionsManagement: User profile updated, refreshing reviewers...');
      // Small delay to ensure database is updated
      setTimeout(() => {
        loadAvailableReviewers();
      }, 500);
    };

    // Listen for database update events
    window.addEventListener('userDatabaseUpdated', handleUserDatabaseUpdate);
    window.addEventListener('userProfileUpdated', handleUserProfileUpdate);
    window.addEventListener('userDatabaseRefresh', handleUserDatabaseUpdate);
    window.addEventListener('reviewerListUpdated', handleUserDatabaseUpdate);

    return () => {
      window.removeEventListener('userDatabaseUpdated', handleUserDatabaseUpdate);
      window.removeEventListener('userProfileUpdated', handleUserProfileUpdate);
      window.removeEventListener('userDatabaseRefresh', handleUserDatabaseUpdate);
      window.removeEventListener('reviewerListUpdated', handleUserDatabaseUpdate);
    };
  }, []);

  // Filter and search questions
  const getFilteredQuestions = (): Question[] => {
    return questions.filter(question => {
      const matchesSearch = (question.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (question.disease || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (question.topic || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (question.leadQuestion || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSubject = selectedSubject === 'all' || question.subject === selectedSubject;
      const matchesStatus = selectedStatus === 'all' || question.status === selectedStatus;

      return matchesSearch && matchesSubject && matchesStatus;
    });
  };

  const filteredQuestions = getFilteredQuestions();
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const subjects = [...new Set(questions.map(q => q.subject))];
  const statuses = [...new Set(questions.map(q => q.status))];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'rejected':
        return <XCircle size={16} className="text-red-600" />;
      case 'under-review':
        return <Clock size={16} className="text-orange-600" />;
      case 'needs-revision':
        return <Edit size={16} className="text-yellow-600" />;
      default:
        return <AlertTriangle size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'under-review':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'needs-revision':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAssignReviewers = async () => {
    if (!assignmentData.reviewer1 || !assignmentData.reviewer2) {
      alert('Please select exactly two reviewers');
      return;
    }

    if (assignmentData.reviewer1 === assignmentData.reviewer2) {
      alert('Please select two different reviewers');
      return;
    }

    try {
      const reviewer1 = availableReviewers.find(r => r.id === assignmentData.reviewer1);
      const reviewer2 = availableReviewers.find(r => r.id === assignmentData.reviewer2);

      await updateQuestion(assignmentData.questionId, {
        status: 'under-review',
        reviewerId: assignmentData.reviewer1,
        reviewerName: `${reviewer1?.first_name} ${reviewer1?.last_name}`,
        reviewer1: `${reviewer1?.first_name} ${reviewer1?.last_name}`,
        reviewer2: `${reviewer2?.first_name} ${reviewer2?.last_name}`,
      });

      setShowAssignModal(false);
      setAssignmentData({ questionId: '', reviewer1: '', reviewer2: '' });
      alert('Reviewers assigned successfully!');
    } catch (error) {
      console.error('Error assigning reviewers:', error);
      alert('Failed to assign reviewers. Please try again.');
    }
  };

  const exportQuestions = () => {
    const csvContent = questions.map(q => ({
      ID: q.id,
      Subject: q.subject,
      Topic: q.topic,
      Status: q.status,
      Author: q.authorName,
      'Created Date': q.createdAt,
      'Reviewer 1': q.reviewer1 || '',
      'Reviewer 2': q.reviewer2 || ''
    }));

    const csv = [
      Object.keys(csvContent[0]).join(','),
      ...csvContent.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Questions Management</h2>
          <p className="text-gray-600">Manage all questions, assign reviewers, and create exam books</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={exportQuestions}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <Download size={20} />
            <span>Export</span>
          </button>
          <button
            onClick={onCreateExamBookRequest}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <BookOpen size={20} />
            <span>Create Exam Book</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <BookOpen size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Questions</p>
              <p className="text-xl font-semibold text-gray-900">{questions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-full">
              <Clock size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Under Review</p>
              <p className="text-xl font-semibold text-gray-900">
                {questions.filter(q => q.status === 'under-review').length}
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
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-xl font-semibold text-gray-900">
                {questions.filter(q => q.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <AlertTriangle size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-xl font-semibold text-gray-900">
                {questions.filter(q => q.status === 'submitted').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-full">
              <XCircle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-xl font-semibold text-gray-900">
                {questions.filter(q => q.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions by subject, topic, or content..."
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

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {paginatedQuestions.length} of {filteredQuestions.length} questions
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reviewers
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
              {paginatedQuestions.map((question) => (
                <tr key={question.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {question.leadQuestion}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {question.topic}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{question.subject}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{question.authorName}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(question.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(question.status)}`}>
                        {question.status.replace('-', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-600">
                      {question.reviewer1 && (
                        <div>R1: {question.reviewer1}</div>
                      )}
                      {question.reviewer2 && (
                        <div>R2: {question.reviewer2}</div>
                      )}
                      {!question.reviewer1 && !question.reviewer2 && (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {new Date(question.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedQuestion(question)}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                      {(question.status === 'submitted' || question.status === 'needs-revision') && (
                        <button
                          onClick={() => {
                            setAssignmentData({ ...assignmentData, questionId: question.id });
                            setShowAssignModal(true);
                          }}
                          className="text-green-600 hover:text-green-700 text-sm flex items-center space-x-1"
                        >
                          <UserPlus size={14} />
                          <span>Assign</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredQuestions.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredQuestions.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight size={20} />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Question Details Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Question Details</h2>
                  <p className="text-gray-600">ID: {selectedQuestion.id}</p>
                </div>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Subject & Topic</h4>
                    <p className="text-gray-700">{selectedQuestion.subject} - {selectedQuestion.topic}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedQuestion.status)}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedQuestion.status)}`}>
                        {selectedQuestion.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Author</h4>
                    <p className="text-gray-700">{selectedQuestion.authorName}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Created</h4>
                    <p className="text-gray-700">{new Date(selectedQuestion.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Clinical Vignette</h4>
                  <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{selectedQuestion.clinicalVignette}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Lead Question</h4>
                  <p className="text-gray-700 font-medium">{selectedQuestion.leadQuestion}</p>
                </div>

                {selectedQuestion.options && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Answer Options</h4>
                    <ul className="space-y-2">
                      {selectedQuestion.options.map((option, index) => (
                        <li
                          key={index}
                          className={`p-3 rounded-lg ${
                            option === selectedQuestion.correctAnswer
                              ? 'bg-green-100 text-green-800 font-medium border border-green-200'
                              : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          {index + 1}. {option}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedQuestion.explanation && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Explanation</h4>
                    <p className="text-gray-700">{selectedQuestion.explanation}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Aspect</h4>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {selectedQuestion.aspect?.replace('-', ' ')}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Pathomechanism</h4>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                      {selectedQuestion.pathomecanism}
                    </span>
                  </div>
                </div>

                {(selectedQuestion.reviewer1 || selectedQuestion.reviewer2) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Assigned Reviewers</h4>
                    <div className="space-y-1">
                      {selectedQuestion.reviewer1 && (
                        <p className="text-gray-700">Reviewer 1: {selectedQuestion.reviewer1}</p>
                      )}
                      {selectedQuestion.reviewer2 && (
                        <p className="text-gray-700">Reviewer 2: {selectedQuestion.reviewer2}</p>
                      )}
                    </div>
                  </div>
                )}

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

              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {(selectedQuestion.status === 'submitted' || selectedQuestion.status === 'needs-revision') && (
                  <button
                    onClick={() => {
                      setAssignmentData({ ...assignmentData, questionId: selectedQuestion.id });
                      setShowAssignModal(true);
                      setSelectedQuestion(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Assign Reviewers
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Reviewers Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Reviewers</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Reviewer *
                </label>
                {isLoadingReviewers ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600 text-sm">Loading reviewers...</span>
                  </div>
                ) : (
                <select
                  value={assignmentData.reviewer1}
                  onChange={(e) => setAssignmentData({ ...assignmentData, reviewer1: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">
                    {availableReviewers.length === 0 ? 'No reviewers available' : 'Select first reviewer'}
                  </option>
                  {availableReviewers.map(reviewer => (
                    <option key={reviewer.id} value={reviewer.id}>
                      {reviewer.first_name} {reviewer.last_name} ({reviewer.department})
                    </option>
                  ))}
                </select>
                )}
                {!isLoadingReviewers && availableReviewers.length === 0 && (
                  <p className="mt-1 text-sm text-orange-600">
                    No verified reviewers found. Please assign reviewer roles to users first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Second Reviewer *
                </label>
                {isLoadingReviewers ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600 text-sm">Loading reviewers...</span>
                  </div>
                ) : (
                <select
                  value={assignmentData.reviewer2}
                  onChange={(e) => setAssignmentData({ ...assignmentData, reviewer2: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">
                    {availableReviewers.length === 0 ? 'No reviewers available' : 'Select second reviewer'}
                  </option>
                  {availableReviewers
                    .filter(reviewer => reviewer.id !== assignmentData.reviewer1)
                    .map(reviewer => (
                    <option key={reviewer.id} value={reviewer.id}>
                      {reviewer.first_name} {reviewer.last_name} ({reviewer.department})
                    </option>
                  ))}
                </select>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignmentData({ questionId: '', reviewer1: '', reviewer2: '' });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignReviewers}
                disabled={isLoadingReviewers || availableReviewers.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Reviewers
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};