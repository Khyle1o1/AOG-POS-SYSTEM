import React from 'react';
import { Users, Plus, Edit, Trash2, Shield, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { User, UserFormData } from '../types';
import { useForm } from 'react-hook-form';
import { hashPassword, generateRandomPassword, validatePassword } from '../utils/auth';

const UserManagement: React.FC = () => {
  const { users, addUser, updateUserData, deleteUser, auth } = useStore();
  const [showModal, setShowModal] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [generatedPassword, setGeneratedPassword] = React.useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<UserFormData>();

  const password = watch('password');

  // Only admin can access user management
  if (auth.user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500">You don't have permission to manage users.</p>
        </div>
      </div>
    );
  }

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      reset({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        password: '', // Don't pre-fill password for security
        confirmPassword: '',
      });
    } else {
      setEditingUser(null);
      reset({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        role: 'cashier',
        isActive: true,
        password: '',
        confirmPassword: '',
      });
    }
    setGeneratedPassword('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setGeneratedPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    reset();
  };

  const generatePassword = () => {
    const newPassword = generateRandomPassword(10);
    setGeneratedPassword(newPassword);
    setValue('password', newPassword);
    setValue('confirmPassword', newPassword);
  };

  const onSubmit = (data: UserFormData) => {
    // Validate password confirmation
    if (data.password !== data.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    // Validate password strength for new users or when password is being changed
    if (!editingUser || data.password) {
      const validation = validatePassword(data.password);
      if (!validation.isValid) {
        alert('Password requirements:\n' + validation.errors.join('\n'));
        return;
      }
    }

    if (editingUser) {
      // For editing, only update password if it's provided
      const updateData: Partial<User> = {
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        isActive: data.isActive,
        updatedAt: new Date(),
      };

      // Only update password if provided
      if (data.password) {
        updateData.password = hashPassword(data.password);
      }

      updateUserData(editingUser.id, updateData);
    } else {
      // For new users, password is required
      const newUser: User = {
        id: Date.now().toString(),
        username: data.username,
        email: data.email,
        password: hashPassword(data.password),
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        isActive: data.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addUser(newUser);
    }
    closeModal();
  };

  const handleDelete = (user: User) => {
    if (user.id === auth.user?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      deleteUser(user.id);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'cashier':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Manage employee accounts and permissions</p>
        </div>
        
        <button
          onClick={() => openModal()}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <Users className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm text-gray-900">{user.email}</span>
                  </td>
                  <td>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal(user)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {user.id !== auth.user?.id && (
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    {...register('firstName', { required: 'First name is required' })}
                    className="input"
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    {...register('lastName', { required: 'Last name is required' })}
                    className="input"
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  {...register('username', { 
                    required: 'Username is required',
                    minLength: { value: 3, message: 'Username must be at least 3 characters' }
                  })}
                  className="input"
                  placeholder="Enter username"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className="input"
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <div className="relative">
                  <input
                    {...register('password', editingUser ? {} : { 
                      required: 'Password is required for new users'
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-20"
                    placeholder={editingUser ? 'Enter new password (optional)' : 'Enter password'}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="p-2 text-blue-600 hover:text-blue-800 mr-1"
                      title="Generate random password"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
                {generatedPassword && (
                  <p className="mt-1 text-sm text-green-600">
                    Generated password: <span className="font-mono font-bold">{generatedPassword}</span>
                    <br />
                    <span className="text-xs">Make sure to save this password!</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password {editingUser ? '(if changing password)' : '*'}
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword', editingUser ? {} : { 
                      required: 'Please confirm the password'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
                {password && watch('confirmPassword') && password !== watch('confirmPassword') && (
                  <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  {...register('role', { required: 'Role is required' })}
                  className="input"
                >
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  <strong>Cashier:</strong> Can process sales and view basic reports<br />
                  <strong>Manager:</strong> Can manage inventory and view detailed reports<br />
                  <strong>Admin:</strong> Full access to all features
                </p>
              </div>

              <div className="flex items-center">
                <input
                  {...register('isActive')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 rounded border-gray-300"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Active user (can login)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 