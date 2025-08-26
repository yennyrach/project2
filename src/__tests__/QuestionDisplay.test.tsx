import { render, screen } from '@testing-library/react';
import { QuestionCard } from '../components/Questions/QuestionCard';
import { AuthProvider } from '../context/AuthContext';
import { mockQuestions } from '../data/mockData';

// Mock the auth context
const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  roles: [{ type: 'lecturer', permissions: ['view-questions'] }],
  isVerified: true,
  createdAt: '2024-01-01'
};

jest.mock('../context/AuthContext', () => ({
  ...jest.requireActual('../context/AuthContext'),
  useAuth: () => ({
    user: mockUser,
    hasRole: (role: string) => mockUser.roles.some(r => r.type === role)
  })
}));

describe('Question Display Components', () => {
  const sampleQuestion = mockQuestions[0];

  const renderQuestionCard = (question = sampleQuestion) => {
    return render(
      <AuthProvider>
        <QuestionCard question={question} />
      </AuthProvider>
    );
  };

  test('displays subject and topic in header instead of title', () => {
    renderQuestionCard();
    
    // Should display subject - topic format
    expect(screen.getByText(`${sampleQuestion.subject} - ${sampleQuestion.topic}`)).toBeInTheDocument();
    
    // Should not display any title-related content
    expect(screen.queryByText(/title/i)).not.toBeInTheDocument();
  });

  test('displays clinical vignette correctly', () => {
    renderQuestionCard();
    
    // Should display clinical vignette
    expect(screen.getByText(sampleQuestion.clinicalVignette, { exact: false })).toBeInTheDocument();
  });

  test('displays lead question correctly', () => {
    renderQuestionCard();
    
    // Should display lead question
    expect(screen.getByText(sampleQuestion.leadQuestion)).toBeInTheDocument();
  });

  test('displays author and date information', () => {
    renderQuestionCard();
    
    // Should display author name
    expect(screen.getByText(sampleQuestion.authorName)).toBeInTheDocument();
    
    // Should display creation date
    expect(screen.getByText(new Date(sampleQuestion.createdAt).toLocaleDateString())).toBeInTheDocument();
  });

  test('displays status correctly', () => {
    renderQuestionCard();
    
    // Should display status
    expect(screen.getByText(sampleQuestion.status.replace('-', ' '))).toBeInTheDocument();
  });

  test('displays aspect and pathomechanism tags', () => {
    renderQuestionCard();
    
    // Should display aspect
    expect(screen.getByText(sampleQuestion.aspect?.replace('-', ' ') || '')).toBeInTheDocument();
    
    // Should display pathomechanism
    expect(screen.getByText(sampleQuestion.pathomecanism)).toBeInTheDocument();
  });

  test('handles questions with missing optional fields', () => {
    const questionWithMissingFields = {
      ...sampleQuestion,
      disease: undefined,
      explanation: undefined,
      references: undefined
    };
    
    renderQuestionCard(questionWithMissingFields);
    
    // Should still render without errors
    expect(screen.getByText(`${sampleQuestion.subject} - ${sampleQuestion.topic}`)).toBeInTheDocument();
  });

  test('displays all question options when expanded', () => {
    renderQuestionCard();
    
    // Click to expand details
    const viewDetailsButton = screen.getByText('View Details');
    viewDetailsButton.click();
    
    // Should display all options
    sampleQuestion.options?.forEach((option, index) => {
      expect(screen.getByText(`${index + 1}. ${option}`)).toBeInTheDocument();
    });
  });
});