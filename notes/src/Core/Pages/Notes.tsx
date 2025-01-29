/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { SharePermission } from '../Database/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PlusIcon, MagnifyingGlassIcon, AvatarIcon, FileTextIcon, Share2Icon } from '@radix-ui/react-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { onSnapshot, collection, query, where, getDocs, documentId, getDoc, doc } from 'firebase/firestore';
import { db as firestore } from '../Auth/firebase';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPreviewText, formatTimeAgo } from '../utils/noteUtils';
import type { Note } from '../Database/db';
import { LayoutGridIcon, LayoutListIcon } from 'lucide-react';
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

const NoteCard = ({ note, shares, user, view, onClick }: { 
  note: Note, 
  shares: SharePermission[], 
  user: any, 
  view: 'grid' | 'list',
  onClick: () => void 
}) => {
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  
  // Fetch owner's current profile
  useEffect(() => {
    const fetchOwnerProfile = async () => {
      try {
        // Get the owner's user document from Firebase Auth
        const userDoc = await getDoc(doc(firestore, 'users', note.ownerUserId));
        if (userDoc.exists()) {
          setOwnerProfile(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching owner profile:', error);
      }
    };

    fetchOwnerProfile();
  }, [note.ownerUserId]);

  const isOwner = note.ownerUserId === user?.uid;
  const noteShares = shares.filter(s => s.noteId === note.firebaseId);
  const hasShares = noteShares.length > 0;

  // Use ownerProfile data if available, fall back to note data if not
  const ownerDisplayName = ownerProfile?.displayName || note.ownerDisplayName;
  const ownerPhotoURL = ownerProfile?.photoURL || note.ownerPhotoURL;
  const ownerEmail = ownerProfile?.email || note.ownerEmail;

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
      ${note.isPinned ? 'border-primary/50' : ''}`}
    >
      {/* Action buttons - position absolute */}
      <div className="absolute right-2 top-2 z-10 flex gap-2">
        {isOwner && (
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
              className={`h-4 w-4 ${note.isPinned ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </Button>
        )}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <InfoIcon className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent onClick={(e) => e.stopPropagation()}>
            <SheetHeader>
              <SheetTitle>Note Details</SheetTitle>
              <SheetDescription>
                View details about this note including creation date, ownership, and sharing information.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Basic Information</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Created {formatTimeAgo(note.createdAt)}</p>
                  <p>Last updated {formatTimeAgo(note.updatedAt)}</p>
                  {note.isPinned && <p>📌 Pinned note</p>}
                </div>
              </div>

              {/* Owner Info */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Owner</h4>
                <div className="flex items-center gap-2">
                  {ownerPhotoURL ? (
                    <img 
                      src={ownerPhotoURL} 
                      alt={ownerDisplayName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <AvatarIcon className="w-8 h-8" />
                  )}
                  <div className="text-sm">
                    <p>{ownerDisplayName}</p>
                    <p className="text-muted-foreground">{ownerEmail}</p>
                  </div>
                </div>
              </div>

              {/* Share Info */}
              {hasShares && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Shared With</h4>
                  <div className="space-y-2">
                    {noteShares.map(share => (
                      <div key={share.id} className="flex items-center gap-2">
                        <div className="text-sm">
                          <p>{share.displayName}</p>
                          <p className="text-muted-foreground">{share.email}</p>
                          <p className="text-xs text-muted-foreground">Can {share.access}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit History */}
              {note.lastEditedByUserId && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Last Edit</h4>
                  <div className="flex items-center gap-2">
                    {note.lastEditedByPhotoURL && (
                      <img 
                        src={note.lastEditedByPhotoURL} 
                        alt={note.lastEditedByDisplayName}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div className="text-sm">
                      <p>{note.lastEditedByDisplayName}</p>
                      <p className="text-muted-foreground">
                        {formatTimeAgo(note.lastEditedAt || note.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                {note.title || 'Untitled'}
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
                {ownerPhotoURL ? (
                  <img 
                    src={ownerPhotoURL} 
                    alt={ownerDisplayName}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <AvatarIcon className="w-5 h-5" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isOwner ? 'You' : ownerDisplayName}
                </span>
              </div>
            </div>

            {/* Preview - Different styling for list view */}
            {view === 'list' ? (
              <div className="text-sm text-muted-foreground line-clamp-1">
                {getPreviewText(note.content, 100).split('\n')[0]}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground space-y-1 line-clamp-4">
                {getPreviewText(note.content, 150).split('\n').map((line, i) => (
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
          </div>

          {/* Right Section for List View - Updated layout */}
          {view === 'list' && (
            <div className="flex flex-col justify-between items-end min-w-[120px] ml-4">
              <div className="text-xs text-muted-foreground">
                {/* commented because its overlapped with the pin and info icon */}
                {/* Created {formatTimeAgo(note.createdAt)} */}
              </div>
              {note.lastEditedByUserId && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Edited {formatTimeAgo(note.lastEditedAt || note.updatedAt)}</span>
                  {note.lastEditedByPhotoURL && (
                    <img 
                      src={note.lastEditedByPhotoURL} 
                      alt={note.lastEditedByDisplayName}
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
                <span>Created {formatTimeAgo(note.createdAt)}</span>
              </div>
              {note.lastEditedByUserId && (
                <div className="flex items-center gap-2">
                  {note.lastEditedByPhotoURL && (
                    <img 
                      src={note.lastEditedByPhotoURL} 
                      alt={note.lastEditedByDisplayName}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span>
                    Edited {formatTimeAgo(note.lastEditedAt || note.updatedAt)}
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

export default function Notes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [shares, setShares] = useState<SharePermission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-notes' | 'shared'>('my-notes');
  const [view, setView] = useState<'grid' | 'list'>(() => {
    return localStorage.getItem('notes-view') as 'grid' | 'list' || 'grid';
  });
  const [showViewOptions, setShowViewOptions] = useState(false);
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>();

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

  const myNotes = notes.filter(note => note.ownerUserId === user?.uid);
  const sharedWithMe = notes.filter(note => {
    if (!user) return false;
    return shares.some(share => 
      share.noteId === note.firebaseId && 
      share.email === user.email
    );
  });

  // Enhanced filtering logic
  const filteredNotes = useMemo(() => {
    return (activeTab === 'my-notes' ? myNotes : sharedWithMe)
      .filter(note => {
        // Search query
        if (!note.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        
        // Tags filter
        if (selectedTags.length > 0) {
          if (!selectedTags.every(tag => note.tags?.includes(tag))) {
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
        // First sort by pinned status
        if (a.isPinned && !b.isPinned) return -1;
        if (!b.isPinned && a.isPinned) return 1;
        
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
  }, [activeTab, myNotes, sharedWithMe, searchQuery, selectedTags, dateFilter, sortBy]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
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

        </div>

        {/* Active Filters Display */}
        {(selectedTags.length > 0 || dateFilter) && (
          <div className="flex flex-wrap gap-2">
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

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as 'my-notes' | 'shared')} 
        className="mb-6"
      >
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="my-notes" className="flex-1 sm:flex-initial">
            My Notes ({myNotes.length})
          </TabsTrigger>
          <TabsTrigger value="shared" className="flex-1 sm:flex-initial">
            Shared with Me ({sharedWithMe.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

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
    </div>
  );
}
