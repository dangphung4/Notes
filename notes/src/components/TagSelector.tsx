import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/Core/Database/db';
import type { Tags } from '@/Core/Database/db';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Check, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TagSelectorProps {
  selectedTags: Tags[];
  onTagsChange: (tags: Tags[]) => void;
  onCreateTag: (tag: Partial<Tags>) => Promise<Tags>;
}

// Add more preset colors
const presetColors = [
  // Blues
  '#3b82f6', '#60a5fa', '#2563eb',
  // Reds
  '#ef4444', '#f87171', '#dc2626',
  // Greens
  '#22c55e', '#4ade80', '#16a34a',
  // Yellows/Oranges
  '#f59e0b', '#fbbf24', '#d97706',
  // Purples
  '#6366f1', '#a855f7', '#7c3aed',
  // Pinks
  '#ec4899', '#f472b6', '#db2777',
  // Grays
  '#6b7280', '#4b5563', '#374151',
  // Teals
  '#14b8a6', '#2dd4bf', '#0d9488',
];

/**
 *
 * @param root0
 * @param root0.selectedTags
 * @param root0.onTagsChange
 * @param root0.onCreateTag
 */
export function TagSelector({ selectedTags, onTagsChange, onCreateTag }: TagSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [existingTags, setExistingTags] = useState<Tags[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTag, setNewTag] = useState({
    name: '',
    color: '#3b82f6',
    group: 'default'
  });
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

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
        <div className="space-y-4 animate-in slide-in-from-left">
          <div className="space-y-2">
            <Input
              placeholder="Tag name"
              value={newTag.name}
              onChange={e => setNewTag({ ...newTag, name: e.target.value })}
              className="h-8 text-sm"
            />
            
            <div className="space-y-1.5">
              <Label className="text-xs">Color</Label>
              <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-8 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: newTag.color }}
                      />
                      {newTag.color}
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <div className="space-y-3">
                    <div className="grid grid-cols-5 gap-2">
                      {presetColors.map(color => (
                        <button
                          key={color}
                          className={cn(
                            "w-8 h-8 rounded-full transition-all relative",
                            newTag.color === color && "ring-2 ring-offset-2 ring-primary"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            setNewTag({ ...newTag, color });
                            setIsColorPickerOpen(false);
                          }}
                        >
                          {newTag.color === color && (
                            <Check className="h-4 w-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                          )}
                        </button>
                      ))}
                    </div>
                    <Input
                      type="color"
                      value={newTag.color}
                      onChange={e => setNewTag({ ...newTag, color: e.target.value })}
                      className="w-full h-8"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              disabled={!newTag.name}
              onClick={async () => {
                if (!newTag.name) return;
                try {

                  const tagToCreate: Partial<Tags> = {
                    name: newTag.name.trim(),
                    color: newTag.color,
                    group: newTag.group,
                    metadata: '',
                  };

                  const createdTag = await onCreateTag(tagToCreate);

                  const updatedTags = [...selectedTags, createdTag];
                  onTagsChange(updatedTags);

                  setIsCreating(false);
                  setSearchTerm('');
                  setNewTag({ name: '', color: '#3b82f6', group: 'default' });
                  
                  const tags = await db.getTags();
                  setExistingTags(tags);

                  toast({
                    title: "Tag created",
                    description: `Tag "${createdTag.name}" has been created successfully.`,
                  });
                } catch (error) {
                  console.error('Detailed error creating tag:', error);
                  toast({
                    title: "Error creating tag",
                    description: error instanceof Error ? error.message : "There was a problem creating the tag.",
                    variant: "destructive"
                  });
                }
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
        </div>
      )}
    </div>
  );
} 