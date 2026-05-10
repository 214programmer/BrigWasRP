import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, UserProfile } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';
import { Heart, Trash2 } from 'lucide-react';

interface Post {
  id: string;
  topicId: string;
  authorId: string;
  content: string;
  createdAt: any;
  authorProfile?: UserProfile;
  likesCount?: number;
  userLiked?: boolean;
}

export const TopicPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const [topic, setTopic] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const { user, profile } = useAuth();

  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const topicRef = doc(db, 'topics', topicId!);
        const topicSnap = await getDoc(topicRef);
        if (topicSnap.exists()) {
          setTopic({ id: topicSnap.id, ...topicSnap.data() });
        }

        const q = query(
          collection(db, 'posts'), 
          where('topicId', '==', topicId),
          orderBy('createdAt', 'asc')
        );
        const postsSnap = await getDocs(q);
        
        const postsData = postsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
        
        const authorIds = [...new Set(postsData.map(p => p.authorId))];
        const authorsData: Record<string, UserProfile> = {};
        for (const uid of authorIds) {
          const uSnap = await getDoc(doc(db, 'users', uid));
          if (uSnap.exists()) authorsData[uid] = uSnap.data() as UserProfile;
        }

        // Fetch likes
        let likesMap: Record<string, { count: number; likedByUserId: string | null }> = {};
        for(const p of postsData) {
          likesMap[p.id] = { count: 0, likedByUserId: null };
        }

        const likesQ = query(
          collection(db, 'likes')
        );
        // Better to query likes per post, but for demo we fetch likes globally or chunked by post ids
        const likesSnap = await getDocs(likesQ);
        likesSnap.forEach(lk => {
          const lkData = lk.data();
          if (likesMap[lkData.postId]) {
            likesMap[lkData.postId].count++;
            if (user && lkData.authorId === user.uid) {
               likesMap[lkData.postId].likedByUserId = lk.id;
            }
          }
        });

        setPosts(postsData.map(p => ({ 
          ...p, 
          authorProfile: authorsData[p.authorId],
          likesCount: likesMap[p.id]?.count || 0,
          userLiked: !!likesMap[p.id]?.likedByUserId,
          likeDocId: likesMap[p.id]?.likedByUserId
        } as any)));
        
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `topics/${topicId}`);
      } finally {
        setLoading(false);
      }
    };
    if (topicId) fetchData();
  }, [topicId, user]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !user) return;
    try {
      const newPost = {
        topicId,
        authorId: user.uid,
        content: replyContent.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'posts'), newPost);
      
      setPosts([...posts, { 
        id: docRef.id, 
        ...newPost, 
        createdAt: { toDate: () => new Date() },
        authorProfile: profile!,
        likesCount: 0,
        userLiked: false
      } as any]);
      setReplyContent('');
    } catch(err) {
      handleFirestoreError(err, OperationType.CREATE, 'posts');
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setPosts(posts.filter(p => p.id !== postId));
      setShowConfirmDelete(null);
    } catch(err) {
      handleFirestoreError(err, OperationType.DELETE, `posts/${postId}`);
    }
  };

  const handleLikeToggle = async (post: any) => {
    if (!user) return;
    try {
      if (post.userLiked && post.likeDocId) {
        await deleteDoc(doc(db, 'likes', post.likeDocId));
        setPosts(posts.map(p => p.id === post.id ? { ...p, userLiked: false, likesCount: (p.likesCount || 1) - 1, likeDocId: null } as any: p));
      } else {
        const likeRef = await addDoc(collection(db, 'likes'), {
          postId: post.id,
          authorId: user.uid,
          createdAt: serverTimestamp()
        });
        setPosts(posts.map(p => p.id === post.id ? { ...p, userLiked: true, likesCount: (p.likesCount || 0) + 1, likeDocId: likeRef.id } as any : p));
      }
    } catch(err) {
      handleFirestoreError(err, OperationType.WRITE, 'likes');
    }
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
          <div key={post.id} className="bg-bw-panel rounded-xl shadow-sm border border-bw-border flex flex-col md:flex-row overflow-hidden">
            <div className="w-full md:w-[220px] bg-[#222225] p-5 border-b md:border-b-0 md:border-r border-bw-border flex flex-col items-center flex-shrink-0">
              <div className="w-16 h-16 bg-[#27272a] rounded-full mb-3 flex items-center justify-center text-white font-bold text-2xl border-2 border-[#3f3f46]">
                {post.authorProfile?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="text-[15px] font-bold text-white text-center break-words w-full">
                {post.authorProfile?.username || 'Неизвестный'}
              </div>
              <div className="mt-1.5 text-[11px] px-2.5 py-1 bg-[#2a1b1b] text-[#ea3943] border border-[#3f1d1d] rounded capitalize font-medium tracking-wide">
                {post.authorProfile?.role?.replace('_', ' ') || 'user'}
              </div>
              <div className="mt-4 w-full pt-3 text-center">
                <span className="text-[11px] text-gray-500 tracking-wider font-mono">
                  ID: {post.authorProfile?.id?.substring(0,6) || post.authorId.substring(0,6)}
                </span>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4 text-xs text-bw-muted border-b border-[#2a2a2a] pb-3">
                <span>{post.createdAt?.toDate?.()?.toLocaleString() || 'Недавно'}</span>
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
                  className={`flex items-center text-sm transition-colors ${post.userLiked ? 'text-[#ea3943] hover:text-[#ff6b6b]' : 'text-bw-muted hover:text-[#ff4e4e]'}`} 
                  disabled={!user}
                >
                  <Heart className={`w-4 h-4 mr-1.5 ${post.userLiked ? 'fill-current' : ''}`} />
                  {post.likesCount > 0 ? post.likesCount : 'Нравится'}
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
