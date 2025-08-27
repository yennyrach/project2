require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse');

// --- Supabase Configuration ---
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL and Service Role Key (or Anon Key) are required. Check your .env file.');
  console.log('Make sure your .env file contains:');
  console.log('VITE_SUPABASE_URL="your-supabase-url"');
  console.log('SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" (recommended for import)');
  console.log('OR VITE_SUPABASE_ANON_KEY="your-supabase-anon-key" (if RLS is disabled)');
  process.exit(1);
}

// --- Initialize Supabase Client ---
const supabase = createClient(supabaseUrl, supabaseServiceKey);
console.log('Supabase client initialized successfully');


// --- CSV File Path ---
const csvFilePath = './questions_export.csv';

// --- Check if CSV file exists ---
if (!fs.existsSync(csvFilePath)) {
  console.error(`CSV file not found: ${csvFilePath}`);
  console.log('Please export your questions from the app and save as "questions_export.csv" in the project root.');
  process.exit(1);
}

// --- Helper function to create a default admin user if needed ---
async function ensureDefaultUser() {
  console.log('Checking for default admin user...');
  
  const { data: existingUsers, error } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'admin@university.edu')
    .limit(1);

  if (error) {
    console.error('Error checking for admin user:', error.message);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    return null;
  }

  console.log('Existing users query result:', JSON.stringify(existingUsers, null, 2));
  if (existingUsers && existingUsers.length > 0) {
    console.log('Found existing admin user:', existingUsers[0].id);
    return existingUsers[0].id;
  }

  // Create default admin user
  console.log('Creating default admin user...');
  console.log('User data to insert:', JSON.stringify({
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@university.edu',
    first_name: 'Admin',
    last_name: 'User',
    is_verified: true
  }, null, 2));

  const defaultUser = {
    id: '00000000-0000-0000-0000-000000000001', // Fixed UUID for consistency
    email: 'admin@university.edu',
    first_name: 'Admin',
    last_name: 'User',
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert([defaultUser])
    .select()
    .single();

  console.log('User insert result - data:', JSON.stringify(newUser, null, 2));
  console.log('User insert result - error:', JSON.stringify(insertError, null, 2));
  if (insertError) {
    console.error('Error creating default admin user:', insertError.message);
    console.error('Full insert error object:', JSON.stringify(insertError, null, 2));
    return null;
  }

  // Create admin role
  console.log('Creating admin role for user:', defaultUser.id);
  const adminRole = {
    user_id: defaultUser.id,
    role_type: 'admin',
    permissions: ['manage-users', 'verify-accounts', 'system-config']
  };

  console.log('Role data to insert:', JSON.stringify(adminRole, null, 2));
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert([adminRole]);

  console.log('Role insert result - error:', JSON.stringify(roleError, null, 2));
  if (roleError) {
    console.error('Error creating admin role:', roleError.message);
    console.error('Full role error object:', JSON.stringify(roleError, null, 2));
  }

  console.log('Created default admin user:', newUser.id);
  return newUser.id;
}

// --- Helper function to map names to user IDs ---
async function getUserIdByName(fullName) {
  if (!fullName || fullName.trim() === '') return null;
  
  // Try to find user by full name match first
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .or(`first_name.ilike.%${fullName}%,last_name.ilike.%${fullName}%`)
    .limit(1);

  if (error) {
    console.error(`Error looking up user ${fullName}:`, error.message);
    return null;
  }
  
  if (data && data.length > 0) {
    return data[0].id;
  }
  
  return null;
}

// --- Main import function ---
async function importQuestions() {
  console.log('=== Starting Question Import Process ===');
  
  // Ensure we have a default user for questions without valid authors
  const defaultAuthorId = await ensureDefaultUser();
  if (!defaultAuthorId) {
    console.error('Failed to create or find default admin user. Aborting import.');
    process.exit(1);
  }

  const records = [];
  let importedCount = 0;
  let errorCount = 0;

  console.log(`Reading CSV file: ${csvFilePath}...`);

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (data) => records.push(data))
      .on('end', async () => {
        console.log(`Finished reading CSV. Found ${records.length} records.`);
        console.log('Processing records...\n');

        for (let i = 0; i < records.length; i++) {
          const row = records[i];
          try {
            console.log(`Processing record ${i + 1}/${records.length}: ${row.ID || 'No ID'}`);

            // --- Data Transformation ---
            const options = [
              row['Correct answer'],
              row['Distractor Option 1'],
              row['Distractor Option 2'],
              row['Distractor Option 3'],
              row['Distractor Option 4']
            ].filter(opt => opt && opt.trim() !== '');

            const distractorOptions = [
              row['Distractor Option 1'],
              row['Distractor Option 2'],
              row['Distractor Option 3'],
              row['Distractor Option 4']
            ].filter(opt => opt && opt.trim() !== '');

            // Parse tags and learning objectives
            const tags = row.Tags ? row.Tags.split(';').map(tag => tag.trim()).filter(tag => tag !== '') : [];
            const learningObjective = row['Learning Objective'] ? 
              row['Learning Objective'].split(';').map(obj => obj.trim()).filter(obj => obj !== '') : [];

            // Map status
            let status = 'draft';
            if (row.Status) {
              const statusMap = {
                'draft': 'draft',
                'submitted': 'submitted',
                'under review': 'under-review',
                'under-review': 'under-review',
                'approved': 'approved',
                'rejected': 'rejected',
                'needs revision': 'needs-revision',
                'needs-revision': 'needs-revision'
              };
              status = statusMap[row.Status.toLowerCase()] || 'draft';
            }

            // Map pathomecanism
            let pathomecanism = 'non-applicable';
            if (row.Pathomecanism) {
              const pathMap = {
                'congenital': 'congenital',
                'infection': 'infection',
                'inflammation': 'inflammation',
                'degenerative': 'degenerative',
                'neoplasm': 'neoplasm',
                'trauma': 'trauma',
                'metabolism': 'metabolism'
              };
              pathomecanism = pathMap[row.Pathomecanism.toLowerCase()] || 'non-applicable';
            }

            // Map aspect
            let aspect = 'knowledge';
            if (row.Aspect) {
              const aspectMap = {
                'knowledge': 'knowledge',
                'procedural knowledge': 'procedural-knowledge',
                'procedural-knowledge': 'procedural-knowledge',
                'attitude': 'attitude',
                'health system': 'health-system',
                'health-system': 'health-system'
              };
              aspect = aspectMap[row.Aspect.toLowerCase()] || 'knowledge';
            }

            // Resolve author and reviewer IDs
            const authorId = await getUserIdByName(row['Created By']) || defaultAuthorId;
            const reviewerId = await getUserIdByName(row['Reviewer 1']) || null;

            // Extract subject from topic (you may need to adjust this logic)
            const subject = row.Subject || extractSubjectFromTopic(row.Topic) || 'General Medicine';

            const questionToInsert = {
              clinical_vignette: row['Clinical Vignette'] || '',
              lead_question: row['Lead Question'] || '',
              type: 'multiple-choice',
              subject: subject,
              topic: row.Topic || '',
              options: options,
              correct_answer: row['Correct answer'] || '',
              distractor_options: distractorOptions,
              explanation: row.Explanation || '',
              author_id: authorId,
              author_name: row['Created By'] || 'CSV Import',
              status: status,
              reviewer_id: reviewerId,
              reviewer_name: row['Reviewer 1'] || '',
              feedback: row.Feedback || '',
              tags: tags,
              additional_picture_link: row['Additional picture Link (optional)'] || '',
              references: row.References || '',
              learning_objective: learningObjective,
              pathomecanism: pathomecanism,
              aspect: aspect,
              disease: row.Disease || '',
              reviewer1: row['Reviewer 1'] || '',
              reviewer2: row['Reviewer 2'] || '',
              reviewer_comment: row['Reviewer Comment'] || '',
            };

            // --- Insert into Supabase ---
            const { error } = await supabase
              .from('questions')
              .insert([questionToInsert]);

            if (error) {
              console.error(`❌ Error inserting question ${row.ID || i + 1}:`, error.message);
              errorCount++;
            } else {
              console.log(`✅ Successfully imported question ${row.ID || i + 1}`);
              importedCount++;
            }

          } catch (e) {
            console.error(`❌ Failed to process row ${row.ID || i + 1}:`, e.message);
            errorCount++;
          }
        }

        console.log('\n=== Import Summary ===');
        console.log(`Total records processed: ${records.length}`);
        console.log(`Successfully imported: ${importedCount}`);
        console.log(`Errors encountered: ${errorCount}`);
        console.log('=== Import Complete ===');
        
        resolve();
      })
      .on('error', (err) => {
        console.error('Error reading CSV file:', err.message);
        reject(err);
      });
  });
}

// --- Helper function to extract subject from topic ---
function extractSubjectFromTopic(topic) {
  if (!topic) return 'General Medicine';
  
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
  
  return 'Internal Medicine';
}

// --- Run the import ---
importQuestions().catch(console.error);