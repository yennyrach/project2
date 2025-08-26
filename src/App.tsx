import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QuestionProvider } from './context/QuestionContext';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { QuestionList } from './components/Questions/QuestionList';
import { SubmitQuestion } from './components/Questions/SubmitQuestion';
import { CSVImport } from './components/Questions/CSVImport';
import { ReviewQuestions } from './components/Review/ReviewQuestions';
import { ExamBooks } from './components/Exams/ExamBooks';
import { Login } from './components/Auth/Login';
import { QuestionsManagement } from './components/Admin/QuestionsManagement';
import { UserManagement } from './components/Admin/UserManagement';
import { UserSettings } from './components/Settings/UserSettings';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSubmitQuestionModal, setShowSubmitQuestionModal] = useState(false);
  const [triggerCreateExamModal, setTriggerCreateExamModal] = useState(false);

  if (!user) {
    return <Login />;
  }

  const handleCreateExamBookRequest = () => {
    setActiveTab('exams');
    setTriggerCreateExamModal(true);
  };
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'questions-management':
        return <QuestionsManagement onCreateExamBookRequest={handleCreateExamBookRequest} />;
      case 'questions':
        return <QuestionList onAddQuestion={() => setShowSubmitQuestionModal(true)} />;
      case 'submit-question':
        return <SubmitQuestion />;
      case 'csv-import':
        return <CSVImport onImport={(questions) => {
          console.log('Imported questions:', questions);
        }} />;
      case 'review':
        return <ReviewQuestions />;
      case 'exams':
        return <ExamBooks 
          shouldOpenCreateModal={triggerCreateExamModal}
          onModalOpened={() => setTriggerCreateExamModal(false)}
        />;
      case 'user-management':
        return <UserManagement />;
      case 'settings':
        return <UserSettings />;
      case 'analytics':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600">
              This section would show question bank statistics, usage analytics, and performance metrics.
            </p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 p-6">
          {renderContent()}
          
          {/* Submit Question Modal */}
          {showSubmitQuestionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Submit New Question</h2>
                    <button
                      onClick={() => setShowSubmitQuestionModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Close modal"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <SubmitQuestion onSuccess={() => {
                    setShowSubmitQuestionModal(false);
                    // Optionally refresh the question list or show success message
                  }} />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <QuestionProvider>
        <AppContent />
      </QuestionProvider>
    </AuthProvider>
  );
}

export default App;