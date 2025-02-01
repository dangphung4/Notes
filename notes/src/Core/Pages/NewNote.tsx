/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '../Components/Editor';
import { db } from '../Database/db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '../Auth/AuthContext';
import type { Note, Folder } from '../Database/db';
import { NoteTemplate, noteTemplates } from '../Components/NoteTemplates';
import TemplateDialog from '../Components/TemplateDialog';
import { SaveIcon, LayoutTemplateIcon, FolderIcon } from 'lucide-react';
import { BlockNoteEditor } from '@blocknote/core';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
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
    
    // Initialize with blank template content
    const blankContent = noteTemplates.blank.content;
    return {
      title: '',
      content: typeof blankContent === 'string' 
        ? blankContent 
        : JSON.stringify(blankContent),
      updatedAt: new Date(),
      createdAt: new Date(),
      ownerUserId: user?.uid || '',
      ownerEmail: user?.email || '',
      ownerDisplayName: user?.displayName || 'Unknown',
      ownerPhotoURL: user?.photoURL || undefined,
      tags: [],
      folderId: null
    };
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load folders
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const userFolders = await db.getFolders();
        setFolders(userFolders);
      } catch (error) {
        console.error('Error loading folders:', error);
      }
    };
    loadFolders();
  }, []);

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

  // Add a ref to track if initial focus has been set
  const initialFocusRef = useRef(false);

  // Update the editor initialization and focus handling
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || initialFocusRef.current) return;

    // Function to focus editor and show keyboard
    const focusEditor = () => {
      // First focus the title input
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.click();
      }

      // Then set up a delayed focus for the editor
      setTimeout(() => {
        if (editor) {
          editor.focus();
        }
      }, 300); // Delay to ensure proper focus order
    };

    // Set initial focus after a short delay
    const timer = setTimeout(focusEditor, 100);
    initialFocusRef.current = true;

    return () => clearTimeout(timer);
  }, []);

  // Update title input focus handling
  useEffect(() => {
    if (initialFocusRef.current) return;

    const timer = setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        // Force keyboard to show on iOS
        titleInputRef.current.click();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Add touch event handlers for iOS
  const handleTouchStart = useCallback(() => {
    const editor = editorRef.current;
    if (editor && !editor.isFocused) {
      editor.focus();
    }
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

  // Update the template selection handler
  const handleTemplateSelect = (template: NoteTemplate) => {
    console.log('Selected template:', template); // Keep debug log
    
    // Get the editor instance
    const editor = editorRef.current;
    if (!editor) {
      console.warn('Editor not initialized');
      return;
    }

    // Update note state with template title
    setNote(prev => ({
      ...prev,
      title: template.title || 'Untitled',
    }));

    try {
      // Parse the template content and apply it to the editor
      const content = typeof template.content === 'string' 
        ? JSON.parse(template.content)
        : template.content;
        
      // Replace the editor content with template content
      editor.replaceBlocks(editor.document, content);
      
      // Save to localStorage after template is applied
      localStorage.setItem('draft-note', JSON.stringify({
        ...note,
        title: template.title || 'Untitled',
        content: JSON.stringify(content)
      }));
    } catch (error) {
      console.error('Error applying template:', error);
    }
  };

  // Update the content change handler
  const handleContentChange = useCallback((content: any[]) => {
    const contentStr = JSON.stringify(content);
    setNote(prev => ({
      ...prev,
      content: contentStr
    }));
  }, []);

  // Save new note to Firebase directly
  const saveNote = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      const firebaseId = await db.createNote({
        ...note,
        folderId: selectedFolderId,
        updatedAt: new Date()
      });
      
      if (firebaseId) {
        localStorage.removeItem('draft-note');
        navigate(`/notes/${firebaseId}`);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  }, [note, selectedFolderId, user, navigate]);

  return (
    <div className="flex flex-col h-screen">
      {/* Fixed header section - only add top spacing on desktop */}
      <div className="sticky top-0 md:top-16 left-0 right-0 z-40 bg-background">
        {/* Title bar */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Input
              ref={titleInputRef}
              type="text"
              value={note.title}
              onChange={(e) => setNote({ ...note, title: e.target.value })}
              className="text-lg font-semibold bg-transparent border-0 p-0 focus:outline-none min-w-0 flex-1"
              placeholder="Untitled"
              autoFocus
              onFocus={(e) => {
                // Prevent iOS from losing focus
                e.currentTarget.setSelectionRange(
                  e.currentTarget.value.length,
                  e.currentTarget.value.length
                );
              }}
            />

            {/* Folder Selection - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              <Select
                value={selectedFolderId || "root"}
                onValueChange={(value) => setSelectedFolderId(value === "root" ? undefined : value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select folder">
                    <div className="flex items-center gap-2">
                      <FolderIcon className="h-4 w-4" />
                      {selectedFolderId 
                        ? folders.find(f => f.id === selectedFolderId)?.name || "Select folder"
                        : "Select folder"
                      }
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">
                    <div className="flex items-center gap-2">
                      <FolderIcon className="h-4 w-4" />
                      Root
                    </div>
                  </SelectItem>
                  {folders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <FolderIcon className="h-4 w-4" style={{ color: folder.color }} />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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

            {/* Mobile buttons and folder selection */}
            <div className="flex md:hidden items-center gap-2">
              <Select
                value={selectedFolderId || "root"}
                onValueChange={(value) => setSelectedFolderId(value === "root" ? undefined : value)}
              >
                <SelectTrigger className="w-10 px-0">
                  <FolderIcon className="h-5 w-5" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">
                    <div className="flex items-center gap-2">
                      <FolderIcon className="h-4 w-4" />
                      Root
                    </div>
                  </SelectItem>
                  {folders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <FolderIcon className="h-4 w-4" style={{ color: folder.color }} />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <div className="w-px h-4 bg-border mx-1" />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="shrink-0"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Container - remove padding on mobile */}
      <div 
        className="flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
      >
        <Editor
          content={note.content}
          onChange={handleContentChange}
          editorRef={editorRef}
        />
      </div>
    </div>
  );
} 