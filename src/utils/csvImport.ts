export interface CSVQuestionRow {
  ID: string;
  Topic: string;
  'Clinical Vignette': string;
  'Lead Question': string;
  'Additional picture Link (optional)': string;
  'Correct answer': string;
  'Distractor Option 1': string;
  'Distractor Option 2': string;
  'Distractor Option 3': string;
  'Distractor Option 4': string;
  Explanation: string;
  References: string;
  'Learning Objective': string;
  Pathomecanism: string;
  Aspect: string;
  Disease: string;
  Difficulty: string;
  'Created By': string;
  'Reviewer 1': string;
  'Reviewer 2': string;
  'Reviewer Comment': string;
}

export function parseCSVToQuestions(csvData: string): any[] {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const questions = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < headers.length) continue;

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    // Map CSV fields to Question interface
    const question = {
      id: row.ID || `csv-${i}`,
      clinicalVignette: row['Clinical Vignette'] || '',
      leadQuestion: row['Lead Question'] || '',
      type: 'multiple-choice' as const,
      subject: extractSubjectFromTopic(row.Topic),
      topic: row.Topic || '',
      options: [
        row['Correct answer'],
        row['Distractor Option 1'],
        row['Distractor Option 2'],
        row['Distractor Option 3'],
        row['Distractor Option 4']
      ].filter(option => option && option.trim() !== ''),
      correctAnswer: row['Correct answer'] || '',
      distractorOptions: [
        row['Distractor Option 1'],
        row['Distractor Option 2'],
        row['Distractor Option 3'],
        row['Distractor Option 4']
      ].filter(option => option && option.trim() !== ''),
      explanation: row.Explanation || '',
      references: row.References || '',
      learningObjective: row['Learning Objective'] ? [row['Learning Objective']] : [],
      pathomecanism: mapPathomecanism(row.Pathomecanism),
      aspect: mapAspect(row.Aspect),
      disease: row.Disease || '',
      additionalPictureLink: row['Additional picture Link (optional)'] || '',
      authorId: 'csv-import',
      authorName: row['Created By'] || 'CSV Import',
      reviewer1: row['Reviewer 1'] || '',
      reviewer2: row['Reviewer 2'] || '',
      reviewerComment: row['Reviewer Comment'] || '',
      status: 'draft' as const,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      tags: generateTags(row),
    };

    questions.push(question);
  }

  return questions;
}

function extractSubjectFromTopic(topic: string): string {
  // Simple mapping based on common medical topics
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('cardio') || topicLower.includes('heart')) return 'Cardiology';
  if (topicLower.includes('pulmo') || topicLower.includes('lung') || topicLower.includes('respiratory')) return 'Pulmonology';
  if (topicLower.includes('neuro') || topicLower.includes('brain')) return 'Neurology';
  if (topicLower.includes('endo') || topicLower.includes('hormone') || topicLower.includes('thyroid')) return 'Endocrinology';
  if (topicLower.includes('gastro') || topicLower.includes('gi') || topicLower.includes('liver')) return 'Gastroenterology';
  if (topicLower.includes('renal') || topicLower.includes('kidney')) return 'Nephrology';
  if (topicLower.includes('hema') || topicLower.includes('blood')) return 'Hematology';
  if (topicLower.includes('onco') || topicLower.includes('cancer')) return 'Oncology';
  if (topicLower.includes('infect') || topicLower.includes('bacteria') || topicLower.includes('virus')) return 'Infectious Diseases';
  if (topicLower.includes('rheum') || topicLower.includes('arthritis')) return 'Rheumatology';
  if (topicLower.includes('derm') || topicLower.includes('skin')) return 'Dermatology';
  if (topicLower.includes('psych') || topicLower.includes('mental')) return 'Psychiatry';
  if (topicLower.includes('emergency') || topicLower.includes('trauma')) return 'Emergency Medicine';
  
  return 'Internal Medicine'; // Default
}

function mapPathomecanism(pathomecanism: string): 'congenital' | 'infection' | 'inflammation' | 'degenerative' | 'neoplasm' | 'trauma' | 'metabolism' | 'non-applicable' {
  const pathLower = pathomecanism.toLowerCase();
  if (pathLower.includes('congenital') || pathLower.includes('genetic')) return 'congenital';
  if (pathLower.includes('infection') || pathLower.includes('bacterial') || pathLower.includes('viral')) return 'infection';
  if (pathLower.includes('inflammation') || pathLower.includes('inflammatory')) return 'inflammation';
  if (pathLower.includes('degenerative') || pathLower.includes('degeneration')) return 'degenerative';
  if (pathLower.includes('neoplasm') || pathLower.includes('cancer') || pathLower.includes('tumor')) return 'neoplasm';
  if (pathLower.includes('trauma') || pathLower.includes('injury')) return 'trauma';
  if (pathLower.includes('metabolism') || pathLower.includes('metabolic')) return 'metabolism';
  return 'non-applicable'; // Default
}

function mapAspect(aspect: string): 'knowledge' | 'procedural-knowledge' | 'attitude' | 'health-system' {
  const aspectLower = aspect.toLowerCase();
  if (aspectLower.includes('procedural') || aspectLower.includes('skill')) return 'procedural-knowledge';
  if (aspectLower.includes('attitude') || aspectLower.includes('behavior')) return 'attitude';
  if (aspectLower.includes('health-system') || aspectLower.includes('system')) return 'health-system';
  return 'knowledge'; // Default
}

function generateTags(row: any): string[] {
  const tags = [];
  
  if (row.Disease) tags.push(row.Disease.toLowerCase().replace(/\s+/g, '-'));
  if (row.Aspect) tags.push(row.Aspect.toLowerCase().replace(/\s+/g, '-'));
  if (row.Topic) {
    const topicWords = row.Topic.toLowerCase().split(' ');
    tags.push(...topicWords.filter(word => word.length > 3));
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

export function exportQuestionsToCSV(questions: any[]): string {
  const headers = [
    'ID', 'Topic', 'Clinical Vignette', 'Lead Question', 'Additional picture Link (optional)',
    'Correct answer', 'Distractor Option 1', 'Distractor Option 2', 'Distractor Option 3', 'Distractor Option 4',
    'Explanation', 'References', 'Learning Objective', 'Pathomecanism', 'Aspect', 'Disease', 
    'Created By', 'Reviewer 1', 'Reviewer 2', 'Reviewer Comment'
  ];

  const csvRows = [headers.join(',')];

  questions.forEach(q => {
    const row = [
      q.id,
      q.topic || '',
      q.clinicalVignette || '',
      q.leadQuestion || '',
      q.additionalPictureLink || '',
      q.correctAnswer || '',
      q.distractorOptions?.[0] || q.options?.[1] || '',
      q.distractorOptions?.[1] || q.options?.[2] || '',
      q.distractorOptions?.[2] || q.options?.[3] || '',
      q.distractorOptions?.[3] || q.options?.[4] || '',
      q.explanation || '',
      q.references || '',
      Array.isArray(q.learningObjective) ? q.learningObjective.join('; ') : q.learningObjective || '',
      q.pathomecanism || '',
      q.aspect || '',
      q.disease || '',
      q.authorName || '',
      q.reviewer1 || '',
      q.reviewer2 || '',
      q.reviewerComment || ''
    ].map(field => `"${String(field).replace(/"/g, '""')}"`);

    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}