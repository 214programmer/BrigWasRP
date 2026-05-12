import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc, query, where, orderBy, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export interface Category {
  id: string;
  title: string;
  description: string;
  type: string;
  order: number;
}

export interface Topic {
  id: string;
  categoryId: string;
  title: string;
  authorId: string;
  authorUsername: string;
  createdAt: number;
  views: number;
  repliesAmount: number;
  lastReplyAt: number;
}

export interface Post {
  id: string;
  topicId: string;
  content: string;
  authorId: string;
  authorUsername: string;
  authorRole: string;
  createdAt: number;
  likes: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  password?: string;
  username: string;
  role: 'citizen' | 'deputy' | 'leader' | 'admin_1' | 'admin_2' | 'admin_3' | 'deputy_superadmin' | 'superadmin';
  factionId?: string | null;
}

export const store = {
  // USERS
  async getUsers(): Promise<UserProfile[]> { 
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(d => d.data() as UserProfile);
  },
  async getUser(id: string): Promise<UserProfile | undefined> { 
    const snapshot = await getDoc(doc(db, 'users', id));
    return snapshot.exists() ? (snapshot.data() as UserProfile) : undefined;
  },
  async saveUser(user: UserProfile) {
    await setDoc(doc(db, 'users', user.id), user);
  },

  // CATEGORIES  
  async getCategories(): Promise<Category[]> {
    const snapshot = await getDocs(collection(db, 'categories'));
    const categories = snapshot.docs.map(d => d.data() as Category);
    return categories.sort((a, b) => a.order - b.order);
  },
  async getCategory(id: string): Promise<Category | undefined> { 
    const snapshot = await getDoc(doc(db, 'categories', id));
    return snapshot.exists() ? (snapshot.data() as Category) : undefined;
  },
  async saveCategory(cat: Category) {
    await setDoc(doc(db, 'categories', cat.id), cat);
  },
  async deleteCategory(id: string) {
    await deleteDoc(doc(db, 'categories', id));
  },

  // TOPICS
  async getTopics(categoryId?: string): Promise<Topic[]> {
    let q;
    if (categoryId) {
      q = query(collection(db, 'topics'), where('categoryId', '==', categoryId));
    } else {
      q = collection(db, 'topics');
    }
    const snapshot = await getDocs(q);
    const topics = snapshot.docs.map(d => d.data() as Topic);
    return topics.sort((a, b) => b.lastReplyAt - a.lastReplyAt);
  },
  async getTopic(id: string): Promise<Topic | undefined> { 
    const snapshot = await getDoc(doc(db, 'topics', id));
    return snapshot.exists() ? (snapshot.data() as Topic) : undefined;
  },
  async createTopic(topic: Topic) {
    await setDoc(doc(db, 'topics', topic.id), topic);
  },
  async updateTopic(id: string, updates: Partial<Topic>) {
    await updateDoc(doc(db, 'topics', id), updates);
  },
  async deleteTopic(id: string) {
    await deleteDoc(doc(db, 'topics', id));
    // Ideally delete all posts associated with the topic as well
    const postsQuery = query(collection(db, 'posts'), where('topicId', '==', id));
    const snapshot = await getDocs(postsQuery);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  },

  // POSTS
  async getPosts(topicId: string): Promise<Post[]> {
    const q = query(collection(db, 'posts'), where('topicId', '==', topicId));
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(d => d.data() as Post);
    return posts.sort((a, b) => a.createdAt - b.createdAt);
  },
  async createPost(post: Post) {
    await setDoc(doc(db, 'posts', post.id), post);
  },
  async deletePost(id: string) {
    await deleteDoc(doc(db, 'posts', id));
  },
  async likePost(id: string, userId: string) {
    const postDoc = await getDoc(doc(db, 'posts', id));
    if (postDoc.exists()) {
      const post = postDoc.data() as Post;
      let likes = post.likes || [];
      if (!likes.includes(userId)) likes.push(userId);
      else likes = likes.filter(u => u !== userId);
      await updateDoc(doc(db, 'posts', id), { likes });
    }
  },
  
  // METRICS
  async getStats() {
    const topicsSnapshot = await getDocs(collection(db, 'topics'));
    const postsSnapshot = await getDocs(collection(db, 'posts'));
    return {
      topics: topicsSnapshot.size,
      posts: postsSnapshot.size
    };
  }
};

