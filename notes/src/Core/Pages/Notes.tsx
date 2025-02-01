/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { SharePermission, Folder } from '../Database/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PlusIcon, MagnifyingGlassIcon, AvatarIcon, FileTextIcon, Share2Icon, ChevronRightIcon, TrashIcon } from '@radix-ui/react-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { onSnapshot, collection, query, where, getDocs, documentId, deleteDoc, doc } from 'firebase/firestore';
import { db as firestore } from '../Auth/firebase';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPreviewText, formatTimeAgo } from '../utils/noteUtils';
import type { Note, Tags } from '../Database/db';
import { LayoutGridIcon, LayoutListIcon, FolderIcon, FolderPlusIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, XIcon } from "lucide-react";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { PinIcon } from 'lucide-react';
import { InfoIcon } from 'lucide-react';
import { db } from '../Database/db';
import { TagSelector } from '@/components/TagSelector';
import { TagIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { XCircleIcon } from 'lucide-react';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { BarChart2Icon, ClockIcon, UserIcon, ActivityIcon, LinkIcon } from 'lucide-react';
import ShareDialog from '../Components/ShareDialog';
import { cn } from "@/lib/utils";

interface StoredNotesPreferences {
  activeTab: 'my-notes' | 'shared';
  view: 'grid' | 'list';
  sortBy: 'updated' | 'created' | 'title';
  selectedTags: string[];
  selectedTagFilters: Tags[];
  searchQuery: string;
  dateFilter?: string;
  selectedFolderId?: string;
}

const getBlockNoteContent = (jsonString: string) => {
  try {
    const blocks = JSON.parse(jsonString);
    let text = '';
    
    const extractText = (block: any) => {
      // Check if block has content array
      if (Array.isArray(block.content)) {
        block.content.forEach((item: any) => {
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

const getReadingLevel = (text: string) => {
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const syllables = words.reduce((count, word) => {
    return count + (word.match(/[aeiouy]{1,2}/gi)?.length || 1);
  }, 0);
  
  // Flesch-Kincaid Grade Level
  const level = 0.39 * (words.length / sentences.length) 
    + 11.8 * (syllables / words.length) - 15.59;
    
  return Math.max(1, Math.min(12, Math.round(level))); // Clamp between 1-12
};

const getRelatedNotes = (notes: Note[], currentNote: Note) => {
  if (!currentNote.tags?.length) return [];
  
  return notes
    .filter(note => 
      note.firebaseId !== currentNote.firebaseId && 
      note.tags?.some(tag => 
        currentNote.tags?.some(currentTag => currentTag.id === tag.id)
      )
    )
    .slice(0, 3);
};

const hasEditAccess = (note: Note, user: any, shares: SharePermission[]) => {
  if (!user) return false;
  if (note.ownerUserId === user.uid) return true;
  return shares.some(share => 
    share.noteId === note.firebaseId && 
    share.email === user.email && 
    share.access === 'edit'
  );
};

const NoteCard = ({ 
  note, 
  shares, 
  user, 
  view, 
  onClick,
  allNotes,
  navigate,
  folders
}: { 
  note: Note, 
  shares: SharePermission[], 
  user: any, 
  view: 'grid' | 'list',
  onClick: () => void,
  allNotes: Note[],
  navigate: (path: string) => void,
  folders: Folder[]
}) => {
  const isOwner = note.ownerUserId === user?.uid;
  const [noteShares, setNoteShares] = useState<SharePermission[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const hasShares = noteShares.length > 0;
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tags[]>(note.tags || []);
  const [localNote, setLocalNote] = useState<Note>(note);

  // Add function to load shares
  const loadShares = async () => {
    if (!note.firebaseId) return;
    
    setIsLoadingShares(true);
    try {
      const sharesRef = collection(firestore, 'shares');
      const sharesQuery = query(sharesRef, where('noteId', '==', note.firebaseId));
      const snapshot = await getDocs(sharesQuery);
      
      const sharesList = snapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email,
        displayName: doc.data().displayName,
        photoURL: doc.data().photoURL,
        access: doc.data().access,
        noteId: doc.data().noteId,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      
      setNoteShares(sharesList as SharePermission[]);
    } catch (error) {
      console.error('Error loading shares:', error);
    } finally {
      setIsLoadingShares(false);
    }
  };

  // Load shares when sheet opens
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  useEffect(() => {
    if (isSheetOpen) {
      loadShares();
    }
  }, [isSheetOpen, note.firebaseId]);

  // Update local state when note prop changes
  useEffect(() => {
    setLocalNote(note);
    setSelectedTags(note.tags || []);
  }, [note]);

  const handlePinClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await db.toggleNotePin(note.firebaseId!, !note.isPinned);
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  return (
    <Card className={`group hover:shadow-lg transition-all relative
      ${localNote.isPinned && note.ownerUserId === user?.uid ? 'border-primary/50' : ''}`}
    >
      {/* Action buttons - position absolute */}
      <div className="absolute right-2 top-2 z-10 flex gap-2">
        {/* Only show pin button if user is the owner */}
        {note.ownerUserId === user?.uid && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handlePinClick(e);
            }}
          >
            <PinIcon 
              className={`h-4 w-4 ${localNote.isPinned ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </Button>
        )}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setIsSheetOpen(true);
              }}
            >
              <InfoIcon className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-[440px] px-2 sm:px-6"
          >
            <SheetHeader>
              <SheetTitle>Note Details</SheetTitle>
              <SheetDescription>
                View insights and details about this note
              </SheetDescription>
            </SheetHeader>
            
            <ScrollArea 
              className="h-[calc(100vh-8rem)] mt-6 pr-2 sm:pr-4"
            >
              <div className="space-y-6">
                {/* Note Stats Section */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <BarChart2Icon className="h-4 w-4 text-primary" />
                    Note Statistics
                  </h4>

                  {/* Add Folder Selection */}
                  {hasEditAccess(note, user, shares) && (
                    <div className="mb-4">
                      <div className="text-sm text-muted-foreground mb-2">Folder</div>
                      <Select
                        value={localNote.folderId || "root"}
                        onValueChange={async (value) => {
                          try {
                            const newFolderId = value === "root" ? undefined : value;
                            await db.updateNote(note.firebaseId!, { folderId: newFolderId });
                            setLocalNote(prev => ({
                              ...prev,
                              folderId: newFolderId
                            }));
                            toast({
                              title: "Folder updated",
                              description: "Note has been moved to the selected folder"
                            });
                          } catch (error) {
                            console.error('Error updating folder:', error);
                            toast({
                              title: "Error",
                              description: "Failed to update folder",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <FolderIcon className="h-4 w-4" style={{ 
                                color: localNote.folderId ? 
                                  folders.find((f: Folder) => f.id === localNote.folderId)?.color : undefined 
                              }} />
                              {localNote.folderId ? 
                                folders.find((f: Folder) => f.id === localNote.folderId)?.name || "Select folder" : 
                                "Root"
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
                          {folders.map((folder: Folder) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              <div className="flex items-center gap-2">
                                <FolderIcon className="h-4 w-4" style={{ color: folder.color }} />
                                {folder.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-3">
                      <div className="text-2xl font-bold">
                        {getBlockNoteContent(localNote.content).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Characters</div>
                    </Card>
                    <Card className="p-3">
                      <div className="text-2xl font-bold">
                        {getBlockNoteContent(localNote.content).split(/\s+/).filter(Boolean).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Words</div>
                    </Card>
                    <Card className="p-3">
                      <div className="text-2xl font-bold">
                        {getBlockNoteContent(localNote.content).split('\n').filter(Boolean).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Lines</div>
                    </Card>
                    <Card className="p-3">
                      <div className="text-2xl font-bold">
                        {Math.ceil(getBlockNoteContent(localNote.content).split(/\s+/).filter(Boolean).length / 200)}
                      </div>
                      <div className="text-xs text-muted-foreground">Min Read</div>
                    </Card>
                    <Card className="p-3">
                      <div className="text-2xl font-bold">
                        {getBlockNoteContent(localNote.content).split('.').filter(Boolean).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Sentences</div>
                    </Card>
                    <Card className="p-3">
                      <div className="text-2xl font-bold">
                        {getBlockNoteContent(localNote.content).split(/\n\s*\n/).filter(Boolean).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Paragraphs</div>
                    </Card>
                  </div>
                </div>

                {/* Reading Level Analysis */}
                <Card className="mt-4 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Reading Level</div>
                    <div className="text-2xl font-bold">
                      Grade {getReadingLevel(getBlockNoteContent(localNote.content))}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Based on Flesch-Kincaid Grade Level
                  </div>
                </Card>

                {/* Tags Section */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-primary" />
                    Tags
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {localNote.tags && localNote.tags.length > 0 ? (
                        localNote.tags.map(tag => (
                          <div
                            key={tag.id}
                            className="px-2 py-0.5 rounded-full text-xs"
                            style={{
                              backgroundColor: tag.color + '20',
                              color: tag.color
                            }}
                          >
                            {tag.name}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No tags added yet</p>
                      )}
                    </div>
                    {hasEditAccess(note, user, shares) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingTags(true);
                        }}
                      >
                        {localNote.tags?.length ? 'Edit Tags' : 'Add Tags'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Timeline Section */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-primary" />
                    Timeline
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Created</span>
                      <span className="ml-auto">{formatTimeAgo(localNote.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Last updated</span>
                      <span className="ml-auto">{formatTimeAgo(localNote.updatedAt)}</span>
                    </div>
                    {localNote.lastEditedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        <span className="text-muted-foreground">Last edited</span>
                        <span className="ml-auto">{formatTimeAgo(localNote.lastEditedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ownership & Sharing Section */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-primary" />
                    Ownership & Sharing
                  </h4>
                  <Card className="p-4 space-y-4">
                    {/* Owner Info */}
                    <div className="flex items-center gap-3">
                      {localNote.ownerPhotoURL ? (
                        <img 
                          src={localNote.ownerPhotoURL} 
                          alt={localNote.ownerDisplayName}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <UserIcon className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{localNote.ownerDisplayName}</div>
                        <div className="text-xs text-muted-foreground truncate">{localNote.ownerEmail}</div>
                      </div>
                      <Badge variant="secondary">Owner</Badge>
                    </div>

                    {/* Share Button */}
                    {hasEditAccess(note, user, shares) && (
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm text-muted-foreground">Share this note</span>
                        <ShareDialog 
                          note={note}
                          onShare={() => {
                            loadShares(); // Reload shares after new share is added
                            toast({
                              title: "Note shared",
                              description: "The note has been shared successfully"
                            });
                          }}
                          onError={(error) => {
                            toast({
                              title: "Error sharing note",
                              description: error,
                              variant: "destructive"
                            });
                          }}
                        />
                      </div>
                    )}

                    {/* Shared Users List */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="text-sm text-muted-foreground">Shared with</div>
                      <div className="space-y-2">
                        {isLoadingShares ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          </div>
                        ) : noteShares.length > 0 ? (
                          noteShares.map(share => (
                            <div key={share.id} className="flex items-center gap-3">
                              {share.photoURL ? (
                                <img 
                                  src={share.photoURL} 
                                  alt={share.displayName}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                  <UserIcon className="h-4 w-4" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{share.displayName}</div>
                                <div className="text-xs text-muted-foreground truncate">{share.email}</div>
                              </div>
                              <Badge variant="outline">{share.access}</Badge>
                              {note.ownerUserId === user?.uid && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await deleteDoc(doc(firestore, 'shares', share.id!));
                                      await loadShares(); // Reload shares after deletion
                                      toast({
                                        title: "Share removed",
                                        description: "User's access has been removed"
                                      });
                                    } catch (error) {
                                      console.error('Error removing share:', error);
                                      toast({
                                        title: "Error",
                                        description: "Failed to remove share",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                >
                                  <TrashIcon className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground text-center py-2">
                            This note hasn't been shared with anyone yet
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Activity Section */}
                {localNote.lastEditedByUserId && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <ActivityIcon className="h-4 w-4 text-primary" />
                      Recent Activity
                    </h4>
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        {localNote.lastEditedByPhotoURL ? (
                          <img 
                            src={localNote.lastEditedByPhotoURL} 
                            alt={localNote.lastEditedByDisplayName}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <UserIcon className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm">
                            <span className="font-medium">{localNote.lastEditedByDisplayName}</span>
                            <span className="text-muted-foreground"> edited this note</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTimeAgo(localNote.lastEditedAt || localNote.updatedAt)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Pin Status */}
                {localNote.isPinned && note.ownerUserId === user?.uid && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <PinIcon className="h-4 w-4" />
                      <span>This note is pinned to the top</span>
                    </div>
                  </div>
                )}

                {/* Related Notes Section */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-primary" />
                    Related Notes
                  </h4>
                  <div className="space-y-2">
                    {getRelatedNotes(allNotes, localNote).length > 0 ? (
                      getRelatedNotes(allNotes, localNote).map(note => (
                        <Card 
                          key={note.firebaseId} 
                          className="p-3 cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/notes/${note.firebaseId}`)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="font-medium truncate">{note.title || 'Untitled'}</div>
                              <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-1">
                                {note.tags?.map(tag => (
                                  <span
                                    key={tag.id}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                                    style={{
                                      backgroundColor: tag.color + '20',
                                      color: tag.color
                                    }}
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg text-center">
                        No related notes found based on tags
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Add Tag Editor Dialog */}
            <Dialog open={isEditingTags} onOpenChange={setIsEditingTags}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Manage Tags</DialogTitle>
                  <DialogDescription>
                    Add or remove tags from this note
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <TagSelector
                    selectedTags={selectedTags}
                    onTagsChange={async (tags) => {
                      try {
                        await db.updateNoteTags(note.firebaseId!, tags);
                        // Update local state immediately
                        setLocalNote(prev => ({
                          ...prev,
                          tags: tags
                        }));
                        setSelectedTags(tags);
                        toast({
                          title: "Tags updated",
                          description: "Note tags have been updated successfully"
                        });
                      } catch (error) {
                        console.error('Error updating tags:', error);
                        toast({
                          title: "Error",
                          description: "Failed to update tags",
                          variant: "destructive"
                        });
                      }
                    }}
                    onCreateTag={async (tag) => {
                      try {
                        const newTag = await db.createTag(tag);
                        return newTag;
                      } catch (error) {
                        console.error('Error creating tag:', error);
                        toast({
                          title: "Error",
                          description: "Failed to create tag",
                          variant: "destructive"
                        });
                        throw error;
                      }
                    }}
                  />
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setIsEditingTags(false)}>
                    Done
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SheetContent>
        </Sheet>
      </div>

      {/* Clickable area */}
      <div className="cursor-pointer" onClick={onClick}>
        <CardContent className={`p-4 ${view === 'list' ? 'flex gap-4' : 'flex flex-col'} h-full`}>
          {/* Left Section: Title, Owner, Preview */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                {localNote.title || 'Untitled'}
              </h3>
              {hasShares && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                  <Share2Icon className="h-3 w-3" />
                  <span>
                    {isOwner 
                      ? `${noteShares.length} ${noteShares.length === 1 ? 'person' : 'people'}`
                      : 'Shared with you'
                    }
                  </span>
                </div>
              )}
            </div>

            {/* Owner Info - Updated layout */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                {localNote.ownerPhotoURL ? (
                  <img 
                    src={localNote.ownerPhotoURL} 
                    alt={localNote.ownerDisplayName}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <AvatarIcon className="w-5 h-5" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isOwner ? 'You' : localNote.ownerDisplayName}
                </span>
              </div>
            </div>

            {/* Preview - Different styling for list view */}
            {view === 'list' ? (
              <div className="text-sm text-muted-foreground line-clamp-1">
                {getPreviewText(localNote.content, 100).split('\n')[0]}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground space-y-1 line-clamp-4">
                {getPreviewText(localNote.content, 150).split('\n').map((line, i) => (
                  line && (
                    <div 
                      key={i} 
                      className={`
                        ${line.startsWith('#') ? 'font-bold text-base' : ''}
                        ${line.startsWith('•') ? 'pl-4' : ''}
                        ${line.startsWith('1.') ? 'pl-4' : ''}
                        ${line.startsWith('☐') ? 'pl-4' : ''}
                      `}
                    >
                      {line}
                    </div>
                  )
                ))}
              </div>
            )}

            {/* Add tags display */}
            {localNote.tags && localNote.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {localNote.tags.map(tag => (
                  <div
                    key={tag.id}
                    className="px-2 py-0.5 rounded-full text-xs"
                    style={{
                      backgroundColor: tag.color + '20',
                      color: tag.color
                    }}
                  >
                    {tag.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Section for List View - Updated layout */}
          {view === 'list' && (
            <div className="flex flex-col justify-between items-end min-w-[120px] ml-4">
              <div className="text-xs text-muted-foreground">
                {/* commented because its overlapped with the pin and info icon */}
                {/* Created {formatTimeAgo(note.createdAt)} */}
              </div>
              {localNote.lastEditedByUserId && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Edited {formatTimeAgo(localNote.lastEditedAt || localNote.updatedAt)}</span>
                  {localNote.lastEditedByPhotoURL && (
                    <img 
                      src={localNote.lastEditedByPhotoURL} 
                      alt={localNote.lastEditedByDisplayName}
                      className="w-4 h-4 rounded-full"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer for Grid View */}
          {view === 'grid' && (
            <div className="mt-auto pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Created {formatTimeAgo(localNote.createdAt)}</span>
              </div>
              {localNote.lastEditedByUserId && (
                <div className="flex items-center gap-2">
                  {localNote.lastEditedByPhotoURL && (
                    <img 
                      src={localNote.lastEditedByPhotoURL} 
                      alt={localNote.lastEditedByDisplayName}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span>
                    Edited {formatTimeAgo(localNote.lastEditedAt || localNote.updatedAt)}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
};

const groupNotesByDate = (notes: Note[]) => {
  const groups: { [key: string]: Note[] } = {};
  
  notes.forEach(note => {
    const date = new Date(note.updatedAt);
    let groupKey: string;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Yesterday';
    } else if (date.getFullYear() === today.getFullYear()) {
      groupKey = format(date, 'MMMM d');
    } else {
      groupKey = format(date, 'MMMM d, yyyy');
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(note);
  });

  return groups;
};

const NoteSearch = ({ 
  notes, 
  onNoteSelect 
}: { 
  notes: Note[], 
  onNoteSelect: (note: Note) => void 
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const filteredNotes = notes.filter(note => {
    const searchLower = search.toLowerCase();
    return (
      note.title.toLowerCase().includes(searchLower) ||
      note.content?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="w-full max-w-md">
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="w-full justify-start text-sm text-muted-foreground"
      >
        <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
        Search notes...
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search notes..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No notes found.</CommandEmpty>
          <CommandGroup heading="Notes">
            {filteredNotes.map(note => (
              <CommandItem
                key={note.firebaseId}
                value={note.title}
                onSelect={() => {
                  onNoteSelect(note);
                  setOpen(false);
                  setSearch('');
                }}
                className="flex-col items-start gap-1 !py-3"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="h-4 w-4" />
                    <span className="font-medium">{note.title || 'Untitled'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatTimeAgo(note.updatedAt)}</span>
                    {note.isPinned && <PinIcon className="h-3 w-3 text-primary" />}
                  </div>
                </div>

                {/* Owner info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
                  {note.ownerPhotoURL ? (
                    <img 
                      src={note.ownerPhotoURL} 
                      alt={note.ownerDisplayName}
                      className="w-4 h-4 rounded-full"
                    />
                  ) : (
                    <AvatarIcon className="w-4 h-4" />
                  )}
                  <span>{note.ownerDisplayName}</span>
                </div>

                {/* Preview */}
                {note.content && (
                  <div className="ml-6 text-xs text-muted-foreground line-clamp-2 mt-1">
                    {getPreviewText(note.content, 150)}
                  </div>
                )}

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 ml-6 mt-1">
                    {note.tags.map(tag => (
                      <div
                        key={tag.id}
                        className="px-1.5 py-0.5 rounded-full text-[10px]"
                        style={{
                          backgroundColor: tag.color + '20',
                          color: tag.color
                        }}
                      >
                        {tag.name}
                      </div>
                    ))}
                  </div>
                )}

                {note.lastEditedAt &&  note.lastEditedByUserId &&  note.lastEditedByPhotoURL && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
                    {note.lastEditedByPhotoURL && (
                    <img 
                      src={note.lastEditedByPhotoURL} 
                      alt={note.lastEditedByDisplayName}
                      className="w-4 h-4 rounded-full"
                    />
                    )}
                    <span>Edited {formatTimeAgo(note.lastEditedAt)}</span>
                  </div>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
};

/**
 *
 */
export default function Notes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [shares, setShares] = useState<SharePermission[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-notes' | 'shared'>(() => {
    const stored = localStorage.getItem('notes-preferences');
    if (stored) {
      const preferences = JSON.parse(stored) as StoredNotesPreferences;
      return preferences.activeTab;
    }
    return 'my-notes';
  });
  const [view, setView] = useState<'grid' | 'list'>(() => {
    const stored = localStorage.getItem('notes-preferences');
    if (stored) {
      const preferences = JSON.parse(stored) as StoredNotesPreferences;
      return preferences.view;
    }
    return 'grid';
  });
  const [showViewOptions, setShowViewOptions] = useState(false);
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>(() => {
    const stored = localStorage.getItem('notes-preferences');
    if (stored) {
      const preferences = JSON.parse(stored) as StoredNotesPreferences;
      return preferences.sortBy;
    }
    return 'updated';
  });
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const stored = localStorage.getItem('notes-preferences');
    if (stored) {
      const preferences = JSON.parse(stored) as StoredNotesPreferences;
      return preferences.selectedTags;
    }
    return [];
  });
  const [dateFilter, setDateFilter] = useState<Date | undefined>(() => {
    const stored = localStorage.getItem('notes-preferences');
    if (stored) {
      const preferences = JSON.parse(stored) as StoredNotesPreferences;
      return preferences.dateFilter ? new Date(preferences.dateFilter) : undefined;
    }
    return undefined;
  });
  const [selectedTagFilters, setSelectedTagFilters] = useState<Tags[]>(() => {
    const stored = localStorage.getItem('notes-preferences');
    if (stored) {
      const preferences = JSON.parse(stored) as StoredNotesPreferences;
      return preferences.selectedTagFilters;
    }
    return [];
  });
  const [allTags, setAllTags] = useState<Tags[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#4f46e5'); // Default indigo color
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(() => {
    const stored = localStorage.getItem('notes-preferences');
    if (stored) {
      const preferences = JSON.parse(stored) as StoredNotesPreferences;
      return preferences.selectedFolderId;
    }
    return undefined;
  });

  // Persist view preference
  useEffect(() => {
    localStorage.setItem('notes-view', view);
  }, [view]);

  useEffect(() => {
    if (!user) return;

    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Load owned notes
        const notesRef = collection(firestore, 'notes');
        const ownedQuery = query(notesRef, where('ownerUserId', '==', user.uid));
        const ownedSnapshot = await getDocs(ownedQuery);
        
        const ownedNotes = ownedSnapshot.docs.map(doc => ({
          ...doc.data(),
          firebaseId: doc.id,
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          lastEditedAt: doc.data().lastEditedAt?.toDate()
        })) as Note[];

        // Load all shares for owned notes
        const sharesRef = collection(firestore, 'shares');
        const ownedNotesShares = query(
          sharesRef, 
          where('noteId', 'in', ownedNotes.map(note => note.firebaseId))
        );
        
        // Load shares where current user is recipient
        const sharedWithMeQuery = query(
          sharesRef,
          where('email', '==', user.email)
        );

        // Get both share types
        const [ownedSharesSnapshot, sharedWithMeSnapshot] = await Promise.all([
          getDocs(ownedNotesShares),
          getDocs(sharedWithMeQuery)
        ]);

        // Combine all shares
        const allShares = [
            ...ownedSharesSnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            })),
            ...sharedWithMeSnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            }))
        ] as unknown as SharePermission[];

        setShares(allShares);

        // Load shared notes
        const sharedNoteIds = sharedWithMeSnapshot.docs.map(doc => doc.data().noteId);
        
        if (sharedNoteIds.length > 0) {
          const sharedQuery = query(
            collection(firestore, 'notes'),
            where(documentId(), 'in', sharedNoteIds)
          );
          
          const sharedSnapshot = await getDocs(sharedQuery);
          const sharedNotes = sharedSnapshot.docs.map(doc => ({
            ...doc.data(),
            firebaseId: doc.id,
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            lastEditedAt: doc.data().lastEditedAt?.toDate()
          })) as Note[];

          // Combine owned and shared notes
          const uniqueNotes = [...ownedNotes];
          sharedNotes.forEach(sharedNote => {
            if (!uniqueNotes.some(note => note.firebaseId === sharedNote.firebaseId)) {
              uniqueNotes.push(sharedNote);
            }
          });
          setNotes(uniqueNotes);
        } else {
          setNotes(ownedNotes);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const notesQuery = query(
      collection(firestore, 'notes'),
      where('ownerUserId', '==', user.uid)
    );

    const sharesQuery = query(
      collection(firestore, 'shares'),
      where('email', '==', user.email)
    );

    // First subscription: Listen for shares
    const unsubscribeShares = onSnapshot(sharesQuery, async (snapshot) => {
      const sharesData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
      })) as unknown as SharePermission[];
      setShares(sharesData);

      // After getting shares, fetch the shared notes
      if (sharesData.length > 0) {
        const sharedNoteIds = sharesData.map(share => share.noteId);
        const sharedQuery = query(
          collection(firestore, 'notes'),
          where(documentId(), 'in', sharedNoteIds)
        );
        
        try {
          const sharedSnapshot = await getDocs(sharedQuery);
          const sharedNotes = sharedSnapshot.docs.map(doc => ({
            ...doc.data(),
            firebaseId: doc.id,
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            lastEditedAt: doc.data().lastEditedAt?.toDate()
          })) as Note[];

          setNotes(prev => {
            const ownedNotes = prev.filter(note => note.ownerUserId === user.uid);
            const uniqueNotes = [...ownedNotes];
            sharedNotes.forEach(sharedNote => {
              if (!uniqueNotes.some(note => note.firebaseId === sharedNote.firebaseId)) {
                uniqueNotes.push(sharedNote);
              }
            });
            return uniqueNotes;
          });
        } catch (error) {
          console.error('Error loading shared notes:', error);
        }
      }
    });

    // Second subscription: Listen for owned notes
    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const ownedNotes = snapshot.docs.map(doc => ({
        ...doc.data(),
        firebaseId: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastEditedAt: doc.data().lastEditedAt?.toDate()
      })) as Note[];

      setNotes(prev => {
        const sharedNotes = prev.filter(note => note.ownerUserId !== user.uid);
        const uniqueNotes = [...sharedNotes];
        ownedNotes.forEach(ownedNote => {
          if (!uniqueNotes.some(note => note.firebaseId === ownedNote.firebaseId)) {
            uniqueNotes.push(ownedNote);
          }
        });
        return uniqueNotes;
      });
    });

    return () => {
      unsubscribeNotes();
      unsubscribeShares();
    };
  }, [user]);

  // Add useEffect to load tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await db.getTags();
        setAllTags(tags);
      } catch (error) {
        console.error('Error loading tags:', error);
      }
    };
    loadTags();
  }, []);

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

  const myNotes = notes.filter(note => note.ownerUserId === user?.uid);
  const sharedWithMe = notes.filter(note => {
    if (!user) return false;
    return shares.some(share => 
      share.noteId === note.firebaseId && 
      share.email === user.email
    );
  });

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await db.createFolder({
        name: newFolderName.trim(),
        color: newFolderColor,
      });
      setNewFolderName('');
      setNewFolderColor('#4f46e5');
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


  // Enhanced filtering logic
  const filteredNotes = useMemo(() => {
    const baseFiltered = (activeTab === 'my-notes' ? myNotes : sharedWithMe)
      .filter(note => {
        // Search query
        if (!note?.title?.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        
        // Folder filter
        if (selectedFolderId !== undefined) {
          if (note.folderId !== selectedFolderId) {
            return false;
          }
        }

        // Tags filter
        if (selectedTags.length > 0) {
          if (!selectedTags.every(tag => note?.tags?.some(noteTag => noteTag.id === tag))) {
            return false;
          }
        }

        // Date filter
        if (dateFilter) {
          const noteDate = note.updatedAt;
          return format(noteDate, 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd');
        }

        return true;
      })
      .sort((a, b) => {
        // Only consider pins for notes owned by current user
        const aIsPinned = a.isPinned && a.ownerUserId === user?.uid;
        const bIsPinned = b.isPinned && b.ownerUserId === user?.uid;
        
        // First sort by pinned status (only for owned notes)
        if (aIsPinned && !bIsPinned) return -1;
        if (!aIsPinned && bIsPinned) return 1;
        
        // Then by selected sort
        switch (sortBy) {
          case 'title':
            return a.title.localeCompare(b.title);
          case 'created':
            return b.createdAt.getTime() - a.createdAt.getTime();
          default:
            return b.updatedAt.getTime() - a.updatedAt.getTime();
        }
      });

    // Add tag filtering
    if (selectedTagFilters.length === 0) return baseFiltered;
      
    return baseFiltered.filter(note => {
      if (!note.tags) return false;
      return selectedTagFilters.every(filterTag =>
        note?.tags?.some(noteTag => noteTag.id === filterTag.id)
      );
    });
  }, [activeTab, myNotes, sharedWithMe, searchQuery, selectedTags, dateFilter, sortBy, selectedTagFilters, user?.uid, selectedFolderId]);

  // Add effect to save preferences whenever they change
  useEffect(() => {
    const preferences: StoredNotesPreferences = {
      activeTab,
      view,
      sortBy,
      selectedTags,
      selectedTagFilters,
      searchQuery,
      dateFilter: dateFilter?.toISOString(),
      selectedFolderId,
    };
    localStorage.setItem('notes-preferences', JSON.stringify(preferences));
  }, [activeTab, view, sortBy, selectedTags, selectedTagFilters, searchQuery, dateFilter, selectedFolderId]);

  /**
   *
   */
  function clearFilters(): void {
    setSearchQuery('');
    setSelectedTags([]);
    setDateFilter(undefined);
    setSelectedTagFilters([]);
    setSortBy('updated');
    setSelectedFolderId(undefined);
    
    const preferences: StoredNotesPreferences = {
      activeTab,
      view,
      sortBy: 'updated',
      selectedTags: [],
      selectedTagFilters: [],
      searchQuery: '',
      dateFilter: undefined,
      selectedFolderId: undefined,
    };
    localStorage.setItem('notes-preferences', JSON.stringify(preferences));
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <NoteSearch 
              notes={notes} 
              onNoteSelect={(note) => navigate(`/notes/${note.firebaseId}`)} 
            />
          </div>

          {/* View Toggle and New Note */}
          <div className="flex gap-2">
            {/* Desktop View Toggle */}
            <div className="hidden sm:flex gap-2">
              <Button
                variant={view === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setView('grid')}
              >
                <LayoutGridIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setView('list')}
              >
                <LayoutListIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile View Toggle */}
            <div className="sm:hidden">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowViewOptions(!showViewOptions)}
              >
                {view === 'grid' ? <LayoutGridIcon className="h-4 w-4" /> : <LayoutListIcon className="h-4 w-4" />}
              </Button>
              {showViewOptions && (
                <div className="absolute right-4 mt-2 p-2 bg-popover border rounded-md shadow-lg">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setView('grid');
                      setShowViewOptions(false);
                    }}
                  >
                    <LayoutGridIcon className="h-4 w-4 mr-2" />
                    Grid View
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setView('list');
                      setShowViewOptions(false);
                    }}
                  >
                    <LayoutListIcon className="h-4 w-4 mr-2" />
                    List View
                  </Button>
                </div>
              )}
            </div>

            <Button onClick={() => navigate('/notes/new')} className="w-full sm:w-auto">
              <PlusIcon className="mr-2 h-4 w-4" /> New Note
            </Button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Folder Selection */}
          <Select
            value={selectedFolderId || "root"}
            onValueChange={(value) => setSelectedFolderId(value === "root" ? undefined : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All folders">
                <div className="flex items-center gap-2">
                  <FolderIcon className="h-4 w-4" />
                  {selectedFolderId 
                    ? folders.find(f => f.id === selectedFolderId)?.name || "All folders"
                    : "All folders"
                  }
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">
                <div className="flex items-center gap-2">
                  <FolderIcon className="h-4 w-4" />
                  All folders
                </div>
              </SelectItem>
              {folders.map(folder => (
                <SelectItem key={folder.id} value={folder.id}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <FolderIcon className="h-4 w-4" style={{ color: folder.color }} />
                      {folder.name}
                    </div>
                  </div>
                </SelectItem>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-start mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreatingFolder(true);
                }}
              >
                <FolderPlusIcon className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </SelectContent>
          </Select>

          {/* Sort dropdown */}
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Last Updated</SelectItem>
              <SelectItem value="created">Created Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={dateFilter ? "default" : "outline"}
                className="gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                {dateFilter ? format(dateFilter, 'MMM dd, yyyy') : 'Filter by date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={setDateFilter}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Add tag filter button and dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <TagIcon className="h-4 w-4" />
                Tags
                {selectedTagFilters.length > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-1 h-5 px-1"
                  >
                    {selectedTagFilters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <div className="p-2 border-b">
                <Input
                  placeholder="Search tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <ScrollArea className="h-52">
                <div className="p-2">
                  {allTags
                    .filter(tag => 
                      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(tag => (
                      <div
                        key={tag.id}
                        className="flex items-center gap-2 p-1 hover:bg-muted rounded-sm cursor-pointer"
                        onClick={() => {
                          setSelectedTagFilters(prev => {
                            const isSelected = prev.some(t => t.id === tag.id);
                            return isSelected
                              ? prev.filter(t => t.id !== tag.id)
                              : [...prev, tag];
                          });
                        }}
                      >
                        <Checkbox
                          checked={selectedTagFilters.some(t => t.id === tag.id)}
                        />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm">{tag.name}</span>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filters Display */}
        {(selectedTags.length > 0 || dateFilter || selectedFolderId) && (
          <div className="flex flex-wrap gap-2">
            {selectedFolderId && (
              <Badge
                variant="secondary"
                className="gap-1"
              >
                <FolderIcon className="h-3 w-3 mr-1" style={{ 
                  color: folders.find(f => f.id === selectedFolderId)?.color 
                }} />
                {folders.find(f => f.id === selectedFolderId)?.name}
                <XIcon
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedFolderId(undefined)}
                />
              </Badge>
            )}
            {selectedTags.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1"
              >
                {tag}
                <XIcon
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                />
              </Badge>
            ))}
            {dateFilter && (
              <Badge
                variant="secondary"
                className="gap-1"
              >
                {format(dateFilter, 'MMM dd, yyyy')}
                <XIcon
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setDateFilter(undefined)}
                />
              </Badge>
            )}
          </div>
        )}
      </div>
      

      {/* Tabs with improved mobile layout */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'my-notes' | 'shared')} 
          className="flex-1"
        >
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="my-notes" className="text-sm">
              My Notes ({myNotes.length})
            </TabsTrigger>
            <TabsTrigger value="shared" className="text-sm">
              Shared ({sharedWithMe.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Clear Filters Button - only show if there are active filters */}
        {(selectedTags.length > 0 || dateFilter || searchQuery || selectedTagFilters.length > 0 || sortBy !== 'updated') && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="h-9 gap-2 whitespace-nowrap"
          >
            <XCircleIcon className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Notes Grid/List */}
      {Object.entries(groupNotesByDate(filteredNotes)).map(([date, dateNotes]) => (
        <div key={date} className="mb-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">{date}</h3>
          <div className={
            view === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
              : "flex flex-col gap-4"
          }>
            {dateNotes.map((note) => (
              <NoteCard 
                key={note.firebaseId} 
                note={note} 
                shares={shares} 
                user={user} 
                view={view}
                onClick={() => navigate(`/notes/${note.firebaseId}`)}
                allNotes={notes}
                navigate={navigate}
                folders={folders}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {filteredNotes.length === 0 && !isLoading && (
        <div className="text-center text-muted-foreground mt-8">
          <FileTextIcon className="mx-auto h-12 w-12 mb-4" />
          <h3 className="font-semibold mb-2">No notes found</h3>
          <p>{searchQuery ? 'Try a different search term' : 'Create your first note!'}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={isCreatingFolder} onOpenChange={setIsCreatingFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Customize your folder with a name and color
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
                <div className="text-xs text-muted-foreground">Preview</div>
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
    </div>
  );
}
