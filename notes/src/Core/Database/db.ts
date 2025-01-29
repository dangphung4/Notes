import Dexie from 'dexie';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, documentId } from 'firebase/firestore';
import { auth, db as firestore } from '../Auth/firebase';

export interface User {
  userId: string;
  email: string;
  displayName: string;
  photoURL: string;
  lastLoginAt: Date;
}

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
  id: string | null | undefined;
  noteId: string;
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  access: 'view' | 'edit';
  createdAt: Date;
  updatedAt?: Date;
}

// Update CalendarEvent type to include sharing
interface CalendarEventShare {
  email: string;
  permission: 'view' | 'edit';
  status: 'pending' | 'accepted' | 'declined';
}

export interface CalendarEvent {
  firebaseId?: string;
  id: number;
  title: string;
  startDate: Date;
  endDate: Date;
  reminderMinutes: number;
  sharedWith?: CalendarEventShare[];
  createdBy: string; // user email
  lastModifiedBy?: string;
  lastModifiedAt?: Date;
}

class NotesDB extends Dexie {
  notes: Dexie.Table<Note, number>;
  calendarEvents!: Dexie.Table<CalendarEvent, number>;

  constructor() {
    super('NotesDB');
    this.version(2).stores({
      notes: '++id, firebaseId, title, updatedAt',
      calendarEvents: '++id, firebaseId, startDate, endDate, ownerUserId'
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
          title: note.title,
          content: note.content || '',
          updatedAt: new Date(),
          lastEditedByUserId: user.uid,
          lastEditedByEmail: user.email,
          lastEditedByDisplayName: user.displayName || 'Unknown',
          lastEditedByPhotoURL: user.photoURL,
          lastEditedAt: new Date(),
          isPinned: note.isPinned
        });
      } else {
        const docRef = await addDoc(collection(firestore, 'notes'), {
          title: note.title,
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
  async shareNote(noteId: string, recipientEmail: string, access: 'view' | 'edit' = 'view') {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Get note from Firebase to check ownership
      const noteRef = doc(firestore, 'notes', noteId);
      const noteDoc = await getDoc(noteRef);
      
      if (!noteDoc.exists()) {
        throw new Error('Note not found');
      }
      
      const noteData = noteDoc.data();
      if (noteData.ownerUserId !== user.uid) {
        throw new Error('Only the owner can share this note');
      }

      const sharesRef = collection(firestore, 'shares');
      const existingShares = await getDocs(
        query(sharesRef, 
          where('noteId', '==', noteId),
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
          noteId: noteId,
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

  // Create new note
  async createNote(note: Note): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      // Create in Firebase first
      const docRef = await addDoc(collection(firestore, 'notes'), {
        title: note.title,
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

      // Then add to local DB
      await this.notes.add({
        firebaseId: docRef.id,
        title: note.title,
        content: note.content || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerUserId: user.uid,
        ownerEmail: user.email || '',
        ownerDisplayName: user.displayName || 'Unknown',
        ownerPhotoURL: user.photoURL || undefined,
        tags: []
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  // Add new method for toggling pin
  async toggleNotePin(noteId: string, isPinned: boolean) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const noteRef = doc(firestore, 'notes', noteId);
      const noteDoc = await getDoc(noteRef);
      
      if (!noteDoc.exists()) {
        throw new Error('Note not found');
      }
      
      const noteData = noteDoc.data();
      if (noteData.ownerUserId !== user.uid) {
        throw new Error('Only the owner can pin/unpin notes');
      }

      await updateDoc(noteRef, {
        isPinned,
        updatedAt: new Date()
      });

      await this.loadFromFirebase();
    } catch (error) {
      console.error('Error toggling pin:', error);
      throw error;
    }
  }

  // Add calendar event methods
  async createCalendarEvent(event: CalendarEvent) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      // Save to Firebase
      const docRef = await addDoc(collection(firestore, 'calendarEvents'), {
        ...event,
        ownerUserId: user.uid,
        ownerEmail: user.email,
        createdAt: new Date()
      });

      // Save locally
      const localId = await this.calendarEvents.add({
        ...event,
        firebaseId: docRef.id
      });

      // Schedule notification
      await this.scheduleEventReminder(event);

      return docRef.id;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  private async scheduleEventReminder(event: CalendarEvent) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const reminderTime = new Date(event.startDate);
      reminderTime.setMinutes(reminderTime.getMinutes() - event.reminderMinutes);

      // Register notification trigger
      await navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(event.title, {
          body: `Reminder: ${event.title} starts in ${event.reminderMinutes} minutes`,
          icon: '/note-maskable.png',
          tag: `event-${event.id}`,
          timestamp: reminderTime.getTime(),
          data: {
            eventId: event.id,
            url: `/calendar/${event.id}`
          }
        });
      });
    }
  }

  async deleteCalendarEvent(id: number) {
    const event = await this.calendarEvents.get(id);
    if (!event) return;

    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      if (event.firebaseId) {
        await deleteDoc(doc(firestore, 'calendarEvents', event.firebaseId));
      }
      await this.calendarEvents.delete(id);
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  async shareCalendarEvent(eventId: number, shareWith: string[], permission: 'view' | 'edit' = 'view') {
    const event = await this.calendarEvents.get(eventId);
    const user = auth.currentUser;
    
    if (!event || !user) throw new Error('Event not found or user not authenticated');

    try {
      const shares = shareWith.map(email => ({
        email,
        permission,
        status: 'pending'
      }));

      // Update Firebase
      if (event.firebaseId) {
        await updateDoc(doc(firestore, 'calendarEvents', event.firebaseId), {
          sharedWith: [...(event.sharedWith || []), ...shares],
          lastModifiedBy: user.email,
          lastModifiedAt: new Date()
        });
      }

      // Update local DB
      await this.calendarEvents.update(eventId, {
        sharedWith: [...(event.sharedWith || []), ...shares],
        lastModifiedBy: user.email,
        lastModifiedAt: new Date()
      });

      // Send email notifications (you'll need to implement this on your backend)
      // For now, we'll just console.log
      console.log(`Sharing event with: ${shareWith.join(', ')}`);

    } catch (error) {
      console.error('Error sharing calendar event:', error);
      throw error;
    }
  }

  async updateEventShare(eventId: number, email: string, status: 'accepted' | 'declined') {
    const event = await this.calendarEvents.get(eventId);
    if (!event) throw new Error('Event not found');

    try {
      const updatedShares = event.sharedWith?.map(share => 
        share.email === email ? { ...share, status } : share
      );

      if (event.firebaseId) {
        await updateDoc(doc(firestore, 'calendarEvents', event.firebaseId), {
          sharedWith: updatedShares
        });
      }

      await this.calendarEvents.update(eventId, {
        sharedWith: updatedShares
      });
    } catch (error) {
      console.error('Error updating share status:', error);
      throw error;
    }
  }

  async getSharedEvents() {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      const eventsQuery = query(
        collection(firestore, 'calendarEvents'),
        where('sharedWith', 'array-contains', {
          email: user.email
        })
      );

      const snapshot = await getDocs(eventsQuery);
      const sharedEvents = snapshot.docs.map(doc => ({
        ...doc.data(),
        firebaseId: doc.id
      }));

      return sharedEvents;
    } catch (error) {
      console.error('Error fetching shared events:', error);
      throw error;
    }
  }

  async updateCalendarEvent(id: number, updates: Partial<CalendarEvent>) {
    const event = await this.calendarEvents.get(id);
    const user = auth.currentUser;
    
    if (!event || !user) throw new Error('Event not found or user not authenticated');

    try {
      const updatedEvent = {
        ...event,
        ...updates,
        lastModifiedBy: user.email,
        lastModifiedAt: new Date()
      };

      if (event.firebaseId) {
        await updateDoc(doc(firestore, 'calendarEvents', event.firebaseId), updatedEvent);
      }

      await this.calendarEvents.update(id, updatedEvent);
      
      // Update reminder if time changed
      if (updates.startDate || updates.reminderMinutes) {
        await this.scheduleEventReminder(updatedEvent);
      }
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }
}

export const db = new NotesDB();