import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, LogOut, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, profile, loginWithGoogle, logout } = useAuth();

  return (
    <header className="bg-[#18181b] sticky top-0 z-50 border-b border-bw-border">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center bg-bw-red text-white font-bold rounded shadow-lg text-lg">
                B
              </div>
              <span className="text-xl font-bold text-white tracking-tight">BrigWas <span className="text-bw-red">RP</span></span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8 h-full">
              <Link to="/" className="h-16 flex items-center border-b-2 border-bw-red text-bw-red font-medium">
                Форум
              </Link>
              <Link to="/users" className="h-16 flex items-center border-b-2 border-transparent text-gray-400 hover:text-white transition-colors font-medium">
                Пользователи
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden lg:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text"
                placeholder="Поиск..."
                className="bg-[#242427] text-sm text-gray-200 rounded-md pl-9 pr-4 py-1.5 focus:outline-none focus:ring-1 focus:ring-bw-red border border-[#3f3f46]"
              />
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="flex flex-col text-right hover:opacity-80 transition-opacity">
                  <span className="text-sm font-medium text-white">{profile?.username}</span>
                  <span className="text-xs text-bw-muted capitalize flex items-center justify-end gap-1">
                    {profile?.role?.replace('_', ' ')} <span className="text-[10px] bg-bw-panel px-1 rounded border border-bw-border font-mono text-gray-500">ID: {profile?.id.substring(0, 6)}</span>
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-[#27272a] text-gray-400 hover:text-[#ff4e4e] hover:bg-[#3f3f46] transition-colors shadow-sm"
                  title="Выйти"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="flex items-center px-4 py-1.5 bg-[#27272a] text-white rounded hover:bg-[#3f3f46] transition-colors shadow-sm text-sm font-medium border border-[#3f3f46]"
              >
                <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center mr-2">
                  <LogIn className="w-3 h-3 text-white" />
                </div>
                Войти
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
