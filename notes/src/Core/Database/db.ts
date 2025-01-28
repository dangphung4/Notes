import Dexie from 'dexie';
import { db as firestore } from '../Auth/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { auth } from '../Auth/firebase';

export interface Note {
  id?: number;
  firebaseId?: string; // Add this for Firebase document ID
  userId?: string; // Add this for user association
  title: string;
  content: string; // Will store JSON string of BlockNote content
  updatedAt: Date;
}

class NotesDB extends Dexie {
  notes!: Dexie.Table<Note, number>;

  constructor() {
    super('NotesDB');
    this.version(2).stores({ // Bump version to 2
      notes: '++id, firebaseId, userId, title, updatedAt'
    });
  }

  // Sync note with Firebase
  async syncNote(note: Note) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const noteData = {
        title: note.title,
        content: note.content,
        updatedAt: note.updatedAt,
        userId: user.uid
      };

      if (note.firebaseId) {
        // Update existing Firebase document
        const docRef = doc(firestore, 'notes', note.firebaseId);
        await updateDoc(docRef, noteData);
      } else {
        // Create new Firebase document
        const docRef = await addDoc(collection(firestore, 'notes'), noteData);
        // Update local note with Firebase ID
        await this.notes.update(note.id!, { firebaseId: docRef.id });
      }
    } catch (error) {
      console.error('Error syncing with Firebase:', error);
      throw error; // Propagate error for handling in UI
    }
  }

  // Load notes from Firebase
  async loadFromFirebase() {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const q = query(collection(firestore, 'notes'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      // Begin transaction
      await this.transaction('rw', this.notes, async () => {
        // Clear existing notes
        await this.notes.where('userId').equals(user.uid).delete();
        
        // Add Firebase notes to local DB
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          await this.notes.add({
            firebaseId: doc.id,
            userId: user.uid,
            title: data.title,
            content: data.content,
            updatedAt: data.updatedAt.toDate(),
          });
        }
      });
    } catch (error) {
      console.error('Error loading from Firebase:', error);
    }
  }

  // Add this method to the NotesDB class
  async deleteNote(firebaseId: string) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Delete from Firebase
      const docRef = doc(firestore, 'notes', firebaseId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting note from Firebase:', error);
    }
  }
}

export const db = new NotesDB();