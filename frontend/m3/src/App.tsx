import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { ToastProvider } from './components/ui/ToastContext';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { SettingsProvider } from './context/SettingsContext';
import { Spinner } from './components/ui/Spinner';
import { authService } from './services/auth';

// Lazy load new pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ClientsLogin = lazy(() => import('./pages/ClientsLogin'));
const ClientsDashboard = lazy(() => import('./pages/ClientsDashboard'));
const ProjectLogin = lazy(() => import('./pages/ProjectLogin'));
const ProjectOverview = lazy(() => import('./pages/ProjectOverview'));
const OperatorLogin = lazy(() => import('./pages/OperatorLogin'));

// Lazy load existing pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ModuleDetail = lazy(() => import('./pages/ModuleDetail'));
const SpeedChallenge = lazy(() => import('./pages/SpeedChallenge'));
const CompletedTasks = lazy(() => import('./pages/CompletedTasks'));
const ClientRoadmap = lazy(() => import('./pages/ClientRoadmap'));
const KanbanBoard = lazy(() => import('./pages/KanbanBoard'));
const AIRoadmap = lazy(() => import('./pages/AIRoadmap'));
const SeoChecklistPage = lazy(() => import('./pages/SeoChecklistPage'));
const Settings = lazy(() => import('./pages/Settings'));

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
    const isAuthenticated = authService.isAuthenticated();
    const user = authService.getCurrentUser();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/clientes" state={{ from: location }} replace />;
    }

    if (roles && user) {
        if (user.role === 'operator') {
            return <>{children}</>;
        }
        if (!roles.includes(user.role)) {
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const {
    modules,
    globalScore,
    clients,
    currentClientId,
    currentClient,
    generalNotes,
    switchClient,
    addClient,
    deleteClient,
    resetCurrentProject,
    addTask,
    deleteTask,
    toggleTask,
    updateTaskNotes,
    updateTaskImpact,
    toggleTaskCommunicated,
    toggleCustomRoadmapTask,
    handleReorderRoadmap,
    addManualCompletedTask,
    deleteCompletedTaskLog,
    addNote,
    updateNote,
    deleteNote,
  } = useProject();

  // Define layout content as a separate variable to keep JSX cleaner
  const toolRoutes = (
      <Layout
        modules={modules}
        globalScore={globalScore}
        clients={clients}
        currentClientId={currentClientId}
        onSwitchClient={switchClient}
        onAddClient={addClient}
        onDeleteClient={deleteClient}
        generalNotes={generalNotes}
        projectNotes={currentClient?.notes || []}
        onAddNote={addNote}
        onUpdateNote={updateNote}
        onDeleteNote={deleteNote}
      >
          <Routes>
            <Route
                path="/" // Relative to /tool/*, this matches /tool/
                element={<Navigate to="dashboard" replace />}
            />
            <Route
                path="dashboard"
                element={
                <Dashboard
                    modules={modules}
                    globalScore={globalScore}
                    onReset={resetCurrentProject}
                />
                }
            />
            <Route
                path="module/:id"
                element={
                <ModuleDetail
                    modules={modules}
                    onToggleTask={toggleTask}
                    onAddTask={addTask}
                    onDeleteTask={deleteTask}
                    onUpdateTaskNotes={updateTaskNotes}
                    onUpdateTaskImpact={updateTaskImpact}
                    clientVertical={currentClient?.vertical || 'media'}
                    clientName={currentClient?.name || 'Cliente'}
                    onToggleCustomRoadmap={toggleCustomRoadmapTask}
                    onToggleTaskCommunicated={toggleTaskCommunicated}
                />
                }
            />
             <Route
                path="client-roadmap"
                element={
                <ClientRoadmap
                    modules={modules}
                    customRoadmapOrder={currentClient?.customRoadmapOrder}
                    onReorder={handleReorderRoadmap}
                    onToggleTask={toggleTask}
                    onRemoveFromRoadmap={toggleCustomRoadmapTask}
                    onUpdateTaskNotes={updateTaskNotes}
                    onUpdateTaskImpact={updateTaskImpact}
                    clientVertical={currentClient?.vertical || 'media'}
                    clientName={currentClient?.name || 'Cliente'}
                    onToggleTaskCommunicated={toggleTaskCommunicated}
                />
                }
            />
            <Route path="kanban" element={<KanbanBoard />} />
            <Route path="checklist" element={<SeoChecklistPage />} />
            <Route path="ai-roadmap" element={<AIRoadmap />} />
            <Route path="settings" element={<Settings />} />
            <Route path="challenge" element={<SpeedChallenge />} />
            <Route
                path="completed-tasks"
                element={
                <CompletedTasks
                    completedTasks={currentClient?.completedTasksLog || []}
                    onAddManualTask={addManualCompletedTask}
                    onDeleteLogEntry={deleteCompletedTaskLog}
                />
                }
            />
            {/* Catch-all inside /tool/* */}
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
      </Layout>
  );

  return (
      <Suspense
        fallback={
          <div className="flex justify-center p-8">
            <Spinner size={48} />
          </div>
        }
      >
        <Routes>
          {/* New Portal Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/clientes" element={<ClientsLogin />} />
          <Route
            path="/clientes/dashboard"
            element={
                <ProtectedRoute roles={['clients_area', 'operator']}>
                    <ClientsDashboard />
                </ProtectedRoute>
            }
          />
          <Route path="/p/:slug" element={
              <ProtectedRoute roles={['clients_area', 'operator']}>
                  <ProjectLogin />
              </ProtectedRoute>
          } />
          <Route
            path="/c/:slug/overview"
            element={
                <ProtectedRoute roles={['project', 'operator']}>
                    <ProjectOverview />
                </ProtectedRoute>
            }
          />
          <Route path="/operator" element={<OperatorLogin />} />

          {/* Existing App Routes (protected by operator login ideally, but for now open or under /tool)
              Actually, let's protect the tools too, requiring operator access.
          */}
          <Route
            path="/tool/*"
            element={
                <ProtectedRoute roles={['operator']}>
                    {toolRoutes}
                </ProtectedRoute>
            }
          />

          {/* Catch all for unknown routes at root level - Redirect to Landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <SettingsProvider>
        <ProjectProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </ProjectProvider>
      </SettingsProvider>
    </ToastProvider>
  );
};

export default App;
