import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export interface LiveFiltersState {
  searchQuery: string;
  category: string;
  minViews: number;
}

interface LiveFiltersProps {
  filters: LiveFiltersState;
  onFiltersChange: (filters: LiveFiltersState) => void;
  maxViews: number;
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'music', label: 'Music' },
  { value: 'sports', label: 'Sports' },
  { value: 'education', label: 'Education' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'technology', label: 'Technology' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'general', label: 'General' },
];

const LiveFilters: React.FC<LiveFiltersProps> = ({ filters, onFiltersChange, maxViews }) => {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchQuery: value });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ ...filters, category: value });
  };

  const handleMinViewsChange = (value: number[]) => {
    onFiltersChange({ ...filters, minViews: value[0] });
  };

  const handleClearFilters = () => {
    onFiltersChange({ searchQuery: '', category: 'all', minViews: 0 });
  };

  const hasActiveFilters = filters.searchQuery || filters.category !== 'all' || filters.minViews > 0;

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by host or title..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 bg-muted/50 border-border focus-visible:ring-primary"
          />
        </div>

        {/* Category Filter */}
        <Select value={filters.category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px] bg-muted/50">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border z-50">
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Viewer Count Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 bg-muted/50">
              <SlidersHorizontal className="h-4 w-4" />
              {filters.minViews > 0 ? `${filters.minViews}+ viewers` : 'All Viewers'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-card border-border z-50" align="start">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Minimum Viewers</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Show streams with at least {filters.minViews} viewers
                </p>
              </div>
              <Slider
                value={[filters.minViews]}
                onValueChange={handleMinViewsChange}
                max={maxViews || 1000}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span className="font-medium text-foreground">{filters.minViews}</span>
                <span>{maxViews || 1000}+</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default LiveFilters;
