import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'important';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'font-mono border transition-colors duration-200 focus:outline-none';
  
  const variantClasses = {
    primary: 'bg-[#9ACD32] border-[#9ACD32] text-black hover:bg-black hover:text-[#9ACD32]',
    secondary: 'bg-black border-[#9ACD32] text-[#9ACD32] hover:bg-[#9ACD32]/20',
    danger: 'bg-black border-[#9ACD32] text-[#9ACD32] hover:bg-red-500/20',
    outline: 'bg-transparent border-[#9ACD32] text-[#9ACD32] hover:bg-[#9ACD32]/10',
    important: 'bg-white border-white text-black hover:bg-black hover:text-white hover:border-white'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm',
    lg: 'px-5 py-2 text-base',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant as keyof typeof variantClasses]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button; 