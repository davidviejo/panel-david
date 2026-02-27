import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Layers,
  BookOpen,
  Cpu,
  Activity,
  Globe,
  BarChart3,
  Menu,
  X,
  Terminal,
  CheckCircle2,
  Zap,
  Moon,
  Sun,
  Siren,
  Keyboard,
  StickyNote,
  Sparkles,
  ClipboardList,
  Map,
  Shield,
  Server,
  Database,
  Code2,
  Settings as SettingsIcon,
  KanbanSquare,
  ListChecks,
} from 'lucide-react';
import { ModuleData, Client, ClientVertical, Note } from '../types';
import ClientSwitcher from './ClientSwitcher';
import NotesPanel from './NotesPanel';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './ui/LanguageSwitcher';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  subLabel?: string;
  onClick?: () => void;
  isComplete?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, subLabel, onClick, isComplete }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
      }`}
    >
      <div
        className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}
      >
        {icon}
      </div>
      <div className="flex flex-col flex-1">
        <span className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>{label}</span>
        {subLabel && (
          <span
            className={`text-[10px] uppercase tracking-wider ${isActive ? 'text-blue-200' : 'text-slate-400'}`}
          >
            {subLabel}
          </span>
        )}
      </div>
      {isComplete && !isActive && <CheckCircle2 size={16} className="text-emerald-500" />}
    </NavLink>
  );
};

interface LayoutProps {
  children: React.ReactNode;
  modules: ModuleData[];
  globalScore: number;
  clients?: Client[];
  currentClientId?: string;
  onSwitchClient?: (id: string) => void;
  onAddClient?: (name: string, vertical: ClientVertical) => void;
  onDeleteClient?: (id: string) => void;
  // Notes Props
  generalNotes?: Note[];
  projectNotes?: Note[];
  onAddNote?: (content: string, type: 'project' | 'general') => void;
  onUpdateNote?: (noteId: string, content: string, type: 'project' | 'general') => void;
  onDeleteNote?: (noteId: string, type: 'project' | 'general') => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  modules,
  globalScore,
  clients,
  currentClientId,
  onSwitchClient,
  onAddClient,
  onDeleteClient,
  generalNotes = [],
  projectNotes = [],
  onAddNote = () => {},
  onUpdateNote = () => {},
  onDeleteNote = () => {},
}) => {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('mediaflow_theme') === 'dark',
  );
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isEmergencyLoading, setIsEmergencyLoading] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mediaflow_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mediaflow_theme', 'light');
    }
  }, [darkMode]);

  const handleEmergencyIndex = () => {
    if (
      confirm(
        '¿CONFIRMAR INDEXACIÓN DE EMERGENCIA? Esto enviará un ping a la API de Indexing para URLs críticas recientes.',
      )
    ) {
      setIsEmergencyLoading(true);
      setTimeout(() => {
        setIsEmergencyLoading(false);
        alert('Solicitud de Indexación enviada a Google API. Espera rastreo en 2 minutos.');
      }, 2000);
    }
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'Search':
        return <Search size={20} />;
      case 'Layers':
        return <Layers size={20} />;
      case 'BookOpen':
        return <BookOpen size={20} />;
      case 'Cpu':
        return <Cpu size={20} />;
      case 'Activity':
        return <Activity size={20} />;
      case 'Globe':
        return <Globe size={20} />;
      case 'BarChart3':
        return <BarChart3 size={20} />;
      case 'Sparkles':
        return <Sparkles size={20} />;
      default:
        return <Search size={20} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-300">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-white dark:bg-slate-900 z-50 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            M
          </div>
          <span className="font-bold text-slate-800 dark:text-white">MediaFlow</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-slate-600 dark:text-slate-300"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                M
              </div>
              <div>
                <h1 className="font-bold text-slate-800 dark:text-white text-lg leading-tight">
                  {t('app.title')}
                </h1>
                <p className="text-xs text-slate-400 font-medium">{t('app.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {clients && currentClientId && onSwitchClient && onAddClient && onDeleteClient && (
            <div className="mb-4">
              <ClientSwitcher
                clients={clients}
                currentClientId={currentClientId}
                onSwitchClient={onSwitchClient}
                onAddClient={onAddClient}
                onDeleteClient={onDeleteClient}
              />
            </div>
          )}

          <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-4 text-white relative overflow-hidden mb-6 border border-slate-800 dark:border-slate-700 shrink-0">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
              {t('global_score')}
            </p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{Math.round(globalScore)}</span>
              <span className="text-slate-400 mb-1">/ 100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-400 to-emerald-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${globalScore}%` }}
              ></div>
            </div>
          </div>

          <nav className="space-y-1 pr-2">
            <NavItem
              to="/"
              icon={<LayoutDashboard size={20} />}
              label={t('nav.dashboard')}
              subLabel={t('nav.dashboard_sub')}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="my-4 border-t border-slate-100 dark:border-slate-800"></div>
            {modules.map((mod) => {
              const isComplete =
                mod.tasks.length > 0 && mod.tasks.every((t) => t.status === 'completed');
              return (
                <NavItem
                  key={mod.id}
                  to={`/module/${mod.id}`}
                  icon={getIcon(mod.iconName)}
                  label={`${t('nav.module_prefix')}${mod.id}: ${mod.title}`}
                  subLabel={mod.levelRange}
                  onClick={() => setIsMobileMenuOpen(false)}
                  isComplete={isComplete}
                />
              );
            })}

            <div className="my-4 border-t border-slate-100 dark:border-slate-800"></div>

            <NavItem
              to="/client-roadmap"
              icon={<Map size={20} />}
              label={t('nav.client_roadmap')}
              subLabel={t('nav.client_roadmap_sub')}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <NavItem
              to="/kanban"
              icon={<KanbanSquare size={20} />}
              label={t('nav.kanban_board')}
              subLabel={t('nav.kanban_board_sub')}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <NavItem
              to="/checklist"
              icon={<ListChecks size={20} />}
              label={t('nav.seo_checklist')}
              subLabel={t('nav.seo_checklist_sub')}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <NavItem
              to="/ai-roadmap"
              icon={<Sparkles size={20} />}
              label={t('nav.ai_roadmap')}
              subLabel={t('nav.ai_roadmap_sub')}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <NavItem
              to="/settings"
              icon={<SettingsIcon size={20} />}
              label={t('nav.settings')}
              subLabel={t('nav.settings_sub')}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <NavItem
              to="/challenge"
              icon={<Zap size={20} />}
              label={t('nav.breaking_sim')}
              subLabel={t('nav.breaking_sim_sub')}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <NavItem
              to="/completed-tasks"
              icon={<ClipboardList size={20} />}
              label={t('nav.completed_tasks')}
              subLabel={t('nav.completed_tasks_sub')}
              onClick={() => setIsMobileMenuOpen(false)}
            />
          </nav>

          <div className="mt-auto pt-6 pb-2 space-y-3">
            <button
              onClick={handleEmergencyIndex}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-bold transition-all shadow-lg ${isEmergencyLoading ? 'bg-red-700' : 'bg-red-600 hover:bg-red-700 animate-pulse-slow'}`}
            >
              {isEmergencyLoading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              ) : (
                <Siren size={20} />
              )}
              {isEmergencyLoading ? t('nav.indexing') : t('nav.emergency_index')}
            </button>

            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2"
            >
              <Keyboard size={14} /> {t('nav.shortcuts')}
            </button>

            <button
              onClick={() => setIsNotesOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
            >
              <StickyNote size={20} />
              <span className="font-medium">{t('nav.notes')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Notes Panel */}
      <NotesPanel
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        projectNotes={projectNotes}
        generalNotes={generalNotes}
        onAddNote={onAddNote}
        onUpdateNote={onUpdateNote}
        onDeleteNote={onDeleteNote}
        projectName={clients?.find((c) => c.id === currentClientId)?.name || 'Proyecto'}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50 w-full lg:pt-0 pt-16 relative">
        <div className="max-w-7xl mx-auto p-4 lg:p-8">{children}</div>

        {/* Shortcuts Modal (Simple) */}
        {showShortcuts && (
          <div
            className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowShortcuts(false)}
          >
            <div
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                  <Keyboard size={20} /> Atajos de Teclado
                </h3>
                <button onClick={() => setShowShortcuts(false)}>
                  <X className="text-slate-400 hover:text-slate-600" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                    CMD + K
                  </span>{' '}
                  <span>Búsqueda Rápida</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                    CMD + J
                  </span>{' '}
                  <span>Modo Oscuro</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                    ESC
                  </span>{' '}
                  <span>Cerrar Modales</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Layout;
