import { useState, useEffect } from 'react';
import { db, SharePermission } from '../Database/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PlusIcon, MagnifyingGlassIcon, AvatarIcon, FileTextIcon } from '@radix-ui/react-icons';
import { Share } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { onSnapshot, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db as firestore } from '../Auth/firebase';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebugInfo } from '../Components/DebugInfo';
import { getPreviewText, formatLastEdited, formatTimeAgo } from '../utils/noteUtils';
import type { Note } from '../Database/db';

export default function Notes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [shares, setShares] = useState<SharePermission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-notes' | 'shared'>('my-notes');

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

        // Load shares
        const sharesRef = collection(firestore, 'shares');
        const sharesQuery = query(sharesRef, where('email', '==', user.email));
        const sharesSnapshot = await getDocs(sharesQuery);
        
        const sharesData = sharesSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        })) as SharePermission[];
        
        setShares(sharesData);

        // Load shared notes if there are any shares
        if (sharesData.length > 0) {
          const sharedNoteIds = sharesData.map(share => share.noteId);
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
          setNotes([...ownedNotes, ...sharedNotes]);
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
      })) as SharePermission[];
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
            return [...ownedNotes, ...sharedNotes];
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
        return [...sharedNotes, ...ownedNotes];
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

  const filteredNotes = (activeTab === 'my-notes' ? myNotes : sharedWithMe)
    .filter(note => note.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="container mx-auto p-4">
      {/* Search and New Note */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => navigate('/notes/new')} className="ml-4">
          <PlusIcon className="mr-2 h-4 w-4" /> New Note
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: 'my-notes' | 'shared') => setActiveTab(value)} className="mb-6">
        <TabsList>
          <TabsTrigger value="my-notes">My Notes ({myNotes.length})</TabsTrigger>
          <TabsTrigger value="shared">Shared with Me ({sharedWithMe.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredNotes.map((note) => (
          <Card 
            key={note.firebaseId} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/notes/${note.firebaseId}`)}
          >
            <CardContent className="p-6 flex flex-col h-[300px]">
              {/* Title and Share Status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold truncate">
                    {note.title || 'Untitled'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {note.ownerPhotoURL && (
                      <img 
                        src={note.ownerPhotoURL} 
                        alt={note.ownerDisplayName}
                        className="w-4 h-4 rounded-full"
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      by {note.ownerUserId === user?.uid ? 'you' : note.ownerDisplayName}
                    </p>
                  </div>
                </div>
                {shares.some(s => s.noteId === note.firebaseId) && (
                  <div className="flex items-center ml-2">
                    <Share className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="text-sm text-muted-foreground flex-grow overflow-hidden">
                <div className="whitespace-pre-wrap break-words line-clamp-6">
                  {getPreviewText(note.content, 300).split('\n').map((line, i) => (
                    <div key={i} className={
                      line.startsWith('#') ? 'font-bold text-base' :
                      line.startsWith('•') ? 'pl-4' :
                      line.startsWith('1.') ? 'pl-4' :
                      ''
                    }>
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags (if any) */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex gap-1 mt-3 flex-wrap">
                  {note.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="px-2 py-0.5 bg-muted rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Last Edited Info */}
              <div className="text-xs text-muted-foreground mt-4 pt-3 border-t">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {note.lastEditedByPhotoURL ? (
                      <img 
                        src={note.lastEditedByPhotoURL} 
                        alt={note.lastEditedByDisplayName}
                        className="w-4 h-4 rounded-full"
                      />
                    ) : (
                      <AvatarIcon className="h-4 w-4" />
                    )}
                    <span>
                      {note.lastEditedByDisplayName 
                        ? `Edited by ${note.lastEditedByDisplayName} • ${formatTimeAgo(note.lastEditedAt!)}`
                        : `Updated ${formatTimeAgo(note.updatedAt)}`
                      }
                    </span>
                  </div>
                  {shares.some(s => s.noteId === note.firebaseId) && (
                    <div className="flex items-center gap-1 text-muted-foreground/80">
                      <span>
                        Shared
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
