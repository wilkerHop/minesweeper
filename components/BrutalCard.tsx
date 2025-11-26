import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: string;
  action?: React.ReactNode;
}

export function BrutalCard({ children, className = '', title, icon, action }: Props) {
  return (
    <div className={`bg-void border-2 border-hacker-grey p-6 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col ${className}`}>
      {(title || icon || action) && (
        <div className="flex items-center justify-between mb-4 border-b-2 border-hacker-grey pb-2">
          <div className="flex items-center gap-2 text-neon-green font-bold uppercase tracking-widest font-mono">
            {icon && <span className="text-xl">{icon}</span>}
            {title && <span>{title}</span>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
