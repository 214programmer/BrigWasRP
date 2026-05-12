import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, LogOut, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, profile, loginWithEmail, registerWithEmail, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, username);
      }
      setShowAuth(false);
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации. Проверьте данные и попробуйте снова.');
    }
  };

  return (
    <>
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
                      {profile?.role?.replace('_', ' ')} <span className="text-[10px] bg-bw-panel px-1 rounded border border-bw-border font-mono text-gray-500">ID: {profile?.id?.substring(0, 6)}</span>
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
                  onClick={() => setShowAuth(true)}
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

      {showAuth && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#18181b] rounded-xl w-full max-w-md shadow-2xl border border-[#3f3f46] overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-[#2a2a2a]">
              <h3 className="text-xl font-bold text-white">
                {isLogin ? 'Вход в аккаунт' : 'Регистрация'}
              </h3>
              <button 
                onClick={() => setShowAuth(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-sm text-center">
                  {error}
                </div>
              )}
              <form onSubmit={handleAuth} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Никнейм</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2 bg-[#121212] border border-[#3f3f46] rounded focus:border-bw-red focus:ring-1 focus:ring-bw-red text-white"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input 
                    type="email"
                    className="w-full px-4 py-2 bg-[#121212] border border-[#3f3f46] rounded focus:border-bw-red focus:ring-1 focus:ring-bw-red text-white"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Пароль</label>
                  <input 
                    type="password"
                    className="w-full px-4 py-2 bg-[#121212] border border-[#3f3f46] rounded focus:border-bw-red focus:ring-1 focus:ring-bw-red text-white"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-2.5 bg-bw-red hover:bg-[#c92f37] text-white rounded font-medium transition-colors mt-2"
                >
                  {isLogin ? 'Войти' : 'Зарегистрироваться'}
                </button>
              </form>
              
              <div className="mt-6 text-center text-sm text-gray-400">
                {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
                <button 
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="text-bw-red hover:text-white transition-colors font-medium"
                >
                  {isLogin ? "Зарегистрируйтесь" : "Войти"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
