import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, Search } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/shadcn/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/shadcn/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/shadcn/command';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcn/popover';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Separator } from '@/components/ui/shadcn/separator';
import type { UsersManagementController } from '../hooks/use-users-management-controller';

const SEARCH_DEBOUNCE_MS = 350;

interface UsersManagementFiltersProps {
  controller: UsersManagementController;
}

/**
 * UsersManagementFilters
 * Search and team filter. Search is debounced locally before calling controller.
 */
export function UsersManagementFilters({ controller }: UsersManagementFiltersProps) {
  const { t } = useTranslation();
  const {
    api: { isLoadingTeams, teamNamesOptions, selectedTeamNames },
    store: { state },
    handlers: { handleSearchQueryChange, handleTeamFilterChange, handleClearFilters },
  } = controller;

  const [searchValue, setSearchValue] = useState(state.searchQuery);

  useEffect(() => {
    const timeout = setTimeout(() => {
      handleSearchQueryChange(searchValue);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchValue, handleSearchQueryChange]);

  useEffect(() => {
    setSearchValue(state.searchQuery);
  }, [state.searchQuery]);

  const [teamPopoverOpen, setTeamPopoverOpen] = useState(false);

  const toggleTeam = (name: string) => {
    const next = selectedTeamNames.includes(name)
      ? selectedTeamNames.filter((n) => n !== name)
      : [...selectedTeamNames, name];
    handleTeamFilterChange(next);
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-full flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('users.management.filters.searchPlaceholderExtended')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10"
              disabled={controller.api.isLoading}
            />
          </div>
        </div>
        <Separator />
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('users.management.filters.team')}
          </Label>
          <Popover open={teamPopoverOpen} onOpenChange={setTeamPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'h-10 w-full justify-between border-dashed text-sm font-normal',
                )}
              >
                <span className="truncate">
                  {selectedTeamNames.length > 0
                    ? t('users.management.filters.selected', { count: selectedTeamNames.length })
                    : isLoadingTeams
                      ? t('users.management.filters.loadingTeams')
                      : t('users.management.filters.selectTeams')}
                </span>
                <Filter className="size-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandInput placeholder={t('users.management.filters.searchTeams')} />
                <CommandEmpty>{t('users.management.filters.noTeamFound')}</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-y-auto">
                  {teamNamesOptions.map((name) => {
                    const isSelected = selectedTeamNames.includes(name);
                    return (
                      <CommandItem
                        key={name}
                        onSelect={() => toggleTeam(name)}
                        className="flex items-center gap-2"
                      >
                        <Checkbox checked={isSelected} />
                        <span className="text-sm">{name}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-end gap-3">
        <Button variant="ghost" onClick={handleClearFilters}>
          {t('users.management.filters.clear')}
        </Button>
        <Button variant="outline" className="gap-2">
          <Filter className="size-4" />
          {t('users.management.filters.apply')}
        </Button>
      </CardFooter>
    </Card>
  );
}
