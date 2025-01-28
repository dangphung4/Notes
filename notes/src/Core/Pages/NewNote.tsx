import { useCallback, useState } from 'react';
import Editor from '../Components/Editor';
import { db } from '../Database/db';
import { Input } from '@/components/ui/input';
import debounce from 'lodash/debounce';
import { useAuth } from '../Auth/AuthContext';
import { Note } from '../Database/db';


export default function NewNote() {
  const { user } = useAuth();
  
  const [note, setNote] = useState<Note>({
    title: 'Untitled',
    content: JSON.stringify([{  // Store as string to match database
      type: 'paragraph',
      content: []
    }]),
    updatedAt: new Date(),
    createdAt: new Date(),
    ownerUserId: user?.uid || '',
    ownerEmail: user?.email || '',
    ownerDisplayName: user?.displayName || 'Unknown',
    ownerPhotoURL: user?.photoURL || undefined,
    tags: []
  });

  // Save note to database
  const saveNote = useCallback(async (newTitle: string, content: any[]) => {
    try {
      const contentStr = JSON.stringify(content);
      
      if (note.id) {
        await db.notes.update(note.id, {
          title: newTitle,
          content: contentStr,
          updatedAt: new Date()
        });
        
        const updatedNote = await db.notes.get(note.id);
        if (updatedNote && user) {
          await db.syncNote(updatedNote);
        }
      } else {
        const id = await db.notes.add({
          title: newTitle,
          content: contentStr,
          updatedAt: new Date(),
          createdAt: new Date(),
          ownerUserId: user?.uid || '',
          ownerEmail: user?.email || '',
          ownerDisplayName: user?.displayName || 'Unknown',
          ownerPhotoURL: user?.photoURL || undefined,
          tags: []
        });
        
        const newNote = await db.notes.get(id);
        if (newNote && user) {
          await db.syncNote(newNote);
          setNote(newNote);  // No need to parse, keeping as string
        }
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }, [note.id, user]);

  // Debounced save for title changes
  const debouncedSaveTitle = useCallback(
    debounce((newTitle: string) => {
      saveNote(newTitle, JSON.parse(note.content));  // Parse when needed
    }, 500),
    [saveNote, note.content]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex items-center p-4 border-b">
        <Input
          type="text"
          value={note.title}
          onChange={(e) => {
            setNote({ ...note, title: e.target.value });
            debouncedSaveTitle(e.target.value);
          }}
          className="text-lg font-semibold bg-transparent border-0 p-0 focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          content={note.content}  // Pass string content
          onChange={(content) => {
            const contentStr = JSON.stringify(content);
            setNote({ ...note, content: contentStr });
            saveNote(note.title, content);
          }}
        />
      </div>
    </div>
  );
} 