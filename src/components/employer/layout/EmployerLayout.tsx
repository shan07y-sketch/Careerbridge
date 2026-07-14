import React from 'react';

interface EmployerLayoutProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
}

export const EmployerLayout: React.FC<EmployerLayoutProps> = ({ sidebar, header, children }) => {
  return (
    <div className="bg-background text-on-background font-sans min-h-screen flex overflow-hidden">
      {sidebar}
      <main className="ml-64 flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {header}
        {children}
      </main>
    </div>
  );
};
export default EmployerLayout;
