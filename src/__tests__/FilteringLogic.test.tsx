import { mockQuestions } from '../data/mockData';

describe('Question Filtering Logic', () => {
  const filterQuestions = (questions: any[], searchTerm: string, subject: string, status: string) => {
    return questions.filter(question => {
      const matchesSearch = (question.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (question.disease || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (question.topic || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSubject = subject === 'all' || question.subject === subject;
      const matchesStatus = status === 'all' || question.status === status;

      return matchesSearch && matchesSubject && matchesStatus;
    });
  };

  test('filters by subject correctly', () => {
    const result = filterQuestions(mockQuestions, '', 'Cardiology', 'all');
    
    expect(result.length).toBeGreaterThan(0);
    result.forEach(question => {
      expect(question.subject).toBe('Cardiology');
    });
  });

  test('filters by status correctly', () => {
    const result = filterQuestions(mockQuestions, '', 'all', 'approved');
    
    expect(result.length).toBeGreaterThan(0);
    result.forEach(question => {
      expect(question.status).toBe('approved');
    });
  });

  test('search works with subject field', () => {
    const result = filterQuestions(mockQuestions, 'Cardiology', 'all', 'all');
    
    expect(result.length).toBeGreaterThan(0);
    result.forEach(question => {
      expect(question.subject.toLowerCase()).toContain('cardiology');
    });
  });

  test('search works with disease field', () => {
    const result = filterQuestions(mockQuestions, 'Myocardial', 'all', 'all');
    
    expect(result.length).toBeGreaterThan(0);
    result.forEach(question => {
      const hasMatch = (question.disease || '').toLowerCase().includes('myocardial') ||
                      (question.subject || '').toLowerCase().includes('myocardial') ||
                      (question.topic || '').toLowerCase().includes('myocardial');
      expect(hasMatch).toBe(true);
    });
  });

  test('search works with topic field', () => {
    const result = filterQuestions(mockQuestions, 'Hypothyroidism', 'all', 'all');
    
    expect(result.length).toBeGreaterThan(0);
    result.forEach(question => {
      const hasMatch = (question.topic || '').toLowerCase().includes('hypothyroidism') ||
                      (question.subject || '').toLowerCase().includes('hypothyroidism') ||
                      (question.disease || '').toLowerCase().includes('hypothyroidism');
      expect(hasMatch).toBe(true);
    });
  });

  test('combined filters work correctly', () => {
    const result = filterQuestions(mockQuestions, 'Cardiology', 'Cardiology', 'approved');
    
    result.forEach(question => {
      expect(question.subject).toBe('Cardiology');
      expect(question.status).toBe('approved');
      expect(question.subject.toLowerCase()).toContain('cardiology');
    });
  });

  test('handles empty search term', () => {
    const result = filterQuestions(mockQuestions, '', 'all', 'all');
    
    expect(result.length).toBe(mockQuestions.length);
  });

  test('handles null/undefined field values gracefully', () => {
    const questionsWithNulls = [
      ...mockQuestions,
      {
        ...mockQuestions[0],
        subject: null,
        disease: undefined,
        topic: null
      }
    ];
    
    const result = filterQuestions(questionsWithNulls, 'test', 'all', 'all');
    
    // Should not throw errors and should handle null values
    expect(Array.isArray(result)).toBe(true);
  });

  test('search is case insensitive', () => {
    const lowerResult = filterQuestions(mockQuestions, 'cardiology', 'all', 'all');
    const upperResult = filterQuestions(mockQuestions, 'CARDIOLOGY', 'all', 'all');
    const mixedResult = filterQuestions(mockQuestions, 'Cardiology', 'all', 'all');
    
    expect(lowerResult.length).toBe(upperResult.length);
    expect(upperResult.length).toBe(mixedResult.length);
  });
});