import { UserService } from '../database/services';
import { hashPassword } from './auth';
import { User } from '../types';

/**
 * Create the admin123 user if it doesn't exist
 */
export async function createAdmin123User(): Promise<void> {
  try {
    // Check if user already exists
    const existingUser = await UserService.getByUsername('admin123');
    
    if (existingUser) {
      console.log('User admin123 already exists');
      return;
    }

    // Create the new admin user
    const newAdminUser: User = {
      id: 'user-admin123-' + Date.now(),
      username: 'admin123',
      email: 'admin123@pos.com',
      password: hashPassword('adminpassword'),
      role: 'admin',
      firstName: 'Administrator',
      lastName: 'Account',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await UserService.create(newAdminUser);
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin123');
    console.log('Password: adminpassword');
    console.log('Role: admin');
    
  } catch (error) {
    console.error('Failed to create admin123 user:', error);
    throw error;
  }
} 