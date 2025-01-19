import { supabase } from './initSupabase';

export const fetchAllUsers = async () => {
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  // Map and return user data (customize fields as needed)
  return data.users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.user_metadata.full_name || user.email, // Fallback to email if no full_name
  }));
};
