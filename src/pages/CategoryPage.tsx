import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';

interface Topic {
  id: string;
  categoryId: string;
  title: string;
  authorId: string;
  createdAt: any;
  updatedAt: any;
}

export const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [catData, setCatData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const catRef = doc(db, 'categories', categoryId!);
        const catSnap = await getDoc(catRef);
        if (catSnap.exists()) {
          setCategoryName(catSnap.data().name);
          setCatData(catSnap.data());
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `categories/${categoryId}`);
      }
    };

    const fetchTopics = async () => {
      try {
        const q = query(
          collection(db, 'topics'), 
          where('categoryId', '==', categoryId),
          orderBy('updatedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setTopics(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Topic)));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'topics');
      } finally {
        setLoading(false);
      }
    };
    
    if (categoryId) {
      fetchCategory();
      fetchTopics();
    }
  }, [categoryId]);

  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  const canCreateTopic = () => {
    if (!profile) return false;
    if (['admin_1', 'admin_2', 'admin_3', 'deputy_superadmin', 'superadmin'].includes(profile.role)) return true;
    if (['leader', 'deputy'].includes(profile.role) && catData?.type === 'faction' && catData?.factionId === profile.factionId) return true;
    return false;
  };

  const canDeleteTopic = () => {
    if (!profile) return false;
    if (['admin_1', 'admin_2', 'admin_3', 'deputy_superadmin', 'superadmin'].includes(profile.role)) return true;
    return false;
  };

  const handleDeleteTopic = async (topicId: string) => {
    try {
      await deleteDoc(doc(db, 'topics', topicId));
      setTopics(topics.filter(t => t.id !== topicId));
      setShowConfirmDelete(null);
    } catch(err) {
      handleFirestoreError(err, OperationType.DELETE, `topics/${topicId}`);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !user) return;
    
    try {
      const topicRef = await addDoc(collection(db, 'topics'), {
        categoryId,
        title: newTitle.trim(),
        authorId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      await addDoc(collection(db, 'posts'), {
        topicId: topicRef.id,
        authorId: user.uid,
        content: newContent.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      navigate(`/topic/${topicRef.id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'topics');
    }
  };

  if (loading) return <div className="text-gray-500 animate-pulse">Загрузка тем...</div>;

  return (
    <div>
      <div className="mb-6 flex justify-between items-center bg-bw-panel p-5 rounded-xl border border-bw-border shadow-sm">
        <div>
          <Link to="/" className="text-sm text-gray-400 hover:text-white mb-2 inline-block transition-colors">← На главную</Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">{categoryName}</h1>
        </div>
        
        {canCreateTopic() && !showCreate && (
          <button 
            onClick={() => setShowCreate(true)}
            className="flex items-center px-4 py-2 bg-bw-red text-white rounded-md hover:bg-[#c92f37] transition-colors shadow-sm text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Создать тему
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreateTopic} className="mb-8 bg-bw-panel p-6 rounded-xl shadow-sm border border-bw-border">
          <h3 className="text-lg font-semibold mb-5 text-white">Новая тема</h3>
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Заголовок</label>
            <input 
              type="text" 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#121212] border border-[#2a2a2a] rounded-md focus:ring-1 focus:ring-bw-red focus:border-bw-red text-white placeholder-gray-500"
              required 
              maxLength={200}
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Сообщение</label>
            <textarea 
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#121212] border border-[#2a2a2a] rounded-md h-32 focus:ring-1 focus:ring-bw-red focus:border-bw-red text-white resize-y placeholder-gray-500"
              required
              maxLength={4000}
            />
          </div>
          <div className="flex space-x-3">
            <button type="submit" className="px-5 py-2.5 bg-bw-red text-white rounded-md hover:bg-[#c92f37] text-sm font-medium shadow-sm transition-colors">Опубликовать</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 bg-[#27272a] text-white rounded-md hover:bg-[#3f3f46] text-sm font-medium border border-[#3f3f46] transition-colors">Отмена</button>
          </div>
        </form>
      )}

      <div className="bg-bw-panel rounded-xl shadow-sm border border-bw-border divide-y divide-[#2a2a2a] overflow-hidden">
        {topics.length === 0 ? (
          <div className="p-8 text-center text-bw-muted">
            В этом разделе пока нет тем.
          </div>
        ) : (
          topics.map(topic => (
            <div key={topic.id} className="p-5 hover:bg-[#222226] transition-colors flex items-center justify-between group">
              <div className="flex items-center flex-1">
                <div className="bg-[#2a1b1b] p-3 rounded-full mr-5 text-bw-red border border-[#3f1d1d] group-hover:bg-[#382020] transition-colors shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <Link to={`/topic/${topic.id}`} className="text-lg font-bold text-white hover:text-bw-red transition-colors">
                    {topic.title}
                  </Link>
                  <div className="text-xs text-bw-muted mt-1.5 flex items-center space-x-2">
                    <span>Обновлено: {topic.updatedAt?.toDate?.()?.toLocaleString() || 'Недавно'}</span>
                  </div>
                </div>
              </div>
              
              {canDeleteTopic() && (
                <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {showConfirmDelete === topic.id ? (
                    <div className="flex items-center gap-2 text-sm bg-[#1c1c1e] px-3 py-1.5 rounded-lg border border-[#3f3f46]">
                      <span className="text-gray-300 whitespace-nowrap">Удалить тему?</span>
                      <button onClick={() => handleDeleteTopic(topic.id)} className="text-bw-red hover:text-[#ff6b6b] font-medium transition-colors">Да</button>
                      <button onClick={() => setShowConfirmDelete(null)} className="text-gray-400 hover:text-white transition-colors">Нет</button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowConfirmDelete(topic.id)} 
                      className="p-2 text-bw-muted hover:text-[#ff4e4e] hover:bg-[#2a1b1b] rounded transition-colors"
                      title="Удалить тему"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
