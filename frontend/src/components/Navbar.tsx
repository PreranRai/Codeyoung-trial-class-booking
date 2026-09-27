import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, LayoutDashboard } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              CY
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-sky-700 to-indigo-800 bg-clip-text text-transparent">
                Codeyoung
              </span>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Trial Class Booking
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-2">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Book Trial</span>
            </Link>

            <Link
              to="/admin"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/admin'
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Admin Demo</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
