import React from 'react';

interface LogoProps {
  variant?: 'icon' | 'full' | 'horizontal';
  className?: string;
  size?: number; // Used for icon size or height
}

export const Logo: React.FC<LogoProps> = ({ variant = 'full', className = '', size }) => {
  const iconSize = size || (variant === 'icon' ? 36 : 48);

  const svgIcon = (
    <svg
      viewBox="0 0 200 200"
      width={iconSize}
      height={iconSize}
      className="inline-block select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradients matching the actual logo */}
        <linearGradient id="logoBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d47a1" />
          <stop offset="50%" stopColor="#1565c0" />
          <stop offset="100%" stopColor="#1e88e5" />
        </linearGradient>
        <linearGradient id="logoGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2e7d32" />
          <stop offset="60%" stopColor="#4caf50" />
          <stop offset="100%" stopColor="#81c784" />
        </linearGradient>
        <shadow id="logoShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.1" />
        </shadow>
      </defs>

      {/* House Roof & Chimney */}
      {/* Chimney (Green) */}
      <path
        d="M 140,55 L 140,35 L 155,35 L 155,70 Z"
        fill="url(#logoGreenGrad)"
      />

      {/* Blue Roof (Left) */}
      <path
        d="M 100,25 L 30,85 L 42,95 L 100,45 Z"
        fill="url(#logoBlueGrad)"
      />

      {/* Green Roof (Right) */}
      <path
        d="M 100,25 L 170,85 L 158,95 L 100,45 Z"
        fill="url(#logoGreenGrad)"
      />

      {/* House Walls & Dynamic Lettering */}
      {/* C Letter (Blue Gradient) - Left side wrapping into center */}
      <path
        d="M 45,95 L 45,155 C 45,170 65,180 90,180 C 110,180 125,172 125,158 L 105,158 C 105,164 95,166 90,166 C 72,166 65,156 65,148 L 65,115 C 65,102 80,92 100,92 C 118,92 130,102 130,118 L 130,128 L 112,128 L 112,142 L 150,142 L 150,115 C 150,85 125,74 100,74 C 70,74 45,82 45,95 Z"
        fill="url(#logoBlueGrad)"
      />

      {/* F Letter (Green Gradient) - Nested inside the house */}
      <path
        d="M 105,92 L 105,166 L 85,166 L 85,180 L 125,180 L 125,166 L 121,166 L 121,130 L 142,130 L 142,116 L 121,116 L 121,104 L 145,104 L 145,92 Z"
        fill="url(#logoGreenGrad)"
      />

      {/* Subtle details to match the stylized CF icon overlap */}
      <path
        d="M 85,110 C 85,96 100,86 118,86 C 130,86 140,94 140,102 L 124,102 C 124,98 118,96 114,96 C 104,96 98,102 98,110 Z"
        fill="url(#logoBlueGrad)"
        opacity="0.85"
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {svgIcon}
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {svgIcon}
        <div className="flex flex-col">
          <span className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-none">
            Casa <span className="text-brand-600 dark:text-brand-400">Finance</span> Pro
          </span>
          <span className="text-[9px] font-semibold tracking-widest text-gray-500 dark:text-gray-400 mt-1 uppercase">
            Seu dinheiro, sob controle
          </span>
        </div>
      </div>
    );
  }

  // Full variant (Stacked - like the uploaded image)
  return (
    <div className={`flex flex-col items-center text-center p-4 ${className}`}>
      {svgIcon}
      <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-4 tracking-tight">
        Casa <span className="text-brand-600 dark:text-brand-400">Finance</span> Pro
      </h2>
      <p className="text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 mt-2 uppercase">
        Seu dinheiro, sob controle
      </p>
    </div>
  );
};
