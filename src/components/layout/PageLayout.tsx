import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Footer } from './Footer';

interface PageLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children, fullWidth = false }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="text-on-surface bg-surface dark:bg-surface-dim min-h-screen flex overflow-hidden">
      {/* Mobile Drawer Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main Shell Offset */}
      <div className="flex-grow lg:ml-64 flex flex-col h-screen overflow-hidden">
        {/* Header bar */}
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col bg-surface dark:bg-surface-dim">
          {fullWidth ? (
            <div className="flex-grow flex flex-col">
              {children}
            </div>
          ) : (
            <div className="flex-grow p-4 md:p-6 lg:p-10">
              <div className="w-full max-w-container-max mx-auto space-y-stack-lg">
                {children}
              </div>
            </div>
          )}
          
          {/* Global Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

