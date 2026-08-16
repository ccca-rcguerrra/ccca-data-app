import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookmarkPlus, Trash2 } from 'lucide-react';

import { Input } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import { Label } from '@/components/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import {
  useCreateIndicatorSavedFilterMutation,
  useDeleteIndicatorSavedFilterMutation,
  useIndicatorSavedFiltersQuery,
} from '@/hooks/api/use-semaspa';
import { ANY_INDICATOR_ID } from '@/types/semaspa';

import type { IndicatorsController } from '../hooks/use-indicators-controller';
import {
  fromApiFilters,
  savedIndicatorIdToSelection,
  toApiFilters,
} from '../lib/indicator-url-state';

interface IndicatorSavedFiltersProps {
  controller: IndicatorsController;
}

export function IndicatorSavedFilters({ controller }: IndicatorSavedFiltersProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const listQuery = useIndicatorSavedFiltersQuery();
  const createMutation = useCreateIndicatorSavedFilterMutation();
  const deleteMutation = useDeleteIndicatorSavedFilterMutation();
  const presets = listQuery.data ?? [];
  const selected = presets.find((item) => String(item.id) === selectedId) ?? null;
  const busy =
    listQuery.isFetching || createMutation.isPending || deleteMutation.isPending;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createMutation.mutate(
      {
        name: trimmed,
        indicatorId: controller.api.queryId,
        filters: toApiFilters(controller.store.state.filters),
      },
      {
        onSuccess: (created) => {
          setName('');
          setSelectedId(String(created.id));
        },
      },
    );
  };

  const handleApply = (id: string) => {
    setSelectedId(id);
    const preset = presets.find((item) => String(item.id) === id);
    if (!preset) return;
    controller.store.actions.applySnapshot({
      selectedIndicatorId: savedIndicatorIdToSelection(preset.indicatorId),
      filters: fromApiFilters(preset.filters ?? {}),
    });
  };

  const handleDelete = () => {
    if (!selected) return;
    deleteMutation.mutate(selected.id, {
      onSuccess: () => setSelectedId(''),
    });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="space-y-1.5 flex-1 min-w-[12rem]">
        <Label htmlFor="indicator-saved-name">
          {t('semaspa.indicators.savedFilters.name')}
        </Label>
        <div className="flex gap-2">
          <Input
            id="indicator-saved-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('semaspa.indicators.savedFilters.namePlaceholder')}
            className="h-9"
            disabled={busy}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSave();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0"
            onClick={handleSave}
            disabled={busy || name.trim().length === 0}
          >
            <BookmarkPlus className="h-4 w-4" />
            {t('semaspa.indicators.savedFilters.save')}
          </Button>
        </div>
      </div>

      <div className="space-y-1.5 flex-1 min-w-[12rem]">
        <Label htmlFor="indicator-saved-select">
          {t('semaspa.indicators.savedFilters.title')}
        </Label>
        <div className="flex gap-2">
          <Select
            value={selectedId || 'none'}
            onValueChange={(value) => {
              if (value === 'none') {
                setSelectedId('');
                return;
              }
              handleApply(value);
            }}
            disabled={busy}
          >
            <SelectTrigger id="indicator-saved-select" className="h-9 w-full">
              <SelectValue
                placeholder={t('semaspa.indicators.savedFilters.selectPlaceholder')}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                {presets.length === 0
                  ? t('semaspa.indicators.savedFilters.empty')
                  : t('semaspa.indicators.savedFilters.selectPlaceholder')}
              </SelectItem>
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={String(preset.id)}>
                  {preset.name}
                  {preset.indicatorId && preset.indicatorId !== ANY_INDICATOR_ID
                    ? ` · ${t(`semaspa.indicators.catalog.${preset.indicatorId}.name`)}`
                    : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0"
            onClick={handleDelete}
            disabled={busy || !selected}
            aria-label={t('semaspa.indicators.savedFilters.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
