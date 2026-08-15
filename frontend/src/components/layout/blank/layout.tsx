import React from 'react';
import { useTranslation } from 'react-i18next';


interface BlankLayoutProps {
  children: React.ReactNode;
}

export const BlankLayout = ({ children }: BlankLayoutProps) => {
  const { t } = useTranslation();

  return (
    <div 
      className="blank-layout"
      role="application" 
      aria-label={t('layout.blank.ariaLabel')}
    >
      <main 
        className="page-content"
        role="main"
        aria-label={t('layout.blank.mainAria')}
      >
        <div className="content-container">
          {children}
        </div>
      </main>
    </div>
  );
};
