import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuestions } from '../../context/QuestionContext';
import { Question } from '../../types';
import { QuestionCard } from './QuestionCard';
import { Search, Filter, Plus } from 'lucide-react';

interface QuestionListProps {
  onAddQuestion?: () => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({ onAddQuestion }) => {
  const { user, hasRole } = useAuth();
  const { questions } = useQuestions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  if (!user) return null;

  // Force re-render when questions change
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
    console.log('Questions updated, current count:', questions.length);
  }, [questions]);

  // Filter questions based on user role and permissions
  const getFilteredQuestions = (): Question[] => {
    let filteredQuestions = questions;

    // Role-based filtering
    if (hasRole('lecturer') && !hasRole('reviewer') && !hasRole('coordinator')) {
      // Lecturers can see all approved questions and their own questions
      filteredQuestions = questions.filter(q => 
        q.status === 'approved' || q.authorId === user.id
      );
    }

    // Apply search and filters
    return filteredQuestions.filter(question => {
      const matchesSearch = (question.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (question.disease || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (question.topic || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSubject = selectedSubject === 'all' || question.topic === selectedSubject;
      const matchesStatus = selectedStatus === 'all' || question.status === selectedStatus;

      return matchesSearch && matchesSubject && matchesStatus;
    });
  };

  const filteredQuestions = getFilteredQuestions();
  const subjects = [...new Set(questions.map(q => q.subject))];
  const statuses = [...new Set(questions.map(q => q.status))];

  console.log('Rendering QuestionList with', filteredQuestions.length, 'filtered questions out of', questions.length, 'total');

  return (
    <div className="space-y-6" key={refreshKey}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Question Bank</h2>
          <p className="text-gray-600">Manage and review questions in the system</p>
        </div>
        
        {hasRole('lecturer') && (
          <button 
            onClick={onAddQuestion}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Add new question"
          >
            <Plus size={20} />
            <span>Add Question</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by subject, disease/condition, or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Subject Filter */}
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

          {/* Status Filter */}
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

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredQuestions.length} of {questions.length} questions
        </div>
      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredQuestions.map(question => (
          <QuestionCard key={question.id} question={question} />
        ))}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="text-center py-12">
          <Filter size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
        </div>
      )}
    </div>
  );
};