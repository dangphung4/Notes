import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Save, Trash2, MoreVertical, StickyNoteIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NoteHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onDelete?: () => void;
  isSaving: boolean;
  isNewNote?: boolean;
}

export default function NoteHeader({
  title,
  onTitleChange,
  onSave,
  onDelete,
  isSaving,
  isNewNote = false
}: NoteHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="sticky z-20 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-2 py-2 flex items-center justify-between gap-2">
        {/* Back Button + Title Section */}
        <div className="flex items-center gap-2 flex-grow min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/notes')}
            className="shrink-0"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span>Notes</span>
            <StickyNoteIcon className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Title Input - Hidden on smallest screens */}
        <div className="hidden sm:block min-w-0 flex-grow px-2">
          <Input
            type="text"
            placeholder="Untitled Note..."
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="text-lg font-semibold border-none focus-visible:ring-0 px-0 truncate bg-transparent"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Mobile Save Button */}
          <Button
            onClick={onSave}
            disabled={isSaving || !title.trim()}
            size="sm"
            className="shrink-0 sm:min-w-[5rem]"
          >
            <Save className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
          </Button>

          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Title edit on mobile */}
              <div className="px-2 py-1 sm:hidden">
                <Input
                  type="text"
                  placeholder="Untitled Note..."
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  className="text-sm"
                />
              </div>
              {!isNewNote && onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Note
                </DropdownMenuItem>
              )}
              {/* Add more actions here */}
              <DropdownMenuItem onClick={() => {}}>
                Share Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                Add to Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
} 