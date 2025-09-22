import React from 'react';
import { Home, CreditCard, Settings, User } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neo-white border-t-4 border-neo-black">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-4 px-2 flex flex-col items-center justify-center font-mono text-xs font-bold border-r-2 border-neo-black last:border-r-0 transition-colors ${
                isActive 
                  ? 'bg-neo-pink text-neo-white' 
                  : 'bg-neo-white text-neo-black hover:bg-neo-cyan'
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
