import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuestions } from '../../context/QuestionContext';
import { Question } from '../../types';
import { Plus, Trash2, Save, Eye, CheckCircle, AlertCircle } from 'lucide-react';

interface FormErrors {
  clinicalVignette?: string;
  leadQuestion?: string;
  subject?: string;
  topic?: string;
  options?: string;
  correctAnswer?: string;
  learningObjective?: string;
}

interface SubmitQuestionProps {
  onSuccess?: () => void;
}

export const SubmitQuestion: React.FC<SubmitQuestionProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const { addQuestion } = useQuestions();
  const [questionData, setQuestionData] = useState<Partial<Question>>({
    clinicalVignette: '',
    leadQuestion: '',
    type: 'multiple-choice',
    subject: '',
    topic: '',
    options: ['', '', '', '', ''],
    correctAnswer: '',
    distractorOptions: ['', '', '', ''],
    explanation: '',
    tags: [],
    learningObjective: [],
    pathomecanism: 'non-applicable',
    aspect: 'knowledge',
    status: 'draft',
    additionalPictureLink: '',
    references: '',
    disease: '',
  });

  const [newTag, setNewTag] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  if (!user) return null;

  const subjects = [
    'Cardiology',
    'Pulmonology',
    'Neurology',
    'Endocrinology',
    'Gastroenterology',
    'Nephrology',
    'Hematology',
    'Oncology',
    'Infectious Diseases',
    'Rheumatology',
    'Dermatology',
    'Psychiatry',
    'Emergency Medicine',
    'Internal Medicine',
    'Surgery',
    'Pediatrics',
    'Obstetrics & Gynecology',
    'Radiology',
    'Pathology',
    'Pharmacology'
  ];

  const aspectOptions = [
    { value: 'knowledge', label: 'Knowledge' },
    { value: 'procedural-knowledge', label: 'Procedural Knowledge' },
    { value: 'attitude', label: 'Attitude' },
    { value: 'health-system', label: 'Health System' },
  ];

  const pathomechanismOptions = [
    { value: 'congenital', label: 'Congenital' },
    { value: 'infection', label: 'Infection' },
    { value: 'inflammation', label: 'Inflammation' },
    { value: 'degenerative', label: 'Degenerative' },
    { value: 'neoplasm', label: 'Neoplasm' },
    { value: 'trauma', label: 'Trauma' },
    { value: 'metabolism', label: 'Metabolism' },
    { value: 'non-applicable', label: 'Non-applicable' },
  ];

  const learningObjectiveOptions = [
    'Profesionalitas yang luhur',
    'Mawas diri dan pengembangan diri',
    'Kolaborasi dan kerjasama',
    'Keselamatan dan mutu layanan kesehatan',
    'Literasi Sains atau landasan ilmiah',
    'Literasi Teknologi Informasi dan Digital dan Komunikasi',
    'Pengelolaan masalah kesehatan dan sumber daya',
    'Keterampilan klinis',
    'Komunikasi efektif',
  ];

  const handleInputChange = (field: string, value: any) => {
    setQuestionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(questionData.options || [])];
    newOptions[index] = value;
    
    // Update distractor options (all except the correct answer)
    const distractors = newOptions.filter(option => option !== questionData.correctAnswer && option.trim() !== '');
    
    setQuestionData(prev => ({
      ...prev,
      options: newOptions,
      distractorOptions: distractors
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !questionData.tags?.includes(newTag.trim())) {
      setQuestionData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setQuestionData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }));
  };

  const handleLearningObjectiveChange = (objective: string, checked: boolean) => {
    setQuestionData(prev => {
      const currentObjectives = prev.learningObjective || [];
      if (checked) {
        return {
          ...prev,
          learningObjective: [...currentObjectives, objective]
        };
      } else {
        return {
          ...prev,
          learningObjective: currentObjectives.filter(obj => obj !== objective)
        };
      }
    });
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!questionData.clinicalVignette?.trim()) {
      newErrors.clinicalVignette = 'Clinical vignette is required';
    }

    if (!questionData.leadQuestion?.trim()) {
      newErrors.leadQuestion = 'Lead question is required';
    }

    if (!questionData.subject?.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!questionData.topic?.trim()) {
      newErrors.topic = 'Topic is required';
    }

    if (!questionData.learningObjective || questionData.learningObjective.length === 0) {
      newErrors.learningObjective = 'At least one learning objective is required';
    }

    // Validate options for multiple choice questions
    if (questionData.type === 'multiple-choice') {
      const validOptions = (questionData.options || []).filter(opt => opt.trim() !== '');
      if (validOptions.length < 5) {
        newErrors.options = 'All 5 options are required';
      }

      if (!questionData.correctAnswer?.trim()) {
        newErrors.correctAnswer = 'Correct answer must be selected';
      }
    }

    return newErrors;
  };

  const resetForm = () => {
    setQuestionData({
      clinicalVignette: '',
      leadQuestion: '',
      type: 'multiple-choice',
      subject: '',
      topic: '',
      options: ['', '', '', '', ''],
      correctAnswer: '',
      distractorOptions: ['', '', '', ''],
      explanation: '',
      tags: [],
      learningObjective: [],
      pathomecanism: 'non-applicable',
      aspect: 'knowledge',
      status: 'draft',
      additionalPictureLink: '',
      references: '',
      disease: '',
    });
    setNewTag('');
    setShowPreview(false);
    setErrors({});
  };

  const handleSubmit = async (status: 'draft' | 'submitted') => {
    console.log('Starting question submission with status:', status);
    console.log('Current question data:', questionData);
    
    const formErrors = validateForm();
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      console.error('Form validation failed:', formErrors);
      setSubmitStatus('error');
      setSubmitMessage('Please fix the errors below before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Update distractor options based on current options and correct answer
      const updatedDistractors = (questionData.options || [])
        .filter(option => option !== questionData.correctAnswer && option.trim() !== '');

      const questionToSubmit = {
        ...questionData,
        authorId: user.id,
        authorName: `${user.first_name} ${user.last_name}`,
        status,
        distractorOptions: updatedDistractors,
      } as Omit<Question, 'id' | 'createdAt' | 'updatedAt'>;

      console.log('Submitting question:', questionToSubmit);
      
      const questionId = await addQuestion(questionToSubmit);
      console.log('Question submitted successfully with ID:', questionId);
      
      setSubmitStatus('success');
      setSubmitMessage(
        status === 'draft' 
          ? 'Question saved as draft successfully!' 
          : 'Question submitted for review successfully!'
      );

      // Reset form after successful submission
      setTimeout(() => {
        console.log('Resetting form after successful submission');
        resetForm();
        setSubmitStatus('idle');
        setSubmitMessage('');
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      }, 3000);

    } catch (error) {
      console.error('Error submitting question:', error);
      setSubmitStatus('error');
      setSubmitMessage(`Failed to submit question: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Submit New Question</h2>
        <p className="text-gray-600">Create a new question for the question bank</p>
      </div>

      {/* Status Messages */}
      {submitStatus !== 'idle' && (
        <div className={`rounded-lg p-4 flex items-center space-x-3 ${
          submitStatus === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {submitStatus === 'success' ? (
            <CheckCircle size={20} className="text-green-600" />
          ) : (
            <AlertCircle size={20} className="text-red-600" />
          )}
          <p className={`font-medium ${
            submitStatus === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {submitMessage}
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                value={questionData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.subject ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Select subject</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic *
              </label>
              <input
                type="text"
                value={questionData.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.topic ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="e.g., Myocardial Infarction"
              />
              {errors.topic && (
                <p className="mt-1 text-sm text-red-600">{errors.topic}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disease/Condition
              </label>
              <input
                type="text"
                value={questionData.disease}
                onChange={(e) => handleInputChange('disease', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Myocardial Infarction"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aspect *
              </label>
              <select
                value={questionData.aspect}
                onChange={(e) => handleInputChange('aspect', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {aspectOptions.map(aspect => (
                  <option key={aspect.value} value={aspect.value}>{aspect.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pathomechanism *
              </label>
              <select
                value={questionData.pathomecanism}
                onChange={(e) => handleInputChange('pathomecanism', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {pathomechanismOptions.map(mechanism => (
                  <option key={mechanism.value} value={mechanism.value}>{mechanism.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Learning Objectives */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Learning Objective * (Select one or more)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {learningObjectiveOptions.map(objective => (
                <label key={objective} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={(questionData.learningObjective || []).includes(objective)}
                    onChange={(e) => handleLearningObjectiveChange(objective, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{objective}</span>
                </label>
              ))}
            </div>
            {errors.learningObjective && (
              <p className="mt-1 text-sm text-red-600">{errors.learningObjective}</p>
            )}
          </div>

          {/* Clinical Vignette */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clinical Vignette *
            </label>
            <textarea
              rows={6}
              value={questionData.clinicalVignette}
              onChange={(e) => handleInputChange('clinicalVignette', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.clinicalVignette ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Provide detailed clinical scenario, patient history, physical examination findings, laboratory results, imaging findings..."
              required
            />
            {errors.clinicalVignette && (
              <p className="mt-1 text-sm text-red-600">{errors.clinicalVignette}</p>
            )}
          </div>

          {/* Lead Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead Question *
            </label>
            <input
              type="text"
              value={questionData.leadQuestion}
              onChange={(e) => handleInputChange('leadQuestion', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.leadQuestion ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="The main question being asked based on the clinical vignette"
              required
            />
            {errors.leadQuestion && (
              <p className="mt-1 text-sm text-red-600">{errors.leadQuestion}</p>
            )}
          </div>

          {/* Answer Options - Always 5 options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Answer Options * (Exactly 5 options required)
            </label>
            <div className="space-y-3">
              {(questionData.options || []).map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600 w-8">
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.options ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                </div>
              ))}
              {errors.options && (
                <p className="mt-1 text-sm text-red-600">{errors.options}</p>
              )}
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correct Answer *
              </label>
              <select
                value={questionData.correctAnswer}
                onChange={(e) => handleInputChange('correctAnswer', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.correctAnswer ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select correct answer</option>
                {(questionData.options || []).map((option, index) => (
                  <option key={index} value={option}>
                    {index + 1}. {option}
                  </option>
                ))}
              </select>
              {errors.correctAnswer && (
                <p className="mt-1 text-sm text-red-600">{errors.correctAnswer}</p>
              )}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Explanation (Optional)
            </label>
            <textarea
              rows={3}
              value={questionData.explanation}
              onChange={(e) => handleInputChange('explanation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Explain the correct answer or provide additional context..."
            />
          </div>

          {/* Additional CSV Template Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                References (Optional)
              </label>
              <textarea
                rows={2}
                value={questionData.references}
                onChange={(e) => handleInputChange('references', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Cite relevant literature, guidelines, or textbooks..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Picture Link (Optional)
              </label>
              <input
                type="url"
                value={questionData.additionalPictureLink}
                onChange={(e) => handleInputChange('additionalPictureLink', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a tag and press Enter"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(questionData.tags || []).map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center space-x-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <Eye size={16} />
              <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                <span>{isSubmitting ? 'Saving...' : 'Save Draft'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('submitted')}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Preview</h3>
          
          <div className="space-y-4">
            {/* Clinical Vignette */}
            {questionData.clinicalVignette && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Clinical Vignette:</h5>
                <p className="text-gray-700 bg-blue-50 p-3 rounded-lg text-sm">{questionData.clinicalVignette}</p>
              </div>
            )}

            {/* Lead Question Preview */}
            {questionData.leadQuestion && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Lead Question:</h5>
                <p className="text-gray-700 font-medium text-sm">{questionData.leadQuestion}</p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Lead Question:</h4>
              <p className="text-gray-700 font-medium">{questionData.leadQuestion}</p>
            </div>

            {questionData.options && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Options:</h5>
                <ul className="space-y-1">
                  {questionData.options.map((option, index) => (
                    <li
                      key={index}
                      className={`p-2 rounded ${
                        option === questionData.correctAnswer
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

            {questionData.explanation && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Explanation:</h5>
                <p className="text-gray-600">{questionData.explanation}</p>
              </div>
            )}

            {/* Additional Preview Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Aspect:</h5>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {aspectOptions.find(a => a.value === questionData.aspect)?.label}
                </span>
              </div>
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Pathomechanism:</h5>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                  {pathomechanismOptions.find(p => p.value === questionData.pathomecanism)?.label}
                </span>
              </div>
            </div>

            {questionData.learningObjective && questionData.learningObjective.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Learning Objectives:</h5>
                <div className="flex flex-wrap gap-2">
                  {questionData.learningObjective.map(objective => (
                    <span key={objective} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      {objective}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {questionData.references && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">References:</h5>
                <p className="text-gray-600 text-sm italic">{questionData.references}</p>
              </div>
            )}

            {(questionData.disease || questionData.aspect) && (
              <div className="flex items-center space-x-4 text-sm">
                {questionData.disease && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    Disease: {questionData.disease}
                  </span>
                )}
                {questionData.aspect && (
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                    Aspect: {questionData.aspect}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{questionData.subject} • {questionData.topic}</span>
            </div>

            {questionData.tags && questionData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {questionData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};