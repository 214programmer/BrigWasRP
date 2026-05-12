import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { store } from '../lib/store';

export const ProfilePage: React.FC = () => {
  const { user, profile } = useAuth();
  const [username, setUsername] = useState(profile?.username || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  if (!user || !profile) {
    return <div className="text-gray-500 animate-pulse">Загрузка профиля...</div>;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !user.uid) return;

    setIsSaving(true);
    setMessage('');

    try {
      const u = await store.getUser(user.uid);
      if (u) {
        u.username = username.trim();
        await store.saveUser(u);
        setMessage('Профиль успешно обновлен!');
        window.location.reload();
      }
    } catch (error) {
      setMessage('Ошибка при обновлении профиля.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 bg-bw-panel p-5 rounded-xl border border-bw-border shadow-sm">
        <h1 className="text-2xl font-bold text-white tracking-tight">Настройки профиля</h1>
        <p className="text-bw-muted text-sm mt-1">Отредактируйте ваши личные данные</p>
      </div>

      <div className="bg-bw-panel rounded-xl border border-bw-border shadow-sm p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Имя пользователя (Никнейм)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#121212] border border-[#3f3f46] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-bw-red focus:ring-1 focus:ring-bw-red transition-all"
              required
              minLength={3}
              maxLength={40}
            />
            <p className="text-xs text-bw-muted mt-2">
              От 3 до 40 символов.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full bg-[#121212] border border-[#3f3f46] text-gray-500 rounded-lg px-4 py-2 opacity-70 cursor-not-allowed"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Текущая роль
            </label>
            <div className="text-white capitalize px-4 py-2 bg-[#121212] border border-[#3f3f46] rounded-lg opacity-80 inline-block font-medium w-full">
              {profile.role.replace('_', ' ')}
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${message.includes('Ошибка') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
              {message}
            </div>
          )}

          <div className="pt-4 border-t border-[#2a2a2a]">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 bg-bw-red text-white font-medium rounded-lg shadow-lg hover:bg-[#c92f37] transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
