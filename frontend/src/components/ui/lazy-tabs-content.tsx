import { useEffect, useState } from 'react';

import { TabsContent } from '@/components/ui/shadcn/tabs';

type LazyTabsContentProps = React.ComponentProps<typeof TabsContent> & {
  /** Currently selected tab value (the same value bound to the parent `Tabs`). */
  activeValue: string | undefined;
};

/**
 * TabsContent that defers mounting its children until the tab is opened for the
 * first time, then keeps them mounted (`forceMount`) so revisiting it does not
 * remount/refetch. Use for tabs whose content is expensive to load — e.g. the
 * shared GEE Analysis chart, which otherwise fires its query on page load even
 * while hidden.
 *
 * Pair it with a `data-[state=inactive]:hidden` className (as the regular tabs
 * do) so the force-mounted content stays hidden while another tab is active.
 */
export function LazyTabsContent({ value, activeValue, children, ...props }: LazyTabsContentProps) {
  const [visited, setVisited] = useState(false);

  useEffect(() => {
    if (activeValue === value) setVisited(true);
  }, [activeValue, value]);

  return (
    <TabsContent value={value} forceMount {...props}>
      {visited ? children : null}
    </TabsContent>
  );
}
