import React, { useEffect, useState } from 'react';
import { store } from '../lib/store';
import { useAuth, UserProfile } from '../contexts/AuthContext';
import { Shield, User, Star } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  const roles = [
    { value: 'citizen', label: 'Гражданин' },
    { value: 'deputy', label: 'Заместитель' },
    { value: 'leader', label: 'Лидер' },
    { value: 'admin_1', label: 'Младший Администратор' },
    { value: 'admin_2', label: 'Администратор' },
    { value: 'admin_3', label: 'Старший Администратор' },
    { value: 'deputy_superadmin', label: 'Зам. Гл. Администратора' },
    { value: 'superadmin', label: 'Специальный Администратор / Founder' }
  ];

  const fetchUsers = async () => {
    setUsers(await store.getUsers());
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string) => {
    if (!newRole) return;
    const u = await store.getUser(userId);
    if (u) {
      u.role = newRole as any;
      await store.saveUser(u);
      setUsers(await store.getUsers());
    }
    setEditingUserId(null);
  };

  const getRoleLabel = (roleValue: string) => {
    return roles.find(r => r.value === roleValue)?.label || roleValue;
  };

  const canEditRoles = profile?.role === 'superadmin' || profile?.role === 'deputy_superadmin';

  const [directRoleUserId, setDirectRoleUserId] = useState('');
  const [directRoleValue, setDirectRoleValue] = useState('');

  const handleDirectRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directRoleUserId || !directRoleValue) return;
    const u = await store.getUser(directRoleUserId);
    if (u) {
      u.role = directRoleValue as any;
      await store.saveUser(u);
      setUsers(await store.getUsers());
      setDirectRoleUserId('');
      setDirectRoleValue('');
      alert('Права успешно выданы');
    } else {
      alert('Пользователь не найден');
    }
  };

  if (loading) return <div className="text-gray-500 animate-pulse">Загрузка пользователей...</div>;

  return (
    <div>
      <div className="mb-6 bg-bw-panel p-5 rounded-xl border border-bw-border shadow-sm flex flex-col xl:flex-row gap-6 xl:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Пользователи проекта</h1>
          <p className="text-bw-muted text-sm mt-1">Список зарегистрированных аккаунтов на форуме</p>
        </div>

        {canEditRoles && (
          <form onSubmit={handleDirectRoleSubmit} className="flex flex-col sm:flex-row flex-wrap items-center gap-3 bg-[#1c1c1e] p-3 rounded-lg border border-[#2a2a2a]">
            <h3 className="text-sm font-semibold text-white mr-2">Выдать права по ID:</h3>
            <input 
              type="text" 
              placeholder="Введите ID пользователя"
              value={directRoleUserId}
              onChange={e => setDirectRoleUserId(e.target.value)}
              className="bg-[#121212] border border-[#3f3f46] text-sm text-white rounded px-3 py-1.5 focus:outline-none focus:border-bw-red max-w-[200px]"
              required
            />
            <select 
              value={directRoleValue} 
              onChange={e => setDirectRoleValue(e.target.value)}
              className="bg-[#121212] border border-[#3f3f46] text-sm text-white rounded px-3 py-1.5 focus:outline-none focus:border-bw-red"
              required
            >
              <option value="" disabled>Выберите роль</option>
              {roles.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <button 
              type="submit"
              className="px-4 py-1.5 bg-bw-red text-white text-sm rounded shadow hover:bg-[#c92f37] font-medium transition-colors"
            >
              Выдать
            </button>
          </form>
        )}
      </div>

      <div className="bg-bw-panel rounded-xl border border-bw-border shadow-sm overflow-hidden divide-y divide-[#2a2a2a]">
        {users.map(u => (
          <div key={u.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-[#222226] transition-colors gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#27272a] rounded-xl flex items-center justify-center text-white font-bold text-xl border-2 border-[#3f3f46]">
                {u.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="text-lg font-bold text-white flex items-center gap-2">
                  {u.username}
                </div>
                <div className="text-sm mt-0.5 text-gray-400">ID: <span className="font-mono text-gray-500">{u.id}</span></div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {editingUserId === u.id ? (
                <div className="flex items-center gap-2">
                  <select 
                    value={newRole} 
                    onChange={e => setNewRole(e.target.value)}
                    className="bg-[#121212] border border-[#3f3f46] text-sm text-white rounded px-2 py-1"
                  >
                    <option value="" disabled>Выберите роль</option>
                    {roles.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => handleRoleChange(u.id)}
                    className="px-3 py-1 bg-bw-red text-white text-xs rounded hover:bg-[#c92f37] font-medium transition-colors"
                  >
                    Сохранить
                  </button>
                  <button 
                    onClick={() => setEditingUserId(null)}
                    className="px-3 py-1 bg-[#27272a] text-white text-xs rounded hover:bg-[#3f3f46] font-medium transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-[#2a1b1b] text-bw-red border border-[#3f1d1d] rounded text-xs font-bold uppercase tracking-wider">
                    {getRoleLabel(u.role)}
                  </span>
                  {canEditRoles && (
                    <button 
                      onClick={() => { setEditingUserId(u.id); setNewRole(u.role); }}
                      className="text-xs text-gray-400 hover:text-white underline decoration-dashed underline-offset-4"
                    >
                      Изменить роль
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
