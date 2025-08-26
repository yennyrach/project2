import React, { useState } from 'react';
import { Question } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useQuestions } from '../../context/QuestionContext';
import { 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye, 
  Edit,
  Trash2,
  Calendar
} from 'lucide-react';

interface QuestionCardProps {
  question: Question;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const { user, hasRole } = useAuth();
  const { deleteQuestion } = useQuestions();
  const [showDetails, setShowDetails] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'rejected':
        return <XCircle size={16} className="text-red-600" />;
      case 'under-review':
        return <AlertCircle size={16} className="text-orange-600" />;
      case 'needs-revision':
        return <Edit size={16} className="text-yellow-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canEdit = user?.id === question.authorId && 
    ['draft', 'needs-revision'].includes(question.status);

  const canReview = hasRole('reviewer') && 
    question.status === 'under-review' && 
    question.reviewerId === user?.id;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteQuestion(question.id);
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{question.subject} - {question.topic}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <User size={14} />
                <span>{question.authorName}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar size={14} />
                <span>{new Date(question.createdAt).toLocaleDateString()}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(question.status)}
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(question.status)}`}>
              {question.status.replace('-', ' ')}
            </span>
          </div>
        </div>

        {/* Question Preview */}
        <p className="text-gray-700 text-sm mb-2 line-clamp-2">
          {question.clinicalVignette}
        </p>
        <p className="text-gray-800 text-sm font-medium mb-4">
          {question.leadQuestion}
        </p>

        {/* Tags and Metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">
              {question.aspect?.replace('-', ' ')}
            </span>
            <span className="text-xs text-gray-600 bg-purple-100 px-2 py-1 rounded">
              {question.pathomecanism}
            </span>
          </div>
        </div>

        {/* Subject and Topic */}
        <div className="mt-3 flex items-center space-x-2 text-xs text-gray-600">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {question.subject}
          </span>
          <span>•</span>
          <span>{question.topic}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
            >
              <Eye size={14} />
              <span>View Details</span>
            </button>
            
            {canEdit && (
              <button className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center space-x-1">
                <Edit size={14} />
                <span>Edit</span>
              </button>
            )}

            {canEdit && (
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1 disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            )}

            {canReview && (
              <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                Review
              </button>
            )}
          </div>

          {question.reviewerName && (
            <span className="text-xs text-gray-500">
              Reviewed by {question.reviewerName}
            </span>
          )}
        </div>

        {/* Tags */}
        {question.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {question.tags.map(tag => (
              <span
                key={tag}
                className="inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Feedback */}
        {question.feedback && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">Reviewer Feedback:</p>
            <p className="text-sm text-blue-700 mt-1">{question.feedback}</p>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Clinical Vignette:</h4>
              <p className="text-gray-700 text-sm whitespace-pre-wrap bg-blue-50 p-3 rounded-lg">{question.clinicalVignette}</p>
            </div>

            {question.leadQuestion && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Lead Question:</h4>
                <p className="text-gray-700 text-sm font-medium">{question.leadQuestion}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-700 mb-1">Aspect:</h5>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {question.aspect?.replace('-', ' ')}
                </span>
              </div>
              <div>
                <h5 className="font-medium text-gray-700 mb-1">Pathomechanism:</h5>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {question.pathomecanism}
                </span>
              </div>
            </div>

            {question.options && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Options:</h4>
                <ul className="space-y-1">
                  {question.options.map((option, index) => (
                    <li
                      key={index}
                      className={`text-sm p-2 rounded ${
                        option === question.correctAnswer
                          ? 'bg-green-100 text-green-800 font-medium'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {index + 1}. {option}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {question.learningObjective && question.learningObjective.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Learning Objectives:</h4>
                <div className="flex flex-wrap gap-2">
                  {question.learningObjective.map(objective => (
                    <span key={objective} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      {objective}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {question.explanation && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Explanation:</h4>
                <p className="text-gray-700 text-sm">{question.explanation}</p>
              </div>
            )}

            {/* Additional CSV Template Fields */}
            {question.references && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">References:</h4>
                <p className="text-gray-600 text-sm italic">{question.references}</p>
              </div>
            )}

            {question.disease && (
              <div className="flex items-center space-x-4 text-sm">
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                  Disease: {question.disease}
                </span>
              </div>
            )}

            {(question.reviewer1 || question.reviewer2) && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Reviewers:</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {question.reviewer1 && <span>Reviewer 1: {question.reviewer1}</span>}
                  {question.reviewer2 && <span>Reviewer 2: {question.reviewer2}</span>}
                </div>
              </div>
            )}

            {question.reviewerComment && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Reviewer Comment:</h4>
                <p className="text-gray-700 text-sm bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  {question.reviewerComment}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};