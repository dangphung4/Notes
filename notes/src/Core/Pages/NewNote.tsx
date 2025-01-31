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
import { BlockNoteEditor } from '@blocknote/core';
import { cn } from '@/lib/utils';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  CheckSquareIcon,
  CodeIcon,
  ArrowUpIcon,
} from 'lucide-react';

/**
 *
 */
export default function NewNote() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<BlockNoteEditor | null>(null);
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false
  });
  
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

  // Add effect to track active styles
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const updateActiveStyles = () => {
      const styles = editor.getActiveStyles();
      setActiveStyles({
        bold: !!styles.bold,
        italic: !!styles.italic,
        underline: !!styles.underline,
        strikethrough: !!styles.strike
      });
    };

    editor.onSelectionChange(() => {
      updateActiveStyles();
    });

    editor.onChange(() => {
      updateActiveStyles();
    });

    updateActiveStyles();
  }, [editorRef.current]);

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
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b shrink-0">
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

      {/* Desktop Toolbar */}
      <div className="hidden sm:flex items-center gap-1 p-2 overflow-x-auto bg-muted/50 border-b shrink-0">
        <Button 
          variant={activeStyles.bold ? "default" : "ghost"}
          size="sm" 
          className={cn(
            "shrink-0 transition-colors",
            activeStyles.bold && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => {
            const editor = editorRef.current;
            if (editor) {
              editor.focus();
              editor.toggleStyles({ bold: true });
            }
          }}
        >
          <BoldIcon className="h-4 w-4" />
        </Button>
        <Button 
          variant={activeStyles.italic ? "default" : "ghost"}
          size="sm" 
          className={cn(
            "shrink-0 transition-colors",
            activeStyles.italic && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => {
            const editor = editorRef.current;
            if (editor) {
              editor.focus();
              editor.toggleStyles({ italic: true });
            }
          }}
        >
          <ItalicIcon className="h-4 w-4" />
        </Button>
        <Button 
          variant={activeStyles.underline ? "default" : "ghost"}
          size="sm" 
          className={cn(
            "shrink-0 transition-colors",
            activeStyles.underline && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => {
            const editor = editorRef.current;
            if (editor) {
              editor.focus();
              editor.toggleStyles({ underline: true });
            }
          }}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button 
          variant={activeStyles.strikethrough ? "default" : "ghost"}
          size="sm" 
          className={cn(
            "shrink-0 transition-colors",
            activeStyles.strikethrough && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => {
            const editor = editorRef.current;
            if (editor) {
              editor.focus();
              editor.toggleStyles({ strike: true });
            }
          }}
        >
          <StrikethroughIcon className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button 
          variant="ghost" 
          size="sm" 
          className="shrink-0"
          onClick={() => {
            const editor = editorRef.current;
            if (editor) {
              editor.focus();
              editor.insertBlocks(
                [{ type: "heading", props: { level: 1 } }],
                editor.getTextCursorPosition().block,
                'after'
              );
            }
          }}
        >
          <Heading1Icon className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="shrink-0"
          onClick={() => {
            const editor = editorRef.current;
            if (editor) {
              editor.focus();
              editor.insertBlocks(
                [{ type: "heading", props: { level: 2 } }],
                editor.getTextCursorPosition().block,
                'after'
              );
            }
          }}
        >
          <Heading2Icon className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="shrink-0"
          onClick={() => {
            const editor = editorRef.current;
            if (editor) {
              editor.focus();
              editor.insertBlocks(
                [{ type: "heading", props: { level: 3 } }],
                editor.getTextCursorPosition().block,
                'after'
              );
            }
          }}
        >
          <Heading3Icon className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button 
          variant="ghost" 
          size="sm" 
          className="shrink-0"
          onClick={() => {
            const editor = editorRef.current;
            if (editor) {
              editor.focus();
              editor.insertBlocks(
                [{ type: "bulletListItem" }],
                editor.getTextCursorPosition().block,
                'after'
              );
            }
          }}
        >
          <ListIcon className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="shrink-0"
          onClick={() => {
            const editor = editorRef.current;
            if (editor) {
              editor.focus();
              editor.insertBlocks(
                [{ type: "checkListItem", props: { checked: false } }],
                editor.getTextCursorPosition().block,
                'after'
              );
            }
          }}
        >
          <CheckSquareIcon className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            const editor = editorRef.current;
            if (editor) {
              editor.focus();
              editor.insertBlocks(
                [{ type: "codeBlock", props: {} }],
                editor.getTextCursorPosition().block,
                'after'
              );
            }
          }}
          className="shrink-0"
        >
          <CodeIcon className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            const editor = editorRef.current;
            if (editor) {
              const editorElement = editor.domElement;
              editorElement?.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="shrink-0"
        >
          <ArrowUpIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile Toolbar */}
      <div className="sm:hidden flex items-center gap-1 p-2 overflow-x-auto bg-muted/50 border-b shrink-0">
        <Button 
          variant={activeStyles.bold ? "default" : "ghost"}
          size="sm" 
          className={cn(
            "shrink-0 transition-colors",
            activeStyles.bold && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => {
            const editor = editorRef.current;
            if (editor) {
              editor.focus();
              editor.toggleStyles({ bold: true });
            }
          }}
        >
          <BoldIcon className="h-4 w-4" />
        </Button>
        <Button 
          variant={activeStyles.italic ? "default" : "ghost"}
          size="sm" 
          className={cn(
            "shrink-0 transition-colors",
            activeStyles.italic && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => {
            const editor = editorRef.current;
            if (editor) {
              editor.focus();
              editor.toggleStyles({ italic: true });
            }
          }}
        >
          <ItalicIcon className="h-4 w-4" />
        </Button>
        <Button 
          variant={activeStyles.underline ? "default" : "ghost"}
          size="sm" 
          className={cn(
            "shrink-0 transition-colors",
            activeStyles.underline && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => {
            const editor = editorRef.current;
            if (editor) {
              editor.focus();
              editor.toggleStyles({ underline: true });
            }
          }}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button 
          variant={activeStyles.strikethrough ? "default" : "ghost"}
          size="sm" 
          className={cn(
            "shrink-0 transition-colors",
            activeStyles.strikethrough && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => {
            const editor = editorRef.current;
            if (editor) {
              editor.focus();
              editor.toggleStyles({ strike: true });
            }
          }}
        >
          <StrikethroughIcon className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button 
          variant="ghost" 
          size="sm" 
          className="shrink-0"
          onClick={() => {
            const editor = editorRef.current;
            if (editor) {
              editor.focus();
              editor.insertBlocks(
                [{ type: "heading", props: { level: 1 } }],
                editor.getTextCursorPosition().block,
                'after'
              );
            }
          }}
        >
          <Heading1Icon className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="shrink-0"
          onClick={() => {
            const editor = editorRef.current;
            if (editor) {
              editor.focus();
              editor.insertBlocks(
                [{ type: "bulletListItem" }],
                editor.getTextCursorPosition().block,
                'after'
              );
            }
          }}
        >
          <ListIcon className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="shrink-0"
          onClick={() => {
            const editor = editorRef.current;
            if (editor) {
              editor.focus();
              editor.insertBlocks(
                [{ type: "checkListItem", props: { checked: false } }],
                editor.getTextCursorPosition().block,
                'after'
              );
            }
          }}
        >
          <CheckSquareIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Container */}
      <div className="flex-1 overflow-hidden">
        <Editor
          key={note.content}
          content={note.content}
          onChange={(content) => {
            const contentStr = JSON.stringify(content);
            setNote({ ...note, content: contentStr });
          }}
          editorRef={editorRef}
        />
      </div>
    </div>
  );
} 