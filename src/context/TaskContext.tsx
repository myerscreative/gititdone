'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Task, TaskCategory, HormoziScore } from '@/types/task';
import { db, auth } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocs,
  where,
  writeBatch
} from 'firebase/firestore';

interface TaskContextType {
  tasks: Task[];
  addTask: (title: string, category?: TaskCategory, scoreVariables?: HormoziScore, magicWords?: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleDaily3: (id: string) => void;
  toggleComplete: (id: string) => void;
  calculateScore: (variables: HormoziScore) => number;
  categories: string[];
  addCategory: (cat: string) => void;
  removeCategory: (cat: string) => void;
  dbConnected: boolean;
  user: User | null;
  loading: boolean;
  authLoading: boolean;
  isSyncing: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Data sync loading
  const [authLoading, setAuthLoading] = useState(true); // Initial auth handshake
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Authenticate Anonymously
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        console.log("✅ Authenticated as:", u.uid);
        setUser(u);
        setAuthLoading(false);
      } else {
        console.log("🔒 Attempting anonymous sign-in...");
        signInAnonymously(auth)
          .then(() => setAuthLoading(false))
          .catch((e) => {
            console.error("Auth Failed:", e);
            setAuthLoading(false);
            setLoading(false);
          });
      }
    });
    return () => unsub();
  }, []);


  // Load Categories (Scoped to User)
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'categories'), 
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
       const cats = snapshot.docs
         .map(d => d.data().name)
         .filter(name => typeof name === 'string' && name.trim().length > 0);
       
       const uniqueCats = Array.from(new Set(cats)).sort((a, b) => a.localeCompare(b));
       console.log("📂 Synced Categories:", uniqueCats, snapshot.metadata.fromCache ? "(from cache)" : "(from server)");
       setCategories(uniqueCats);
       setDbConnected(!snapshot.metadata.fromCache);
    }, (error) => {
      console.error("❌ Category Listener Error:", error);
      setDbConnected(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Load Tasks (Scoped to User)
  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'tasks'), 
      where('userId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveTasks: Task[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(liveTasks.sort((a,b) => b.calculatedScore - a.calculatedScore));
      setLoading(false);
    }, (error) => {
      console.error("❌ Task Listener Error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Seed Default Categories (Scoped to User)
  useEffect(() => {
    if (!user) return;
    const seedCategories = async () => {
       const q = query(collection(db, 'categories'), where('userId', '==', user.uid));
       const querySnapshot = await getDocs(q);
       if (querySnapshot.empty) {
         console.log("🌱 Seeding first-time categories for user...");
         const defaults = ['Income Generation', 'NILUMI Switch', 'Patio Doors', 'CRM', 'Strategy', 'Other'];
         await Promise.all(defaults.map(name => 
           addDoc(collection(db, 'categories'), { name, userId: user.uid })
         ));
       }
    };
    seedCategories();
  }, [user]);


  const calculateScore = (v: HormoziScore) => {
    const numerator = v.outcome * v.certainty;
    const denominator = (v.delay * v.effort) || 1; 
    return parseFloat((numerator / denominator).toFixed(2));
  };

  const addTask = async (title: string, category: TaskCategory = 'Uncategorized', scoreVariables?: HormoziScore, magicWords?: string) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const defaults = { outcome: 5, certainty: 5, delay: 5, effort: 5 };
      const finalScores = scoreVariables || defaults;
      const calculatedScore = calculateScore(finalScores);
      
      console.log("📤 Adding Task to Firestore:", title);
      await addDoc(collection(db, 'tasks'), {
        userId: user.uid,
        title: title.trim(),
        category,
        isDaily3: false,
        completed: false,
        scoreVariables: finalScores,
        calculatedScore,
        magicWords: magicWords || "",
        createdAt: Date.now(),
      });
    } catch (e) {
      console.error("❌ Add Task Failed:", e);
      alert("Database error: Could not add task.");
    } finally {
      setIsSyncing(false);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const docRef = doc(db, 'tasks', id);
      if (updates.scoreVariables) {
        updates.calculatedScore = calculateScore(updates.scoreVariables);
      }
      console.log("📤 Updating Task in Firestore:", id);
      await updateDoc(docRef, updates);
    } catch (e) {
      console.error("❌ Update Task Failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleDaily3 = async (id: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    setIsSyncing(true);
    try {
      await updateDoc(doc(db, 'tasks', id), { isDaily3: !task.isDaily3 });
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleComplete = async (id: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    setIsSyncing(true);
    try {
      await updateDoc(doc(db, 'tasks', id), { completed: !task.completed });
    } finally {
      setIsSyncing(false);
    }
  };

  const addCategory = async (cat: string) => {
    if (!user || !cat.trim()) return;
    const normalized = cat.trim();
    
    // Hard refresh/check against latest local state
    if (!categories.some(c => c.toLowerCase() === normalized.toLowerCase())) {
      setIsSyncing(true);
      try {
        console.log("➕ Adding Category:", normalized);
        await addDoc(collection(db, 'categories'), { 
          name: normalized, 
          userId: user.uid,
          createdAt: Date.now() 
        });
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const removeCategory = async (cat: string, action: 'migrate' | 'delete' = 'migrate') => {
     if (!user) return;
     try {
       console.log(`📤 ${action === 'migrate' ? 'Migrating' : 'Deleting'} tasks for category:`, cat);
       const batch = writeBatch(db);

       // 1. Handle Tasks
       const taskQ = query(collection(db, 'tasks'), where('userId', '==', user.uid), where('category', '==', cat));
       const taskSnap = await getDocs(taskQ);
       taskSnap.forEach((tDoc) => {
         if (action === 'migrate') {
           batch.update(tDoc.ref, { category: 'Uncategorized' });
         } else {
           batch.delete(tDoc.ref);
         }
       });

       // 2. Handle Category entry
       const catQ = query(collection(db, 'categories'), where('userId', '==', user.uid), where('name', '==', cat)); 
       const catSnap = await getDocs(catQ);
       catSnap.forEach((d) => {
         batch.delete(d.ref);
       });

       setIsSyncing(true);
       await batch.commit();
       console.log("✅ Category removal/migration complete");
     } catch (e) {
       console.error("❌ Remove Category Failed:", e);
       alert("Error deleting category. Check connection.");
     } finally {
       setIsSyncing(false);
     }
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask, toggleDaily3, toggleComplete, calculateScore, categories, addCategory, removeCategory, user, loading, authLoading, isSyncing, dbConnected }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
