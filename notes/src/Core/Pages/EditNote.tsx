import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../Database/db';
import Editor from '../Components/Editor';
import NoteHeader from '../Components/NoteHeader';

export default function EditNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNote = async () => {
      if (!id) return;
      try {
        const note = await db.notes.get(parseInt(id));
        if (note) {
          setTitle(note.title);
          setContent(note.content);
        }
      } catch (error) {
        console.error('Error loading note:', error);
        // Add proper error handling
      } finally {
        setIsLoading(false);
      }
    };

    loadNote();
  }, [id]);

  const handleSave = async () => {
    if (!id || !title.trim()) return;

    setIsSaving(true);
    try {
      await db.notes.update(parseInt(id), {
        title,
        content,
        updatedAt: new Date(),
      });
      navigate('/notes');
    } catch (error) {
      console.error('Error saving note:', error);
      // Add proper error handling
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await db.notes.delete(parseInt(id));
      navigate('/notes');
    } catch (error) {
      console.error('Error deleting note:', error);
      // Add proper error handling
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <NoteHeader
        title={title}
        onTitleChange={setTitle}
        onSave={handleSave}
        onDelete={handleDelete}
        isSaving={isSaving}
      />
      {isLoading ? (
        <div className="flex-grow flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="flex-grow overflow-hidden relative">
          <Editor content={content} onChange={setContent} />
        </div>
      )}
    </div>
  );
} 