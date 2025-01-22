import { supabase } from './initSupabase';


// Function to fetch all users
export const fetchAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email');

    if (error) {
      throw error; // Throws errors if there are any
    }

    return data; // Returns the fetched user data
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error; // Rethrows the error for further error handling
  } 
};
