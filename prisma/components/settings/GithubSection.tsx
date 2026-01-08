
import React, { useState, useEffect } from 'react';
import { Github, Star } from 'lucide-react';

const GithubSection = ({ isOpen }: { isOpen: boolean }) => {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('https://api.github.com/repos/yeahhe365/Prisma')
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.stargazers_count === 'number') {
            setStars(data.stargazers_count);
          }
        })
        .catch(err => console.error("Error fetching stars:", err));
    }
  }, [isOpen]);

  return (
    <div className="border-t border-slate-100 pt-6">
      <a 
        href="https://github.com/yeahhe365/Prisma" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 text-white rounded-lg group-hover:scale-110 transition-transform">
            <Github size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">yeahhe365 / Prisma</p>
            <p className="text-xs text-slate-500">Open source on GitHub</p>
          </div>
        </div>
        
        {stars !== null && (
          <div className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-md shadow-sm">
            <Star size={14} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-slate-700">{stars.toLocaleString()}</span>
          </div>
        )}
      </a>
    </div>
  );
};

export default GithubSection;
