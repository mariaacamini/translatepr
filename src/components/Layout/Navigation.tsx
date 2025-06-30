import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  LanguageIcon, 
  QueueListIcon, 
  CogIcon,
  ChartBarIcon,
  FolderIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Languages } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Translations', href: '/translations', icon: LanguageIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Queue', href: '/queue', icon: QueueListIcon },
  { name: 'History', href: '/history', icon: ClockIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

export const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 shadow-xl">
        <div className="flex h-16 shrink-0 items-center">
          <Languages className="h-8 w-8 text-blue-600" />
          <span className="ml-3 text-xl font-bold text-gray-900">TranslatePress</span>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon
                          className={`h-6 w-6 shrink-0 ${
                            isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                          }`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
            <li className="mt-auto">
              <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                <h3 className="text-sm font-medium text-gray-900">Translation Credits</h3>
                <p className="mt-1 text-xs text-gray-600">
                  You have <span className="font-semibold text-blue-600">12,847</span> characters remaining
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '73%' }}></div>
                </div>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};