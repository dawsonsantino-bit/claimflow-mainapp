import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, 
  PlusCircle,
  LogOut, 
  X,
  Shield,
  UserCog,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { USER_ROLES } from '@/components/job/JobConstants';
import { APP_ENV } from '@/components/AppConfig';

export default function AppSidebar({ user, isOpen, setIsOpen }) {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  
  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const NavItem = ({ icon: Icon, label, path }) => (
    <Link 
      to={createPageUrl(path)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive(path) 
          ? 'bg-slate-100 text-slate-900 font-medium' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Link>
  );

  if (!user) return null;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <Shield className="w-6 h-6 text-slate-900 mr-2" />
            <span className="font-bold text-lg">CaseManager</span>
            <button 
              className="ml-auto lg:hidden"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 m-2 bg-slate-50 rounded-lg">
            <p className="font-medium text-sm text-slate-900 truncate">{user.full_name || user.email}</p>
            <p className="text-xs text-slate-500 capitalize">{user.business_role?.replace(/([A-Z])/g, ' $1').trim()}</p>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-2 space-y-1 py-4">
            {(user.business_role === USER_ROLES.CompanyAdmin || user.business_role === USER_ROLES.LocationAdmin) && (
                <NavItem icon={LayoutDashboard} label="Dashboard" path="Admin" />
            )}
            {user.business_role === USER_ROLES.SalesRep && (
                <NavItem icon={LayoutDashboard} label="Dashboard" path="Sales" />
            )}
            {user.business_role === USER_ROLES.Homeowner && (
                <NavItem icon={LayoutDashboard} label="Dashboard" path="Homeowner" />
            )}
            {!([USER_ROLES.CompanyAdmin, USER_ROLES.LocationAdmin, USER_ROLES.SalesRep, USER_ROLES.Homeowner].includes(user.business_role)) && (
                <NavItem icon={LayoutDashboard} label="Dashboard" path="Dashboard" />
            )}
            
            {(user.business_role === USER_ROLES.SalesRep || 
              user.business_role === USER_ROLES.CompanyAdmin || 
              user.business_role === USER_ROLES.LocationAdmin) && (
                <>
                  <NavItem icon={PlusCircle} label="New Job" path="NewJob" />
                  <NavItem icon={Flame} label="Fire Alerts" path="Fires" />
                </>
            )}

            {user.business_role === USER_ROLES.CompanyAdmin && (
                <>
                    <NavItem icon={LayoutDashboard} label="All Jobs (Debug)" path="AdminJobsDebug" />
                    <NavItem icon={UserCog} label="Users" path="Users" />
                    <NavItem icon={Shield} label="Company Settings" path="CompanySettings" />
                </>
            )}

            {user.is_app_owner && (
                <NavItem icon={Shield} label="App Owner" path="Owner" />
            )}

            {APP_ENV === 'DEV' && !user.is_app_owner && (
                <NavItem icon={Shield} label="🆘 Role Rescue" path="RoleRescue" />
            )}
          </nav>

          {/* Dev Role Switcher - For Testing Pipeline Only */}
          {user.business_role === USER_ROLES.CompanyAdmin && APP_ENV === 'DEV' && (
            <div className="px-4 py-4 border-t border-slate-100">

              <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                  <UserCog className="w-3 h-3" /> DEV: Switch Role
              </div>
              <div className="grid grid-cols-2 gap-1">
                  {Object.values(USER_ROLES).map(role => (
                      <button
                          key={role}
                          onClick={() => {
                              base44.auth.updateMe({ business_role: role })
                                  .then(() => window.location.reload());
                          }}
                          className={`text-[10px] px-2 py-1 rounded border ${
                              user.business_role === role 
                              ? 'bg-slate-900 text-white border-slate-900' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                          {role}
                      </button>
                  ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-slate-100">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}