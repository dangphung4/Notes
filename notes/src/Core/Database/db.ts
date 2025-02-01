/* eslint-disable @typescript-eslint/no-unused-vars */
import Dexie from "dexie";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  documentId,
} from "firebase/firestore";
import { auth, db as firestore } from "../Auth/firebase";

export interface User {
  userId: string;
  email: string;
  displayName: string;
  photoURL: string;
  lastLoginAt: Date;
  preferences?: {
    editorFont?: string;
    theme?: string;        // for storing theme name (default, forest, ocean)
    colorMode?: string;    // for storing light/dark preference
  };
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

export interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  ownerUserId: string;
  ownerEmail: string;
  ownerDisplayName: string;
  ownerPhotoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  isShared?: boolean;
}

export interface Note {
  id?: number;
  firebaseId?: string;
  title: string;
  content: string;
  updatedAt: Date;
  createdAt: Date;
  tags?: Tags[];
  folderId?: string;

  ownerUserId: string;
  ownerEmail: string;
  ownerDisplayName: string;
  ownerPhotoURL?: string;

  lastEditedByUserId?: string;
  lastEditedByEmail?: string;
  lastEditedByDisplayName?: string;
  lastEditedByPhotoURL?: string;
  lastEditedAt?: Date;

  isPinned?: boolean;
  isArchived?: boolean;
}

export interface SharePermission {
  id: string | null | undefined;
  noteId: string;
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  access: "view" | "edit";
  createdAt: Date;
  updatedAt?: Date;
  tags?: Tags[];
}

export interface CalendarEventShare {
  email: string;
  permission: "view" | "edit";
  status: "pending" | "accepted" | "declined";
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

// Add to your existing interface for user preferences
interface UserPreferences {
  editorFont?: string;
  theme?: string;        // for storing theme name (default, forest, ocean)
  colorMode?: string;    // for storing light/dark preference
}

/**
 *
 */
class NotesDB extends Dexie {
  notes: Dexie.Table<Note, number>;
  calendarEvents!: Dexie.Table<CalendarEvent, number>;
  tags: Dexie.Table<Tags, string>;
  users?: Dexie.Table<User, string>;
  folders: Dexie.Table<Folder, string>;

  /**
   *
   */
  constructor() {
    super("NotesDB");
    this.version(5).stores({
      notes: "++id, firebaseId, title, updatedAt, folderId",
      calendarEvents: "++id, firebaseId, startDate, endDate, ownerUserId",
      tags: "++id, name, group",
      users: "++userId, email, displayName, photoURL, lastLoginAt, preferences",
      folders: "++id, name, parentId, ownerUserId"
    });
    this.notes = this.table("notes");
    this.tags = this.table("tags");
    this.users = this.table("users");
    this.folders = this.table("folders");
  }

  // Load notes from Firebase
  /**
   *
   */
  async loadFromFirebase() {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const notesRef = collection(firestore, "notes");
      const sharesRef = collection(firestore, "shares");

      // Get all notes I own
      const ownedSnapshot = await getDocs(
        query(notesRef, where("ownerUserId", "==", user.uid))
      );

      // Get all shares for me by email
      const mySharesSnapshot = await getDocs(
        query(sharesRef, where("email", "==", user.email))
      );

      // Get all shared notes
      const sharedNoteIds = mySharesSnapshot.docs.map(
        (doc) => doc.data().noteId
      );
      const sharedNotesSnapshot =
        sharedNoteIds.length > 0
          ? await getDocs(
              query(notesRef, where(documentId(), "in", sharedNoteIds))
            )
          : { docs: [] };

      // Load folders
      const foldersRef = collection(firestore, "folders");
      const foldersQuery = query(
        foldersRef,
        where("ownerUserId", "==", user.uid)
      );
      const foldersSnapshot = await getDocs(foldersQuery);
      
      // Clear existing notes
      await this.notes.clear();

      // Add owned notes
      for (const doc of ownedSnapshot.docs) {
        const data = doc.data();
        await this.notes.add({
          firebaseId: doc.id,
          title: data.title || "Untitled",
          content: data.content || "",
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),

          ownerUserId: data.ownerUserId || "",
          ownerEmail: data.ownerEmail || "",
          ownerDisplayName: data.ownerDisplayName || "Unknown",
          ownerPhotoURL: data.ownerPhotoURL,

          lastEditedByUserId: data.lastEditedByUserId,
          lastEditedByEmail: data.lastEditedByEmail,
          lastEditedByDisplayName: data.lastEditedByDisplayName,
          lastEditedByPhotoURL: data.lastEditedByPhotoURL,
          lastEditedAt: data.lastEditedAt?.toDate(),

          tags: data.tags || [],
          isPinned: data.isPinned || false,
          isArchived: data.isArchived || false,
          folderId: data.folderId || null,
        });
      }

      // Add shared notes
      for (const doc of sharedNotesSnapshot.docs) {
        const data = doc.data();
        const share = mySharesSnapshot.docs
          .find((s) => s.data().noteId === doc.id)
          ?.data();

        if (share) {
          await this.notes.add({
            firebaseId: doc.id,
            title: data.title || "Untitled",
            content: data.content || "",
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),

            ownerUserId: data.ownerUserId || "",
            ownerEmail: data.ownerEmail || "",
            ownerDisplayName: data.ownerDisplayName || "Unknown",
            ownerPhotoURL: data.ownerPhotoURL,

            lastEditedByUserId: data.lastEditedByUserId,
            lastEditedByEmail: data.lastEditedByEmail,
            lastEditedByDisplayName: data.lastEditedByDisplayName,
            lastEditedByPhotoURL: data.lastEditedByPhotoURL,
            lastEditedAt: data.lastEditedAt?.toDate(),

            tags: data.tags || [],
            isPinned: data.isPinned || false,
            isArchived: data.isArchived || false,
            folderId: data.folderId || null,
          });
        }
      }

      // Load folders
      await this.folders.clear();

      // Add folders
      for (const doc of foldersSnapshot.docs) {
        const data = doc.data();
        await this.folders.add({
          id: doc.id,
          name: data.name,
          description: data.description,
          color: data.color,
          icon: data.icon,
          parentId: data.parentId,
          ownerUserId: data.ownerUserId,
          ownerEmail: data.ownerEmail,
          ownerDisplayName: data.ownerDisplayName,
          ownerPhotoURL: data.ownerPhotoURL,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          isShared: data.isShared || false,
        });
      }
    } catch (error) {
      console.error("Error loading from Firebase:", error);
      throw error;
    }
  }

  // Sync note with Firebase
  /**
   *
   * @param note
   */
  async syncNote(note: Note) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // new notes, set current user as owner
      if (!note.ownerUserId) {
        note.ownerUserId = user.uid;
        note.ownerEmail = user.email || "";
        note.ownerDisplayName = user.displayName || "Unknown";
        note.ownerPhotoURL = user.photoURL || undefined;
      }

      const isOwner = note.ownerUserId === user.uid;

      // Check for edit access in shares collection
      const sharesRef = collection(firestore, "shares");
      const shareQuery = query(
        sharesRef,
        where("noteId", "==", note.firebaseId),
        where("email", "==", user.email),
        where("access", "==", "edit")
      );
      const shareSnapshot = await getDocs(shareQuery);
      const hasEditAccess = !shareSnapshot.empty;

      if (!isOwner && !hasEditAccess) {
        throw new Error("No permission to edit this note");
      }

      // Only include isPinned in the update if the user is the owner
      const noteData = {
        title: note.title,
        content: note.content || "",
        updatedAt: new Date(),
        lastEditedByUserId: user.uid,
        lastEditedByEmail: user.email,
        lastEditedByDisplayName: user.displayName || "Unknown",
        lastEditedByPhotoURL: user.photoURL,
        lastEditedAt: new Date(),
        // Only include isPinned if user is the owner
        ...(note.ownerUserId === user.uid && typeof note.isPinned === 'boolean' && { isPinned: note.isPinned })
      };

      // Remove any undefined or null values
      const cleanedNoteData = Object.fromEntries(
        Object.entries(noteData).filter(([_, value]) => value !== undefined && value !== null)
      );

      if (note.firebaseId) {
        await updateDoc(doc(firestore, "notes", note.firebaseId), cleanedNoteData);
      } else {
        const newNoteData = {
          ...cleanedNoteData,
          createdAt: new Date(),
          ownerUserId: user.uid,
          ownerEmail: user.email,
          ownerDisplayName: user.displayName || "Unknown",
          ownerPhotoURL: user.photoURL,
          tags: [],
          isPinned: false,
          isArchived: false,
          folderId: null,
        };
        const docRef = await addDoc(collection(firestore, "notes"), newNoteData);
        await this.notes.update(note.id!, { firebaseId: docRef.id });
      }

      await this.loadFromFirebase();
    } catch (error) {
      console.error("Error syncing with Firebase:", error);
      throw error;
    }
  }

  // Share note with another user
  /**
   *
   * @param noteId
   * @param recipientEmail
   * @param access
   */
  async shareNote(
    noteId: string,
    recipientEmail: string,
    access: "view" | "edit" = "view"
  ) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Get note from Firebase to check permissions
      const noteRef = doc(firestore, "notes", noteId);
      const noteDoc = await getDoc(noteRef);

      if (!noteDoc.exists()) {
        throw new Error("Note not found");
      }

      const noteData = noteDoc.data();
      
      // Check if user is owner or has edit permissions
      const sharesRef = collection(firestore, "shares");
      const userShareQuery = query(
        sharesRef,
        where("noteId", "==", noteId),
        where("email", "==", user.email),
        where("access", "==", "edit")
      );
      const userShareSnapshot = await getDocs(userShareQuery);
      
      const isOwner = noteData.ownerUserId === user.uid;
      const hasEditAccess = !userShareSnapshot.empty;

      if (!isOwner && !hasEditAccess) {
        throw new Error("You don't have permission to share this note");
      }

      // Check if recipient already has access
      const existingShares = await getDocs(
        query(
          sharesRef,
          where("noteId", "==", noteId),
          where("email", "==", recipientEmail)
        )
      );

      if (!existingShares.empty) {
        const shareDoc = existingShares.docs[0];
        await updateDoc(doc(sharesRef, shareDoc.id), {
          access,
          updatedAt: new Date(),
        });
      } else {
        await addDoc(sharesRef, {
          noteId: noteId,
          userId: recipientEmail, // will be replaced later when user look up is added
          email: recipientEmail,
          displayName: recipientEmail.split("@")[0], // will be replaced later when user look up is added
          access,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await this.loadFromFirebase();
    } catch (error) {
      console.error("Error sharing note:", error);
      throw error;
    }
  }

  // Delete note
  /**
   *
   * @param firebaseId
   */
  async deleteNote(firebaseId: string) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Get note to check ownership
      const noteRef = doc(firestore, "notes", firebaseId);
      const noteDoc = await getDoc(noteRef);

      if (!noteDoc.exists()) return;

      const noteData = noteDoc.data();
      if (noteData.ownerUserId !== user.uid) {
        throw new Error("Only the owner can delete this note");
      }

      // Delete all shares first
      const sharesRef = collection(firestore, "shares");
      const shares = await getDocs(
        query(sharesRef, where("noteId", "==", firebaseId))
      );

      const deletePromises = shares.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Then delete the note
      await deleteDoc(noteRef);
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  }

  // Create new note
  /**
   *
   * @param note
   */
  async createNote(note: Partial<Note>): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
      const noteData = {
        ...note,
        ownerUserId: user.uid,
        ownerEmail: user.email,
        ownerDisplayName: user.displayName || "",
        ownerPhotoURL: user.photoURL || "",
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: note.tags || [],
        folderId: note.folderId || null,
      };

      const docRef = await addDoc(collection(firestore, "notes"), noteData);
      await this.loadFromFirebase();
      return docRef.id;
    } catch (error) {
      console.error("Error creating note:", error);
      throw error;
    }
  }

  // Update note
  /**
   *
   * @param noteId
   * @param updates
   */
  async updateNote(noteId: string, updates: Partial<Note>) {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
      const noteRef = doc(firestore, "notes", noteId);
      const noteDoc = await getDoc(noteRef);

      if (!noteDoc.exists()) {
        throw new Error("Note not found");
      }

      const updateData = {
        ...updates,
        updatedAt: new Date(),
        lastEditedByUserId: user.uid,
        lastEditedByEmail: user.email,
        lastEditedByDisplayName: user.displayName || "",
        lastEditedByPhotoURL: user.photoURL || "",
        lastEditedAt: new Date(),
        tags: updates.tags || [],
        folderId: updates.folderId !== undefined ? updates.folderId : noteDoc.data().folderId,
      };

      await updateDoc(noteRef, updateData);
      await this.loadFromFirebase();
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  }

  // Add new method for toggling pin
  /**
   *
   * @param noteId
   * @param isPinned
   */
  async toggleNotePin(noteId: string, isPinned: boolean) {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
      const noteRef = doc(firestore, "notes", noteId);
      const noteDoc = await getDoc(noteRef);

      if (!noteDoc.exists()) {
        throw new Error("Note not found");
      }

      const noteData = noteDoc.data();
      
      // Strict ownership check
      if (noteData.ownerUserId !== user.uid) {
        throw new Error("Only the owner can pin/unpin notes");
      }

      await updateDoc(noteRef, {
        isPinned,
        updatedAt: new Date(),
        lastEditedByUserId: user.uid,
        lastEditedByEmail: user.email,
        lastEditedByDisplayName: user.displayName || "",
        lastEditedByPhotoURL: user.photoURL || "",
        lastEditedAt: new Date(),
      });

      await this.loadFromFirebase();
    } catch (error) {
      console.error("Error toggling pin:", error);
      throw error;
    }
  }

  // Add calendar event methods
  /**
   *
   */
  private generateUniqueId(): number {
    return Date.now() * 1000 + Math.floor(Math.random() * 1000);
  }

  /**
   *
   * @param event
   */
  async createCalendarEvent(
    event: Partial<CalendarEvent>
  ): Promise<CalendarEvent> {
    console.log("Creating event:", event); // Add debug logging
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
      // Create the event in Firebase first
      const eventData = {
        ...event,
        createdBy: user.email || "",
        createdByPhotoURL: user.photoURL || "",
        lastModifiedBy: user.email || "",
        lastModifiedByPhotoURL: user.photoURL || "",
        lastModifiedByDisplayName: user.displayName || "",
        lastModifiedAt: new Date(),
        // Ensure dates are properly set
        startDate: event.startDate || new Date(),
        endDate: event.endDate || new Date(),
        // Initialize empty arrays if not provided
        sharedWith: event.sharedWith || [],
        tags: event.tags || [],
      };

      console.log("Creating event in Firestore:", eventData); // Add debug logging
      const docRef = await addDoc(
        collection(firestore, "calendarEvents"),
        eventData
      );

      // add Firebase ID to the event
      const newEvent = {
        ...eventData,
        id: Date.now(), // local id for nw
        firebaseId: docRef.id,
      } as CalendarEvent;

      await this.calendarEvents.add(newEvent);

      return newEvent;
    } catch (error) {
      console.error("Detailed error in createCalendarEvent:", error);
      throw error;
    }
  }

  /**
   * TODO: NEEDS FIXING
   * @param event
   */
  private async scheduleEventReminder(event: CalendarEvent) {
    if ("Notification" in window && Notification.permission === "granted") {
      const reminderTime = new Date(event.startDate);
      const reminderMinutes = event.reminderMinutes || 0;
      reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes);

      await navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(event.title, {
          body: `Reminder: ${event.title} starts in ${event.reminderMinutes} minutes`,
          icon: "/note-maskable.png",
          tag: `event-${event.id}`,
          data: {
            eventId: event.id,
            url: `/calendar/${event.id}`,
          },
        });
      });
    }
  }

  /**
   *
   * @param id
   */
  async deleteCalendarEvent(id: number) {
    const event = await this.calendarEvents.get(id);
    if (!event) return;

    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
      if (event.firebaseId) {
        await deleteDoc(doc(firestore, "calendarEvents", event.firebaseId));
      }
      await this.calendarEvents.delete(id);
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      throw error;
    }
  }

  /**
   *
   * @param eventId
   * @param shareWith
   * @param permission
   */
  async shareCalendarEvent(
    eventId: number,
    shareWith: string[],
    permission: "view" | "edit" = "view"
  ) {
    const event = await this.calendarEvents.get(eventId);
    const user = auth.currentUser;

    if (!event || !user)
      throw new Error("Event not found or user not authenticated");

    try {
      const shares = shareWith.map((email) => ({
        email,
        permission,
        status: "pending" as const,
      }));

      if (event.firebaseId) {
        await updateDoc(doc(firestore, "calendarEvents", event.firebaseId), {
          sharedWith: [...(event.sharedWith || []), ...shares],
          lastModifiedBy: user.email,
          lastModifiedAt: new Date(),
        });
      }

      await this.calendarEvents.update(eventId, (obj) => {
        obj.sharedWith = [...(obj.sharedWith || []), ...shares];
        obj.lastModifiedBy = user.email || "";
        obj.lastModifiedAt = new Date();
      });

      console.log(`Sharing event with: ${shareWith.join(", ")}`);
    } catch (error) {
      console.error("Error sharing calendar event:", error);
      throw error;
    }
  }

  /**
   *
   */
  async getSharedEvents(): Promise<CalendarEvent[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
      const eventsRef = collection(firestore, "calendarEvents");
      const snapshot = await getDocs(eventsRef);

      const sharedEvents: CalendarEvent[] = [];
      const syncPromises: Promise<void>[] = [];

      snapshot.docs.forEach((doc) => {
        const eventData = doc.data();
        const sharedWith = eventData.sharedWith || [];

        // Check if current user is in sharedWith array
        const userShare = sharedWith.find(
          (share: CalendarEventShare) => share.email === user.email
        );

        if (userShare?.status === "accepted") {
          syncPromises.push(this.syncSharedEvent(doc.id));
        } else if (userShare?.status === "pending") {
          const startDate = eventData.startDate?.toDate() || new Date();
          const endDate = eventData.endDate?.toDate() || new Date();
          const lastModifiedAt = eventData.lastModifiedAt?.toDate();

          sharedEvents.push({
            id: this.generateUniqueId(),
            firebaseId: doc.id,
            title: eventData.title || "",
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
            tags: eventData.tags || [],
          });
        }
      });

      await Promise.all(syncPromises);

      return sharedEvents;
    } catch (error) {
      console.error("Error fetching shared events:", error);
      throw error;
    }
  }

  /**
   *
   * @param eventId
   * @param email
   * @param status
   */
  async updateEventShare(
    eventId: number | string,
    email: string,
    status: "accepted" | "declined"
  ) {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
      // Add console log to track execution
      console.log("Processing event share update:", { eventId, email, status });

      // If it's a string, assume it's a Firebase ID
      let firebaseId = typeof eventId === "string" ? eventId : null;
      let localEvent = null;

      // If it's a number, try to get the local event
      if (typeof eventId === "number") {
        localEvent = await this.calendarEvents.get(eventId);
        if (localEvent?.firebaseId) {
          firebaseId = localEvent.firebaseId;
        }
      }

      if (!firebaseId) {
        throw new Error("Could not determine Firebase ID for event");
      }

      const eventRef = doc(firestore, "calendarEvents", firebaseId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) throw new Error("Event not found in Firebase");

      const eventData = eventDoc.data();
      const currentShare = eventData.sharedWith?.find(
        (share: CalendarEventShare) => share.email === email
      );

      if (currentShare?.status === status) {
        console.log("Share status already set to:", status);
        return true;
      }

      const updatedShares = (eventData.sharedWith || []).map(
        (share: CalendarEventShare) => {
          if (share.email === email) {
            return { ...share, status };
          }
          return share;
        }
      );

      await updateDoc(eventRef, {
        sharedWith: updatedShares,
        lastModifiedAt: new Date(),
        lastModifiedBy: user.email,
      });

      if (status === "accepted") {
        const existingLocalEvent = await this.calendarEvents
          .where("firebaseId")
          .equals(firebaseId)
          .first();

        if (!existingLocalEvent) {
          const startDate = eventData.startDate?.toDate() || new Date();
          const endDate = eventData.endDate?.toDate() || new Date();
          const lastModifiedAt = eventData.lastModifiedAt?.toDate();

          // add to local DB
          await this.calendarEvents.add({
            id: this.generateUniqueId(),
            firebaseId,
            title: eventData.title || "",
            startDate,
            endDate,
            description: eventData.description,
            location: eventData.location,
            allDay: eventData.allDay || false,
            color: eventData.color,
            reminderMinutes: eventData.reminderMinutes,
            createdBy: eventData.createdBy,
            createdByPhotoURL: eventData.createdByPhotoURL,
            lastModifiedBy: eventData.lastModifiedBy,
            lastModifiedByDisplayName: eventData.lastModifiedByDisplayName,
            lastModifiedByPhotoURL: eventData.lastModifiedByPhotoURL,
            lastModifiedAt,
            sharedWith: updatedShares,
            tags: eventData.tags || [],
          });
        } else {
          // update existing local event
          await this.calendarEvents.update(existingLocalEvent.id, (obj) => {
            Object.assign(obj, {
              ...eventData,
              id: existingLocalEvent.id,
              sharedWith: updatedShares,
            });
          });
        }
      } else if (status === "declined" && localEvent) {
        // remove from local DB if declined
        await this.calendarEvents.delete(localEvent.id);
      }

      return true;
    } catch (error) {
      console.error("Error updating event share:", error);
      throw error;
    }
  }

  /**
   *
   * @param id
   * @param updates
   */
  async updateCalendarEvent(id: number, updates: Partial<CalendarEvent>) {
    console.log("Updating event:", { id, updates });
    const event = await this.calendarEvents.get(id);
    const user = auth.currentUser;

    if (!event || !user) {
      console.error("Event not found or user not authenticated:", {
        event,
        user,
      });
      throw new Error("Event not found or user not authenticated");
    }

    try {
      const updatedEvent: CalendarEvent = {
        ...event,
        ...updates,
        id: event.id,
        title: updates.title || event.title,
        startDate: updates.startDate || event.startDate,
        createdBy: event.createdBy,
        sharedWith: updates.sharedWith || event.sharedWith || [],
        lastModifiedBy: user.email || "",
        lastModifiedByDisplayName: user.displayName || "",
        lastModifiedByPhotoURL: user.photoURL || "",
        lastModifiedAt: new Date(),
      };

      if (event.firebaseId) {
        const eventRef = doc(firestore, "calendarEvents", event.firebaseId);
        const eventDoc = await getDoc(eventRef);

        if (eventDoc.exists()) {
          const firebaseData = eventDoc.data();
          const existingShares = firebaseData.sharedWith || [];
          const newShares = updates.sharedWith || existingShares;

          const shareMap = new Map();
          existingShares.forEach((share: CalendarEventShare) => {
            shareMap.set(share.email, share);
          });

          const mergedShares = newShares.map((share: CalendarEventShare) => {
            const existingShare = shareMap.get(share.email);
            if (existingShare) {
              return { ...share, status: existingShare.status };
            }
            return { ...share, status: "pending" };
          });

          updatedEvent.sharedWith = mergedShares;

          // properly remove the id field for firestore
          const { id: _, ...firestoreData } = updatedEvent;
          console.log("Updating Firestore with:", firestoreData);
          await updateDoc(eventRef, firestoreData);

          // update local copies for all users who have accepted the share
          const acceptedShares = mergedShares.filter(
            (share: { status: string }) => share.status === "accepted"
          );
          for (const _share of acceptedShares) {
            const sharedEventRef = await this.calendarEvents
              .where("firebaseId")
              .equals(event.firebaseId)
              .first();

            if (sharedEventRef) {
              await this.calendarEvents.update(sharedEventRef.id, (obj) => {
                Object.assign(obj, {
                  ...updatedEvent,
                  id: sharedEventRef.id,
                  sharedWith: mergedShares,
                });
              });
            }
          }
        }
      }

      // update locally
      await this.calendarEvents.update(id, (obj) => {
        Object.assign(obj, updatedEvent);
      });

      if (updates.startDate || updates.reminderMinutes) {
        await this.scheduleEventReminder(updatedEvent);
      }

      await this.loadFromFirebase();

      return updatedEvent;
    } catch (error) {
      console.error("Detailed error in updateCalendarEvent:", error);
      throw error;
    }
  }

  // Add tag methods
  /**
   *
   * @param tag
   */
  async createTag(tag: Partial<Tags>): Promise<Tags> {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
      const tagData = {
        name: tag.name || "",
        color: tag.color || "#3b82f6",
        group: tag.group || "default",
        metadata: tag.metadata || "",
        createdAt: new Date(),
        createdBy: user.email || "",
      };

      const docRef = await addDoc(collection(firestore, "tags"), tagData);

      const newTag: Tags = {
        ...tagData,
        id: docRef.id,
      };

      // save locally - NEED fix potential issue with table not being ready
      if (this.tags) {
        await this.tags.add(newTag);
      } else {
        console.error("Tags table not initialized");
      }

      return newTag;
    } catch (error) {
      console.error("Detailed error in createTag:", error);
      throw error;
    }
  }

  /**
   *
   */
  async getTags(): Promise<Tags[]> {
    try {
      const snapshot = await getDocs(collection(firestore, "tags"));
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Tags[];
    } catch (error) {
      console.error("Error fetching tags:", error);
      throw error;
    }
  }

  // Add methods for handling note tags
  /**
   *
   * @param noteId
   * @param tags
   */
  async updateNoteTags(noteId: string, tags: Tags[]) {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
      // Get the note to check permissions
      const noteRef = doc(firestore, "notes", noteId);
      const noteDoc = await getDoc(noteRef);
      
      if (!noteDoc.exists()) {
        throw new Error("Note not found");
      }

      const noteData = noteDoc.data();
      const isOwner = noteData.ownerUserId === user.uid;

      // Check for edit permissions in shares collection if not owner
      if (!isOwner) {
        const sharesRef = collection(firestore, "shares");
        const shareQuery = query(
          sharesRef,
          where("noteId", "==", noteId),
          where("email", "==", user.email),
          where("access", "==", "edit")
        );
        const shareSnapshot = await getDocs(shareQuery);
        
        if (shareSnapshot.empty) {
          throw new Error("No permission to edit tags on this note");
        }
      }

      // Update tags in Firebase
      await updateDoc(noteRef, {
        tags: tags,
        lastModifiedBy: user.email,
        lastModifiedAt: new Date(),
        lastEditedByUserId: user.uid,
        lastEditedByEmail: user.email,
        lastEditedByDisplayName: user.displayName || "",
        lastEditedByPhotoURL: user.photoURL || "",
        lastEditedAt: new Date(),
      });

      // Update locally if using IndexedDB
      const noteIdNumber = parseInt(noteId, 10);
      if (!isNaN(noteIdNumber)) {
        await this.notes.update(noteIdNumber, { tags });
      }

    } catch (error) {
      console.error("Error updating note tags:", error);
      throw error;
    }
  }

  // Add method to get notes by tag
  /**
   *
   * @param tagId
   */
  async getNotesByTag(tagId: string): Promise<Note[]> {
    try {
      const snapshot = await getDocs(
        query(
          collection(firestore, "notes"),
          where("tags", "array-contains", tagId)
        )
      );
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as unknown as Note[];
    } catch (error) {
      console.error("Error fetching notes by tag:", error);
      throw error;
    }
  }

  /**
   *
   * @param firebaseId
   */
  private async syncSharedEvent(firebaseId: string) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const eventRef = doc(firestore, "calendarEvents", firebaseId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) return;

      const eventData = eventDoc.data();
      const userShare = eventData.sharedWith?.find(
        (share: CalendarEventShare) => share.email === user.email
      );

      // only sync if user has accepted the share
      if (userShare?.status === "accepted") {
        // convert timestamps to dates
        const startDate = eventData.startDate?.toDate() || new Date();
        const endDate = eventData.endDate?.toDate() || new Date();
        const lastModifiedAt = eventData.lastModifiedAt?.toDate();

        const existingEvent = await this.calendarEvents
          .where("firebaseId")
          .equals(firebaseId)
          .first();

        const updatedEvent = {
          id: existingEvent?.id || Date.now(),
          firebaseId,
          title: eventData.title || "",
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
          tags: eventData.tags || [],
        };

        if (existingEvent) {
          await this.calendarEvents.update(existingEvent.id, updatedEvent);
        } else {
          await this.calendarEvents.add(updatedEvent);
        }
      }
    } catch (error) {
      console.error("Error syncing shared event:", error);
    }
  }

  /**
   * Updates user preferences in both Firestore and IndexedDB
   * @param userId
   * @param preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>) {
    try {
      // Update Firestore
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        preferences: preferences,
        updatedAt: new Date()
      });

      // Update local IndexedDB
      await this.users?.update(userId, (user: User) => {
        user.preferences = {
          ...user.preferences,
          ...preferences
        };
      });

      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  // Find the syncNoteWithFirebase method and update it to filter out undefined values
  /**
   *
   * @param note
   */
  async syncNoteWithFirebase(note: Note) {
    if (!auth.currentUser) return;

    try {
      const noteData = {
        title: note.title,
        content: note.content,
        updatedAt: note.updatedAt,
        createdAt: note.createdAt,
        ownerUserId: note.ownerUserId,
        ownerEmail: note.ownerEmail,
        ownerDisplayName: note.ownerDisplayName,
        ownerPhotoURL: note.ownerPhotoURL,
        lastEditedByUserId: note.lastEditedByUserId,
        lastEditedByEmail: note.lastEditedByEmail,
        lastEditedByDisplayName: note.lastEditedByDisplayName,
        lastEditedByPhotoURL: note.lastEditedByPhotoURL,
        lastEditedAt: note.lastEditedAt,
        tags: note.tags || [],
        // Only include these fields if they are explicitly set to true or false
        ...(typeof note.isPinned === 'boolean' && { isPinned: note.isPinned }),
        ...(typeof note.isArchived === 'boolean' && { isArchived: note.isArchived }),
        folderId: note.folderId || null,
      };

      // Remove any undefined or null values
      const cleanedNoteData = Object.fromEntries(
        Object.entries(noteData).filter(([_, value]) => value !== undefined && value !== null)
      );

      if (note.firebaseId) {
        // Update existing document
        const noteRef = doc(firestore, 'notes', note.firebaseId);
        await updateDoc(noteRef, cleanedNoteData);
      } else {
        // Create new document
        const docRef = await addDoc(collection(firestore, 'notes'), cleanedNoteData);
        note.firebaseId = docRef.id;
        await this.notes.update(note.id!, { firebaseId: docRef.id });
      }
    } catch (error) {
      console.error('Error syncing with Firebase:', error);
      throw error;
    }
  }

  // Folder Methods
  async createFolder(folder: Partial<Folder>): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
      const folderData = {
        ...folder,
        ownerUserId: user.uid,
        ownerEmail: user.email,
        ownerDisplayName: user.displayName || "",
        ownerPhotoURL: user.photoURL || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(firestore, "folders"), folderData);
      await this.loadFromFirebase(); // Reload data
      return docRef.id;
    } catch (error) {
      console.error("Error creating folder:", error);
      throw error;
    }
  }

  async updateFolder(folderId: string, updates: Partial<Folder>) {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
      const folderRef = doc(firestore, "folders", folderId);
      const folderDoc = await getDoc(folderRef);

      if (!folderDoc.exists()) {
        throw new Error("Folder not found");
      }

      const folderData = folderDoc.data();
      if (folderData.ownerUserId !== user.uid) {
        throw new Error("Only the owner can update this folder");
      }

      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await updateDoc(folderRef, updateData);
      await this.loadFromFirebase();
    } catch (error) {
      console.error("Error updating folder:", error);
      throw error;
    }
  }

  async deleteFolder(folderId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
      const folderRef = doc(firestore, "folders", folderId);
      const folderDoc = await getDoc(folderRef);

      if (!folderDoc.exists()) return;

      const folderData = folderDoc.data();
      if (folderData.ownerUserId !== user.uid) {
        throw new Error("Only the owner can delete this folder");
      }

      // Move all notes in this folder to root (no folder)
      const notesRef = collection(firestore, "notes");
      const notesInFolder = await getDocs(
        query(notesRef, where("folderId", "==", folderId))
      );

      const updatePromises = notesInFolder.docs.map(doc =>
        updateDoc(doc.ref, { folderId: null })
      );
      await Promise.all(updatePromises);

      // Delete the folder
      await deleteDoc(folderRef);
      await this.loadFromFirebase();
    } catch (error) {
      console.error("Error deleting folder:", error);
      throw error;
    }
  }

  async getFolders(): Promise<Folder[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
      const foldersRef = collection(firestore, "folders");
      const q = query(
        foldersRef,
        where("ownerUserId", "==", user.uid)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Folder[];
    } catch (error) {
      console.error("Error fetching folders:", error);
      throw error;
    }
  }
}

export const db = new NotesDB();
