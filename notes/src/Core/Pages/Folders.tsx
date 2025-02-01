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
import { FolderIcon, TrashIcon, PencilIcon, ChevronLeftIcon, ArrowRightIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatTimeAgo } from '../utils/noteUtils';

interface FolderNode extends Folder {
  children: FolderNode[];
  isExpanded?: boolean;
}

export default function Folders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#4f46e5');
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(undefined);
  const [selectedFolder, setSelectedFolder] = useState<FolderNode | null>(null);
  const [folderPath, setFolderPath] = useState<FolderNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  // Load folders and notes
  useEffect(() => {
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
          folderMap.set(folder.id, { ...folder, children: [], isExpanded: false });
        });

        // Second pass: Build the tree structure
        userFolders.forEach(folder => {
          const node = folderMap.get(folder.id)!;
          if (folder.parentId) {
            const parent = folderMap.get(folder.parentId);
            if (parent) {
              parent.children.push(node);
            }
          } else {
            rootFolders.push(node);
          }
        });

        setFolders(rootFolders);
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

    loadData();
  }, []);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await db.createFolder({
        name: newFolderName.trim(),
        color: newFolderColor,
        parentId: selectedParentId || undefined
      });
      setNewFolderName('');
      setNewFolderColor('#4f46e5');
      setSelectedParentId('');
      setIsCreatingFolder(false);
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
        setFolderPath([]);
      }
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

  const handleFolderClick = (folder: FolderNode) => {
    setSelectedFolder(folder);
    // Update folder path
    const newPath = [...folderPath];
    const existingIndex = newPath.findIndex((f: FolderNode) => f.id === folder.id);
    if (existingIndex !== -1) {
      // If clicking a folder in the path, trim to that point
      newPath.splice(existingIndex + 1);
    } else {
      newPath.push(folder);
    }
    setFolderPath(newPath);
    setSelectedParentId(folder.id);
  };

  const navigateToParent = () => {
    if (folderPath.length > 1) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      setSelectedFolder(newPath[newPath.length - 1]);
    } else {
      setFolderPath([]);
      setSelectedFolder(null);
    }
  };

  const getFolderNotes = (folderId: string) => {
    return notes.filter(note => note.folderId === folderId);
  };

  const getChildFolders = (folderId: string) => {
    const findChildren = (nodes: FolderNode[]): FolderNode[] => {
      for (const node of nodes) {
        if (node.id === folderId) {
          return node.children;
        }
        const found = findChildren(node.children);
        if (found.length > 0) {
          return found;
        }
      }
      return [];
    };
    return findChildren(folders);
  };

  const renderFolderContent = () => {
    if (!selectedFolder) return null;

    const folderNotes = getFolderNotes(selectedFolder.id);
    const childFolders = getChildFolders(selectedFolder.id);

    return (
      <div className="space-y-6">
        {childFolders.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Subfolders</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {childFolders.map(folder => (
                <Card
                  key={folder.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleFolderClick(folder)}
                >
                  <div className="flex items-center gap-2">
                    <FolderIcon className="h-5 w-5" style={{ color: folder.color }} />
                    <span className="font-medium">{folder.name}</span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {getFolderNotes(folder.id).length} notes
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {folderNotes.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
            <div className="grid grid-cols-1 gap-4">
              {folderNotes.map(note => (
                <Card
                  key={note.firebaseId}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/notes/${note.firebaseId}`)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{note.title || 'Untitled'}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {formatTimeAgo(note.updatedAt)}
                      </Badge>
                      <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.map(tag => (
                        <Badge
                          key={tag.id}
                          className="text-xs"
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
                </Card>
              ))}
            </div>
          </div>
        )}

        {childFolders.length === 0 && folderNotes.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <FolderIcon className="mx-auto h-12 w-12 mb-4" />
            <h3 className="font-semibold mb-2">Empty folder</h3>
            <p>This folder has no notes or subfolders yet</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Folders</h1>
          <p className="text-muted-foreground">
            Organize your notes in a hierarchical structure
          </p>
        </div>
        <Button onClick={() => setIsCreatingFolder(true)}>
          <PlusIcon className="mr-2 h-4 w-4" /> New Folder
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Folder Tree */}
        <Card className="lg:col-span-1 p-4">
          <ScrollArea className="h-[calc(100vh-16rem)]">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : folders.length > 0 ? (
              <div className="space-y-2">
                {folders.map(folder => (
                  <div
                    key={folder.id}
                    className={cn(
                      "group flex items-center gap-2 p-2 hover:bg-muted rounded-lg cursor-pointer",
                      selectedFolder?.id === folder.id && "bg-muted"
                    )}
                    onClick={() => handleFolderClick(folder)}
                  >
                    <FolderIcon 
                      className="h-4 w-4" 
                      style={{ color: folder.color }} 
                    />
                    <span className="flex-1">{folder.name}</span>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFolder(folder);
                          setNewFolderName(folder.name);
                          setNewFolderColor(folder.color);
                          setIsEditingFolder(true);
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      
                      {folder.ownerUserId === user?.uid && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFolderToDelete(folder.id);
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <FolderIcon className="mx-auto h-12 w-12 mb-4" />
                <h3 className="font-semibold mb-2">No folders yet</h3>
                <p>Create your first folder to organize your notes</p>
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Folder Content */}
        <Card className="lg:col-span-2 p-4">
          <ScrollArea className="h-[calc(100vh-16rem)]">
            {selectedFolder ? (
              <div className="space-y-4">
                {/* Folder Path */}
                <div className="flex items-center gap-2 pb-4 border-b">
                  {folderPath.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={navigateToParent}
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="flex items-center gap-2">
                    {folderPath.map((folder, index) => (
                      <div key={folder.id} className="flex items-center">
                        {index > 0 && <ChevronRightIcon className="h-4 w-4 mx-1 text-muted-foreground" />}
                        <Button
                          variant="ghost"
                          className="h-8"
                          onClick={() => handleFolderClick(folder)}
                        >
                          <FolderIcon 
                            className="h-4 w-4 mr-2" 
                            style={{ color: folder.color }} 
                          />
                          {folder.name}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {renderFolderContent()}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <FolderIcon className="mx-auto h-12 w-12 mb-4" />
                <h3 className="font-semibold mb-2">Select a folder</h3>
                <p>Choose a folder to view its contents</p>
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={isCreatingFolder} onOpenChange={setIsCreatingFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              {selectedParentId 
                ? "Create a subfolder to organize your notes"
                : "Create a root folder to organize your notes"
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
                <div className="text-xs text-muted-foreground">
                  {selectedParentId 
                    ? `Subfolder of ${folders.find(f => f.id === selectedParentId)?.name}`
                    : 'Root folder'
                  }
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewFolderName('');
                setNewFolderColor('#4f46e5');
                setSelectedParentId('');
                setIsCreatingFolder(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={isEditingFolder} onOpenChange={setIsEditingFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Update the folder's name and color
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
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewFolderName('');
                setNewFolderColor('#4f46e5');
                setIsEditingFolder(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditFolder}>
              Save Changes
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