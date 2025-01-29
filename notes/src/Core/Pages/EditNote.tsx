/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '../Components/Editor';
import { db } from '../Database/db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrashIcon} from '@radix-ui/react-icons';
import debounce from 'lodash/debounce';
import { useAuth } from '../Auth/AuthContext';
import type { Note } from '../Database/db';
import ShareDialog from '../Components/ShareDialog';
import { doc, onSnapshot } from 'firebase/firestore';
import { db as firestore } from '../Auth/firebase';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { CheckIcon } from '@radix-ui/react-icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { 
  MoreVerticalIcon, 
  ChevronLeftIcon, 
  PrinterIcon, 
  DownloadIcon,
  Loader2Icon,
  XIcon,
  FileTextIcon,
  FileIcon,
  CodeIcon,
  BoldIcon,
  ListIcon,
  CheckSquareIcon,
  ArrowUpIcon,
  ArrowLeftIcon,
  WifiOffIcon,
  Heading1Icon,
  ItalicIcon,
  UnderlineIcon,
  Heading2Icon,
  Heading3Icon
} from 'lucide-react';
import { BlockNoteEditor } from '@blocknote/core';

export default function EditNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [note, setNote] = useState<Note | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const editorRef = useRef<BlockNoteEditor | null>(null);
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false
  });

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
          setSaveStatus('error');
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

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
        lastEditedByPhotoURL: user?.photoURL || undefined,
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

  // Add the export handler function
  const handleExport = async (format: 'markdown' | 'txt' | 'html') => {
    if (!note) return;

    try {
      let content = '';
      const parsedContent = JSON.parse(note.content);
      
      switch (format) {
        case 'markdown':
          content = convertToMarkdown(parsedContent);
          downloadFile(`${note.title || 'Untitled'}.md`, content);
          break;
        case 'txt':
          content = convertToPlainText(parsedContent);
          downloadFile(`${note.title || 'Untitled'}.txt`, content);
          break;
        case 'html':
          content = convertToHTML(parsedContent);
          downloadFile(`${note.title || 'Untitled'}.html`, content);
          break;
      }

      toast({
        title: "Note exported",
        description: `Successfully exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error exporting note:', error);
      toast({
        title: "Export failed",
        description: "Failed to export note. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper function to download the file
  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Conversion functions
  const convertToMarkdown = (blocks: any[]) => {
    let markdown = '';
    
    const getTextContent = (content: any[]) => {
      if (!Array.isArray(content)) return '';
      return content.map(c => {
        let text = c.text || '';
        if (c.styles?.bold) text = `**${text}**`;
        if (c.styles?.italic) text = `*${text}*`;
        if (c.styles?.underline) text = `_${text}_`;
        if (c.styles?.strike) text = `~~${text}~~`;
        return text;
      }).join('');
    };

    blocks.forEach(block => {
      switch (block.type) {
        case 'heading': {
          const level = '#'.repeat(block.props?.level || 1);
          markdown += `${level} ${getTextContent(block.content)}\n\n`;
          break;
        }
        case 'paragraph':
          markdown += `${getTextContent(block.content)}\n\n`;
          break;
        case 'bulletListItem':
          markdown += `* ${getTextContent(block.content)}\n`;
          break;
        case 'numberedListItem':
          markdown += `1. ${getTextContent(block.content)}\n`;
          break;
        case 'checkListItem': {
          const checkbox = block.props?.checked ? '[x]' : '[ ]';
          markdown += `${checkbox} ${getTextContent(block.content)}\n`;
          break;
        }
      }
    });
    return markdown;
  };

  const convertToPlainText = (blocks: any[]) => {
    return blocks.map(block => {
      // Safely get text content from block
      const getTextContent = (content: any[]) => {
        if (!Array.isArray(content)) return '';
        return content.map(c => c.text || '').join('');
      };

      const text = getTextContent(block.content);
      
      switch (block.type) {
        case 'heading':
          return `${text}\n`;
        case 'bulletListItem':
          return `• ${text}\n`;
        case 'numberedListItem':
          return `1. ${text}\n`;
        case 'checkListItem':
          return `${block.props?.checked ? '☒' : '☐'} ${text}\n`;
        case 'paragraph':
          return `${text}\n`;
        default:
          return `${text}\n`;
      }
    }).join('\n');
  };

  const convertToHTML = (blocks: any[]) => {
    const getTextContent = (content: any[]) => {
      if (!Array.isArray(content)) return '';
      return content.map(c => {
        let text = c.text || '';
        if (c.styles?.bold) text = `<strong>${text}</strong>`;
        if (c.styles?.italic) text = `<em>${text}</em>`;
        if (c.styles?.underline) text = `<u>${text}</u>`;
        if (c.styles?.strike) text = `<del>${text}</del>`;
        return text;
      }).join('');
    };

    let html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>';
    html += note?.title || 'Untitled';
    html += '</title></head><body style="max-width: 800px; margin: 40px auto; padding: 0 20px; font-family: system-ui, -apple-system, sans-serif;">';
    
    blocks.forEach(block => {
      switch (block.type) {
        case 'heading':
          html += `<h${block.props?.level || 1}>${getTextContent(block.content)}</h${block.props?.level || 1}>`;
          break;
        case 'paragraph':
          html += `<p>${getTextContent(block.content)}</p>`;
          break;
        case 'bulletListItem':
          html += `<ul><li>${getTextContent(block.content)}</li></ul>`;
          break;
        case 'numberedListItem':
          html += `<ol><li>${getTextContent(block.content)}</li></ol>`;
          break;
        case 'checkListItem': {
          const checked = block.props?.checked ? ' checked' : '';
          html += `<div><input type="checkbox"${checked} disabled> ${getTextContent(block.content)}</div>`;
          break;
        }
      }
    });
    
    html += '</body></html>';
    return html;
  };

  // Update the touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart(touch.clientY);
    setTouchStartX(touch.clientX);
  };

  const handleTouchMove = async (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    const diffY = touch.clientY - touchStart;
    const scrollTop = e.currentTarget.scrollTop;
    
    // Only allow pull-to-refresh when at the top of the content
    if (diffY > 50 && scrollTop === 0 && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await db.syncNote(note!);
        toast({
          title: "Note refreshed",
          description: "Latest changes have been loaded",
        });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast({
          title: "Error refreshing",
          description: "Failed to load latest changes",
          variant: "destructive",
        });
      } finally {
        setIsRefreshing(false);
        setTouchStart(null);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchEnd - touchStartX;
    
    // Swipe right to go back
    if (diff > 100) {
      navigate('/notes');
    }
    
    setTouchStart(null);
    setTouchStartX(0);
  };

  // Update the effect with proper type checking
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const updateActiveStyles = () => {
      const styles = editor.getActiveStyles();
      setActiveStyles({
        bold: !!styles.bold,
        italic: !!styles.italic,
        underline: !!styles.underline
      });
    };

    const cleanup: Array<() => void> = [];

    // Update on selection change
    const unsubscribe = editor.onSelectionChange(updateActiveStyles);
    if (unsubscribe) cleanup.push(unsubscribe);

    // Update on content change
    const unsubscribeContent = editor.onChange(updateActiveStyles);
    if (unsubscribeContent) cleanup.push(unsubscribeContent);

    // Initial update
    updateActiveStyles();

    return () => {
      cleanup.forEach(fn => fn());
    };
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
    <div 
      className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 flex justify-center py-2 bg-background/80 backdrop-blur z-50">
          <Loader2Icon className="h-4 w-4 animate-spin" />
        </div>
      )}
      {/* Header Bar */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Main Header */}
        <div className="flex items-center justify-between p-4">
          {/* Left Section: Back Button + Title */}
        <div className="flex-1 flex items-center gap-4 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/notes')}
              className="hidden sm:flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span>Back</span>
            </Button>
          <Input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              debouncedSaveTitle(e.target.value);
            }}
              className="text-xl sm:text-2xl font-semibold bg-transparent border-0 p-0 focus:outline-none focus-visible:ring-0 w-full truncate placeholder:text-muted-foreground/50 placeholder:font-normal"
            placeholder="Untitled"
          />
        </div>

          {/* Right Section: Status + Actions */}
          <div className="flex items-center gap-3">
            {/* Save Status */}
            <div className={cn(
              "hidden sm:flex items-center gap-2 text-sm",
              saveStatus === 'saving' && "text-muted-foreground",
              saveStatus === 'saved' && "text-green-500",
              saveStatus === 'error' && "text-destructive"
            )}>
              {saveStatus === 'saving' && <Loader2Icon className="h-3 w-3 animate-spin" />}
              {saveStatus === 'saved' && <CheckIcon className="h-3 w-3" />}
              {saveStatus === 'error' && <XIcon className="h-3 w-3" />}
              <span className="hidden md:inline">
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'All changes saved'}
            {saveStatus === 'error' && 'Error saving'}
          </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {/* Mobile Save Status - Shown inline on mobile */}
              <div className="sm:hidden">
                {saveStatus === 'saving' && (
                  <Button variant="ghost" size="icon" className="pointer-events-none">
                    <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                  </Button>
                )}
                {saveStatus === 'saved' && (
                  <Button variant="ghost" size="icon" className="pointer-events-none">
                    <CheckIcon className="h-4 w-4 text-green-500" />
                  </Button>
                )}
                {saveStatus === 'error' && (
                  <Button variant="ghost" size="icon" className="pointer-events-none">
                    <XIcon className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              <ShareDialog 
                note={note} 
                onShare={() => {
                  toast({
                    title: "Note shared",
                    description: "The note has been shared successfully.",
                  });
                }}
                onError={(error) => {
                  toast({
                    title: "Error sharing note",
                    description: error,
                    variant: "destructive",
                  });
                }}
              />
              
              {/* More Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVerticalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.print()}>
                    <PrinterIcon className="h-4 w-4 mr-2" />
                    Print
                  </DropdownMenuItem>
                  
                  {/* Export Sub-menu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Export as...
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => handleExport('markdown')}>
                        <FileTextIcon className="h-4 w-4 mr-2" />
                        Markdown (.md)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('txt')}>
                        <FileIcon className="h-4 w-4 mr-2" />
                        Plain Text (.txt)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('html')}>
                        <CodeIcon className="h-4 w-4 mr-2" />
                        HTML
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Toolbar - Show only on desktop */}
      <div className="hidden sm:flex items-center gap-1 p-2 overflow-x-auto bg-muted/50 border-b">
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

      {/* Mobile Toolbar - Show only on mobile */}
      <div className="sm:hidden flex items-center gap-1 p-2 overflow-x-auto bg-muted/50 border-b">
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
            const editor = editorRef.current;
            if (editor) {
              // Get the editor's DOM element and scroll it
              const editorElement = editor.domElement;
              editorElement?.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="shrink-0"
        >
          <ArrowUpIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          content={content}
          onChange={handleContentChange}
          editorRef={editorRef}
        />
      </div>

      {/* Mobile bottom toolbar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left - Back button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/notes')}
            className="flex items-center gap-1"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back</span>
          </Button>

          {/* Center - Formatting Options */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
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
              className="shrink-0"
            >
              <Heading1Icon className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
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
              className="shrink-0"
            >
              <Heading2Icon className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
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
              className="shrink-0"
            >
              <Heading3Icon className="h-4 w-4" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />

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
          </div>

          {/* Right side - Empty div to maintain spacing */}
          <div className="w-[72px]" /> {/* Approximate width of removed share button */}
        </div>
      </div>

      {/* Add padding to prevent content from being hidden behind the toolbar */}
      <div className="sm:hidden h-14" />

      {!isOnline && (
        <div className="absolute bottom-0 left-0 right-0 bg-yellow-500/10 text-yellow-500 text-xs py-0.5 text-center">
          <WifiOffIcon className="h-3 w-3 inline-block mr-1" />
          Offline - Changes will sync when connected
        </div>
      )}
    </div>
  );
} 