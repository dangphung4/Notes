import { useState, useEffect } from 'react';
import { db } from '../Database/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PlusIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db as firestore } from '../Auth/firebase';

interface Note {
  id?: number;
  title: string;
  content: string;
  updatedAt: Date;
}

export default function Notes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Load notes from Firebase when user logs in
      db.loadFromFirebase().then(loadNotes);
    }
  }, [user]);

  // Add real-time listener for Firebase updates
  useEffect(() => {
    if (!user) return;

    // Set up real-time listener
    const q = query(
      collection(firestore, 'notes'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'modified' || change.type === 'added') {
          // Update local DB with Firebase changes
          const data = change.doc.data();
          await db.notes.where('firebaseId').equals(change.doc.id).modify(note => {
            note.title = data.title;
            note.content = data.content;
            note.updatedAt = data.updatedAt.toDate();
          });
        }
        if (change.type === 'removed') {
          await db.notes.where('firebaseId').equals(change.doc.id).delete();
        }
      });
      
      // Reload notes after changes
      loadNotes();
    });

    return () => unsubscribe();
  }, [user]);

  const loadNotes = async () => {
    try {
      const allNotes = await db.notes
        .where('userId').equals(user?.uid || '')
        .or('userId').equals('') // Include local notes
        .reverse()
        .sortBy('updatedAt');
      setNotes(allNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Notes</h1>
        <Button onClick={() => navigate('/notes/new')}>
          <PlusIcon className="mr-2 h-5 w-5" />
          New Note
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/notes/${note.id}`)}
            >
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 truncate">{note.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {note.content}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No notes found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/notes/new')}
          >
            Create your first note
          </Button>
        </div>
      )}
    </div>
  );
}
