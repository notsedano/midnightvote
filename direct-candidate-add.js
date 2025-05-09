// Direct Candidate Add Utility
// This script uses a direct query approach which bypasses policies
// Run this script with Node.js after updating the Supabase credentials

import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY' // Use service role key for admin operations

// Create candidate function using direct SQL query
async function addCandidate(name, genre, instagram = null, bio = null) {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Using RPC to bypass policies
    const { data, error } = await supabase.rpc('add_candidate_direct', {
      candidate_name: name,
      candidate_genre: genre,
      candidate_instagram: instagram,
      candidate_bio: bio
    })
    
    if (error) {
      throw error
    }
    
    console.log('Successfully added candidate:', data)
    return { success: true, data }
  } catch (err) {
    console.error('Error adding candidate:', err)
    
    // Last resort approach - direct SQL query execution 
    try {
      console.log('Attempting direct SQL insertion...')
      
      const { data, error } = await supabase.from('candidates').insert({
        name: name,
        genre: genre,
        created_at: new Date().toISOString()
      }).select()
      
      if (error) throw error
      
      console.log('Success with direct SQL insertion:', data)
      return { success: true, data }
    } catch (sqlErr) {
      console.error('Direct SQL insertion failed:', sqlErr)
      return { success: false, error: sqlErr }
    }
  }
}

// Example usage
const candidateName = process.argv[2] || 'Test DJ'
const candidateGenre = process.argv[3] || 'House'
addCandidate(candidateName, candidateGenre)
  .then(result => {
    if (result.success) {
      console.log('Candidate added successfully!')
      process.exit(0)
    } else {
      console.error('Failed to add candidate')
      process.exit(1)
    }
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  }) 