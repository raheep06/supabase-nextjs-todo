import { fetchAllUsers } from '@/lib/fetchAllUsers';

const TestFetchUsers = async () => {
  try {
    const users = await fetchAllUsers();
    console.log('Fetched users:', users);
  } catch (error) {
    console.error('Error in test fetch:', error);
  }
};

TestFetchUsers();