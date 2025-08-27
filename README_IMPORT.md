# Data Import Instructions

## Prerequisites

1. **Export your questions**: Go to your app's "Import/Export CSV" section and export your existing questions. Save the file as `questions_export.csv` in the project root directory.

2. **Supabase Setup**: Make sure you have:
   - Created your Supabase project
   - Run the database creation queries (tables and RLS policies)
   - Your `.env` file contains the correct Supabase credentials

## Running the Import

### Step 1: Export Questions from Your App
1. Open your application
2. Navigate to "Import/Export CSV" section
3. Click "Export Questions"
4. Save the downloaded file as `questions_export.csv` in your project root

### Step 2: Run the Import Script
```bash
npm run import-questions
```

Or directly:
```bash
node import_questions.js
```

## What the Script Does

1. **Checks Prerequisites**: Verifies that your `.env` file has Supabase credentials and that the CSV file exists
2. **Creates Default User**: Creates an admin user if one doesn't exist (for questions without valid authors)
3. **Transforms Data**: Converts CSV format to Supabase table format:
   - Combines multiple distractor columns into a single array
   - Parses semicolon-separated learning objectives and tags
   - Maps status values to database enums
   - Resolves author names to user IDs where possible
4. **Imports Questions**: Inserts all questions into your Supabase `questions` table

## Troubleshooting

### Common Issues:

1. **"Supabase URL and Anon Key are required"**
   - Check your `.env` file contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

2. **"CSV file not found"**
   - Make sure `questions_export.csv` is in your project root directory
   - Check the filename matches exactly

3. **"Error inserting question"**
   - Check your Supabase tables exist and have the correct schema
   - Verify RLS policies allow inserts (you may need to temporarily disable RLS)
   - Check that the default admin user was created successfully

4. **Foreign Key Errors**
   - The script creates a default admin user for questions without valid authors
   - If you have specific users, make sure they exist in your `users` table first

### RLS Considerations

If you encounter permission errors, you may need to temporarily disable RLS during import:

```sql
-- Disable RLS temporarily
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;

-- Run your import script

-- Re-enable RLS after import
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
```

## After Import

1. **Verify Data**: Check your Supabase dashboard to confirm questions were imported correctly
2. **Test Your App**: Update your application to use Supabase instead of localStorage
3. **Clean Up**: Remove the import script and CSV file from your project

## Next Steps

After successfully importing your questions, you'll need to:
1. Update your `AuthContext` to use Supabase Auth
2. Update your `QuestionContext` to use Supabase queries
3. Remove localStorage dependencies
4. Test all functionality with real Supabase data