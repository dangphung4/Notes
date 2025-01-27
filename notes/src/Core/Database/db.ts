import Dexie from 'dexie';

interface Note {
  id?: number;
  title: string;
  content: string;
  updatedAt: Date;
}

class FocusFlowDB extends Dexie {
  notes!: Dexie.Table<Note, number>;

  constructor() {
    super('FocusFlowDB');
    this.version(1).stores({
      notes: '++id, title, content, updatedAt'
    });
  }
}

export const db = new FocusFlowDB();