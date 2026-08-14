import { useTranslation } from 'react-i18next';

export const DashboardPage = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full p-6 overflow-y-auto bg-background flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-2">
        {t('dashboard.welcome')}
      </h1>
      <p className="text-muted-foreground">
        {t('dashboard.description')}
      </p>
    </div>
  );
};
