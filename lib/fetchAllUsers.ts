import { supabase } from './initSupabase';


// Function to fetch all users
export const fetchAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users') // Use the correct table name for users
      .select('id, email'); // Select relevant columns (e.g., id and email)

    if (error) {
      throw error; // Throw error if any
    }

    return data; // Return the fetched user data
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error; // Rethrow the error for further handling
  } 
};
