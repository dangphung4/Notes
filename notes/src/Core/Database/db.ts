import Dexie from 'dexie';

interface Note {
  id?: number;
  title: string;
  content: string; // Will store JSON string of BlockNote content
  updatedAt: Date;
}

class NotesDB extends Dexie {
  notes!: Dexie.Table<Note, number>;

  constructor() {
    super('NotesDB');
    this.version(1).stores({
      notes: '++id, title, updatedAt'
    });
  }
}

export const db = new NotesDB();