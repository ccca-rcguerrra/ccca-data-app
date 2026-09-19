import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes.constants';
import { useAppConfig } from '@/hooks/api/use-app-config';
import { CountryFlag } from '@/components/ui/country-flag';
import style from './sub-header.module.scss';

export const SubHeader = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: appConfig } = useAppConfig();

  const pathLabelKeys: Record<string, string> = {
    '': 'breadcrumbs.home',
    'dashboard': 'navigation.indicators',
    'users': 'navigation.users',
    'list': 'breadcrumbs.list',
    'create': 'breadcrumbs.create',
    'new': 'breadcrumbs.new',
    'edit': 'breadcrumbs.edit',
    'teams': 'navigation.teams',
    'clipping': 'breadcrumbs.clipping',
    'alerts': 'navigation.alerts',
    'management': 'breadcrumbs.management',
    'refinement': 'breadcrumbs.refinement',
    'audit': 'navigation.audit',
    'supports': 'breadcrumbs.supports',
    'details': 'breadcrumbs.details',
    'semaspa': 'navigation.semaspa',
    'autefs': 'navigation.autefs',
    'forest-guides': 'navigation.forestGuides',
    'people': 'navigation.people',
    'permit-references': 'navigation.permitReferences',
  };

  const breadcrumbItems = useMemo(() => {
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) {
      return [
        { id: 'home', label: t('breadcrumbs.home') },
        { id: '/dashboard', label: t('navigation.indicators') },
      ];
    }

    return [
      { id: 'home', label: t('breadcrumbs.home') },
      ...pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const label = pathLabelKeys[value]
          ? t(pathLabelKeys[value])
          : value.charAt(0).toUpperCase() + value.slice(1);
        return { id: to, label };
      }),
    ];
  }, [location.pathname, t]);

  const handleClick = (id: string) => {
    if (id === 'home') {
      navigate(ROUTES.root);
    } else {
      navigate(id);
    }
  };

  return (
    <nav className={style.breadcrumb} aria-label={t('breadcrumbs.ariaLabel')}>
      <div className={style.breadcrumbFlag}>
        <CountryFlag countryCode={appConfig?.countryCode} countryName={appConfig?.country} size="sm" />
      </div>
      <ol className={style.breadcrumbList}>
        {breadcrumbItems.map((item, index) => {
          const path = typeof item.id === 'string' ? item.id : String(item.id);
          const isLast = index === breadcrumbItems.length - 1;
          return (
            <li key={path} className={style.breadcrumbItem}>
              {index > 0 && <span className={style.separator} aria-hidden>›</span>}
              {isLast ? (
                <span className={style.current}>{item.label}</span>
              ) : (
                <button
                  type="button"
                  className={style.link}
                  onClick={() => handleClick(path)}
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
