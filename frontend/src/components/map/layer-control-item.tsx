import type { LayerControlItemProps } from './types';

/**
 * LayerControlItem - Wrapper component that connects a layer ref to LayersControl
 * 
 * This component allows LayersControl to control layer visibility through the layer ref.
 * The actual layer component should be passed as children or rendered separately.
 */
export const LayerControlItem = ({
  id,
  name,
  layerType,
  children,
}: LayerControlItemProps) => {
  // This component acts as a marker for LayersControl to identify and control layers
  // The actual rendering is handled by the children or the layer component itself
  return <>{children}</>;
};

