import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6">
      <div className="flex items-center justify-center">
        <p className="text-sm text-gray-500">
          Made with ❤️ by{' '}
          <span className="font-semibold text-gray-700">AOG Tech</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer; 