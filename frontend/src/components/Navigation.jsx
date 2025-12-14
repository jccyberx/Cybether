import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
} from '@heroicons/react/24/outline';

const Navigation = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
  ];

  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-white font-bold text-xl">Cybether</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      } px-3 py-2 rounded-md text-sm font-medium flex items-center`}
                    >
                      <item.icon className="h-5 w-5 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <button
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('isAdmin');
                  localStorage.removeItem('username');
                  window.location.href = '/login';
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;