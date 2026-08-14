import { useMemo, Children, isValidElement, useState, useEffect, useRef, useCallback } from 'react';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Separator } from '@/components/ui/shadcn/separator';
import { Button } from '@/components/ui/shadcn/button';
import { ChevronDown, Layers } from 'lucide-react';
import type { LayerInfo, LayersControlProps, MapLayerRef } from './types';

/**
 * LayersControl - Map layers panel (base maps and overlays)
 */
export const LayersControl = ({
  children,
  showControlPanel = true,
  controlPanelPosition = 'top-right',
}: LayersControlProps) => {
  const [activeOverlays, setActiveOverlays] = useState<Set<string>>(new Set());
  const [selectedBaseMap, setSelectedBaseMap] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const hasInitialSyncRef = useRef<boolean>(false);

  // Helper function to extract layer info from children (memoized)
  const extractLayerInfo = useCallback((children: React.ReactNode) => {
    const base: LayerInfo[] = [];
    const overlay: LayerInfo[] = [];

    Children.forEach(children, (child) => {
      if (!isValidElement(child)) return;

      // Only accept LayerControlItem (must have layerRef prop)
      const hasLayerRef = child.props?.layerRef !== undefined;
      
      if (!hasLayerRef) {
        return;
      }

      const childId = child.props?.id;
      if (!childId) {
        console.warn('LayerControlItem must have an id prop');
        return;
      }

      const layerType = child.props?.layerType;
      if (!layerType) {
        console.warn(`LayerControlItem with id "${childId}" must have a layerType prop`);
        return;
      }

      const name = child.props?.name || childId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      const layerRef = child.props?.layerRef;

      if (layerType === 'base') {
        base.push({ id: childId, name, type: 'base', layerRef });
      } else if (layerType === 'overlay') {
        overlay.push({ id: childId, name, type: 'overlay', layerRef });
      }
    });

    return { baseMaps: base, overlays: overlay };
  }, []);

  // Separate base maps and overlays from children - only accept LayerControlItem
  const { baseMaps, overlays } = useMemo(() => {
    return extractLayerInfo(children);
  }, [children, extractLayerInfo]);

  // Reset sync state when children change
  useEffect(() => {
    hasInitialSyncRef.current = false;
  }, [children]);

  // Helper function to safely check if layer is visible
  const isLayerVisible = useCallback((layerRef: React.RefObject<MapLayerRef | null> | undefined): boolean => {
    if (!layerRef?.current) return false;
    try {
      return layerRef.current.isVisible();
    } catch {
      return false;
    }
  }, []);

  // Helper function to safely check if layer is lazy
  const isLayerLazy = useCallback((layerRef: React.RefObject<MapLayerRef | null> | undefined): boolean => {
    if (!layerRef?.current) return true;
    try {
      return layerRef.current.isLazy();
    } catch {
      return true;
    }
  }, []);

  // Sync initial state — retries until all layer refs are populated (map loads async)
  useEffect(() => {
    if (hasInitialSyncRef.current) return;

    let retryCount = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const syncState = () => {
      const allRefsReady =
        baseMaps.every((bm) => bm.layerRef?.current) &&
        overlays.every((ov) => ov.layerRef?.current);

      // Refs not ready yet — keep retrying (MapLibre loads asynchronously)
      if (!allRefsReady && retryCount < 30) {
        retryCount += 1;
        timeoutId = setTimeout(syncState, Math.min(100 * retryCount, 500));
        return;
      }

      // Sync base maps — include lazy layers in visibility check so proxy-based base maps
      // (like Sentinel, which is always lazy but can be active) are correctly detected.
      let foundVisibleBaseMap: string | null = null;
      for (const baseMap of baseMaps) {
        if (baseMap.layerRef?.current && isLayerVisible(baseMap.layerRef)) {
          foundVisibleBaseMap = baseMap.id;
          break;
        }
      }
      if (foundVisibleBaseMap) {
        setSelectedBaseMap(foundVisibleBaseMap);
      } else {
        const firstNonLazy = baseMaps.find(bm => bm.layerRef?.current && !isLayerLazy(bm.layerRef));
        if (firstNonLazy) setSelectedBaseMap(firstNonLazy.id);
      }

      // Sync overlays — isLayerVisible() is the source of truth for both lazy and non-lazy
      // layers. Lazy but not-yet-created layers return isVisible()=false, so they're
      // excluded without needing the isLayerLazy guard. The guard would incorrectly
      // exclude lazy overlays that were manually activated by the user.
      const visibleOverlays = new Set<string>();
      for (const overlay of overlays) {
        if (overlay.layerRef?.current && isLayerVisible(overlay.layerRef)) {
          visibleOverlays.add(overlay.id);
        }
      }
      setActiveOverlays(visibleOverlays);

      hasInitialSyncRef.current = true;
    };

    timeoutId = setTimeout(syncState, 100);

    return () => clearTimeout(timeoutId);
  }, [baseMaps, overlays, isLayerVisible, isLayerLazy]);

  // Handle base map selection
  const handleBaseMapChange = useCallback((layer: LayerInfo) => {
    // Validate layer ref exists
    if (!layer.layerRef?.current) {
      console.warn(`Cannot change base map ${layer.id}: layer ref is not available`);
      return;
    }

    // Hide all base maps first
    baseMaps.forEach((baseMap) => {
      if (baseMap.layerRef?.current) {
        try {
          baseMap.layerRef.current.destroy();
        } catch (error) {
          console.warn(`Error destroying base map ${baseMap.id}:`, error);
        }
      }
    });

    // Create and show selected base map
    try {
      layer.layerRef.current.create();
      // Layer is automatically visible when created (unless lazy)
    } catch (error) {
      console.error(`Error creating base map ${layer.id}:`, error);
      return;
    }

    setSelectedBaseMap(layer.id);
  }, [baseMaps]);

  // Handle overlay toggle
  const handleOverlayChange = useCallback((layer: LayerInfo, checked: boolean) => {
    // Validate layer ref exists
    if (!layer.layerRef?.current) {
      console.warn(`Cannot toggle overlay ${layer.id}: layer ref is not available`);
      return;
    }

    try {
      if (checked) {
        layer.layerRef.current.create();
        setActiveOverlays((prev) => new Set(prev).add(layer.id));
      } else {
        layer.layerRef.current.destroy();
        setActiveOverlays((prev) => {
          const next = new Set(prev);
          next.delete(layer.id);
          return next;
        });
      }
    } catch (error) {
      console.error(`Error toggling overlay ${layer.id}:`, error);
    }
  }, []);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-12 right-4',
    'bottom-left': 'bottom-12 left-8',
  };

  const baseMapOptions = useMemo(
    () => baseMaps.map((bm) => ({ value: bm.id, label: bm.name })),
    [baseMaps]
  );

  const handleBaseMapOptionChange = useCallback(
    (value: string) => {
      const layer = baseMaps.find((bm) => bm.id === value);
      if (layer) handleBaseMapChange(layer);
    },
    [baseMaps, handleBaseMapChange]
  );

  return (
    <div className="relative w-full h-full pointer-events-none">
      {children}

      {showControlPanel && (
        <div
          className={`absolute ${positionClasses[controlPanelPosition]} pointer-events-auto`}
          style={{ zIndex: 'var(--z-index-modal)' }}
        >
          <div
            className={`flex flex-col overflow-hidden rounded-lg border border-border/80 bg-background/95 shadow-lg backdrop-blur-sm ${
              isMinimized ? 'min-w-0' : 'min-w-[210px] max-w-[260px]'
            }`}
          >
            {isMinimized ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-lg"
                aria-label="Expand layers panel"
                aria-expanded={false}
                onClick={() => setIsMinimized(false)}
              >
                <Layers size={16} className="text-muted-foreground" />
              </Button>
            ) : (
              <>
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60">
              <Layers size={13} className="text-muted-foreground shrink-0" />
              <span className="text-sm font-semibold flex-1">Layers</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 -mr-1"
                aria-label="Minimize layers panel"
                aria-expanded={true}
                onClick={() => setIsMinimized(true)}
              >
                <ChevronDown size={14} className="text-muted-foreground" />
              </Button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-2.5 p-2.5">
              {baseMaps.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1.5 mb-0.5">
                    Base Maps
                  </p>
                  <div role="radiogroup" aria-label="Base maps" className="flex flex-col">
                    {baseMapOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2.5 h-7 cursor-pointer rounded-md px-1.5 hover:bg-accent/50 transition-colors"
                      >
                        <input
                          type="radio"
                          name="baseMap"
                          value={opt.value}
                          checked={selectedBaseMap === opt.value}
                          onChange={() => handleBaseMapOptionChange(opt.value)}
                          className="size-3.5 shrink-0 accent-primary"
                        />
                        <span className="text-sm leading-none">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {baseMaps.length > 0 && overlays.length > 0 && <Separator />}

              {overlays.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1.5 mb-0.5">
                    Overlays
                  </p>
                  <div className="flex flex-col">
                    {overlays.map((layer) => (
                      <div
                        key={layer.id}
                        className="flex items-center gap-2.5 h-7 px-1.5 rounded-md hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          id={`overlay-${layer.id}`}
                          checked={activeOverlays.has(layer.id)}
                          onCheckedChange={(value) => handleOverlayChange(layer, !!value)}
                          className="shrink-0"
                        />
                        <label
                          htmlFor={`overlay-${layer.id}`}
                          className="text-sm leading-none cursor-pointer flex-1"
                        >
                          {layer.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
