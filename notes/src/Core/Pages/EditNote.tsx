import { useCallback, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '../Components/Editor';
import { db } from '../Database/db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrashIcon } from '@radix-ui/react-icons';
import debounce from 'lodash/debounce';
import { useAuth } from '../Auth/AuthContext';
import type { Note } from '../Database/db';
import ShareDialog from '../Components/ShareDialog';

export default function EditNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [note, setNote] = useState<Note | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Load note data
  const loadNote = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      // Try to get note from IndexedDB first
      const notes = await db.notes.where('firebaseId').equals(id).toArray();
      const noteData = notes[0];

      if (noteData) {
        setNote(noteData);
        setTitle(noteData.title);
        setContent(noteData.content);
      } else {
        // If not in IndexedDB, try to load from Firebase and save to IndexedDB
        await db.loadFromFirebase();
        const updatedNotes = await db.notes.where('firebaseId').equals(id).toArray();
        const updatedNote = updatedNotes[0];
        
        if (updatedNote) {
          setNote(updatedNote);
          setTitle(updatedNote.title);
          setContent(updatedNote.content);
        }
      }
    } catch (error) {
      console.error('Error loading note:', error);
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  // Save note changes
  const saveNote = useCallback(async (newTitle: string, newContent: string) => {
    if (!note) return;

    setSaveStatus('saving');
    try {
      // Update note
      const updatedNote: Note = {
        ...note,
        title: newTitle,
        content: newContent,
        updatedAt: new Date(),
        lastEditedByUserId: user?.uid,
        lastEditedByEmail: user?.email || '',
        lastEditedByDisplayName: user?.displayName || 'Unknown',
        lastEditedByPhotoURL: user?.photoURL,
        lastEditedAt: new Date()
      };

      if (note.id) {
        await db.notes.update(note.id, updatedNote);
      }

      // Sync with Firebase if user is authenticated
      if (user) {
        await db.syncNote(updatedNote);
      }

      setNote(updatedNote);
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error saving note:', error);
      setSaveStatus('error');
    }
  }, [note, user]);

  // Debounced save for title changes
  const debouncedSaveTitle = useCallback(
    debounce((newTitle: string) => {
      if (content) {
        saveNote(newTitle, content);
      }
    }, 500),
    [saveNote, content]
  );

  // Handle content changes
  const handleContentChange = useCallback(async (newContent: any[]) => {
    const contentStr = JSON.stringify(newContent);
    setContent(contentStr);
    saveNote(title, contentStr);
  }, [title, saveNote]);

  // Handle note deletion
  const handleDelete = async () => {
    if (!note?.firebaseId || !window.confirm('Are you sure you want to delete this note?')) return;

    try {
      if (note.id) {
        await db.notes.delete(note.id);
      }

      if (user) {
        await db.deleteNote(note.firebaseId);
      }

      navigate('/notes');
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleShare = useCallback(async () => {
    await loadNote();
  }, [loadNote]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Note not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/notes')}
        >
          Back to Notes
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex-1 flex items-center gap-4">
          <Input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              debouncedSaveTitle(e.target.value);
            }}
            className="text-lg font-semibold bg-transparent border-0 p-0 focus:outline-none"
          />
          <span className="text-sm text-muted-foreground">
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'All changes saved'}
            {saveStatus === 'error' && 'Error saving'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {note && (
            <ShareDialog 
              note={note} 
              onShare={handleShare}
              onError={(error) => setSaveStatus('error')} 
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <TrashIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          content={content}
          onChange={handleContentChange}
        />
      </div>
    </div>
  );
} 