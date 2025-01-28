import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '../Components/Editor';
import { db } from '../Database/db';
import { Input } from '@/components/ui/input';
import debounce from 'lodash/debounce';

export default function NewNote() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('Untitled');
  const [noteId, setNoteId] = useState<number | undefined>();

  // Save note to database
  const saveNote = useCallback(async (newTitle: string, content: string) => {
    try {
      if (noteId) {
        await db.notes.update(noteId, {
          title: newTitle,
          content,
          updatedAt: new Date(),
        });
      } else {
        const id = await db.notes.add({
          title: newTitle,
          content,
          updatedAt: new Date(),
        });
        setNoteId(id);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }, [noteId]);

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