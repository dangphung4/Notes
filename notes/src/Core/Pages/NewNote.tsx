import { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '../Components/Editor';
import { db } from '../Database/db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '../Auth/AuthContext';
import type { Note } from '../Database/db';
import { NoteTemplate, noteTemplates } from '../Components/NoteTemplates';
import TemplateDialog from '../Components/TemplateDialog';
import { SaveIcon, LayoutTemplateIcon } from 'lucide-react';

/**
 *
 */
export default function NewNote() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // Store editor content in localStorage to prevent loss
  const [note, setNote] = useState<Note>(() => {
    const savedNote = localStorage.getItem('draft-note');
    if (savedNote) {
      return JSON.parse(savedNote);
    }
    return {
      title: '',
      content: JSON.stringify(noteTemplates.blank.content),
      updatedAt: new Date(),
      createdAt: new Date(),
      ownerUserId: user?.uid || '',
      ownerEmail: user?.email || '',
      ownerDisplayName: user?.displayName || 'Unknown',
      ownerPhotoURL: user?.photoURL || undefined,
      tags: []
    };
  });
  const [isSaving, setIsSaving] = useState(false);

  // Save draft to localStorage whenever note changes
  useEffect(() => {
    localStorage.setItem('draft-note', JSON.stringify(note));
  }, [note]);

  // Clear draft when component unmounts after successful save
  useEffect(() => {
    return () => {
      if (!isSaving) {
        localStorage.removeItem('draft-note');
      }
    };
  }, [isSaving]);

  // focus title input on mount
  useEffect(() => {
    // Short timeout to ensure input is mounted
    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle template selection
  const handleTemplateSelect = (template: NoteTemplate) => {
    console.log('Selected template:', template); // Debug log
    setNote(prev => ({
      ...prev,
      title: template.title || 'Untitled',
      content: JSON.stringify(template.content)
    }));
  };

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
        localStorage.removeItem('draft-note'); // Clear draft after successful save
        navigate(`/notes/${firebaseId}`);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  }, [note, user, navigate]);

  return (
    <div className="flex flex-col min-h-[100dvh] h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Input
            ref={titleInputRef}
            type="text"
            value={note.title}
            onChange={(e) => setNote({ ...note, title: e.target.value })}
            className="text-lg font-semibold bg-transparent border-0 p-0 focus:outline-none min-w-0 flex-1"
            placeholder="Untitled"
          />
          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-2">
            <TemplateDialog onSelectTemplate={handleTemplateSelect}>
              <Button variant="outline">Choose Template</Button>
            </TemplateDialog>
            <Button 
              onClick={saveNote}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
          {/* Mobile buttons */}
          <div className="flex md:hidden items-center gap-2">
            <TemplateDialog onSelectTemplate={handleTemplateSelect}>
              <Button variant="default" size="icon" className="h-9 w-9">
                <LayoutTemplateIcon className="h-5 w-5" />
              </Button>
            </TemplateDialog>
            <Button 
              variant="secondary"
              size="icon"
              onClick={saveNote}
              disabled={isSaving}
              className="h-9 w-9"
            >
              <SaveIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden min-h-[100dvh] h-full">
        <Editor
          key={note.content}
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