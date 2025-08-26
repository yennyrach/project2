import React, { useState } from 'react';
import { useQuestions } from '../../context/QuestionContext';
import { Upload, Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { parseCSVToQuestions, exportQuestionsToCSV } from '../../utils/csvImport';

interface CSVImportProps {
  onImport: (questions: any[]) => void;
}

export const CSVImport: React.FC<CSVImportProps> = ({ onImport }) => {
  const { questions: existingQuestions, addQuestion } = useQuestions();
  const [dragActive, setDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importedCount, setImportedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setErrorMessage('Please select a CSV file');
      setImportStatus('error');
      return;
    }

    setImportStatus('processing');
    setErrorMessage('');

    try {
      const text = await file.text();
      const questions = parseCSVToQuestions(text);
      
      if (questions.length === 0) {
        setErrorMessage('No valid questions found in the CSV file');
        setImportStatus('error');
        return;
      }

      // Add questions to the system
      for (const question of questions) {
        try {
          await addQuestion(question);
        } catch (error) {
          console.error('Error adding question:', error);
        }
      }

      setImportedCount(questions.length);
      setImportStatus('success');
      onImport(questions);
    } catch (error) {
      setErrorMessage('Error parsing CSV file. Please check the format.');
      setImportStatus('error');
    }
  };

  const downloadTemplate = () => {
    const templateHeaders = [
      'ID,Topic,Clinical Vignette,Lead Question,Additional picture Link (optional),',
      'Correct answer,Distractor Option 1,Distractor Option 2,Distractor Option 3,Distractor Option 4,',
      'Explanation,References,Learning Objective,Pathomecanism,Aspect,Disease,',
      'Created By,Reviewer 1,Reviewer 2,Reviewer Comment'
    ].join('');

    const sampleRow = [
      '1,"Cardiovascular Pathophysiology","A 65-year-old male presents with chest pain","What is the most likely diagnosis?","",',
      '"Inferior wall MI","Anterior wall MI","Unstable angina","Pulmonary embolism","Aortic dissection",',
      '"ST-elevation in leads II, III, aVF indicates inferior wall MI","Cardiology Guidelines 2023","Keterampilan klinis; Literasi Sains atau landasan ilmiah","degenerative","knowledge","Myocardial Infarction",',
      '"Dr. Smith","Dr. Johnson","Dr. Chen","Approved - Good clinical correlation"'
    ].join('');

    const csvContent = templateHeaders + '\n' + sampleRow;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question_bank_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportExisting = () => {
    if (existingQuestions.length === 0) {
      alert('No questions to export');
      return;
    }

    const csvContent = exportQuestionsToCSV(existingQuestions);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Questions from CSV</h3>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : importStatus === 'success'
              ? 'border-green-400 bg-green-50'
              : importStatus === 'error'
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {importStatus === 'processing' ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">Processing CSV file...</p>
            </div>
          ) : importStatus === 'success' ? (
            <div className="space-y-2">
              <CheckCircle size={32} className="text-green-600 mx-auto" />
              <p className="text-green-800 font-medium">Successfully imported {importedCount} questions!</p>
              <button
                onClick={() => setImportStatus('idle')}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Import another file
              </button>
            </div>
          ) : importStatus === 'error' ? (
            <div className="space-y-2">
              <AlertCircle size={32} className="text-red-600 mx-auto" />
              <p className="text-red-800 font-medium">Import failed</p>
              <p className="text-red-600 text-sm">{errorMessage}</p>
              <button
                onClick={() => setImportStatus('idle')}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload size={48} className="text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-900">Drop your CSV file here</p>
                <p className="text-gray-600">or click to browse</p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Choose File
              </label>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p className="mb-2">CSV file should include the following columns:</p>
          <div className="bg-gray-50 p-3 rounded text-xs font-mono">
            ID, Topic, Clinical Vignette, Lead Question, Additional picture Link (optional), 
            Correct answer, Distractor Option 1-4, Explanation, References, 
            Learning Objective, Pathomecanism, Aspect, Disease, 
            Created By, Reviewer 1, Reviewer 2, Reviewer Comment
          </div>
        </div>
      </div>

      {/* Template and Export Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-3">Download Template</h4>
          <p className="text-gray-600 text-sm mb-4">
            Get a CSV template with the correct format and a sample question.
          </p>
          <button
            onClick={downloadTemplate}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download size={16} />
            <span>Download Template</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-3">Export Existing Questions</h4>
          <p className="text-gray-600 text-sm mb-4">
            Export current questions to CSV format for backup or editing.
          </p>
          <button
            onClick={exportExisting}
            disabled={existingQuestions.length === 0}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={16} />
            <span>Export Questions ({existingQuestions.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};