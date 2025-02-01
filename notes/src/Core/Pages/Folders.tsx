import { useState, useEffect } from 'react';
import { Folder, Note } from '../Database/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusIcon, ChevronRightIcon, MagnifyingGlassIcon, Cross2Icon, HamburgerMenuIcon } from '@radix-ui/react-icons';
import { useAuth } from '../Auth/AuthContext';
import { db } from '../Database/db';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { FolderIcon, TrashIcon, PencilIcon, ChevronLeftIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { formatTimeAgo } from '../utils/noteUtils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface FolderNode extends Folder {
  children: FolderNode[];
  isExpanded?: boolean;
}

interface BlockNoteContent {
  type: string;
  content?: Array<{ type: string; text?: string }>;
  text?: string;
  children?: BlockNoteContent[];
}

const getBlockNoteContent = (jsonString: string): string => {
  try {
    const blocks = JSON.parse(jsonString) as BlockNoteContent | BlockNoteContent[];
    let text = '';
    
    const extractText = (block: BlockNoteContent) => {
      // Check if block has content array
      if (Array.isArray(block.content)) {
        block.content.forEach((item) => {
          if (item.type === 'text') {
            text += item.text || '';
          }
        });
      } else if (block.text) {
        // Some blocks might have direct text property
        text += block.text;
      }
      
      // Add newline after certain block types
      if (['paragraph', 'bulletListItem', 'numberedListItem', 'checkListItem'].includes(block.type)) {
        text += '\n';
      }

      // Process children recursively
      if (Array.isArray(block.children)) {
        block.children.forEach(extractText);
      }
    };

    // Handle if blocks is not an array (single block)
    if (!Array.isArray(blocks)) {
      extractText(blocks);
    } else {
      blocks.forEach(extractText);
    }

    return text.trim();
  } catch (error) {
    console.error('Error parsing BlockNote content:', error);
    return '';
  }
};

const FolderTreeItem = ({ 
  folder, 
  level = 0,
  onToggle,
  onEdit,
  onDelete,
  onCreateSubfolder,
  notes,
  isCompact = false
}: { 
  folder: FolderNode;
  level?: number;
  onToggle: (folderId: string) => void;
  onEdit: (folder: FolderNode) => void;
  onDelete: (folderId: string) => void;
  onCreateSubfolder: (folder: FolderNode) => void;
  notes: Note[];
  isCompact?: boolean;
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const folderNotes = notes.filter(note => note.folderId === folder.id);
  const [showInfo, setShowInfo] = useState(false);
  const [openNoteIds, setOpenNoteIds] = useState<Record<string, boolean>>({});
  const hasContent = folder.children.length > 0 || folderNotes.length > 0;

  const toggleNoteInfo = (noteId: string) => {
    setOpenNoteIds(prev => ({
      ...prev,
      [noteId]: !prev[noteId]
    }));
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 py-2 px-3 hover:bg-muted/50 active:bg-muted rounded-lg cursor-pointer relative transition-all",
          level > 0 && "ml-4 sm:ml-6",
          folder.isExpanded && "bg-muted/50"
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (hasContent) {
            onToggle(folder.id);
          }
        }}
      >
        {/* Expand/Collapse Button */}
        <div className="h-6 w-6 shrink-0 flex items-center justify-center">
          <ChevronRightIcon 
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              folder.isExpanded && "rotate-90",
              !hasContent && "opacity-0"
            )}
          />
        </div>
        
        <div 
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: folder.color + '20' }}
        >
          <FolderIcon className="h-4 w-4" style={{ color: folder.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{folder.name}</span>
            {!isCompact && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {folderNotes.length > 0 && (
                  <Badge variant="secondary" className="h-5 text-xs">
                    {folderNotes.length} {folderNotes.length === 1 ? 'note' : 'notes'}
                  </Badge>
                )}
                {folder.children.length > 0 && (
                  <Badge variant="secondary" className="h-5 text-xs">
                    {folder.children.length} {folder.children.length === 1 ? 'folder' : 'folders'}
                  </Badge>
                )}
              </div>
            )}
          </div>
          {!isCompact && folder.updatedAt && (
            <div className="text-xs text-muted-foreground mt-0.5">
              Updated {formatTimeAgo(folder.updatedAt)}
            </div>
          )}
        </div>

        {/* Actions Menu */}
        {folder.ownerUserId === user?.uid && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <HamburgerMenuIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                navigate('/notes/new', { state: { folderId: folder.id } });
              }}>
                <PlusIcon className="h-4 w-4 mr-2" />
                New Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onCreateSubfolder(folder);
              }}>
                <FolderIcon className="h-4 w-4 mr-2" />
                New Subfolder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit(folder);
              }}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                setShowInfo(true);
              }}>
                <FolderIcon className="h-4 w-4 mr-2" />
                Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(folder.id);
                }}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {folder.isExpanded && (
        <div>
          {/* Notes in this folder */}
          {folderNotes.length > 0 && (
            <div className="ml-12 space-y-1 mt-1">
              {folderNotes.map(note => (
                <div key={`note-${folder.id}-${note.firebaseId}`}>
                  <div
                    className="flex flex-col gap-1 py-2 px-3 hover:bg-muted/50 active:bg-muted rounded-lg cursor-pointer text-sm group relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/notes/${note.firebaseId}`);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <FolderIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {note.title || 'Untitled'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">
                          {formatTimeAgo(note.updatedAt)}
                        </div>
                        {/* Desktop menu button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNoteInfo(note.firebaseId!);
                          }}
                        >
                          <HamburgerMenuIcon className="h-4 w-4" />
                        </Button>
                        {/* Mobile indicator */}
                        <div 
                          className="md:hidden flex items-center text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNoteInfo(note.firebaseId!);
                          }}
                        >
                          <div className="rounded-full p-1.5 hover:bg-muted">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 16v-4" />
                              <path d="M12 8h.01" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    {note.content && (
                      <div className="ml-6 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {getBlockNoteContent(note.content)}
                      </div>
                    )}
                    {/* Mobile touch target for note details - wider area */}
                    <button
                      className="md:hidden absolute right-0 inset-y-0 w-24"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNoteInfo(note.firebaseId!);
                      }}
                    />
                  </div>

                  {/* Note Details Sheet */}
                  <Sheet 
                    open={openNoteIds[note.firebaseId!]} 
                    onOpenChange={(open) => {
                      setOpenNoteIds(prev => ({
                        ...prev,
                        [note.firebaseId!]: open
                      }));
                    }}
                  >
                    <SheetContent side="right" className="w-full sm:max-w-md">
                      <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                            <FolderIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">
                              {note.title || 'Untitled'}
                            </div>
                            <div className="text-xs font-normal text-muted-foreground">
                              In {folder.name}
                            </div>
                          </div>
                        </SheetTitle>
                      </SheetHeader>
                      
                      <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
                        <div className="space-y-6 pb-8">
                          {/* Note Preview */}
                          {note.content && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Preview</h4>
                              <div className="p-4 border rounded-lg">
                                <div className="text-sm text-muted-foreground line-clamp-6 whitespace-pre-wrap">
                                  {getBlockNoteContent(note.content)}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Note Stats */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 border rounded-lg">
                              <div className="text-2xl font-bold">
                                {note.content ? getBlockNoteContent(note.content).split(/\s+/).filter(Boolean).length : 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Words</div>
                            </div>
                            <div className="p-4 border rounded-lg">
                              <div className="text-2xl font-bold">
                                {note.content ? getBlockNoteContent(note.content).split('\n').filter(Boolean).length : 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Lines</div>
                            </div>
                            <div className="p-4 border rounded-lg">
                              <div className="text-2xl font-bold">
                                {(() => {
                                  if (!note.content) return '0';
                                  const parsedText = getBlockNoteContent(note.content);
                                  const charCount = parsedText.length;
                                  if (charCount < 1000) return charCount;
                                  return `${(charCount / 1000).toFixed(1)}K`;
                                })()}
                              </div>
                              <div className="text-xs text-muted-foreground">Characters</div>
                            </div>
                          </div>

                          {/* Note Tags */}
                          {note.tags && note.tags.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Tags</h4>
                              <div className="flex flex-wrap gap-1">
                                {note.tags.map(tag => (
                                  <Badge
                                    key={tag.id}
                                    className="px-2 py-0.5 text-xs"
                                    style={{
                                      backgroundColor: tag.color + '20',
                                      color: tag.color
                                    }}
                                  >
                                    {tag.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Contributors */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Contributors</h4>
                            <div className="space-y-3">
                              {/* Owner */}
                              <div className="flex items-center gap-3 p-3 border rounded-lg">
                                <div className="relative">
                                  {note.ownerPhotoURL ? (
                                    <img
                                      src={note.ownerPhotoURL}
                                      alt={note.ownerDisplayName}
                                      className="w-10 h-10 rounded-full"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                      <span className="text-lg font-medium text-primary">
                                        {note.ownerDisplayName?.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                  <div className="absolute -bottom-1 -right-1 bg-primary text-white text-xs px-1 rounded">
                                    Owner
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {note.ownerDisplayName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Created {formatTimeAgo(note.createdAt)}
                                  </div>
                                </div>
                              </div>

                              {/* Last Editor (if different from owner) */}
                              {note.lastEditedByDisplayName && note.lastEditedByUserId !== note.ownerUserId && (
                                <div className="flex items-center gap-3 p-3 border rounded-lg">
                                  <div className="relative">
                                    {note.lastEditedByPhotoURL ? (
                                      <img
                                        src={note.lastEditedByPhotoURL}
                                        alt={note.lastEditedByDisplayName}
                                        className="w-10 h-10 rounded-full"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-lg font-medium text-primary">
                                          {note.lastEditedByDisplayName?.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 bg-muted-foreground text-white text-xs px-1 rounded">
                                      Editor
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">
                                      {note.lastEditedByDisplayName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Modified {formatTimeAgo(note.updatedAt)}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Note Activity */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Activity</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <PencilIcon className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium">Created</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(note.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4 text-primary"
                                  >
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium">Last Modified</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(note.updatedAt).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <Button
                              className="w-full justify-start"
                              onClick={() => {
                                toggleNoteInfo(note.firebaseId!);
                                navigate(`/notes/${note.firebaseId}`);
                              }}
                            >
                              <PencilIcon className="h-4 w-4 mr-2" />
                              Open Note
                            </Button>
                            {note.ownerUserId === user?.uid && (
                              <Button
                                variant="destructive"
                                className="w-full justify-start"
                                onClick={async () => {
                                  try {
                                    await db.deleteNote(note.firebaseId!);
                                    toggleNoteInfo(note.firebaseId!);
                                    toast({
                                      title: "Note deleted",
                                      description: "The note has been permanently deleted"
                                    });
                                  } catch (error) {
                                    console.error('Error deleting note:', error);
                                    toast({
                                      title: "Error",
                                      description: "Failed to delete note",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              >
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Delete Note
                              </Button>
                            )}
                          </div>
                        </div>
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>
                </div>
              ))}
            </div>
          )}

          {/* Subfolders */}
          {folder.children.map(childFolder => (
            <FolderTreeItem
              key={`folder-${childFolder.id}`}
              folder={childFolder}
              level={level + 1}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateSubfolder={onCreateSubfolder}
              notes={notes}
              isCompact={isCompact}
            />
          ))}
        </div>
      )}

      {/* Folder Info Sheet */}
      <Sheet open={showInfo} onOpenChange={setShowInfo}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: folder.color + '20' }}
              >
                <FolderIcon className="h-5 w-5" style={{ color: folder.color }} />
              </div>
              {folder.name}
            </SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
            <div className="space-y-6 pb-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{folderNotes.length}</div>
                  <div className="text-xs text-muted-foreground">Notes</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{folder.children.length}</div>
                  <div className="text-xs text-muted-foreground">Subfolders</div>
                </div>
              </div>

              {folderNotes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Recent Notes</h4>
                  <div className="space-y-2">
                    {folderNotes
                      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                      .slice(0, 5)
                      .map(note => (
                        <div
                          key={`sheet-note-${folder.id}-${note.firebaseId}`}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            setShowInfo(false);
                            navigate(`/notes/${note.firebaseId}`);
                          }}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <FolderIcon className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {note.title || 'Untitled'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Updated {formatTimeAgo(note.updatedAt)}
                                </div>
                              </div>
                            </div>
                            {note.content && (
                              <div className="ml-7 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {getBlockNoteContent(note.content)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{formatTimeAgo(folder.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last updated</span>
                    <span>{formatTimeAgo(folder.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Owner</span>
                    <span>{folder.ownerDisplayName}</span>
                  </div>
                </div>
              </div>

              {folder.ownerUserId === user?.uid && (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setShowInfo(false);
                      onEdit(folder);
                    }}
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Rename Folder
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => {
                      setShowInfo(false);
                      onDelete(folder.id);
                    }}
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete Folder
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

const FolderSkeleton = ({ level = 0 }: { level?: number }) => (
  <div className={cn("py-2 px-3", level > 0 && "ml-6")}>
    <div className="flex items-center gap-2">
      <Skeleton className="h-6 w-6 rounded-full" />
      <Skeleton className="h-6 w-6 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  </div>
);

export default function Folders() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#4f46e5');
  const [selectedFolder, setSelectedFolder] = useState<FolderNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearch, setIsMobileSearch] = useState(false);

  const loadData = async () => {
    try {
      const [userFolders, userNotes] = await Promise.all([
        db.getFolders(),
        db.notes.toArray()
      ]);

      // Create a map of folder IDs to notes
      const folderNotesMap = new Map<string | undefined, Note[]>();
      userNotes.forEach(note => {
        const folderId = note.folderId;
        if (!folderNotesMap.has(folderId)) {
          folderNotesMap.set(folderId, []);
        }
        folderNotesMap.get(folderId)!.push(note);
      });

      // Convert flat structure to tree
      const folderMap = new Map<string, FolderNode>();
      const rootFolders: FolderNode[] = [];

      // First pass: Create all folder nodes
      userFolders.forEach(folder => {
        folderMap.set(folder.id, { 
          ...folder, 
          children: [],
          isExpanded: false // Ensure isExpanded is always initialized
        });
      });

      // Second pass: Build the tree structure
      userFolders.forEach(folder => {
        const node = folderMap.get(folder.id)!;
        if (folder.parentId) {
          const parent = folderMap.get(folder.parentId);
          if (parent) {
            parent.children.push(node);
          } else {
            rootFolders.push(node);
          }
        } else {
          rootFolders.push(node);
        }
      });

      // Sort folders alphabetically
      const sortFolders = (folders: FolderNode[]): FolderNode[] => {
        return folders.sort((a, b) => a.name.localeCompare(b.name)).map(folder => ({
          ...folder,
          children: sortFolders(folder.children)
        }));
      };

      setFolders(sortFolders(rootFolders));
      setNotes(userNotes);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load folders and notes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const toggleFolder = (folderId: string) => {
    const toggleNode = (nodes: FolderNode[]): FolderNode[] => {
      return nodes.map(node => {
        if (node.id === folderId) {
          return { ...node, isExpanded: !node.isExpanded };
        }
        if (node.children.length > 0) {
          return { ...node, children: toggleNode(node.children) };
        }
        return node;
      });
    };

    setFolders(toggleNode(folders));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const folderData: Partial<Folder> = {
        name: newFolderName.trim(),
        color: newFolderColor,
      };

      if (selectedFolder?.id) {
        folderData.parentId = selectedFolder.id;
      }

      await db.createFolder(folderData);
      setNewFolderName('');
      setNewFolderColor('#4f46e5');
      setIsCreatingFolder(false);
      setSelectedFolder(null);
      await loadData(); // Reload data after creating folder
      toast({
        title: "Folder created",
        description: "Your new folder has been created successfully"
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive"
      });
    }
  };

  const handleEditFolder = async () => {
    if (!selectedFolder || !newFolderName.trim()) return;

    try {
      await db.updateFolder(selectedFolder.id, {
        name: newFolderName.trim(),
        color: newFolderColor
      });
      setNewFolderName('');
      setNewFolderColor('#4f46e5');
      setIsEditingFolder(false);
      setSelectedFolder(null);
      await loadData(); // Reload data after editing folder
      toast({
        title: "Folder updated",
        description: "Your folder has been updated successfully"
      });
    } catch (error) {
      console.error('Error updating folder:', error);
      toast({
        title: "Error",
        description: "Failed to update folder",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await db.deleteFolder(folderId);
      setFolderToDelete(null);
      if (selectedFolder?.id === folderId) {
        setSelectedFolder(null);
      }
      await loadData(); // Reload data after deleting folder
      toast({
        title: "Folder deleted",
        description: "The folder has been deleted and its notes moved to root"
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive"
      });
    }
  };

  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Mobile Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center gap-4 h-14 px-4">
          {isMobileSearch ? (
            <div className="flex-1 flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => setIsMobileSearch(false)}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </Button>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search folders..."
                className="h-9"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setSearchQuery('')}
                >
                  <Cross2Icon className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold">Folders</h1>
                <p className="text-sm text-muted-foreground">
                  {folders.length} folders • {notes.length} notes
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileSearch(true)}
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HamburgerMenuIcon className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[400px]">
                  <SheetHeader>
                    <SheetTitle>Options</SheetTitle>
                  </SheetHeader>
                  <div className="grid gap-4 py-4">
                    <Button
                      className="w-full justify-start"
                      onClick={() => navigate('/notes/new')}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      New Note
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedFolder(null);
                        setIsCreatingFolder(true);
                      }}
                    >
                      <FolderIcon className="h-4 w-4 mr-2" />
                      New Folder
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </header>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between gap-4 px-4 py-6">
        <div className="flex-1 max-w-md">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search folders..."
            className="h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/notes/new')}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Note
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedFolder(null);
              setIsCreatingFolder(true);
            }}
          >
            <FolderIcon className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>
      </div>

      {/* Folders List */}
      <ScrollArea className="flex-1 px-4">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <FolderSkeleton key={i} level={i % 2} />
            ))}
          </div>
        ) : filteredFolders.length > 0 ? (
          <div className="space-y-1 pb-8">
            {filteredFolders.map(folder => (
              <FolderTreeItem
                key={folder.id}
                folder={folder}
                onToggle={toggleFolder}
                onEdit={(folder) => {
                  setSelectedFolder(folder);
                  setNewFolderName(folder.name);
                  setNewFolderColor(folder.color || '#4f46e5');
                  setIsEditingFolder(true);
                }}
                onDelete={(folderId) => setFolderToDelete(folderId)}
                onCreateSubfolder={(folder) => {
                  setSelectedFolder(folder);
                  setNewFolderName('');
                  setNewFolderColor(folder.color || '#4f46e5');
                  setIsCreatingFolder(true);
                }}
                notes={notes}
                isCompact={false}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center px-4">
            {searchQuery ? (
              <>
                <FolderIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No folders found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try searching with different keywords
                </p>
              </>
            ) : (
              <>
                <FolderIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No folders yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first folder to organize your notes
                </p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setSelectedFolder(null);
                    setIsCreatingFolder(true);
                  }}
                >
                  <FolderIcon className="h-4 w-4 mr-2" />
                  Create Folder
                </Button>
              </>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Create/Edit Folder Dialog */}
      <Dialog 
        open={isCreatingFolder || isEditingFolder} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreatingFolder(false);
            setIsEditingFolder(false);
            setNewFolderName('');
            setNewFolderColor('#4f46e5');
            setSelectedFolder(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditingFolder ? 'Edit Folder' : 'Create New Folder'}
            </DialogTitle>
            <DialogDescription>
              {isEditingFolder 
                ? "Update the folder's name and color"
                : selectedFolder
                  ? `Create a new folder inside ${selectedFolder.name}`
                  : "Create a new root folder"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="grid grid-cols-6 gap-2">
                {[
                  '#ef4444', // Red
                  '#f97316', // Orange
                  '#f59e0b', // Amber
                  '#eab308', // Yellow
                  '#84cc16', // Lime
                  '#22c55e', // Green
                  '#10b981', // Emerald
                  '#14b8a6', // Teal
                  '#06b6d4', // Cyan
                  '#0ea5e9', // Sky
                  '#3b82f6', // Blue
                  '#6366f1', // Indigo
                  '#8b5cf6', // Violet
                  '#a855f7', // Purple
                  '#d946ef', // Fuchsia
                  '#ec4899', // Pink
                  '#f43f5e', // Rose
                  '#64748b', // Slate
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-6 w-6 rounded-md border border-muted transition-all hover:scale-110",
                      newFolderColor === color && "ring-2 ring-primary ring-offset-2"
                    )}
                    style={{ 
                      backgroundColor: color,
                      borderColor: color
                    }}
                    onClick={() => setNewFolderColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: newFolderColor + '20' }}
              >
                <FolderIcon className="w-5 h-5" style={{ color: newFolderColor }} />
              </div>
              <div className="flex-1">
                <div className="font-medium" style={{ color: newFolderColor }}>
                  {newFolderName || 'Untitled Folder'}
                </div>
                {selectedFolder && !isEditingFolder && (
                  <div className="text-xs text-muted-foreground">
                    Inside {selectedFolder.name}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewFolderName('');
                setNewFolderColor('#4f46e5');
                setIsCreatingFolder(false);
                setIsEditingFolder(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={isEditingFolder ? handleEditFolder : handleCreateFolder}>
              {isEditingFolder ? 'Save Changes' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Dialog */}
      <AlertDialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this folder? All notes inside will be moved to root.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => folderToDelete && handleDeleteFolder(folderToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 