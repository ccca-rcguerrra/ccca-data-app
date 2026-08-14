import React from 'react';


interface BlankLayoutProps {
  children: React.ReactNode;
}

export const BlankLayout = ({ children }: BlankLayoutProps) => {
  return (
    <div 
      className="blank-layout"
      role="application" 
      aria-label="Layout em Branco"
    >
      {/* Conteúdo da Página */}
      <main 
        className="page-content"
        role="main"
        aria-label="Conteúdo principal"
      >
        <div className="content-container">
          {children}
        </div>
      </main>
    </div>
  );
};
