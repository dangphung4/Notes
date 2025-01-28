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
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleShare = async (email: string, access: 'view' | 'edit') => {
    if (!note.id) return;
    
    try {
      setIsSharing(true);
      await db.shareNote(note.id, email, access);
      onShare?.();
      setIsOpen(false);
    } catch (error) {
      console.error('Error sharing note:', error);
      onError?.(error as string);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Note</DialogTitle>
          <DialogDescription>
            Share this note with other users. They'll receive access via their email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Share with email</Label>
            <Input
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <RadioGroup value={access} onValueChange={(v) => setAccess(v as 'view' | 'edit')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="view" id="view" />
              <Label htmlFor="view">Can view</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="edit" id="edit" />
              <Label htmlFor="edit">Can edit</Label>
            </div>
          </RadioGroup>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button 
            className="w-full" 
            onClick={() => handleShare(email, access)}
            disabled={isSharing || !email}
          >
            {isSharing ? 'Sharing...' : 'Share'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 