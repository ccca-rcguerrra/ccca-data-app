import { useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router';
import type { UseSidebarProps, UseSidebarReturn, MenuItem } from '@/types/sidebar';

/**
 * Hook customizado para gerenciar o estado do sidebar
 * 
 * @param props - Propriedades do hook
 * @param props.menuItems - Array de itens do menu
 * @returns Objeto com estado e funções do sidebar
 */
export const useSidebar = ({ menuItems }: UseSidebarProps): UseSidebarReturn => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  /**
   * Alterna o estado expandido/colapsado de um item do menu
   */
  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  /**
   * Verifica se uma rota está ativa baseada no path atual
   */
  const isActiveRoute = useCallback((path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  /**
   * Expande automaticamente os itens pai do caminho ativo
   */
  const autoExpandActiveParents = useCallback(() => {
    const activeParents = new Set<string>();
    
    const findActiveParents = (items: MenuItem[], targetPath: string): boolean => {
      for (const item of items) {
        if (item.path === targetPath || targetPath.startsWith(item.path)) {
          return true;
        }
        
        if (item.children) {
          if (findActiveParents(item.children, targetPath)) {
            activeParents.add(item.id);
            return true;
          }
        }
      }
      return false;
    };

    findActiveParents(menuItems, location.pathname);
    
    if (activeParents.size > 0) {
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        activeParents.forEach(parentId => newSet.add(parentId));
        return newSet;
      });
    }
  }, [menuItems, location.pathname]);

  // Auto-expandir pais do caminho ativo quando o caminho mudar
  useMemo(() => {
    autoExpandActiveParents();
  }, [autoExpandActiveParents]);

  return {
    expandedItems,
    toggleExpanded,
    isActiveRoute,
  };
};
