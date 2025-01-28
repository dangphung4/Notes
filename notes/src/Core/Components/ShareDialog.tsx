import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { db } from '../Database/db';
import type { Note } from '../Database/db';
import { Share } from 'lucide-react';

interface ShareDialogProps {
  note: Note;
  onShare?: () => void;
  onError?: (error: string) => void;
}

export default function ShareDialog({ note, onShare, onError }: ShareDialogProps) {
  const [email, setEmail] = useState('');
  const [access, setAccess] = useState<'view' | 'edit'>('view');
  const [isSharing, setIsSharing] = useState(false);
  const [open, setOpen] = useState(false);

  const handleShare = async () => {
    if (!email) {
      onError?.('Please enter an email address');
      return;
    }

    if (!note.firebaseId) {
      onError?.('Note must be saved before sharing');
      return;
    }

    try {
      setIsSharing(true);
      await db.shareNote(note.firebaseId, email, access);
      setEmail('');
      setAccess('view');
      setOpen(false);
      onShare?.();
    } catch (error) {
      console.error('Error sharing note:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to share note');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Share className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Note</DialogTitle>
          <DialogDescription>
            Share this note with other users. They'll receive access via their email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
        </div>

        <Button 
          onClick={handleShare} 
          disabled={isSharing || !email}
          className="w-full"
        >
          {isSharing ? 'Sharing...' : 'Share'}
        </Button>
      </DialogContent>
    </Dialog>
  );
} 