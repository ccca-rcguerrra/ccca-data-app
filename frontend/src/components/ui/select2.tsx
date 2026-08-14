"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/shadcn/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/shadcn/command";
import { Button, buttonVariants } from "@/components/ui/shadcn/button";

export type RemoteOption = {
  id: string;
  text: string;
};

export type RemoteResponse = {
  results: RemoteOption[];
  pagination?: {
    more?: boolean;
  };
};

export type Select2Props = {
  value?: string | null;
  onChange: (value: string | null, option?: RemoteOption) => void;
  fetchOptions: (args: { term: string; page: number }) => Promise<RemoteResponse>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  minimumInputLength?: number;
  debounceMs?: number;
  resolveSelected?: (id: string) => Promise<RemoteOption | null>;
  disabled?: boolean;
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

export function Select2(props: Select2Props) {
  const {
    value,
    onChange,
    fetchOptions,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    emptyText = "No results.",
    minimumInputLength = 0,
    debounceMs = 350,
    resolveSelected,
    disabled = false,
  } = props;

  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
  const [input, setInput] = React.useState("");
  const term = useDebouncedValue(input, debounceMs);

  const [options, setOptions] = React.useState<RemoteOption[]>([]);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!resolveSelected) return;
      if (!value) {
        setSelectedLabel(null);
        return;
      }

      const local = options.find((o) => o.id === value);
      if (local) {
        setSelectedLabel(local.text);
        return;
      }

      const resolved = await resolveSelected(value);
      if (!cancelled) setSelectedLabel(resolved?.text ?? null);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [value, resolveSelected, options]);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!open) return;

      if ((term ?? "").length < minimumInputLength) {
        setOptions([]);
        setHasMore(false);
        setPage(1);
        return;
      }

      setLoading(true);
      setPage(1);

      try {
        const resp = await fetchOptions({ term: term ?? "", page: 1 });
        if (cancelled) return;

        setOptions(resp.results ?? []);
        setHasMore(Boolean(resp.pagination?.more));
      } catch {
        if (cancelled) return;
        setOptions([]);
        setHasMore(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [term, open, minimumInputLength, fetchOptions]);

  async function loadMore() {
    if (loadingMore || loading || !hasMore) return;

    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const resp = await fetchOptions({ term: term ?? "", page: nextPage });
      setOptions((prev) => [...prev, ...(resp.results ?? [])]);
      setHasMore(Boolean(resp.pagination?.more));
      setPage(nextPage);
    } catch {
      // Keep current page when load more fails.
    } finally {
      setLoadingMore(false);
    }
  }

  const currentLabel =
    options.find((o) => o.id === value)?.text ?? selectedLabel ?? null;

  return (
    <Popover
      open={disabled ? false : open}
      onOpenChange={(next) => {
        if (disabled) return;
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full justify-between"
          )}
        >
          <span className={cn(!currentLabel && "text-muted-foreground")}>
            {currentLabel ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={input}
            onValueChange={setInput}
          />

          <CommandList className="max-h-64">
            {loading ? (
              <div className="text-muted-foreground flex items-center gap-2 p-3 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : options.length === 0 ? (
              <CommandEmpty>
                {(term ?? "").length < minimumInputLength
                  ? `Type at least ${minimumInputLength} character(s).`
                  : emptyText}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={opt.text}
                    onSelect={() => {
                      onChange(opt.id, opt);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === opt.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {opt.text}
                  </CommandItem>
                ))}

                <div className="p-2">
                  {hasMore ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={loadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Load more"
                      )}
                    </Button>
                  ) : null}
                </div>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { Select2 as RemoteCombobox };
