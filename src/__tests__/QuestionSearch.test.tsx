import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionList } from '../components/Questions/QuestionList';
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

describe('Question Search Functionality', () => {
  const renderQuestionList = () => {
    return render(
      <AuthProvider>
        <QuestionList />
      </AuthProvider>
    );
  };

  test('searches by subject field', () => {
    renderQuestionList();
    
    const searchInput = screen.getByPlaceholderText('Search by subject, disease/condition, or topic...');
    fireEvent.change(searchInput, { target: { value: 'Cardiology' } });
    
    // Should find questions with Cardiology in subject
    expect(screen.getByText(/Cardiology/)).toBeInTheDocument();
  });

  test('searches by disease/condition field', () => {
    renderQuestionList();
    
    const searchInput = screen.getByPlaceholderText('Search by subject, disease/condition, or topic...');
    fireEvent.change(searchInput, { target: { value: 'Myocardial Infarction' } });
    
    // Should find questions with matching disease
    expect(screen.getByText(/Myocardial Infarction/)).toBeInTheDocument();
  });

  test('searches by topic field', () => {
    renderQuestionList();
    
    const searchInput = screen.getByPlaceholderText('Search by subject, disease/condition, or topic...');
    fireEvent.change(searchInput, { target: { value: 'Hypothyroidism' } });
    
    // Should find questions with matching topic
    expect(screen.getByText(/Hypothyroidism/)).toBeInTheDocument();
  });

  test('search is case insensitive', () => {
    renderQuestionList();
    
    const searchInput = screen.getByPlaceholderText('Search by subject, disease/condition, or topic...');
    fireEvent.change(searchInput, { target: { value: 'cardiology' } });
    
    // Should find questions regardless of case
    expect(screen.getByText(/Cardiology/)).toBeInTheDocument();
  });

  test('handles empty search gracefully', () => {
    renderQuestionList();
    
    const searchInput = screen.getByPlaceholderText('Search by subject, disease/condition, or topic...');
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // Should show all questions when search is empty
    expect(screen.getByText(/Showing \d+ of \d+ questions/)).toBeInTheDocument();
  });

  test('handles search with no results', () => {
    renderQuestionList();
    
    const searchInput = screen.getByPlaceholderText('Search by subject, disease/condition, or topic...');
    fireEvent.change(searchInput, { target: { value: 'NonexistentTopic' } });
    
    // Should show no results message
    expect(screen.getByText('No questions found')).toBeInTheDocument();
  });

  test('filters work correctly with search', () => {
    renderQuestionList();
    
    // Apply subject filter
    const subjectFilter = screen.getByDisplayValue('All Subjects');
    fireEvent.change(subjectFilter, { target: { value: 'Cardiology' } });
    
    // Apply search
    const searchInput = screen.getByPlaceholderText('Search by subject, disease/condition, or topic...');
    fireEvent.change(searchInput, { target: { value: 'Myocardial' } });
    
    // Should show filtered and searched results
    expect(screen.getByText(/Cardiology/)).toBeInTheDocument();
  });
});