'use client';

import React, { useState } from 'react';
import { TeamMember } from '@/types/team';
import { calculateTeamCapabilities } from '@/data/team-members';
import { usePathname } from 'next/navigation';

interface TeamCapabilityMatrixProps {
  teamMembers: TeamMember[];
  className?: string;
}

export default function TeamCapabilityMatrix({ teamMembers, className = '' }: TeamCapabilityMatrixProps) {
  const pathname = usePathname();
  const isEn = pathname?.startsWith('/en');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const capabilities = calculateTeamCapabilities();
  const text = {
    title: isEn ? 'Team AI Tool Usage' : '团队AI工具使用分布',
    membersUsing: (category: string, count: number) =>
      isEn ? `Team members using "${category}" (${count})` : `使用"${category}"的团队成员 (${count})`,
  };
  
  // 显示前8个主要能力
  const topCapabilities = capabilities.slice(0, 8);
  
  // 根据所选类别筛选团队成员
  const filteredMembers = selectedCategory 
    ? teamMembers.filter(member => 
        member.aiTools?.includes(selectedCategory) || 
        member.specialty?.split(',').some(s => s.trim() === selectedCategory)
      )
    : [];
  
  return (
    <div className={`bg-gradient-to-br from-[#f5f3ff] to-purple-50 dark:from-slate-800 dark:to-purple-900/30 rounded-xl shadow-md p-6 border border-indigo-100 dark:border-purple-800/30 ${className}`}>
      <div className="flex items-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7" r="4"></circle>
          <line x1="20" y1="8" x2="20" y2="14"></line>
          <line x1="23" y1="11" x2="17" y2="11"></line>
        </svg>
        <h2 className="text-xl font-bold text-indigo-800 dark:text-indigo-300">{text.title}</h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {topCapabilities.map((capability) => (
          <button
            key={capability.category}
            className={`text-center p-3 rounded-lg transition-all hover:shadow-md ${
              selectedCategory === capability.category
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-400 dark:border-indigo-600 shadow-sm'
                : 'bg-white dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-700/80'
            }`}
            onClick={() => setSelectedCategory(
              selectedCategory === capability.category ? null : capability.category
            )}
          >
            <div className="font-bold text-lg">{capability.count}</div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
              {capability.category}
            </div>
            <div className="mt-1 h-1.5 bg-gray-100 dark:bg-slate-700/70 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                style={{ width: `${capability.percentage}%` }}
              ></div>
            </div>
          </button>
        ))}
      </div>
      
      {selectedCategory && (
        <div className="mt-6 p-4 bg-white/70 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
          <div className="flex items-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300">
              {text.membersUsing(selectedCategory, filteredMembers.length)}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredMembers.map(member => (
              <div 
                key={member.id} 
                className="flex items-center px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full border border-indigo-200 dark:border-indigo-700/30 shadow-sm hover:-translate-y-0.5 transition-transform duration-200"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold mr-2 shadow-sm">
                  {member.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{member.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
