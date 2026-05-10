import React, { useEffect, useState } from 'react';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';
import { MessageSquare, FileText, User as UserIcon, Users, Trash2 } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

interface Category {
  id: string;
  name: string;
  description: string;
  type: 'main' | 'faction' | 'general';
  factionId?: string;
}

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
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [stats, setStats] = useState({ topics: 0, posts: 0, users: 0 });
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const cats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(cats);

        const usersSnap = await getDocs(collection(db, 'users'));
        const allUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const team = allUsers.filter(u => ['superadmin', 'deputy_superadmin', 'admin_1', 'admin_2', 'admin_3'].includes(u.role));
        setTeamMembers(team);

        const topicsSnap = await getDocs(collection(db, 'topics'));
        const postsSnap = await getDocs(collection(db, 'posts'));
        
        setStats({
          topics: topicsSnap.size,
          posts: postsSnap.size,
          users: allUsers.length
        });

      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'categories');
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const seedData = async () => {
    try {
      // Only for demonstration convenience to populate empty DB
      const seed = [
        { id: 'cat-news', name: 'Новости проекта', description: 'Важные новости и обновления BrigWas RP.', type: 'main' },
        { id: 'cat-rules', name: 'Правила проекта', description: 'Основные правила серверов, форума и Discord.', type: 'main' },
        { id: 'cat-general', name: 'Свободное общение', description: 'Раздел для общения на любые темы не касающиеся игры.', type: 'general' },
        { id: 'cat-police', name: 'Los Santos Police Dept', description: 'Офицальный раздел полиции г. Лос-Сантос.', type: 'faction', factionId: 'fac-police' },
        { id: 'cat-medics', name: 'Emergency Medical Services', description: 'Раздел медиков.', type: 'faction', factionId: 'fac-medics' },
      ];
      for (const c of seed) {
        const { id, ...data } = c;
        await setDoc(doc(db, 'categories', id), data);
      }
      window.location.reload();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'categories');
    }
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
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
      setCategories(categories.filter(c => c.id !== categoryId));
    } catch(err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${categoryId}`);
    }
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
                    {cat.name}
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
    </div>
  );
};
