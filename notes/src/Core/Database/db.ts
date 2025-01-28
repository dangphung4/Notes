import Dexie from 'dexie';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, documentId } from 'firebase/firestore';
import { auth, db as firestore } from '../Auth/firebase';

// Simplified interfaces without nesting
export interface Note {
  id?: number;
  firebaseId?: string;
  title: string;
  content: string;
  updatedAt: Date;
  createdAt: Date;
  
  // Flattened owner fields
  ownerUserId: string;
  ownerEmail: string;
  ownerDisplayName: string;
  ownerPhotoURL?: string;
  
  // Flattened lastEditedBy fields
  lastEditedByUserId?: string;
  lastEditedByEmail?: string;
  lastEditedByDisplayName?: string;
  lastEditedByPhotoURL?: string;
  lastEditedAt?: Date;
  
  tags?: string[];
  isPinned?: boolean;
  isArchived?: boolean;
}

// Simplified share permission
export interface SharePermission {
  noteId: string;
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  access: 'view' | 'edit';
  createdAt: Date;
  updatedAt?: Date;
}

class NotesDB extends Dexie {
  notes: Dexie.Table<Note, number>;

  constructor() {
    super('NotesDB');
    this.version(1).stores({
      notes: '++id, firebaseId, title, updatedAt'
    });
    this.notes = this.table('notes');
  }

  // Load notes from Firebase
  async loadFromFirebase() {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const notesRef = collection(firestore, 'notes');
      const sharesRef = collection(firestore, 'shares');

      // Get all notes I own
      const ownedSnapshot = await getDocs(
        query(notesRef, where('ownerUserId', '==', user.uid))
      );

      // Get all shares for me by email
      const mySharesSnapshot = await getDocs(
        query(sharesRef, where('email', '==', user.email))
      );

      // Get all shared notes
      const sharedNoteIds = mySharesSnapshot.docs.map(doc => doc.data().noteId);
      const sharedNotesSnapshot = sharedNoteIds.length > 0 ? 
        await getDocs(query(notesRef, where(documentId(), 'in', sharedNoteIds))) :
        { docs: [] };

      // Clear existing notes
      await this.notes.clear();

      // Add owned notes
      for (const doc of ownedSnapshot.docs) {
        const data = doc.data();
        await this.notes.add({
          firebaseId: doc.id,
          title: data.title || 'Untitled',
          content: data.content || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          
          ownerUserId: data.ownerUserId || '',
          ownerEmail: data.ownerEmail || '',
          ownerDisplayName: data.ownerDisplayName || 'Unknown',
          ownerPhotoURL: data.ownerPhotoURL,
          
          lastEditedByUserId: data.lastEditedByUserId,
          lastEditedByEmail: data.lastEditedByEmail,
          lastEditedByDisplayName: data.lastEditedByDisplayName,
          lastEditedByPhotoURL: data.lastEditedByPhotoURL,
          lastEditedAt: data.lastEditedAt?.toDate(),
          
          tags: data.tags || [],
          isPinned: data.isPinned || false,
          isArchived: data.isArchived || false
        });
      }

      // Add shared notes
      for (const doc of sharedNotesSnapshot.docs) {
        const data = doc.data();
        const share = mySharesSnapshot.docs.find(s => 
          s.data().noteId === doc.id
        )?.data();

        if (share) {
          await this.notes.add({
            firebaseId: doc.id,
            title: data.title || 'Untitled',
            content: data.content || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            
            ownerUserId: data.ownerUserId || '',
            ownerEmail: data.ownerEmail || '',
            ownerDisplayName: data.ownerDisplayName || 'Unknown',
            ownerPhotoURL: data.ownerPhotoURL,
            
            lastEditedByUserId: data.lastEditedByUserId,
            lastEditedByEmail: data.lastEditedByEmail,
            lastEditedByDisplayName: data.lastEditedByDisplayName,
            lastEditedByPhotoURL: data.lastEditedByPhotoURL,
            lastEditedAt: data.lastEditedAt?.toDate(),
            
            tags: data.tags || [],
            isPinned: data.isPinned || false,
            isArchived: data.isArchived || false
          });
        }
      }

    } catch (error) {
      console.error('Error loading from Firebase:', error);
      throw error;
    }
  }

  // Sync note with Firebase
  async syncNote(note: Note) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // For new notes, set current user as owner
      if (!note.ownerUserId) {
        note.ownerUserId = user.uid;
        note.ownerEmail = user.email || '';
        note.ownerDisplayName = user.displayName || 'Unknown';
        note.ownerPhotoURL = user.photoURL || undefined;
      }

      // Check permissions
      const isOwner = note.ownerUserId === user.uid;
      
      // Check for edit access in shares collection
      const sharesRef = collection(firestore, 'shares');
      const shareQuery = query(
        sharesRef, 
        where('noteId', '==', note.firebaseId),
        where('email', '==', user.email),
        where('access', '==', 'edit')
      );
      const shareSnapshot = await getDocs(shareQuery);
      const hasEditAccess = !shareSnapshot.empty;

      if (!isOwner && !hasEditAccess) {
        throw new Error('No permission to edit this note');
      }

      if (note.firebaseId) {
        await updateDoc(doc(firestore, 'notes', note.firebaseId), {
          title: note.title || 'Untitled',
          content: note.content || '',
          updatedAt: new Date(),
          lastEditedByUserId: user.uid,
          lastEditedByEmail: user.email,
          lastEditedByDisplayName: user.displayName || 'Unknown',
          lastEditedByPhotoURL: user.photoURL,
          lastEditedAt: new Date()
        });
      } else {
        const docRef = await addDoc(collection(firestore, 'notes'), {
          title: note.title || 'Untitled',
          content: note.content || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerUserId: user.uid,
          ownerEmail: user.email,
          ownerDisplayName: user.displayName || 'Unknown',
          ownerPhotoURL: user.photoURL,
          lastEditedByUserId: user.uid,
          lastEditedByEmail: user.email,
          lastEditedByDisplayName: user.displayName || 'Unknown',
          lastEditedByPhotoURL: user.photoURL,
          lastEditedAt: new Date(),
          tags: [],
          isPinned: false,
          isArchived: false
        });
        await this.notes.update(note.id!, { firebaseId: docRef.id });
      }

      await this.loadFromFirebase();
    } catch (error) {
      console.error('Error syncing with Firebase:', error);
      throw error;
    }
  }

  // Share note with another user
  async shareNote(noteId: number, recipientEmail: string, access: 'view' | 'edit' = 'view') {
    const note = await this.notes.get(noteId);
    if (!note?.firebaseId) return;

    const user = auth.currentUser;
    if (!user) return;

    // Only owner can share
    if (note.ownerUserId !== user.uid) {
      throw new Error('Only the owner can share this note');
    }

    try {
      const sharesRef = collection(firestore, 'shares');
      const existingShares = await getDocs(
        query(sharesRef, 
          where('noteId', '==', note.firebaseId),
          where('email', '==', recipientEmail)
        )
      );

      if (!existingShares.empty) {
        const shareDoc = existingShares.docs[0];
        await updateDoc(doc(sharesRef, shareDoc.id), {
          access,
          updatedAt: new Date()
        });
      } else {
        await addDoc(sharesRef, {
          noteId: note.firebaseId,
          userId: recipientEmail, // This will be replaced when we implement user lookup
          email: recipientEmail,
          displayName: recipientEmail.split('@')[0], // This will be replaced when we implement user lookup
          access,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      await this.loadFromFirebase();
    } catch (error) {
      console.error('Error sharing note:', error);
      throw error;
    }
  }

  // Delete note
  async deleteNote(firebaseId: string) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Get note to check ownership
      const noteRef = doc(firestore, 'notes', firebaseId);
      const noteDoc = await getDoc(noteRef);
      
      if (!noteDoc.exists()) return;
      
      const noteData = noteDoc.data();
      if (noteData.ownerUserId !== user.uid) {
        throw new Error('Only the owner can delete this note');
      }

      // Delete all shares first
      const sharesRef = collection(firestore, 'shares');
      const shares = await getDocs(
        query(sharesRef, where('noteId', '==', firebaseId))
      );
      
      const deletePromises = shares.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      // Then delete the note
      await deleteDoc(noteRef);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }
}

export const db = new NotesDB();