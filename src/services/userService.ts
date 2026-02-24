
import { User } from '../types';
import * as firestore from './firestoreService';

const MOCK_USERS: User[] = [
  { id: 'user-1', name: 'Gestor Principal', initials: 'GP', avatarColor: 'bg-sky-600', role: 'admin' },
  { id: 'user-2', name: 'Marta López', initials: 'ML', avatarColor: 'bg-emerald-600', role: 'user' },
  { id: 'user-3', name: 'Carlos Vega', initials: 'CV', avatarColor: 'bg-amber-600', role: 'user' },
  { id: 'user-4', name: 'Ana Torres', initials: 'AT', avatarColor: 'bg-indigo-600', role: 'user' },
];

/**
 * Fetch users from Firestore with a fallback to MOCK_USERS if empty.
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    const users = await firestore.getUsers();
    if (users.length === 0) {
      // Seed initial users if empty (optional but helpful for development)
      console.log("No users found in Firestore, seeding defaults...");
      for (const u of MOCK_USERS) {
        await firestore.saveUser(u);
      }
      return MOCK_USERS;
    }
    return users as User[];
  } catch (error) {
    console.error('Error fetching users from Firestore:', error);
    return MOCK_USERS;
  }
};

/**
 * Fetch a single user by ID.
 */
export const getUserById = async (userId: string): Promise<User | undefined> => {
  const users = await getUsers();
  return users.find(u => u.id === userId);
};

/**
 * Save or Update a user in Firestore.
 */
export const saveUser = async (user: User): Promise<User[]> => {
  return await firestore.saveUser(user) as User[];
};