import { useCallback, useState } from 'react';
import Editor from '../Components/Editor';
import { db } from '../Database/db';
import { Input } from '@/components/ui/input';
import debounce from 'lodash/debounce';
import { useAuth } from '../Auth/AuthContext';

export default function NewNote() {
  const { user } = useAuth();
  const [title, setTitle] = useState('Untitled');
  const [noteId, setNoteId] = useState<number | undefined>();

  // Save note to database
  const saveNote = useCallback(async (newTitle: string, content: string) => {
    try {
      if (noteId) {
        // Update existing note
        await db.notes.update(noteId, {
          title: newTitle,
          content,
          updatedAt: new Date(),
          userId: user?.uid
        });
        
        // Get the updated note and sync with Firebase
        const note = await db.notes.get(noteId);
        if (note && user) {
          await db.syncNote(note);
        }
      } else {
        // Create new note
        const id = await db.notes.add({
          title: newTitle,
          content,
          updatedAt: new Date(),
          userId: user?.uid
        });
        setNoteId(id);
        
        // Get the new note and sync with Firebase
        const note = await db.notes.get(id);
        if (note && user) {
          await db.syncNote(note);
        }
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }, [noteId, user]);

  // Debounced save for title changes
  const debouncedSaveTitle = useCallback(
    debounce((newTitle: string, content: string) => {
      saveNote(newTitle, content);
    }, 500),
    [saveNote]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex items-center p-4 border-b">
        <Input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            debouncedSaveTitle(e.target.value, '');
          }}
          className="text-lg font-semibold bg-transparent border-0 p-0 focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          content=""
          onChange={(content) => saveNote(title, content)}
        />
      </div>
    </div>
  );
} 