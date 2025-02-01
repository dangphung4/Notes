import { useState, useEffect } from 'react';
import { Folder, Note } from '../Database/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PlusIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { useAuth } from '../Auth/AuthContext';
import { db } from '../Database/db';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { FolderIcon, TrashIcon, PencilIcon, FileTextIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { formatTimeAgo } from '../utils/noteUtils';

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

const FolderTreeItem = ({ 
  folder, 
  level = 0,
  onToggle,
  onEdit,
  onDelete,
  onCreateSubfolder,
  notes
}: { 
  folder: FolderNode;
  level?: number;
  onToggle: (folderId: string) => void;
  onEdit: (folder: FolderNode) => void;
  onDelete: (folderId: string) => void;
  onCreateSubfolder: (folder: FolderNode) => void;
  notes: Note[];
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const folderNotes = notes.filter(note => note.folderId === folder.id);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 py-3 px-3 hover:bg-muted/50 rounded-lg cursor-pointer relative transition-all",
          level > 0 && "ml-6",
          folder.isExpanded && "bg-muted/50"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(folder.id);
        }}
      >
        {/* Expand/Collapse Button */}
        <div className="h-6 w-6 shrink-0 flex items-center justify-center">
          <ChevronRightIcon 
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              folder.isExpanded && "rotate-90",
              // Only hide arrow if folder has no children AND no notes
              (folder.children.length === 0 && folderNotes.length === 0) && "opacity-0"
            )}
          />
        </div>
        
        <FolderIcon 
          className="h-4 w-4 shrink-0" 
          style={{ color: folder.color }} 
        />
        <span className="flex-1 truncate font-medium">{folder.name}</span>
        
        <div className="flex items-center gap-3">
          {/* Folder Stats */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-md">
              <FileTextIcon className="h-3.5 w-3.5" />
              <span>{folderNotes.length}</span>
            </div>
            {folder.children.length > 0 && (
              <div className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-md">
                <FolderIcon className="h-3.5 w-3.5" />
                <span>{folder.children.length}</span>
              </div>
            )}
          </div>

          {/* Actions - Always visible on mobile */}
          {folder.ownerUserId === user?.uid && (
            <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/notes/new', { state: { folderId: folder.id } });
                }}
              >
                <PlusIcon className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateSubfolder(folder);
                }}
              >
                <FolderIcon className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(folder);
                }}
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(folder.id);
                }}
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {folder.isExpanded && (
        <div>
          {/* Notes in this folder */}
          {folderNotes.length > 0 && (
            <div className="ml-12 space-y-2 mt-2">
              {folderNotes.map(note => (
                <div
                  key={note.firebaseId}
                  className="flex flex-col gap-2 p-3 hover:bg-muted/50 rounded-lg cursor-pointer text-sm group transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/notes/${note.firebaseId}`);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="flex-1 font-medium truncate">
                      {note.title || 'Untitled'}
                    </span>
                    <div className="flex items-center gap-2 text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <span className="text-xs bg-muted/50 px-2 py-0.5 rounded-md">
                        {formatTimeAgo(note.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Note Preview */}
                  <div className="ml-8 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {note.content ? getBlockNoteContent(note.content) : 'Empty note'}
                  </div>

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="ml-8 flex flex-wrap gap-1 mt-1">
                      {note.tags.map(tag => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4"
                          style={{
                            backgroundColor: tag.color + '20',
                            color: tag.color
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Subfolders */}
          {folder.children.map(childFolder => (
            <FolderTreeItem
              key={childFolder.id}
              folder={childFolder}
              level={level + 1}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateSubfolder={onCreateSubfolder}
              notes={notes}
            />
          ))}
        </div>
      )}

      {/* Folder Info Dialog */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderIcon className="h-5 w-5" style={{ color: folder.color }} />
              {folder.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-3">
                <div className="text-2xl font-bold">{folderNotes.length}</div>
                <div className="text-xs text-muted-foreground">Notes</div>
              </Card>
              <Card className="p-3">
                <div className="text-2xl font-bold">{folder.children.length}</div>
                <div className="text-xs text-muted-foreground">Subfolders</div>
              </Card>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Details</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Created</span>
                  <span>{formatTimeAgo(folder.createdAt)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Last updated</span>
                  <span>{formatTimeAgo(folder.updatedAt)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Owner</span>
                  <span>{folder.ownerDisplayName}</span>
                </div>
              </div>
            </div>

            {folderNotes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recent Notes</h4>
                <div className="space-y-1">
                  {folderNotes
                    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                    .slice(0, 3)
                    .map(note => (
                      <div
                        key={note.firebaseId}
                        className="flex items-center justify-between text-sm p-2 hover:bg-muted rounded-lg cursor-pointer"
                        onClick={() => {
                          setShowInfo(false);
                          navigate(`/notes/${note.firebaseId}`);
                        }}
                      >
                        <span className="truncate">{note.title || 'Untitled'}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(note.updatedAt)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const getBlockNoteContent = (jsonString: string) => {
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

  const loadData = async () => {
    try {
      const [userFolders, userNotes] = await Promise.all([
        db.getFolders(),
        db.notes.toArray()
      ]);

      // Convert flat structure to tree
      const folderMap = new Map<string, FolderNode>();
      const rootFolders: FolderNode[] = [];

      // First pass: Create all folder nodes
      userFolders.forEach(folder => {
        folderMap.set(folder.id, { ...folder, children: [] });
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

  return (
    <div className="container max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Folders</h1>
          <p className="text-muted-foreground mt-1">
            Organize your notes in a hierarchical structure
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            size="lg"
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            onClick={() => navigate('/notes/new')}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Note
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto border-dashed"
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

      <Card className="p-4 border-dashed">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : folders.length > 0 ? (
          <div className="space-y-1">
            {folders.map(folder => (
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
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            <FolderIcon className="mx-auto h-16 w-16 mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">No folders yet</h3>
            <p>Create your first folder to organize your notes</p>
          </div>
        )}
      </Card>

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