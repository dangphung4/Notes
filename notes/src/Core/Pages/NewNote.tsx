import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '../Components/Editor';
import { db } from '../Database/db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '../Auth/AuthContext';
import type { Note } from '../Database/db';

export default function NewNote() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [note, setNote] = useState<Note>({
    title: 'Untitled',
    content: JSON.stringify([{
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
  const [isSaving, setIsSaving] = useState(false);

  // Save new note to Firebase directly
  const saveNote = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      const firebaseId = await db.createNote({
        ...note,
        updatedAt: new Date()
      });
      
      if (firebaseId) {
        navigate(`/notes/${firebaseId}`);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  }, [note, user, navigate]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <Input
          type="text"
          value={note.title}
          onChange={(e) => setNote({ ...note, title: e.target.value })}
          className="text-lg font-semibold bg-transparent border-0 p-0 focus:outline-none"
        />
        <Button 
          onClick={saveNote}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Note'}
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          content={note.content}
          onChange={(content) => {
            const contentStr = JSON.stringify(content);
            setNote({ ...note, content: contentStr });
          }}
        />
      </div>
    </div>
  );
} 