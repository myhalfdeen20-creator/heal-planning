import React from 'react';

export const UserAvatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' }> = ({
  name,
  size = 'sm',
}) => {
  const dims = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'md' ? 'w-9 h-9 text-sm' : 'w-16 h-16 text-lg';
  const isLaura = name.toLowerCase().includes('laura');
  return (
    <div
      className={`${dims} rounded-full overflow-hidden shrink-0 border border-white/60 shadow-xs flex items-center justify-center bg-slate-700 text-white font-semibold relative`}
      aria-hidden="true"
    >
      {isLaura ? (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <defs>
            <linearGradient id="lauraBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="100%" stopColor="#450a0a" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill="url(#lauraBg)" />
          <circle cx="32" cy="24" r="11" fill="#f5d0c5" />
          <path d="M16 58 C16 41 48 41 48 58" fill="#1e293b" />
          <path d="M20 22 C20 10 44 10 44 24 C44 18 36 15 32 15 C26 15 21 18 20 22 Z" fill="#451a03" />
        </svg>
      ) : (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <defs>
            <linearGradient id="alexBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill="url(#alexBg)" />
          <circle cx="32" cy="24" r="11" fill="#f1c27d" />
          <path d="M14 58 C14 40 50 40 50 58" fill="#cbd5e1" />
          <path d="M21 20 C21 11 43 11 43 20 C41 15 23 15 21 20 Z" fill="#1e293b" />
        </svg>
      )}
    </div>
  );
};

export const EventCircleAvatar: React.FC<{ type: string; size?: 'sm' | 'lg' }> = ({
  type,
  size = 'lg',
}) => {
  const cls = size === 'lg' ? 'w-20 h-20' : 'w-9 h-9';
  return (
    <div className={`${cls} rounded-full overflow-hidden shrink-0 border-2 border-slate-200 shadow-xs bg-amber-900/20`}>
      {type === 'reception-silhouette' ? (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="sunsetGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c2410c" />
              <stop offset="55%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#sunsetGrad)" />
          <circle cx="38" cy="44" r="10" fill="#0f172a" />
          <circle cx="58" cy="47" r="9.5" fill="#0f172a" />
          <path d="M22 95 C22 65 52 65 52 95 Z" fill="#0f172a" />
          <path d="M44 95 C44 68 74 68 74 95 Z" fill="#0f172a" />
        </svg>
      ) : type === 'sunflower' ? (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect width="100" height="100" fill="#0284c7" />
          <circle cx="50" cy="50" r="30" fill="#facc15" />
          <circle cx="50" cy="50" r="15" fill="#713f12" />
        </svg>
      ) : type === 'wine-tasting' ? (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect width="100" height="100" fill="#fef3c7" />
          <path d="M35 25 L65 25 L60 52 C58 62 42 62 40 52 Z" fill="#881337" />
          <rect x="48" y="58" width="4" height="22" fill="#475569" />
          <rect x="38" y="80" width="24" height="3" fill="#475569" />
        </svg>
      ) : (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="warmWedding" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d6b89c" />
              <stop offset="50%" stopColor="#a67c52" />
              <stop offset="100%" stopColor="#5c3a21" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#warmWedding)" />
          <circle cx="40" cy="42" r="14" fill="#f5d0b5" />
          <circle cx="60" cy="45" r="13" fill="#ecc0a1" />
          <path d="M18 98 C18 68 58 68 58 98" fill="#3b2314" />
          <path d="M44 98 C44 70 84 70 84 98" fill="#fffbeb" />
        </svg>
      )}
    </div>
  );
};

export const FoodDishThumbnail: React.FC<{
  type: 'chicken' | 'pasta' | 'beans' | 'salad' | 'rice' | 'dessert';
}> = ({ type }) => {
  return (
    <div className="w-20 h-20 rounded-md overflow-hidden shrink-0 border border-slate-200 bg-slate-50 shadow-2xs">
      {type === 'chicken' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect width="100" height="100" fill="#f1f5f9" />
          <circle cx="50" cy="50" r="42" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
          <ellipse cx="52" cy="48" rx="26" ry="20" fill="#d97706" />
          <ellipse cx="48" cy="45" rx="20" ry="14" fill="#f59e0b" />
          <circle cx="32" cy="62" r="6" fill="#15803d" />
          <circle cx="65" cy="64" r="5" fill="#16a34a" />
          <circle cx="46" cy="67" r="4" fill="#78350f" />
        </svg>
      )}
      {type === 'pasta' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect width="100" height="100" fill="#fff7ed" />
          <circle cx="50" cy="50" r="42" fill="#ffffff" stroke="#fed7aa" strokeWidth="2" />
          <circle cx="50" cy="50" r="29" fill="#fb923c" />
          <circle cx="45" cy="46" r="14" fill="#dc2626" />
          <circle cx="58" cy="54" r="11" fill="#ea580c" />
          <circle cx="48" cy="48" r="5" fill="#16a34a" />
        </svg>
      )}
      {type === 'beans' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect width="100" height="100" fill="#14532d" />
          <path d="M10 20 L90 40 M10 35 L90 55 M10 50 L90 70 M15 65 L85 85 M20 15 L80 75 M30 10 L90 60" stroke="#22c55e" strokeWidth="7" strokeLinecap="round" />
          <path d="M15 28 L85 48 M20 45 L85 65 M25 60 L80 78" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" />
        </svg>
      )}
      {type === 'salad' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect width="100" height="100" fill="#f8fafc" />
          <circle cx="50" cy="50" r="40" fill="#ffffff" stroke="#cbd5e1" strokeWidth="3" />
          <circle cx="50" cy="50" r="30" fill="#4ade80" />
          <circle cx="38" cy="42" r="10" fill="#16a34a" />
          <circle cx="60" cy="46" r="11" fill="#22c55e" />
          <circle cx="45" cy="60" r="6" fill="#ef4444" />
          <circle cx="62" cy="58" r="5" fill="#f97316" />
          <circle cx="36" cy="54" r="4" fill="#ef4444" />
        </svg>
      )}
      {type === 'rice' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect width="100" height="100" fill="#e2e8f0" />
          <circle cx="50" cy="55" r="38" fill="#fffbeb" stroke="#94a3b8" strokeWidth="3" />
          <ellipse cx="50" cy="52" rx="28" ry="22" fill="#f5f5f4" />
          <circle cx="42" cy="48" r="2.5" fill="#44403c" />
          <circle cx="55" cy="45" r="2.5" fill="#78350f" />
          <circle cx="48" cy="56" r="2.5" fill="#15803d" />
          <circle cx="60" cy="54" r="2.5" fill="#44403c" />
          <circle cx="38" cy="55" r="2.5" fill="#78350f" />
        </svg>
      )}
      {type === 'dessert' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect width="100" height="100" fill="#fdf2f8" />
          <circle cx="50" cy="50" r="38" fill="#ffffff" stroke="#fbcfe8" strokeWidth="2" />
          <polygon points="32,65 68,65 55,32" fill="#be185d" />
          <circle cx="54" cy="30" r="6" fill="#e11d48" />
        </svg>
      )}
    </div>
  );
};

export const ProposalItemThumbnail: React.FC<{
  type: 'clipboard' | 'planner' | 'ballroom' | 'catering';
}> = ({ type }) => {
  return (
    <div className="w-20 h-14 rounded-xs overflow-hidden shrink-0 border border-slate-200 bg-white flex items-center justify-center">
      {type === 'clipboard' && (
        <svg viewBox="0 0 80 60" className="w-full h-full">
          <rect width="80" height="60" fill="#ffffff" />
          <g transform="rotate(-25 40 30)">
            <rect x="24" y="6" width="32" height="46" rx="2" fill="#78350f" stroke="#1e293b" strokeWidth="1.5" />
            <rect x="27" y="10" width="26" height="39" fill="#ffffff" />
            <rect x="34" y="4" width="12" height="5" rx="1" fill="#94a3b8" />
            <line x1="31" y1="18" x2="49" y2="18" stroke="#64748b" strokeWidth="1.5" />
            <line x1="31" y1="24" x2="49" y2="24" stroke="#64748b" strokeWidth="1.5" />
            <line x1="31" y1="30" x2="45" y2="30" stroke="#64748b" strokeWidth="1.5" />
          </g>
        </svg>
      )}
      {type === 'planner' && (
        <svg viewBox="0 0 80 60" className="w-full h-full">
          <rect width="80" height="60" fill="#e2e8f0" />
          <rect x="8" y="8" width="28" height="44" fill="#cbd5e1" />
          <circle cx="52" cy="24" r="8" fill="#f1c27d" />
          <path d="M38 56 C38 38 66 38 66 56" fill="#f8fafc" />
          <rect x="34" y="36" width="16" height="12" fill="#334155" transform="rotate(-10 42 42)" />
        </svg>
      )}
      {type === 'ballroom' && (
        <svg viewBox="0 0 80 60" className="w-full h-full">
          <rect width="80" height="60" fill="#291d12" />
          <rect x="0" y="38" width="80" height="22" fill="#78350f" />
          <circle cx="22" cy="14" r="5" fill="#fde047" opacity="0.85" />
          <circle cx="40" cy="12" r="6" fill="#fef08a" opacity="0.95" />
          <circle cx="58" cy="14" r="5" fill="#fde047" opacity="0.85" />
          <ellipse cx="22" cy="46" rx="10" ry="4" fill="#fef3c7" />
          <ellipse cx="42" cy="48" rx="11" ry="4.5" fill="#fef3c7" />
          <ellipse cx="62" cy="46" rx="10" ry="4" fill="#fef3c7" />
        </svg>
      )}
      {type === 'catering' && (
        <svg viewBox="0 0 80 60" className="w-full h-full">
          <rect width="80" height="60" fill="#f8fafc" />
          <path d="M18 42 A22 22 0 0 1 62 42 Z" fill="#94a3b8" />
          <circle cx="40" cy="18" r="3" fill="#64748b" />
          <rect x="14" y="42" width="52" height="4" rx="2" fill="#475569" />
        </svg>
      )}
    </div>
  );
};
