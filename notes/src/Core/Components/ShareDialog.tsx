import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { db } from '../Database/db';
import type { Note } from '../Database/db';
import { Share, Trash2 } from 'lucide-react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db as firestore } from '../Auth/firebase';
import { useAuth } from '../Auth/AuthContext';

interface SharePermission {
  id: string;
  email: string;
  access: 'view' | 'edit';
  createdAt: Date;
}

interface ShareDialogProps {
  note: Note;
  onShare?: () => void;
  onError?: (error: string) => void;
}

export default function ShareDialog({ note, onShare, onError }: ShareDialogProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [access, setAccess] = useState<'view' | 'edit'>('view');
  const [isSharing, setIsSharing] = useState(false);
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<SharePermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load current shares when dialog opens
  useEffect(() => {
    if (open && note.firebaseId) {
      loadShares();
    }
  }, [open, note.firebaseId]);

  const loadShares = async () => {
    if (!note.firebaseId) return;
    
    setIsLoading(true);
    try {
      const sharesRef = collection(firestore, 'shares');
      const sharesQuery = query(sharesRef, where('noteId', '==', note.firebaseId));
      const snapshot = await getDocs(sharesQuery);
      
      const sharesList = snapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email,
        access: doc.data().access,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      
      setShares(sharesList);
    } catch (error) {
      console.error('Error loading shares:', error);
      onError?.('Failed to load current shares');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!email) {
      onError?.('Please enter an email address');
      return;
    }

    if (!note.firebaseId) {
      onError?.('Note must be saved before sharing');
      return;
    }

    if (email === user?.email) {
      onError?.("You can't share with yourself");
      return;
    }

    try {
      setIsSharing(true);
      await db.shareNote(note.firebaseId, email, access);
      setEmail('');
      setAccess('view');
      await loadShares(); // Reload shares after adding new one
      onShare?.();
    } catch (error) {
      console.error('Error sharing note:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to share note');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      await deleteDoc(doc(firestore, 'shares', shareId));
      await loadShares(); // Reload shares after removing one
    } catch (error) {
      console.error('Error removing share:', error);
      onError?.('Failed to remove share');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Share className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Note</DialogTitle>
          <DialogDescription>
            Share this note with other users. They'll receive access via their email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Share Form */}
          <div className="space-y-2">
            <Label htmlFor="email">Share with email</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Access level</Label>
            <RadioGroup value={access} onValueChange={(value) => setAccess(value as 'view' | 'edit')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="view" id="view" />
                <Label htmlFor="view">Can view</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="edit" id="edit" />
                <Label htmlFor="edit">Can edit</Label>
              </div>
            </RadioGroup>
          </div>

          <Button 
            onClick={handleShare} 
            disabled={isSharing || !email}
            className="w-full"
          >
            {isSharing ? 'Sharing...' : 'Share'}
          </Button>

          {/* Current Shares List */}
          {shares.length > 0 && (
            <div className="mt-6">
              <Label>Shared with</Label>
              <div className="mt-2 space-y-2">
                {shares.map((share) => (
                  <div 
                    key={share.id} 
                    className="flex items-center justify-between p-2 rounded-md bg-muted"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{share.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Can {share.access}
                      </p>
                    </div>
                    {note.ownerUserId === user?.uid && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveShare(share.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 