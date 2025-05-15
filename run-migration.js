const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get environment variables from .env file or process.env
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials. Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

// Create Supabase client with service role key (admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read the SQL files
const execSqlPath = path.join(__dirname, 'supabase', 'exec_sql_function.sql');
const profilesIpTablePath = path.join(__dirname, 'supabase', 'profiles_ip_table.sql');

const execSqlContent = fs.readFileSync(execSqlPath, 'utf8');
const profilesIpTableContent = fs.readFileSync(profilesIpTablePath, 'utf8');

async function createExecSqlFunction() {
  console.log('Creating exec_sql function...');
  
  try {
    // Execute the SQL directly as it's a single function
    const { error } = await supabase.rpc('exec_sql', {
      sql_string: execSqlContent
    }).catch(err => {
      // If exec_sql doesn't exist yet, we need to create it manually
      if (err.message.includes("function exec_sql") && err.message.includes("does not exist")) {
        return supabase.from('_rpc').select('').then(() => ({
          error: null
        }));
      }
      throw err;
    });
    
    if (error) {
      console.error('Error creating exec_sql function:', error);
      
      // Try executing it directly
      console.log('Attempting to create exec_sql directly...');
      const { error: directError } = await supabase
        .from('_rpc')
        .select('')
        .rpc('exec_sql', {
          sql_string: 'SELECT 1'
        })
        .limit(1);
      
      if (!directError) {
        console.log('exec_sql function already exists!');
        return true;
      }
      
      // If we can't create the function, we need to create it manually via the Supabase dashboard
      console.error('Could not create or verify exec_sql function. Please create it manually in the Supabase dashboard SQL editor.');
      return false;
    }
    
    console.log('exec_sql function created/verified successfully!');
    return true;
  } catch (err) {
    console.error('Error handling exec_sql function:', err);
    return false;
  }
}

async function runProfilesIpMigration() {
  console.log('Running migration for profiles_ip table...');
  
  try {
    // Split the SQL into statements
    const statements = profilesIpTableContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      console.log(`Executing SQL statement:\n${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql_string: statement + ';'
      });
      
      if (error) {
        console.error('Error executing statement:', error);
        // Continue with next statement
      }
    }
    
    // Verify the table was created
    const { error } = await supabase
      .from('profiles_ip')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('Error verifying profiles_ip table:', error);
      return false;
    }
    
    console.log('Verification successful - profiles_ip table exists!');
    return true;
  } catch (err) {
    console.error('Error running profiles_ip migration:', err);
    return false;
  }
}

async function createSqlDirectly() {
  console.log('Attempting direct SQL creation of profiles_ip table...');
  
  try {
    // First check if the table already exists
    const { error: checkError } = await supabase
      .from('profiles_ip')
      .select('id')
      .limit(1);
      
    if (!checkError) {
      console.log('profiles_ip table already exists!');
      return true;
    }
    
    // Create a simple version of the table directly
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.profiles_ip (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        ip_address TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
        login_count INTEGER DEFAULT 1
      );
      
      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_profiles_ip_user_id ON public.profiles_ip(user_id);
      CREATE INDEX IF NOT EXISTS idx_profiles_ip_ip_address ON public.profiles_ip(ip_address);
      
      -- Enable RLS
      ALTER TABLE public.profiles_ip ENABLE ROW LEVEL SECURITY;
      
      -- Allow admins to view all IPs
      CREATE POLICY "Admins can view all IP data" ON public.profiles_ip
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
          )
        );
    `;
    
    // Execute the SQL to create the table
    const { error } = await supabase.rpc('exec_sql', {
      sql_string: createTableSQL
    });
    
    if (error) {
      console.error('Error creating profiles_ip table directly:', error);
      return false;
    }
    
    console.log('Successfully created profiles_ip table with basic structure!');
    return true;
  } catch (err) {
    console.error('Error in direct SQL creation:', err);
    return false;
  }
}

async function runMigration() {
  // First, ensure the exec_sql function exists
  const execSqlExists = await createExecSqlFunction();
  
  if (!execSqlExists) {
    console.log('Using alternative approach...');
    // Try to create the table directly if we can't use exec_sql
    const success = await createSqlDirectly();
    
    if (!success) {
      console.error('Migration failed. Please run the migration manually via the Supabase dashboard SQL editor.');
      console.log('SQL content to run:');
      console.log(profilesIpTableContent);
    } else {
      console.log('Basic profiles_ip table created successfully!');
    }
    return;
  }
  
  // If exec_sql exists, run the full migration
  const success = await runProfilesIpMigration();
  
  if (success) {
    console.log('Migration completed successfully!');
  } else {
    console.error('Migration failed. Some errors occurred.');
  }
}

runMigration(); 