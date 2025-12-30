'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Task, TaskCategory, HormoziScore } from '@/types/task';
import { db, auth } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged, User, setPersistence, browserLocalPersistence, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
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
  addTask: (title: string, category?: TaskCategory, scoreVariables?: HormoziScore, magicWords?: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleDaily3: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  reorderDaily3: (orderedIds: string[]) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  scanForOrphans: () => Promise<number>;
  claimOrphans: () => Promise<void>;
  calculateScore: (variables: HormoziScore) => number;
  categories: string[];
  addCategory: (cat: string) => Promise<void>;
  removeCategory: (cat: string, action?: 'migrate' | 'delete') => Promise<void>;
  dbConnected: boolean;
  user: User | null;
  loading: boolean;
  authLoading: boolean;
  isSyncing: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
}


const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Data sync loading
  const [authLoading, setAuthLoading] = useState(true); // Initial auth handshake
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
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
        
        // 1. Try to set persistence (Best Effort)
        setPersistence(auth, browserLocalPersistence)
          .then(() => {
             console.log("💾 Persistence set to LOCAL");
          })
          .catch((err) => {
             console.warn("⚠️ Persistence failed (continuing anyway):", err);
          })
          .finally(() => {
             // 2. Always attempt sign in
             signInAnonymously(auth)
               .then((u) => {
                  console.log("✅ Guest Sign-in Success:", u.user.uid);
                  // setUser will be handled by onAuthStateChanged
               })
               .catch((e) => {
                 console.error("❌ Auth Handshake Failed:", e);
                 setSyncStatus('error');
                 setAuthLoading(false);
                 setLoading(false);
                 alert("Authentication failed. Please check your connection or refresh.");
               });
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
    if (!user) {
      // If no user, we aren't loading data.
      setLoading(false);
      return;
    }
    
    // Safety timeout: If firestore hangs, stop loading after 8s
    const safetyTimer = setTimeout(() => {
      setLoading((current) => {
        if (current) {
           console.warn("⚠️ Task loading timed out (forcing UI to show)");
           return false;
        }
        return current;
      });
    }, 8000);

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
      // If data comes from cache, we are technically "Offline / Local Sync". 
      // If fromCache is false, we are fully connected.
      setDbConnected(!snapshot.metadata.fromCache);
      clearTimeout(safetyTimer);
    }, (error) => {
      console.error("❌ Task Listener Error:", error);
      setLoading(false);
      setDbConnected(false);
      clearTimeout(safetyTimer);
    });
    return () => {
      unsubscribe();
      clearTimeout(safetyTimer);
    };
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
    if (!user) {
      console.error('❌ Cannot add task: User not authenticated');
      setSyncStatus('error');
      throw new Error('User not authenticated. Please wait for login.');
    }
    setIsSyncing(true);
    setSyncStatus('syncing');
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
      console.log("✅ Task saved to Firestore:", title);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (e) {
      console.error("❌ Add Task Failed:", e);
      setSyncStatus('error');
      throw e;
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
      const newStatus = !task.completed;
      await updateDoc(doc(db, 'tasks', id), { completed: newStatus });
      
      // Auto-Reset for Recurring Tasks
      if (newStatus === true && task.isRecurring) {
        console.log("🔄 Recurring Task Completed: triggering auto-reset.");
        setTimeout(async () => {
          try {
            await updateDoc(doc(db, 'tasks', id), { completed: false });
            // Ideally assume toast is handled by UI observing the change, or we could emit an event
            console.log("🔄 Task reset for tomorrow.");
          } catch(e) {
            console.error("Failed to reset recurring task", e);
          }
        }, 2000); // 2 second delay for satisfaction
      }
      
    } finally {
      setIsSyncing(false);
    }
  };

  const reorderDaily3 = async (orderedIds: string[]) => {
    if (!user) return;
    setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      // Update each task with its new order position
      const updates = orderedIds.map((id, index) => 
        updateDoc(doc(db, 'tasks', id), { daily3Order: index })
      );
      await Promise.all(updates);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 1500);
    } catch (e) {
      console.error('❌ Reorder failed:', e);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the user update
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      if (error.code === 'auth/popup-closed-by-user') return;
      
      if (error.code === 'auth/operation-not-allowed') {
        alert("Google Sign-In is not enabled. Please go to the Firebase Console -> Authentication -> Sign-in method, select the support email, and click SAVE.");
        return;
      }
      
      alert("Failed to sign in with Google. " + error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCategories([]); 
      setTasks([]); // clear local state
    } catch (error) {
       console.error("Logout Error:", error);
    }
  };

  // --- Data Rescue ---
  const scanForOrphans = async (): Promise<number> => {
    if (!user) return 0;
    try {
      // Attempt to read ALL tasks. This will FAIL if rules are strict.
      const snap = await getDocs(collection(db, 'tasks'));
      const orphans = snap.docs.filter(d => d.data().userId !== user.uid);
      console.log(`🔎 Scan complete. Found ${orphans.length} orphans out of ${snap.size} total docs.`);
      return orphans.length;
    } catch (e: any) {
      console.error("Scan Failed:", e);
      if (e.code === 'permission-denied') {
        throw new Error("PERMISSION_DENIED"); 
      }
      throw e;
    }
  };

  const claimOrphans = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const snap = await getDocs(collection(db, 'tasks'));
      const orphans = snap.docs.filter(d => d.data().userId !== user.uid);
      
      const batch = writeBatch(db);
      orphans.forEach(doc => {
         batch.update(doc.ref, { userId: user.uid });
      });
      await batch.commit();
      console.log(`✅ Claimed ${orphans.length} tasks.`);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
      
      // Refresh tasks manually since the listener queries by UserID and might not catch the updates immediately if it doesn't see the old ones
      // Actually, once updated, the listener SHOULD see them because userId matches now.
    } catch (e) {
       console.error("Claim Failed:", e);
       alert("Failed to claim tasks: " + e);
    } finally {
       setIsSyncing(false);
    }
  };


  const addCategory = async (cat: string) => {
    if (!user) {
      console.error('❌ Cannot add category: User not authenticated');
      setSyncStatus('error');
      throw new Error('User not authenticated. Please wait for login.');
    }
    if (!cat.trim()) return;
    const normalized = cat.trim();
    
    // Check against latest local state
    if (!categories.some(c => c.toLowerCase() === normalized.toLowerCase())) {
      setIsSyncing(true);
      setSyncStatus('syncing');
      try {
        console.log("➕ Adding Category to Firestore:", normalized);
        await addDoc(collection(db, 'categories'), { 
          name: normalized, 
          userId: user.uid,
          createdAt: Date.now() 
        });
        console.log("✅ Category saved:", normalized);
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (e) {
        console.error("❌ Add Category Failed:", e);
        setSyncStatus('error');
        throw e;
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const removeCategory = async (cat: string, action: 'migrate' | 'delete' = 'migrate') => {
     if (!user) return;
     setIsSyncing(true);
     setSyncStatus('syncing');
     try {
       console.log(`📤 ${action === 'migrate' ? 'Migrating' : 'Deleting'} tasks for category: "${cat}"`);
       const batch = writeBatch(db);

       // 1. Handle Tasks
       const taskQ = query(collection(db, 'tasks'), where('userId', '==', user.uid), where('category', '==', cat));
       const taskSnap = await getDocs(taskQ);
       console.log(`   -> Found ${taskSnap.size} tasks to process.`);
       
       taskSnap.forEach((tDoc) => {
         if (action === 'migrate') {
           batch.update(tDoc.ref, { category: 'Uncategorized' });
         } else {
           batch.delete(tDoc.ref);
         }
       });

       // 2. Handle Category entry
       // Ensure exact match on name
       const catQ = query(collection(db, 'categories'), where('userId', '==', user.uid), where('name', '==', cat)); 
       const catSnap = await getDocs(catQ);
       console.log(`   -> Found ${catSnap.size} category document(s) to delete.`);
       
       if (catSnap.empty) {
         console.warn(`⚠️ No category document found for "${cat}". Local state might be out of sync.`);
         // Force a refresh of categories if possible?
       }

       catSnap.forEach((d) => {
         batch.delete(d.ref);
       });

       await batch.commit();
       console.log("✅ Category removal/migration complete");
       setSyncStatus('success');
       setTimeout(() => setSyncStatus('idle'), 2000);
     } catch (e) {
       console.error("❌ Remove Category Failed:", e);
       setSyncStatus('error');
       alert("Error deleting category. Check console for details.");
     } finally {
       setIsSyncing(false);
     }
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask, toggleDaily3, toggleComplete, reorderDaily3, calculateScore, categories, addCategory, removeCategory, user, loading, authLoading, isSyncing, syncStatus, dbConnected, loginWithGoogle, logout, scanForOrphans, claimOrphans }}>
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
