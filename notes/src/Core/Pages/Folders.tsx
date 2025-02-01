import { useState, useEffect } from 'react';
import { Folder } from '../Database/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PlusIcon, ChevronRightIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import { useAuth } from '../Auth/AuthContext';
import { db } from '../Database/db';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { FolderIcon, TrashIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface FolderNode extends Folder {
  children: FolderNode[];
  isExpanded?: boolean;
}

export default function Folders() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#4f46e5');
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  // Load folders
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const userFolders = await db.getFolders();
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
      } catch (error) {
        console.error('Error loading folders:', error);
        toast({
          title: "Error",
          description: "Failed to load folders",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFolders();
  }, []);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await db.createFolder({
        name: newFolderName.trim(),
        color: newFolderColor,
        parentId: selectedParentId
      });
      setNewFolderName('');
      setNewFolderColor('#4f46e5');
      setSelectedParentId(undefined);
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

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await db.deleteFolder(folderId);
      setFolderToDelete(null);
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

  const renderFolderTree = (nodes: FolderNode[], level = 0) => {
    return nodes.map(folder => (
      <div key={folder.id} className="animate-in fade-in-50">
        <div 
          className={cn(
            "group flex items-center gap-2 p-2 hover:bg-muted rounded-lg cursor-pointer",
            level > 0 && "ml-6"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => toggleFolder(folder.id)}
          >
            {folder.children.length > 0 && (
              folder.isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )
            )}
          </Button>
          
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
                setSelectedParentId(folder.id);
                setIsCreatingFolder(true);
              }}
            >
              <PlusIcon className="h-4 w-4" />
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
        
        {folder.isExpanded && folder.children.length > 0 && (
          <div className="mt-1">
            {renderFolderTree(folder.children, level + 1)}
          </div>
        )}
      </div>
    ));
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

      <Card className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : folders.length > 0 ? (
          renderFolderTree(folders)
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <FolderIcon className="mx-auto h-12 w-12 mb-4" />
            <h3 className="font-semibold mb-2">No folders yet</h3>
            <p>Create your first folder to organize your notes</p>
          </div>
        )}
      </Card>

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
                setSelectedParentId(undefined);
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