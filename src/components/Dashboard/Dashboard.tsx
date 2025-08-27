import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuestions } from '../../context/QuestionContext';
import { mockExamBooks } from '../../data/mockData';
import { FileText, CheckCircle, BookOpen, Clock, TrendingUp, AlertTriangle, Eye } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { questions } = useQuestions();

  if (!user) return null;

  // Check if user is unverified
  const isUnverified = !user.isVerified;

  // Calculate statistics based on user role
  const getStatistics = () => {
    const userQuestions = questions.filter(q => q.authorId === user.id);
    const pendingReviews = questions.filter(q => 
      q.status === 'under-review' && q.reviewerId === user.id
    );
    const approvedQuestions = questions.filter(q => q.status === 'approved');
    
    // Apply access control to exam books count
    const accessibleExamBooks = hasRole('admin') 
      ? mockExamBooks 
      : mockExamBooks.filter(exam => exam.createdBy === user.id);
    const totalExams = accessibleExamBooks.length;

    return {
      submitted: userQuestions.length,
      approved: userQuestions.filter(q => q.status === 'approved').length,
      pendingReview: pendingReviews.length,
      totalQuestions: questions.length,
      totalExams,
      approvedQuestions: approvedQuestions.length,
    };
  };

  const stats = getStatistics();

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('text', 'bg').replace('-600', '-100')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.firstName}!</h2>
        <p className="text-gray-600">
          {isUnverified 
            ? 'Your account is pending verification. Contact an administrator for full access.'
            : "Here's what's happening with your questions and exams."
          }
        </p>
      </div>

      {/* Verification Notice */}
      {isUnverified && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle size={24} className="text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-orange-900 mb-2">Account Verification Required</h3>
              <p className="text-orange-800 mb-4">
                Your account is currently unverified and has limited access. You can view this dashboard and update your account settings, 
                but you cannot access other system features until an administrator verifies your account.
              </p>
              <div className="bg-orange-100 rounded-lg p-4">
                <h4 className="font-medium text-orange-900 mb-2">What you can do while waiting:</h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• View this dashboard for system overview</li>
                  <li>• Update your profile information in Account Settings</li>
                  <li>• Configure your notification preferences</li>
                  <li>• Contact your administrator for account verification</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      {!isUnverified && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(hasRole('lecturer') || hasRole('admin')) && (
          <>
            <StatCard
              title="Questions Submitted"
              value={stats.submitted}
              icon={<FileText size={24} className="text-blue-600" />}
              color="text-blue-600"
            />
            <StatCard
              title="Questions Approved"
              value={stats.approved}
              icon={<CheckCircle size={24} className="text-green-600" />}
              color="text-green-600"
            />
          </>
        )}

        {(hasRole('reviewer') || hasRole('admin')) && (
          <StatCard
            title="Pending Reviews"
            value={stats.pendingReview}
            icon={<Clock size={24} className="text-orange-600" />}
            color="text-orange-600"
          />
        )}

        {(hasRole('coordinator') || hasRole('admin')) && (
          <StatCard
            title="Exam Books"
            value={stats.totalExams}
            icon={<BookOpen size={24} className="text-purple-600" />}
            color="text-purple-600"
          />
        )}

        {(hasRole('admin') || hasRole('coordinator')) && (
          <StatCard
            title="Total Questions"
            value={stats.totalQuestions}
            icon={<TrendingUp size={24} className="text-indigo-600" />}
            color="text-indigo-600"
          />
        )}
        </div>
      )}

      {/* Recent Activity */}
      {!isUnverified && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Questions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Questions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {questions.slice(0, 3).map((question) => (
                <div key={question.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    question.status === 'approved' ? 'bg-green-500' :
                    question.status === 'under-review' ? 'bg-orange-500' :
                    question.status === 'rejected' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {question.subject} - {question.topic}
                    </p>
                    <p className="text-xs text-gray-500">
                      {question.subject} • {question.topic}
                    </p>
                    <p className="text-xs text-gray-400">
                      {question.status.replace('-', ' ')} • {new Date(question.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {(hasRole('lecturer') || hasRole('admin')) && (
                <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <FileText size={20} className="text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Submit New Question</p>
                      <p className="text-sm text-blue-600">Add a question to the bank</p>
                    </div>
                  </div>
                </button>
              )}
              
              {(hasRole('reviewer') || hasRole('admin')) && (
                <button className="w-full text-left p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200">
                  <div className="flex items-center space-x-3">
                    <CheckCircle size={20} className="text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-900">Review Questions</p>
                      <p className="text-sm text-orange-600">Review pending submissions</p>
                    </div>
                  </div>
                </button>
              )}

              {(hasRole('coordinator') || hasRole('admin')) && (
                <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <BookOpen size={20} className="text-purple-600" />
                    <div>
                      <p className="font-medium text-purple-900">Create Exam Book</p>
                      <p className="text-sm text-purple-600">Compile questions into an exam</p>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Restricted Access Message for Unverified Users */}
      {isUnverified && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Account Status</h3>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <AlertTriangle size={48} className="mx-auto text-orange-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Verification Pending</h4>
                <p className="text-gray-600 mb-4">
                  Your account was created on {new Date(user.createdAt).toLocaleDateString()} and is awaiting administrator verification.
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Account Type:</strong> {user.roles.map(r => r.type).join(', ')}<br/>
                    <strong>Department:</strong> {user.department || 'Not specified'}<br/>
                    <strong>Status:</strong> Unverified
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Next Steps</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Complete Your Profile</h4>
                    <p className="text-sm text-gray-600">Update your profile information in Account Settings to help administrators verify your account.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Contact Administrator</h4>
                    <p className="text-sm text-gray-600">Reach out to your system administrator to request account verification and role assignment.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Wait for Verification</h4>
                    <p className="text-sm text-gray-600">Once verified, you'll gain access to all features based on your assigned roles.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};