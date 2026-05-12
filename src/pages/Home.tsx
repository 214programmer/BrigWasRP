import React, { useEffect, useState } from 'react';
import { store, Category, UserProfile } from '../lib/store';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, FileText, User as UserIcon, Users, Trash2, Plus, X } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: '01.05', msgs: 1200 },
  { name: '02.05', msgs: 2100 },
  { name: '03.05', msgs: 800 },
  { name: '04.05', msgs: 1600 },
  { name: '05.05', msgs: 3400 },
  { name: '06.05', msgs: 2800 },
  { name: '07.05', msgs: 5200 },
];

export const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({ topics: 0, posts: 0, users: 0 });
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  
  const [showCreateCat, setShowCreateCat] = useState(false);
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatType, setNewCatType] = useState('main');

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const cats = await store.getCategories();
        setCategories(cats);

        const allUsers = await store.getUsers();
        const team = allUsers.filter(u => ['superadmin', 'deputy_superadmin', 'admin_1', 'admin_2', 'admin_3'].includes(u.role));
        setTeamMembers(team);

        const currentTopics = await store.getTopics();
        const currentStats = await store.getStats();

        setStats({
          topics: currentStats.topics,
          posts: currentStats.posts,
          users: allUsers.length
        });
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const seedData = async () => {
    // Only for demonstration convenience to populate empty DB
    const currentCats = await store.getCategories();
    if (currentCats.length === 0) {
      const initial = [
        { id: 'cat-news', title: 'Новости проекта', description: 'Важные новости и обновления BrigWas RP.', type: 'main', order: 1 },
        { id: 'cat-rules', title: 'Правила проекта', description: 'Основные правила серверов, форума и Discord.', type: 'main', order: 2 },
        { id: 'cat-general', title: 'Свободное общение', description: 'Раздел для общения на любые темы не касающиеся игры.', type: 'general', order: 3 },
        { id: 'cat-police', title: 'Los Santos Police Dept', description: 'Офицальный раздел полиции г. Лос-Сантос.', type: 'faction', order: 4 },
        { id: 'cat-medics', title: 'Emergency Medical Services', description: 'Раздел медиков.', type: 'faction', order: 5 },
      ];
      for (const cat of initial) {
        await store.saveCategory(cat);
      }
      window.location.reload();
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatTitle.trim()) return;

    const currentCats = await store.getCategories();
    const id = 'cat-' + Date.now();
    const newCat: Category = {
      id,
      title: newCatTitle.trim(),
      description: newCatDesc.trim(),
      type: newCatType,
      order: currentCats.length + 1
    };

    await store.saveCategory(newCat);
    setCategories(await store.getCategories());
    
    setNewCatTitle('');
    setNewCatDesc('');
    setShowCreateCat(false);
  };

  if (loading) return <div className="text-gray-500 animate-pulse">Загрузка форума...</div>;

  const grouped = categories.reduce((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = [];
    acc[cat.type].push(cat);
    return acc;
  }, {} as Record<string, Category[]>);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'main': return <FileText className="w-5 h-5 text-bw-red" />;
      case 'faction': return <Users className="w-5 h-5 text-bw-red" />;
      default: return <MessageSquare className="w-5 h-5 text-bw-red" />;
    }
  };

  const getTitleForType = (type: string) => {
    switch (type) {
      case 'main': return "Информационный раздел";
      case 'faction': return "Государственные организации";
      case 'general': return "Общение и обсуждения";
      default: return type;
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if(!window.confirm("Удалить этот раздел и все его настроики? Текущие темы не будут удалены, но перестанут отображаться в разделе.")) return;
    await store.deleteCategory(categoryId);
    setCategories(await store.getCategories());
  };


  const renderSection = (type: string) => {
    const cats = grouped[type] || [];
    if (cats.length === 0) return null;
    return (
      <div className="mb-6" key={type}>
        <div className="bg-bw-panel rounded-t-xl px-5 py-3 border-b border-bw-border shadow-sm">
          <h2 className="text-lg font-semibold text-white">{getTitleForType(type)}</h2>
        </div>
        <div className="bg-bw-panel rounded-b-xl shadow-sm divide-y divide-[#2a2a2a]">
          {cats.map(cat => (
            <div key={cat.id} className="p-5 hover:bg-[#222226] transition-colors flex items-center justify-between group">
              <div className="flex items-start gap-4 flex-1">
                <div className="mt-1 p-2.5 bg-[#2a1b1b] rounded-md border border-[#3f1d1d] group-hover:bg-[#382020] transition-colors shrink-0">
                  {getIconForType(type)}
                </div>
                <div>
                  <Link to={`/category/${cat.id}`} className="text-[17px] font-bold text-white hover:text-bw-red transition-colors">
                    {cat.title}
                  </Link>
                  <p className="text-sm text-bw-muted mt-0.5">{cat.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-8 text-sm">
                  <div className="text-center">
                    <div className="text-gray-200 font-medium">--</div>
                    <div className="text-[11px] text-bw-muted uppercase tracking-wider">Сообщений</div>
                  </div>
                  <div className="w-48 text-right flex flex-col justify-center">
                    <div className="text-gray-200 truncate">Нет сообщений</div>
                    <div className="text-bw-muted text-xs flex justify-between mt-0.5">
                      <span>--</span>
                    </div>
                  </div>
                </div>
                {profile?.role === 'superadmin' && (
                  <button 
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-2 ml-4 opacity-0 group-hover:opacity-100 text-bw-muted hover:text-[#ff4e4e] hover:bg-[#2a1b1b] rounded transition-all"
                    title="Удалить раздел"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      <div className="flex-1 min-w-0">
        {/* Banner Hero */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#2a1b1b] to-bw-panel border border-[#3f1d1d] p-8 mb-8 shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Добро пожаловать на BrigWas RP</h1>
              <p className="text-bw-muted text-[15px] leading-relaxed">
                Окунитесь в увлекательный мир RolePlay в криминальной России. Начните свою историю с обычного работяги и дойдите до главы мафии или влиятельного чиновника.
              </p>
            </div>
            <div className="flex gap-4 shrink-0">
              <a href="https://discord.gg/bQvYqE4r" target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 bg-bw-red hover:bg-[#c92f37] text-white font-medium rounded-md shadow-lg border border-transparent transition-colors">
                Начать игру
              </a>
              <a href="https://discord.gg/bQvYqE4r" target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 bg-[#27272a] hover:bg-[#3f3f46] text-white font-medium rounded-md shadow border border-[#3f3f46] transition-colors">
                Правила
              </a>
            </div>
          </div>
        </div>

        {profile?.role === 'superadmin' && categories.length === 0 && (
          <div className="mb-6">
            <button onClick={seedData} className="px-4 py-2 bg-bw-red text-white rounded shadow-sm text-sm border border-[#c92f37]">
              Создать базовые разделы (Demo)
            </button>
          </div>
        )}

        {profile?.role === 'superadmin' && (
          <div className="mb-6">
            <button onClick={() => setShowCreateCat(true)} className="flex items-center px-4 py-2 bg-bw-red text-white rounded shadow-sm text-sm border border-[#c92f37] hover:bg-[#c92f37] transition-colors">
              <Plus className="w-4 h-4 mr-2" /> Добавить категорию
            </button>
          </div>
        )}

        {/* Category List */}
        {['main', 'faction', 'general'].map(type => renderSection(type))}
        
        {categories.length === 0 && profile?.role !== 'superadmin' && (
          <div className="text-center text-bw-muted py-12 bg-bw-panel rounded-xl border border-bw-border">
            Разделы форума пока не созданы.
          </div>
        )}
      </div>

      <div className="w-full xl:w-[320px] flex flex-col gap-6 shrink-0">
        {/* Team Online Widget */}
        <div className="bg-bw-panel rounded-xl border border-bw-border shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-bw-border bg-[#222225]">
            <h3 className="font-semibold text-white">Команда проекта</h3>
          </div>
          <div className="p-5 flex flex-col gap-4">
            {teamMembers.length > 0 ? teamMembers.map(member => (
              <div key={member.id} className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 bg-[#27272a] rounded flex items-center justify-center text-gray-300 font-bold border border-[#3f3f46]">
                    {member.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#1c1c1e] rounded-full"></div>
                </div>
                <div>
                  <div className="text-[#ff4e4e] font-semibold text-[15px]">{member.username}</div>
                  <div className="text-xs text-bw-muted capitalize flex items-center gap-1">
                    {member.role.replace('_', ' ')}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-sm text-bw-muted">Нет участников команды.</div>
            )}
          </div>
        </div>

        {/* Stats Widget */}
        <div className="bg-bw-panel rounded-xl border border-bw-border shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-bw-border bg-[#222225] flex items-center gap-2">
            <Users className="w-[18px] h-[18px] text-bw-muted" />
            <h3 className="font-semibold text-white">Статистика форума</h3>
          </div>
          <div className="p-5 space-y-3.5 text-[15px]">
            <div className="flex justify-between items-center">
              <span className="text-bw-muted">Темы:</span>
              <span className="text-white font-medium">{stats.topics}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-bw-muted">Сообщения:</span>
              <span className="text-white font-medium">{stats.posts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-bw-muted">Пользователи:</span>
              <span className="text-white font-medium">{stats.users}</span>
            </div>
          </div>
          <div className="px-5 pb-5 mt-2">
            <h4 className="text-[10px] font-bold text-bw-muted uppercase mb-3 text-center tracking-wider">Активность за неделю</h4>
            <div className="h-24 w-full opacity-80 hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea3943" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ea3943" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#222225', border: '1px solid #3f3f46', borderRadius: '6px', fontSize: '13px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="msgs" stroke="#ea3943" strokeWidth={2} fillOpacity={1} fill="url(#colorMsgs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Create Category Modal */}
      {showCreateCat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] w-full max-w-md rounded-2xl border border-bw-border shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white tracking-tight">Новая категория</h3>
              <button 
                onClick={() => setShowCreateCat(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Тип раздела</label>
                <select 
                  value={newCatType}
                  onChange={e => setNewCatType(e.target.value)}
                  className="w-full bg-[#27272a] text-white rounded-lg px-4 py-2.5 border border-[#3f3f46] focus:border-bw-red focus:ring-1 focus:ring-bw-red/50 transition-all outline-none"
                >
                  <option value="main">Информационный раздел</option>
                  <option value="faction">Государственные организации</option>
                  <option value="general">Общение и обсуждения</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Название (Title)</label>
                <input 
                  type="text" 
                  value={newCatTitle}
                  onChange={e => setNewCatTitle(e.target.value)}
                  placeholder="Например: Жалобы на игроков"
                  required
                  className="w-full bg-[#27272a] text-white rounded-lg px-4 py-2.5 border border-[#3f3f46] focus:border-bw-red focus:ring-1 focus:ring-bw-red/50 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Описание (необязательно)</label>
                <textarea 
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  placeholder="Коротко о том, что должно быть в этом разделе..."
                  rows={3}
                  className="w-full bg-[#27272a] text-white rounded-lg px-4 py-2.5 border border-[#3f3f46] focus:border-bw-red focus:ring-1 focus:ring-bw-red/50 transition-all outline-none resize-none"
                />
              </div>
              
              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-bw-red hover:bg-[#c92f37] text-white font-medium rounded-lg px-4 py-3 shadow border border-[#c92f37] transition-colors"
                >
                  Создать категорию
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
