import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { store, Post, Topic } from '../lib/store';
import { useAuth, UserProfile } from '../contexts/AuthContext';
import { Heart, Trash2 } from 'lucide-react';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const TopicPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const { user, profile } = useAuth();
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeTopic: () => void;
    let unsubscribePosts: () => void;

    if (topicId) {
      setLoading(true);
      unsubscribeTopic = onSnapshot(doc(db, 'topics', topicId), (docSnap) => {
        if (docSnap.exists()) {
          setTopic(docSnap.data() as Topic);
        } else {
          setTopic(null);
        }
      });

      const q = query(collection(db, 'posts'), where('topicId', '==', topicId));
      unsubscribePosts = onSnapshot(q, (snapshot) => {
        const p = snapshot.docs.map(d => d.data() as Post).sort((a, b) => a.createdAt - b.createdAt);
        setPosts(p);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => {
      if (unsubscribeTopic) unsubscribeTopic();
      if (unsubscribePosts) unsubscribePosts();
    };
  }, [topicId, user?.uid]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !user || !topicId) return;
    
    const now = Date.now();
    const newPost: Post = {
      id: now.toString(),
      topicId,
      authorId: user.uid,
      content: replyContent.trim(),
      authorUsername: profile?.username || 'user',
      authorRole: profile?.role || 'citizen',
      createdAt: now,
      likes: []
    };
    
    await store.createPost(newPost);
    const existingTopic = await store.getTopic(topicId);
    if(existingTopic) {
      await store.updateTopic(topicId, {
        lastReplyAt: now,
        repliesAmount: existingTopic.repliesAmount + 1
      });
    }
    
    setPosts(await store.getPosts(topicId));
    setReplyContent('');
  };

  const handleDelete = async (postId: string) => {
    await store.deletePost(postId);
    setPosts(posts.filter(p => p.id !== postId));
    setShowConfirmDelete(null);
  };

  const handleLikeToggle = async (post: Post) => {
    if (!user) return;
    await store.likePost(post.id, user.uid);
    setPosts(await store.getPosts(topicId!));
  };

  const canDelete = (postAuthorId: string) => {
    if (!profile) return false;
    if (['admin_1', 'admin_2', 'admin_3', 'deputy_superadmin', 'superadmin'].includes(profile.role)) return true;
    if (profile.id === postAuthorId) return true;
    return false;
  };

  if (loading) return <div className="text-gray-500 animate-pulse">Загрузка...</div>;
  if (!topic) return <div className="text-red-500">Тема не найдена</div>;

  return (
    <div>
      <div className="mb-6 bg-bw-panel p-5 rounded-xl border border-bw-border shadow-sm">
        <Link to={`/category/${topic.categoryId}`} className="text-sm text-gray-400 hover:text-white mb-2 inline-block transition-colors">← Назад в раздел</Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">{topic.title}</h1>
      </div>

      <div className="space-y-4 mb-8">
        {posts.map((post, idx) => (
          <div key={post.id || idx} className="bg-bw-panel rounded-xl shadow-sm border border-bw-border flex flex-col md:flex-row overflow-hidden">
            <div className="w-full md:w-[220px] bg-[#222225] p-5 border-b md:border-b-0 md:border-r border-bw-border flex flex-col items-center flex-shrink-0">
              <div className="w-16 h-16 bg-[#27272a] rounded-full mb-3 flex items-center justify-center text-white font-bold text-2xl border-2 border-[#3f3f46]">
                {post.authorUsername?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="text-[15px] font-bold text-white text-center break-words w-full">
                {post.authorUsername || 'Неизвестный'}
              </div>
              <div className="mt-1.5 text-[11px] px-2.5 py-1 bg-[#2a1b1b] text-[#ea3943] border border-[#3f1d1d] rounded capitalize font-medium tracking-wide">
                {post.authorRole?.replace('_', ' ') || 'user'}
              </div>
              <div className="mt-4 w-full pt-3 text-center">
                <span className="text-[11px] text-gray-500 tracking-wider font-mono">
                  ID: {post.authorId?.substring(0,6)}
                </span>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4 text-xs text-bw-muted border-b border-[#2a2a2a] pb-3">
                <span>{new Date(post.createdAt).toLocaleString()}</span>
                <span className="font-medium bg-[#27272a] px-2 py-0.5 rounded text-gray-300">
                  {idx === 0 ? '#1 (Тема)' : `#${idx + 1}`}
                </span>
              </div>
              <div className="flex-1 text-gray-200 whitespace-pre-wrap leading-relaxed text-[15px]">
                {post.content}
              </div>
              <div className="mt-5 flex justify-end gap-3 border-t border-[#2a2a2a] pt-3">
                <button 
                  onClick={() => handleLikeToggle(post)}
                  className={`flex items-center text-sm transition-colors ${post.likes?.includes(user?.uid) ? 'text-[#ea3943] hover:text-[#ff6b6b]' : 'text-bw-muted hover:text-[#ff4e4e]'}`} 
                  disabled={!user}
                >
                  <Heart className={`w-4 h-4 mr-1.5 ${post.likes?.includes(user?.uid) ? 'fill-current' : ''}`} />
                  {post.likes?.length > 0 ? post.likes.length : 'Нравится'}
                </button>
                {canDelete(post.authorId) && (
                  showConfirmDelete === post.id ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-300">Точно удалить?</span>
                      <button onClick={() => handleDelete(post.id)} className="text-bw-red hover:text-[#ff6b6b] font-medium transition-colors">Да</button>
                      <button onClick={() => setShowConfirmDelete(null)} className="text-gray-400 hover:text-white transition-colors">Нет</button>
                    </div>
                  ) : (
                    <button onClick={() => setShowConfirmDelete(post.id)} className="text-bw-muted hover:text-[#ff4e4e] flex items-center text-sm transition-colors">
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Удалить
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {user ? (
        <form onSubmit={handleReply} className="bg-bw-panel p-6 rounded-xl shadow-sm border border-[#ea3943]/20">
          <h3 className="text-lg font-semibold mb-4 text-white">Ответить в тему</h3>
          <textarea 
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            className="w-full px-4 py-3 bg-[#121212] border border-[#2a2a2a] rounded-md h-32 focus:ring-1 focus:ring-bw-red focus:border-bw-red mb-4 text-white placeholder-gray-500 resize-y"
            placeholder="Напишите ваш ответ..."
            required
            maxLength={4000}
          />
          <button type="submit" className="px-6 py-2.5 bg-bw-red text-white rounded-md hover:bg-[#c92f37] font-medium transition-colors shadow-lg shadow-[#ea3943]/10">
            Отправить ответ
          </button>
        </form>
      ) : (
        <div className="bg-[#1c1c1e] p-6 rounded-xl text-center text-bw-muted border border-bw-border">
          Пожалуйста, войдите в систему, чтобы оставлять сообщения.
        </div>
      )}
    </div>
  );
};
