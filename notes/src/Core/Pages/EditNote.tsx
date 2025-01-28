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
import { doc, onSnapshot } from 'firebase/firestore';
import { db as firestore } from '../Auth/firebase';

export default function EditNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [note, setNote] = useState<Note | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Set up real-time listener for the note
  useEffect(() => {
    if (!id || !user) return;

    // Listen for real-time updates to the note
    const unsubscribe = onSnapshot(
      doc(firestore, 'notes', id),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const updatedNote = {
            ...data,
            firebaseId: doc.id,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            lastEditedAt: data.lastEditedAt?.toDate()
          } as Note;

          setNote(updatedNote);
          setTitle(updatedNote.title);
          setContent(updatedNote.content);
          setIsLoading(false);
        } else {
          console.error('Note not found');
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Error loading note:', error);
        setIsLoading(false);
        setSaveStatus('error');
      }
    );

    return () => unsubscribe();
  }, [id, user]);

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
    // Implementation of handleShare function
  }, []);

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
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex-1 flex items-center gap-4 min-w-0">
          <Input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              debouncedSaveTitle(e.target.value);
            }}
            className="text-2xl md:text-3xl font-bold bg-transparent border-0 p-0 focus:outline-none focus-visible:ring-0 w-full truncate placeholder:text-muted-foreground/50 placeholder:font-normal"
            placeholder="Untitled"
          />
        </div>
        <div className="flex items-center gap-2 ml-2"> {/* added ml-2 for spacing */}
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'All changes saved'}
            {saveStatus === 'error' && 'Error saving'}
          </span>
          <div className="flex items-center gap-1">
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
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Save Status - only shows on mobile */}
      {saveStatus !== 'saved' && (
        <div className="sm:hidden text-center py-1 text-xs">
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'error' && 'Error saving'}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          content={content}
          onChange={handleContentChange}
        />
      </div>
    </div>
  );
} 