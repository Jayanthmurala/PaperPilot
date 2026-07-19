import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen, Upload, FileText, BarChart3, Activity, Home, Users,
  GraduationCap, LogOut, Database, Layers,
} from 'lucide-react';
import axios from 'axios';
import { API } from '../App';

const Sidebar = ({ isCollapsed, onMouseEnter, onMouseLeave }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'classes', label: 'My Classes', icon: GraduationCap, path: '/classes' },
    { id: 'students', label: 'Students', icon: Users, path: '/students' },
    { id: 'syllabus', label: 'Upload Syllabus', icon: BookOpen, path: '/syllabus' },
    { id: 'subjects', label: 'Manage Subjects', icon: Layers, path: '/subjects' },
    { id: 'submit', label: 'Submit Answer', icon: Upload, path: '/submit' },
    { id: 'reviews', label: 'Reviews', icon: FileText, path: '/reviews' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'monitoring', label: 'Model Monitoring', icon: Activity, path: '/monitoring' },
    { id: 'database', label: 'Database', icon: Database, path: '/database' },
  ];

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API}/auth/logout`, {}, { headers, withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('authMethod');
      navigate('/login');
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = (user.name || 'T')
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-border bg-card transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}
      data-testid="sidebar"
    >
      {/* Brand */}
      <div className={`flex items-center gap-3 border-b border-border px-4 py-5 ${isCollapsed ? 'justify-center px-2' : ''}`}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <GraduationCap size={20} />
        </span>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <h1 className="truncate text-lg font-bold leading-tight tracking-tight text-foreground" data-testid="app-title">
              PaperPilot
            </h1>
            <p className="truncate text-[11px] text-muted-foreground">AI Answer Evaluation</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" data-testid="navigation-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              data-testid={`nav-${item.id}`}
              title={isCollapsed ? item.label : undefined}
              className={`group relative flex w-full items-center rounded-xl px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-accent font-semibold text-primary'
                  : 'font-medium text-muted-foreground hover:bg-muted hover:text-foreground'
              } ${isCollapsed ? 'justify-center' : 'gap-3'}`}
            >
              {isActive && !isCollapsed && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <Icon size={19} strokeWidth={2} className="shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-border p-3">
        {!isCollapsed && user.name && (
          <div className="mb-2 flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-primary">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : undefined}
          className={`flex w-full items-center rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}`}
          data-testid="logout-button"
        >
          <LogOut size={19} className="shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
