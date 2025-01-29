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

export interface Tags {
  id: string;
  name: string;
  metadata: string;
  group: string;
  createdAt: Date;
  createdBy: string;
  color: string;
}

// Simplified interfaces without nesting
export interface Note {
  id?: number;
  firebaseId?: string;
  title: string;
  content: string;
  updatedAt: Date;
  createdAt: Date;
  tags?: Tags[];
  
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
  tags?: Tags[];
}

// Update CalendarEvent type to include sharing
export interface CalendarEventShare {
  email: string;
  permission: 'view' | 'edit';
  status: 'pending' | 'accepted' | 'declined';
  tags?: Tags[];
}

export interface CalendarEvent {
  firebaseId?: string;
  id: number;
  title: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  location?: string;
  allDay?: boolean;
  color?: string;
  reminderMinutes?: number;
  sharedWith?: CalendarEventShare[];
  createdBy: string; // user email
  createdByPhotoURL?: string;
  lastModifiedByDisplayName?: string;
  lastModifiedBy?: string;
  lastModifiedByPhotoURL?: string;
  lastModifiedAt?: Date;

  tags?: Tags[];
}

class NotesDB extends Dexie {
  notes: Dexie.Table<Note, number>;
  calendarEvents!: Dexie.Table<CalendarEvent, number>;
  tags: Dexie.Table<Tags, string>;

  constructor() {
    super('NotesDB');
    this.version(4).stores({
      notes: '++id, firebaseId, title, updatedAt',
      calendarEvents: '++id, firebaseId, startDate, endDate, ownerUserId',
      tags: '++id, name, group'
    });
    this.notes = this.table('notes');
    this.tags = this.table('tags');
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
  async createNote(note: Partial<Note>): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      const noteData = {
        ...note,
        ownerUserId: user.uid,
        ownerEmail: user.email,
        ownerDisplayName: user.displayName || '',
        ownerPhotoURL: user.photoURL || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: note.tags || []
      };

      const docRef = await addDoc(collection(firestore, 'notes'), noteData);
      await this.loadFromFirebase();
      return docRef.id;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  // Update note
  async updateNote(noteId: string, updates: Partial<Note>) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      const noteRef = doc(firestore, 'notes', noteId);
      const noteDoc = await getDoc(noteRef);
      
      if (!noteDoc.exists()) {
        throw new Error('Note not found');
      }

      const updateData = {
        ...updates,
        updatedAt: new Date(),
        lastEditedByUserId: user.uid,
        lastEditedByEmail: user.email,
        lastEditedByDisplayName: user.displayName || '',
        lastEditedByPhotoURL: user.photoURL || '',
        lastEditedAt: new Date(),
        tags: updates.tags || []
      };

      await updateDoc(noteRef, updateData);
      await this.loadFromFirebase();
    } catch (error) {
      console.error('Error updating note:', error);
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
  private generateUniqueId(): number {
    return Date.now() * 1000 + Math.floor(Math.random() * 1000);
  }

  async createCalendarEvent(event: Partial<CalendarEvent>) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      const eventData = {
        ...event,
        createdBy: user.email,
        lastModifiedBy: user.email,
        lastModifiedAt: new Date(),
        createdAt: new Date(),
        sharedWith: event.sharedWith?.map(share => ({
          ...share,
          status: 'pending'
        })) || []
      };

      // Save to Firebase
      const docRef = await addDoc(collection(firestore, 'calendarEvents'), eventData);

      // Save to local DB
      const localEvent = {
        ...eventData,
        id: this.generateUniqueId(),
        firebaseId: docRef.id
      };

      await this.calendarEvents.add(localEvent as CalendarEvent);

      return docRef.id;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  private async scheduleEventReminder(event: CalendarEvent) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const reminderTime = new Date(event.startDate);
      const reminderMinutes = event.reminderMinutes || 0; // Ensure reminderMinutes is defined
      reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes);

      // Register notification trigger
      await navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(event.title, {
          body: `Reminder: ${event.title} starts in ${event.reminderMinutes} minutes`,
          icon: '/note-maskable.png',
          tag: `event-${event.id}`,
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
  
      // Update local DB using modification callback
      await this.calendarEvents.update(eventId, obj => {
        obj.sharedWith = [...(obj.sharedWith || []), ...shares];
        obj.lastModifiedBy = user.email;
        obj.lastModifiedAt = new Date();
      });
  
      console.log(`Sharing event with: ${shareWith.join(', ')}`);
  
    } catch (error) {
      console.error('Error sharing calendar event:', error);
      throw error;
    }
  }

  async getSharedEvents(): Promise<CalendarEvent[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      const eventsRef = collection(firestore, 'calendarEvents');
      const snapshot = await getDocs(eventsRef);
      
      const sharedEvents: CalendarEvent[] = [];
      const syncPromises: Promise<void>[] = [];
      
      snapshot.docs.forEach(doc => {
        const eventData = doc.data();
        const sharedWith = eventData.sharedWith || [];
        
        // Check if current user is in sharedWith array
        const userShare = sharedWith.find(
          (share: CalendarEventShare) => share.email === user.email
        );

        if (userShare?.status === 'accepted') {
          // Sync the event to local DB
          syncPromises.push(this.syncSharedEvent(doc.id));
        } else if (userShare?.status === 'pending') {
          // Convert Firestore timestamp to Date for pending events
          const startDate = eventData.startDate?.toDate() || new Date();
          const endDate = eventData.endDate?.toDate() || new Date();
          const lastModifiedAt = eventData.lastModifiedAt?.toDate();

          sharedEvents.push({
            id: this.generateUniqueId(),
            firebaseId: doc.id,
            title: eventData.title || '',
            startDate,
            endDate,
            description: eventData.description,
            location: eventData.location,
            allDay: eventData.allDay || false,
            color: eventData.color,
            reminderMinutes: eventData.reminderMinutes,
            createdBy: eventData.createdBy,
            lastModifiedBy: eventData.lastModifiedBy,
            lastModifiedAt,
            sharedWith,
            tags: eventData.tags || []
          });
        }
      });

      // Wait for all sync operations to complete
      await Promise.all(syncPromises);

      return sharedEvents;
    } catch (error) {
      console.error('Error fetching shared events:', error);
      throw error;
    }
  }

  async updateEventShare(eventId: number | string, email: string, status: 'accepted' | 'declined') {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      // If it's a string, assume it's a Firebase ID
      let firebaseId = typeof eventId === 'string' ? eventId : null;
      let localEvent = null;

      // If it's a number, try to get the local event
      if (typeof eventId === 'number') {
        localEvent = await this.calendarEvents.get(eventId);
        if (localEvent?.firebaseId) {
          firebaseId = localEvent.firebaseId;
        }
      }

      // If we don't have a Firebase ID at this point, something's wrong
      if (!firebaseId) {
        throw new Error('Could not determine Firebase ID for event');
      }

      const eventRef = doc(firestore, 'calendarEvents', firebaseId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) throw new Error('Event not found in Firebase');
      
      const eventData = eventDoc.data();
      const updatedShares = (eventData.sharedWith || []).map((share: CalendarEventShare) => {
        if (share.email === email) {
          return { ...share, status };
        }
        return share;
      });

      // Update in Firebase
      await updateDoc(eventRef, {
        sharedWith: updatedShares,
        lastModifiedAt: new Date(),
        lastModifiedBy: user.email
      });

      // If accepted, add to local DB
      if (status === 'accepted' && !localEvent) {
        const startDate = eventData.startDate?.toDate() || new Date();
        const endDate = eventData.endDate?.toDate() || new Date();
        const lastModifiedAt = eventData.lastModifiedAt?.toDate();

        await this.calendarEvents.add({
          id: this.generateUniqueId(),
          firebaseId,
          title: eventData.title || '',
          startDate,
          endDate,
          description: eventData.description,
          location: eventData.location,
          allDay: eventData.allDay || false,
          color: eventData.color,
          reminderMinutes: eventData.reminderMinutes,
          createdBy: eventData.createdBy,
          lastModifiedBy: eventData.lastModifiedBy,
          lastModifiedAt,
          sharedWith: updatedShares,
          tags: eventData.tags || []
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating event share:', error);
      throw error;
    }
  }

  async updateCalendarEvent(id: number, updates: Partial<CalendarEvent>) {
    const event = await this.calendarEvents.get(id);
    const user = auth.currentUser;
    
    if (!event || !user) throw new Error('Event not found or user not authenticated');

    try {
      // Preserve existing shares and their status
      const updatedEvent = {
        ...event,
        ...updates,
        // Keep the existing sharedWith array if not explicitly updated
        sharedWith: updates.sharedWith || event.sharedWith,
        lastModifiedBy: user.email,
        lastModifiedAt: new Date()
      };

      if (event.firebaseId) {
        // Get current Firebase data to preserve share statuses
        const eventRef = doc(firestore, 'calendarEvents', event.firebaseId);
        const eventDoc = await getDoc(eventRef);
        
        if (eventDoc.exists()) {
          const firebaseData = eventDoc.data();
          // Merge existing shares with any new shares, preserving status
          const existingShares = firebaseData.sharedWith || [];
          const newShares = updates.sharedWith || [];
          
          // Create a map of existing shares by email
          const shareMap = new Map(
            existingShares.map((share: CalendarEventShare) => [share.email, share])
          );
          
          // Update or add new shares while preserving existing status
          newShares.forEach((share: CalendarEventShare) => {
            const existingShare : CalendarEventShare = shareMap.get(share.email) as CalendarEventShare;
            if (existingShare) {
              // Preserve the existing status
              shareMap.set(share.email, { ...share, status: existingShare.status } as CalendarEventShare);
            } else {
              // New share gets 'pending' status
              shareMap.set(share.email, { ...share, status: 'pending' } as CalendarEventShare);
            }
          });

          // Update the event with merged shares
          updatedEvent.sharedWith = Array.from(shareMap.values()) as CalendarEventShare[];
        }

        await updateDoc(eventRef, updatedEvent);
      }

      await this.calendarEvents.update(id, updatedEvent as CalendarEvent);
      
      // Update reminder if time changed
      if (updates.startDate || updates.reminderMinutes) {
        await this.scheduleEventReminder(updatedEvent as CalendarEvent);
      }

      return updatedEvent;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  // Add tag methods
  async createTag(tag: Partial<Tags>): Promise<Tags> {
    console.log('Creating tag with data:', tag); // Debug log
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      // Prepare tag data with all required fields
      const tagData = {
        name: tag.name || '',
        color: tag.color || '#3b82f6',
        group: tag.group || 'default',
        metadata: tag.metadata || '',
        createdAt: new Date(),
        createdBy: user.email || ''
      };

      // Save to Firebase
      const docRef = await addDoc(collection(firestore, 'tags'), tagData);

      // Create complete tag object
      const newTag: Tags = {
        ...tagData,
        id: docRef.id,
      };

      
      // Save locally - Fix potential issue with table not being ready
      if (this.tags) {
        await this.tags.add(newTag);
      } else {
        console.error('Tags table not initialized');
      }

      return newTag;
    } catch (error) {
      console.error('Detailed error in createTag:', error);
      throw error;
    }
  }

  async getTags(): Promise<Tags[]> {
    try {
      const snapshot = await getDocs(collection(firestore, 'tags'));
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Tags[];
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }

  // Add methods for handling note tags
  async updateNoteTags(noteId: string, tags: Tags[]) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      // Update in Firebase
      await updateDoc(doc(firestore, 'notes', noteId), {
        tags: tags,
        lastModifiedBy: user.email,
        lastModifiedAt: new Date()
      });
      const noteIdNumber = parseInt(noteId, 10);

      // Update locally
      await this.notes.update(noteIdNumber, { tags });
    } catch (error) {
      console.error('Error updating note tags:', error);
      throw error;
    }
  }

  // Add method to get notes by tag
  async getNotesByTag(tagId: string): Promise<Note[]> {
    try {
      const snapshot = await getDocs(
        query(collection(firestore, 'notes'), where('tags', 'array-contains', tagId))
      );
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as unknown as Note[];
    } catch (error) {
      console.error('Error fetching notes by tag:', error);
      throw error;
    }
  }

  // Add this new method
  private async syncSharedEvent(firebaseId: string) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const eventRef = doc(firestore, 'calendarEvents', firebaseId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) return;
      
      const eventData = eventDoc.data();
      const userShare = eventData.sharedWith?.find(
        (share: CalendarEventShare) => share.email === user.email
      );

      // Only sync if user has accepted the share
      if (userShare?.status === 'accepted') {
        // Convert timestamps to dates
        const startDate = eventData.startDate?.toDate() || new Date();
        const endDate = eventData.endDate?.toDate() || new Date();
        const lastModifiedAt = eventData.lastModifiedAt?.toDate();

        // Find existing local event
        const existingEvent = await this.calendarEvents
          .where('firebaseId')
          .equals(firebaseId)
          .first();

        const updatedEvent = {
          id: existingEvent?.id || Date.now(),
          firebaseId,
          title: eventData.title || '',
          startDate,
          endDate,
          description: eventData.description,
          location: eventData.location,
          allDay: eventData.allDay || false,
          color: eventData.color,
          reminderMinutes: eventData.reminderMinutes,
          createdBy: eventData.createdBy,
          lastModifiedBy: eventData.lastModifiedBy,
          lastModifiedAt,
          sharedWith: eventData.sharedWith || [],
          tags: eventData.tags || []
        };

        if (existingEvent) {
          await this.calendarEvents.update(existingEvent.id, updatedEvent);
        } else {
          await this.calendarEvents.add(updatedEvent);
        }
      }
    } catch (error) {
      console.error('Error syncing shared event:', error);
    }
  }
}

export const db = new NotesDB();