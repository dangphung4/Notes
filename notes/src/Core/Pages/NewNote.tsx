import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '../Components/Editor';
import { db } from '../Database/db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '../Auth/AuthContext';
import type { Note } from '../Database/db';
import { NoteTemplate, noteTemplates } from '../Components/NoteTemplates';
import TemplateDialog from '../Components/TemplateDialog';

export default function NewNote() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [note, setNote] = useState<Note>({
    title: '',
    content: JSON.stringify(noteTemplates.blank.content),
    updatedAt: new Date(),
    createdAt: new Date(),
    ownerUserId: user?.uid || '',
    ownerEmail: user?.email || '',
    ownerDisplayName: user?.displayName || 'Unknown',
    ownerPhotoURL: user?.photoURL || undefined,
    tags: []
  });
  const [isSaving, setIsSaving] = useState(false);

  // Handle template selection
  const handleTemplateSelect = (template: NoteTemplate) => {
    console.log('Selected template:', template); // Debug log
    setNote(prev => {
      const newNote = {
        ...prev,
        title: template.title || 'Untitled',
        // Convert the template content to a string since that's what Note expects
        content: JSON.stringify(template.content)
      };
      console.log('New note state:', newNote); // Debug log
      return newNote;
    });
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
        <div className="flex items-center gap-4 flex-1">
          <Input
            type="text"
            value={note.title}
            onChange={(e) => setNote({ ...note, title: e.target.value })}
            className="text-lg font-semibold bg-transparent border-0 p-0 focus:outline-none"
            placeholder="Untitled"
          />
          <TemplateDialog onSelectTemplate={handleTemplateSelect} />
        </div>
        <Button 
          onClick={saveNote}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Note'}
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          key={note.content} // Add key to force re-render when content changes
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