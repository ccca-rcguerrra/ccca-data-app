# Component Rules

Applies when working in `src/components/` or `src/pages/*/components/`.

## Shared vs Page-Scoped

| Location | Purpose | When to use |
|----------|---------|-------------|
| `src/components/` | Reusable across 2+ pages | If the component appears in multiple routes |
| `src/pages/<domain>/components/` | Page-specific only | If the component only serves one page |

## Component Template

```typescript
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
  onAction?: () => void;
}

export const FeatureCard = ({
  title,
  description,
  isLoading = false,
  className,
  children,
  onAction,
}: FeatureCardProps) => {
  if (isLoading) {
    return (
      <div className={cn('rounded-lg border p-4 animate-pulse', className)}>
        <div className="h-5 w-2/3 rounded bg-muted" />
        <div className="mt-2 h-4 w-full rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      <h3 className="font-semibold text-card-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {children}
      {onAction && (
        <button
          onClick={onAction}
          className="mt-3 text-sm font-medium text-primary hover:underline"
        >
          Action
        </button>
      )}
    </div>
  );
};
```

## Rules

| Rule | Why |
|------|-----|
| **`cn()` for all className merging** | Safely merges Tailwind classes without conflicts |
| **Props interface in same file** | Move to types/ only if shared by 3+ files |
| **`className` prop always accepted** | Allows parent to customize layout (margin, width) |
| **Loading state built-in** | Components that fetch data should handle their own loading |
| **No default exports** | Named exports are easier to refactor and tree-shake |
| **`React.forwardRef` for Radix wrappers** | Required for `asChild` pattern in shadcn/ui |
| **Props use `type` not `interface`** | Consistent with project conventions |
| **Destructure props in signature** | Easier to see what props the component uses |

## When to Create Shared Components

Extract to `src/components/` when:
- The same markup appears in 3+ places
- Multiple pages need the same layout (sidebar, header, footer)
- A UI pattern is complex enough to warrant its own file (map popups, image selectors, drawing tools)

Keep in `pages/<domain>/components/` when:
- The component is tightly coupled to page-specific state
- It uses the page's controller hook
- It only exists to break up a large page file

## shadcn/ui Components

- Installed via `pnpm dlx shadcn@latest add <name>`
- Live in `src/components/ui/shadcn/`
- All support `className` prop
- Some use `forwardRef` for `asChild` pattern:
  ```typescript
  <Button asChild>
    <a href="/somewhere">Navigate</a>
  </Button>
  ```
- Icons always from `lucide-react`:
  ```typescript
  import { AlertCircle, Check, Loader2 } from 'lucide-react';
  ```
