
import type { ReactNode, MouseEventHandler } from 'react';
import React from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div onClick={onClick} className={`bg-white dark:bg-dark-sidebar rounded-lg shadow-md p-4 md:p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
