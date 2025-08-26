import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuestions } from '../../context/QuestionContext';
import { mockReviewAssignments } from '../../data/mockData';
import { Question } from '../../types';
import { CheckCircle, XCircle, MessageSquare, Clock, AlertTriangle, Save, Edit3, X } from 'lucide-react';

export const ReviewQuestions: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { questions, updateQuestion } = useQuestions();
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'revision' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'revision' | null>(null);
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());

  if (!user) return null;

  const isAdmin = hasRole('admin');

  // Get questions assigned to current reviewer
  const assignedQuestions = questions.filter(q => 
    q.status === 'under-review' && q.reviewerId === user.id
  );

  // Get questions that need review (unassigned) - all reviewers can see these
  const pendingQuestions = questions.filter(q => 
    q.status === 'submitted' && !q.reviewerId
  );

  // Get all reviewed questions for transparency
  const reviewedQuestions = questions.filter(q => 
    ['approved', 'rejected', 'needs-revision'].includes(q.status)
  );

  const handleReview = (action: 'approve' | 'reject' | 'revision') => {
    if (!selectedQuestion) return;
    
    console.log(`${action} question:`, selectedQuestion.id, 'with feedback:', feedback);
    
    // In a real app, this would make an API call
    alert(`Question ${action}ed successfully!`);
    
    // Reset state
    setSelectedQuestion(null);
    setReviewAction(null);
    setFeedback('');
  };

  const handleAssignToSelf = (questionId: string) => {
    if (!isAdmin) {
      alert('Only administrators can assign reviewers to questions.');
      return;
    }
    
    console.log('Admin assigning question to reviewer:', questionId);
    // In a real app, this would make an API call to assign the question
    alert('Question assigned successfully!');
  };

  const handleEditQuestion = (question: Question) => {
    setEditedQuestion({ ...question });
    setIsEditing(true);
    setModifiedFields(new Set());
  };

  const handleFieldChange = (field: keyof Question, value: any) => {
    if (!editedQuestion) return;
    
    setEditedQuestion(prev => prev ? { ...prev, [field]: value } : null);
    setModifiedFields(prev => new Set([...prev, field]));
  };

  const handleOptionChange = (index: number, value: string) => {
    if (!editedQuestion || !editedQuestion.options) return;
    
    const newOptions = [...editedQuestion.options];
    newOptions[index] = value;
    
    setEditedQuestion(prev => prev ? { ...prev, options: newOptions } : null);
    setModifiedFields(prev => new Set([...prev, 'options']));
  };

  const handleSaveChanges = async () => {
    if (!editedQuestion || !selectedQuestion) return;
    
    setIsSubmitting(true);
    try {
      await updateQuestion(selectedQuestion.id, {
        ...editedQuestion,
        updatedAt: new Date().toISOString().split('T')[0]
      });
      
      // Update the selected question to reflect changes
      setSelectedQuestion(editedQuestion);
      setIsEditing(false);
      setModifiedFields(new Set());
      
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedQuestion(null);
    setIsEditing(false);
    setModifiedFields(new Set());
  };

  const handleReviewAction = (action: 'approve' | 'reject' | 'revision') => {
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const confirmReviewAction = async () => {
    if (!selectedQuestion || !confirmAction) return;
    
    setIsSubmitting(true);
    setShowConfirmDialog(false);
    
    try {
      // Save any pending edits first
      if (isEditing && editedQuestion) {
        await updateQuestion(selectedQuestion.id, {
          ...editedQuestion,
          updatedAt: new Date().toISOString().split('T')[0]
        });
      }
      
      // Update question status based on action
      const statusMap = {
        approve: 'approved' as const,
        reject: 'rejected' as const,
        revision: 'needs-revision' as const
      };
      
      await updateQuestion(selectedQuestion.id, {
        status: statusMap[confirmAction],
        feedback: feedback.trim() || undefined,
        reviewerId: user.id,
        reviewerName: `${user.firstName} ${user.lastName}`,
        updatedAt: new Date().toISOString().split('T')[0]
      });
      
      // Reset states and close modal
      setSelectedQuestion(null);
      setReviewAction(null);
      setConfirmAction(null);
      setFeedback('');
      setIsEditing(false);
      setEditedQuestion(null);
      setModifiedFields(new Set());
      
      alert(`Question ${confirmAction}d successfully!`);
    } catch (error) {
      console.error('Error processing review action:', error);
      alert('Failed to process review action. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const QuestionReviewCard: React.FC<{ 
    question: Question; 
    isAssigned: boolean;
    showAssignButton?: boolean;
  }> = ({ 
    question, 
    isAssigned,
    showAssignButton = false
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{question.leadQuestion}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{question.clinicalVignette}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>By {question.authorName}</span>
            <span>•</span>
            <span>{question.subject}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isAssigned ? (
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
              Assigned to you
            </span>
          ) : showAssignButton ? (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
              Reviewed
            </span>
          ) : (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
              Pending review
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            Submitted {new Date(question.createdAt).toLocaleDateString()}
          </span>
          {isAssigned && (
            <>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-orange-600 flex items-center space-x-1">
                <Clock size={12} />
                <span>Due in 5 days</span>
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {showAssignButton && isAdmin && (
            <button
              onClick={() => handleAssignToSelf(question.id)}
              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
            >
              Assign Reviewer
            </button>
          )}
          <button
            onClick={() => setSelectedQuestion(question)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            {isAssigned ? 'Review' : 'View Details'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Review Questions</h2>
        <p className="text-gray-600">
          {isAdmin 
            ? 'Review questions and assign reviewers' 
            : 'Review questions assigned to you and view all questions for transparency'
          }
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-full">
              <Clock size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Assigned to You</p>
              <p className="text-xl font-semibold text-gray-900">{assignedQuestions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <AlertTriangle size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-xl font-semibold text-gray-900">{pendingQuestions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Reviewed</p>
              <p className="text-xl font-semibold text-gray-900">{reviewedQuestions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed Today</p>
              <p className="text-xl font-semibold text-gray-900">2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Lists */}
      <div className="space-y-8">
        {/* Assigned Questions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Assigned to You ({assignedQuestions.length})
          </h3>
          <div className="space-y-4">
            {assignedQuestions.map(question => (
              <QuestionReviewCard 
                key={question.id} 
                question={question} 
                isAssigned={true} 
              />
            ))}
            {assignedQuestions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No questions assigned to you</p>
              </div>
            )}
          </div>
        </div>

        {/* Questions Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Pending Questions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Pending Review ({pendingQuestions.length})
            </h3>
            <div className="space-y-4">
              {pendingQuestions.map(question => (
                <QuestionReviewCard 
                  key={question.id} 
                  question={question} 
                  isAssigned={false}
                  showAssignButton={false}
                />
              ))}
              {pendingQuestions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>No questions pending review</p>
                </div>
              )}
            </div>
          </div>

          {/* Reviewed Questions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recently Reviewed ({reviewedQuestions.slice(0, 5).length})
            </h3>
            <div className="space-y-4">
              {reviewedQuestions.slice(0, 5).map(question => (
                <QuestionReviewCard 
                  key={question.id} 
                  question={question} 
                  isAssigned={false}
                  showAssignButton={true}
                />
              ))}
              {reviewedQuestions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>No questions have been reviewed yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Admin Notice */}
        {!isAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Reviewer Permissions</h4>
                <p className="text-blue-700 text-sm mt-1">
                  You can review questions assigned to you and view all questions for transparency. 
                  Only administrators can assign reviewers to questions.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Review Question
                  </h2>
                  <p className="text-gray-600">
                    Submitted by {selectedQuestion.authorName} on{' '}
                    {new Date(selectedQuestion.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedQuestion.reviewerId === user.id && !isEditing && (
                    <button
                      onClick={() => handleEditQuestion(selectedQuestion)}
                      className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <Edit3 size={16} />
                      <span>Edit</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedQuestion(null);
                      setIsEditing(false);
                      setEditedQuestion(null);
                      setModifiedFields(new Set());
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Edit Mode Toggle */}
              {isEditing && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Edit3 size={16} className="text-blue-600" />
                      <span className="text-blue-800 font-medium">Edit Mode Active</span>
                      {modifiedFields.size > 0 && (
                        <span className="text-blue-600 text-sm">
                          ({modifiedFields.size} field{modifiedFields.size !== 1 ? 's' : ''} modified)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSaveChanges}
                        disabled={isSubmitting || modifiedFields.size === 0}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
                      >
                        <Save size={14} />
                        <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                        className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Question Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Main Content */}
                <div className="space-y-6">
                  {/* Subject and Topic */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Subject & Topic</h4>
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            value={editedQuestion?.subject || ''}
                            onChange={(e) => handleFieldChange('subject', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              modifiedFields.has('subject') ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                            }`}
                            placeholder="Subject"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={editedQuestion?.topic || ''}
                            onChange={(e) => handleFieldChange('topic', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              modifiedFields.has('topic') ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                            }`}
                            placeholder="Topic"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700">{selectedQuestion.subject} - {selectedQuestion.topic}</p>
                    )}
                  </div>

                  {/* Clinical Vignette */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Clinical Vignette</h4>
                    {isEditing ? (
                      <textarea
                        rows={6}
                        value={editedQuestion?.clinicalVignette || ''}
                        onChange={(e) => handleFieldChange('clinicalVignette', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          modifiedFields.has('clinicalVignette') ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                        }`}
                        placeholder="Clinical vignette..."
                      />
                    ) : (
                      <p className="text-gray-700 bg-blue-50 p-3 rounded-lg whitespace-pre-wrap">
                        {selectedQuestion.clinicalVignette}
                      </p>
                    )}
                  </div>

                  {/* Lead Question */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Lead Question</h4>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        value={editedQuestion?.leadQuestion || ''}
                        onChange={(e) => handleFieldChange('leadQuestion', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          modifiedFields.has('leadQuestion') ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                        }`}
                        placeholder="Lead question..."
                      />
                    ) : (
                      <p className="text-gray-700 font-medium">{selectedQuestion.leadQuestion}</p>
                    )}
                  </div>

                  {/* Answer Options */}
                  {selectedQuestion.type === 'multiple-choice' && selectedQuestion.options && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Answer Options</h4>
                      <div className="space-y-2">
                        {(isEditing ? editedQuestion?.options : selectedQuestion.options)?.map((option, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-600 w-6">
                              {String.fromCharCode(65 + index)}.
                            </span>
                            {isEditing ? (
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  modifiedFields.has('options') ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                                }`}
                              />
                            ) : (
                              <div
                                className={`flex-1 p-3 rounded-lg ${
                                  option === selectedQuestion.correctAnswer
                                    ? 'bg-green-100 text-green-800 font-medium border border-green-200'
                                    : 'bg-gray-50 text-gray-700'
                                }`}
                              >
                                {option}
                                {option === selectedQuestion.correctAnswer && (
                                  <span className="ml-2 text-green-600 font-bold">(CORRECT)</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {isEditing && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Correct Answer
                          </label>
                          <select
                            value={editedQuestion?.correctAnswer || ''}
                            onChange={(e) => handleFieldChange('correctAnswer', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              modifiedFields.has('correctAnswer') ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select correct answer</option>
                            {editedQuestion?.options?.map((option, index) => (
                              <option key={index} value={option}>
                                {String.fromCharCode(65 + index)}. {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column - Additional Details */}
                <div className="space-y-6">
                  {/* Explanation */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Explanation</h4>
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={editedQuestion?.explanation || ''}
                        onChange={(e) => handleFieldChange('explanation', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          modifiedFields.has('explanation') ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                        }`}
                        placeholder="Explanation..."
                      />
                    ) : (
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {selectedQuestion.explanation || 'No explanation provided.'}
                      </p>
                    )}
                  </div>

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
                      {isEditing ? (
                        <textarea
                          rows={3}
                          value={editedQuestion?.references || ''}
                          onChange={(e) => handleFieldChange('references', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            modifiedFields.has('references') ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                          }`}
                          placeholder="References..."
                        />
                      ) : (
                        <p className="text-gray-600 text-sm italic">{selectedQuestion.references}</p>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Question Metadata</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Aspect:</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {selectedQuestion.aspect?.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pathomechanism:</span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {selectedQuestion.pathomecanism}
                        </span>
                      </div>
                      {selectedQuestion.disease && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Disease:</span>
                          <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                            {selectedQuestion.disease}
                          </span>
                        </div>
                      )}
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
              </div>

              {/* Review Actions - Only show if question is assigned to current reviewer */}
              {selectedQuestion.reviewerId === user.id && (
                <div className="border-t border-gray-200 pt-6 mt-8">
                  <h4 className="font-medium text-gray-900 mb-4">Review Actions</h4>
                  
                  <div className="space-y-4">
                    {/* Feedback Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reviewer Feedback
                      </label>
                      <textarea
                        rows={3}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Provide feedback for the author..."
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleReviewAction('approve')}
                          disabled={isSubmitting}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={18} />
                          <span>Approve</span>
                        </button>

                        <button
                          onClick={() => handleReviewAction('revision')}
                          disabled={isSubmitting}
                          className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                        >
                          <MessageSquare size={18} />
                          <span>Request Revision</span>
                        </button>

                        <button
                          onClick={() => handleReviewAction('reject')}
                          disabled={isSubmitting}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <XCircle size={18} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* View-only notice for non-assigned questions */}
              {selectedQuestion.reviewerId !== user.id && (
                <div className="border-t border-gray-200 pt-6 mt-8">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 text-sm">
                      {selectedQuestion.status === 'submitted' 
                        ? 'This question is available for review but not assigned to you. Only administrators can assign reviewers.'
                        : `This question has been ${selectedQuestion.status.replace('-', ' ')} by ${selectedQuestion.reviewerName || 'another reviewer'}.`
                      }
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-end mt-4">
                    <button
                      onClick={() => setSelectedQuestion(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              {confirmAction === 'approve' && <CheckCircle size={24} className="text-green-600" />}
              {confirmAction === 'revision' && <MessageSquare size={24} className="text-yellow-600" />}
              {confirmAction === 'reject' && <XCircle size={24} className="text-red-600" />}
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm {confirmAction === 'revision' ? 'Revision Request' : confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)}
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                {confirmAction === 'approve' && 'Are you sure you want to approve this question? It will be marked as approved and available for use in exam books.'}
                {confirmAction === 'revision' && 'Are you sure you want to request revision for this question? The author will be notified to make changes.'}
                {confirmAction === 'reject' && 'Are you sure you want to reject this question? This action will mark the question as rejected.'}
              </p>
              
              {modifiedFields.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Note:</strong> Your edits to {modifiedFields.size} field{modifiedFields.size !== 1 ? 's' : ''} will be saved along with this review action.
                  </p>
                </div>
              )}
              
              {feedback.trim() && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-gray-700 text-sm">
                    <strong>Your feedback:</strong> {feedback.trim()}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmAction(null);
                }}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReviewAction}
                disabled={isSubmitting}
                className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                  confirmAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  confirmAction === 'revision' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmitting ? 'Processing...' : `Confirm ${confirmAction === 'revision' ? 'Revision Request' : confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};