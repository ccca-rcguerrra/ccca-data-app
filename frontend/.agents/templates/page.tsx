import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/shadcn/alert';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { useFeatureController } from './hooks/use-feature-controller';

export const FeaturePage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const controller = useFeatureController({
    id: id ? Number(id) : undefined,
  });

  if (!controller.isValidId) {
    return (
      <div className="flex items-center justify-center w-full h-full p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>{t('errors.invalidId')}</AlertTitle>
          <AlertDescription>
            {t('errors.invalidIdDescription')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (controller.api.isLoading) {
    return <FeatureSkeleton />;
  }

  if (controller.api.isError || !controller.api.data) {
    return (
      <div className="flex items-center justify-center w-full h-full p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>{t('errors.loadError')}</AlertTitle>
          <AlertDescription>
            {controller.api.error instanceof Error
              ? controller.api.error.message
              : t('errors.unknownError')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1">{/* Main content */}</div>
      <div className="w-[450px] border-l">{/* Sidebar */}</div>
    </div>
  );
};

const FeatureSkeleton = () => (
  <div className="flex h-full">
    <div className="flex-1 p-6">
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
    <div className="w-[450px] border-l p-6 space-y-4">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-20 w-full" />
    </div>
  </div>
);
