import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

import type { ColetaBase } from '@/types/semaspa';
import { useCreateColetaMutation } from '@/hooks/api/use-semaspa';
import { ROUTES } from '@/constants/routes.constants';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/shadcn/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/shadcn/collapsible';
import { Input } from '@/components/ui/shadcn/input';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Button } from '@/components/ui/shadcn/button';

import {
  addCalendarYears,
  fieldsFor,
  periodIssue,
  type ColetaField,
} from '../nova-coleta-fields';

interface NovaColetaPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fieldClass =
  'h-auto w-full rounded-lg border-[#e4e8e5] bg-white px-3 py-2.5 text-sm text-[#0f1a16] shadow-none';

function optionalPage(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined;
}

export function NovaColetaPanel({ open, onOpenChange }: NovaColetaPanelProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createMutation = useCreateColetaMutation();

  const [base, setBase] = useState<ColetaBase>('autef');
  const [values, setValues] = useState<Record<string, string>>({});
  const [pageStart, setPageStart] = useState('1');
  const [pageEnd, setPageEnd] = useState('');
  const [forceRestart, setForceRestart] = useState(false);
  const [limit, setLimit] = useState('');

  const busy = createMutation.isPending;
  const { primary, more } = fieldsFor(base);
  const baseLabel =
    base === 'gf' ? t('semaspa.coletas.base.gf') : t('semaspa.coletas.base.autef');

  const setField = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const filtros = useMemo(() => {
    const next: Record<string, string> = {};
    for (const field of [...primary, ...more]) {
      const raw = values[field.key]?.trim();
      if (!raw) continue;
      next[field.key] = raw;
    }
    return next;
  }, [primary, more, values]);

  const start = filtros.data_inicio ?? '';
  const end = filtros.data_fim ?? '';
  const issue = periodIssue(start, end);
  const summary =
    issue === null
      ? t('semaspa.coletas.nova.resumoPeriodo', { base: baseLabel, start, end })
      : t(`semaspa.coletas.nova.dates.${issue}`);

  const handleSubmit = () => {
    if (issue) return;
    createMutation.mutate(
      {
        base,
        filtros,
        pageStart: optionalPage(pageStart) ?? 1,
        pageEnd: optionalPage(pageEnd),
        forceRestart,
        limit: optionalPage(limit),
      },
      {
        onSuccess: (coleta) => {
          onOpenChange(false);
          navigate(ROUTES.semaspa.coletaDetail.replace(':id', coleta.taskId));
        },
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[460px] gap-0 border-[#e4e8e5] bg-white p-0 sm:max-w-[460px]">
        <SheetHeader className="flex-row items-center justify-between space-y-0 border-b border-[#e4e8e5] px-5 py-4">
          <SheetTitle className="text-base font-bold text-[#0f1a16]">
            {t('semaspa.coletas.nova.title')}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t('semaspa.coletas.nova.subtitle')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-[#0f1a16]">
              {t('semaspa.coletas.nova.base')}
            </span>
            <div className="flex gap-0.5 rounded-lg bg-[#eef1ef] p-0.5">
              {(['autef', 'gf'] as const).map((option) => {
                const selected = base === option;
                return (
                  <button
                    key={option}
                    type="button"
                    className={cn(
                      'flex-1 rounded-md px-2 py-2 text-[13px]',
                      selected
                        ? 'bg-[#0e4b3b] font-semibold text-white'
                        : 'font-normal text-[#5c6b64]',
                    )}
                    onClick={() => setBase(option)}
                    disabled={busy}
                  >
                    {t(`semaspa.coletas.base.${option}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {primary.map((field) => (
            <FieldControl
              key={field.key}
              field={field}
              value={values[field.key] ?? ''}
              disabled={busy}
              required={field.kind === 'date'}
              min={
                field.key === 'data_fim'
                  ? start || undefined
                  : field.key === 'data_inicio' && end
                    ? addCalendarYears(end, -2) ?? undefined
                    : undefined
              }
              max={
                field.key === 'data_fim'
                  ? addCalendarYears(start, 2) ?? undefined
                  : field.key === 'data_inicio'
                    ? end || undefined
                    : undefined
              }
              onChange={(value) => setField(field.key, value)}
            />
          ))}

          <label className="flex flex-col gap-1.5 text-[13px] text-[#0f1a16]">
            <span className="font-semibold">{t('semaspa.coletas.nova.limit')}</span>
            <Input
              className={fieldClass}
              type="number"
              min={1}
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              disabled={busy}
            />
          </label>

          {more.map((field) => (
            <FieldControl
              key={field.key}
              field={field}
              value={values[field.key] ?? ''}
              disabled={busy}
              onChange={(value) => setField(field.key, value)}
            />
          ))}

          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-[#e4e8e5] bg-white px-3 py-2.5 text-[13px] text-[#0f1a16]">
              {t('semaspa.coletas.nova.advanced')}
              <ChevronDown className="h-4 w-4 text-[#5c6b64]" />
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-3 pt-3">
              <label className="flex flex-col gap-1.5 text-[13px] text-[#0f1a16]">
                <span className="font-semibold">{t('semaspa.coletas.nova.pageStart')}</span>
                <Input
                  className={fieldClass}
                  type="number"
                  min={1}
                  value={pageStart}
                  onChange={(event) => setPageStart(event.target.value)}
                  disabled={busy}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] text-[#0f1a16]">
                <span className="font-semibold">{t('semaspa.coletas.nova.pageEnd')}</span>
                <Input
                  className={fieldClass}
                  type="number"
                  min={1}
                  value={pageEnd}
                  onChange={(event) => setPageEnd(event.target.value)}
                  disabled={busy}
                />
              </label>
              <label className="flex items-center gap-2 text-[13px] text-[#0f1a16]">
                <Checkbox
                  checked={forceRestart}
                  onCheckedChange={(checked) => setForceRestart(checked === true)}
                  disabled={busy}
                />
                {t('semaspa.coletas.nova.forceRestart')}
              </label>
            </CollapsibleContent>
          </Collapsible>

          <div className="h-px bg-[#e4e8e5]" />

          <p
            className={cn(
              'text-xs leading-relaxed',
              issue ? 'text-[#c2413b]' : 'text-[#5c6b64]',
            )}
          >
            {summary}
          </p>

          <Button
            className="h-auto w-full rounded-lg bg-[#0e4b3b] py-3 text-sm font-semibold text-white hover:bg-[#0c3f32]"
            onClick={handleSubmit}
            disabled={busy || issue !== null}
          >
            {t('semaspa.coletas.nova.iniciar')}
          </Button>
          <Button
            variant="ghost"
            className="h-auto w-full py-2 text-[13px] font-normal text-[#5c6b64] hover:bg-transparent hover:text-[#0f1a16]"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FieldControl({
  field,
  value,
  disabled,
  required,
  min,
  max,
  onChange,
}: {
  field: ColetaField;
  value: string;
  disabled: boolean;
  required?: boolean;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const label = t(`semaspa.coletas.nova.fields.${field.key}`);

  return (
    <label className="flex flex-col gap-1.5 text-[13px] text-[#0f1a16]">
      <span className="font-semibold">
        {label}
        {required ? <span className="text-[#c2413b]"> *</span> : null}
      </span>
      <Input
        className={fieldClass}
        type={field.kind === 'date' ? 'date' : 'text'}
        value={value}
        min={min}
        max={max}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </label>
  );
}
