import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/Core/Database/db';
import type { Tags } from '@/Core/Database/db';

interface TagSelectorProps {
  selectedTags: Tags[];
  onTagsChange: (tags: Tags[]) => void;
  onCreateTag: (tag: Partial<Tags>) => Promise<Tags>;
}

export function TagSelector({ selectedTags, onTagsChange, onCreateTag }: TagSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [existingTags, setExistingTags] = useState<Tags[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTag, setNewTag] = useState({
    name: '',
    color: '#3b82f6',
    group: 'default'
  });

  // Fetch existing tags on mount
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await db.getTags();
        setExistingTags(tags);
      } catch (error) {
        console.error('Error loading tags:', error);
      }
    };
    loadTags();
  }, []);

  // Filter tags based on search term
  const filteredTags = existingTags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedTags.some(selected => selected.id === tag.id)
  );

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      <div className="flex flex-wrap gap-1">
        {selectedTags.map(tag => (
          <div
            key={tag.id}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
            style={{ 
              backgroundColor: tag.color + '20',
              color: tag.color 
            }}
          >
            <span>{tag.name}</span>
            <button
              onClick={() => onTagsChange(selectedTags.filter(t => t.id !== tag.id))}
              className="hover:opacity-75"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Search/Create input */}
      <div className="relative">
        <Input
          placeholder="Search or create tag..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="h-8 text-sm"
        />
        
        {/* Dropdown for existing tags */}
        {searchTerm && filteredTags.length > 0 && !isCreating && (
          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md">
            <ScrollArea className="max-h-[200px]">
              {filteredTags.map(tag => (
                <button
                  key={tag.id}
                  className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-muted text-sm text-left"
                  onClick={() => {
                    onTagsChange([...selectedTags, tag]);
                    setSearchTerm('');
                  }}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              ))}
            </ScrollArea>
          </div>
        )}

        {/* Create new tag option */}
        {searchTerm && !filteredTags.length && !isCreating && (
          <button
            className="absolute z-10 w-full mt-1 px-2 py-1.5 text-sm text-left bg-popover border rounded-md hover:bg-muted"
            onClick={() => {
              setIsCreating(true);
              setNewTag(prev => ({ ...prev, name: searchTerm }));
            }}
          >
            Create tag "{searchTerm}"
          </button>
        )}
      </div>

      {/* Create new tag form */}
      {isCreating && (
        <div className="flex items-center gap-2 animate-in slide-in-from-left">
          <div className="flex gap-1">
            {['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#6366f1'].map(color => (
              <button
                key={color}
                type="button"
                className={cn(
                  "w-5 h-5 rounded-full transition-all",
                  newTag.color === color && "ring-2 ring-offset-1 ring-primary"
                )}
                style={{ backgroundColor: color }}
                onClick={() => setNewTag({ ...newTag, color })}
              />
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              if (!newTag.name) return;
              const tag = await onCreateTag(newTag);
              onTagsChange([...selectedTags, tag]);
              setIsCreating(false);
              setSearchTerm('');
              setNewTag({ name: '', color: '#3b82f6', group: 'default' });
              // Refresh existing tags
              const tags = await db.getTags();
              setExistingTags(tags);
            }}
          >
            Create
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsCreating(false);
              setSearchTerm('');
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
} 