export type ImpactLevel = 'High' | 'Medium' | 'Low';
export type TaskStatus = string;

export interface KanbanColumn {
  id: string;
  title: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  impact: ImpactLevel;
  status: TaskStatus;
  category?: string; // e.g., "Technical", "Content", "Off-page"
  isCustom?: boolean;
  isInCustomRoadmap?: boolean;
  userNotes?: string;
  communicated?: boolean;
  externalLink?: string;
  assignee?: string;
}

export interface CompletedTask {
  id: string;
  taskId?: string; // Reference to original task if exists
  title: string;
  description?: string;
  completedAt: number;
  source: 'manual' | 'module';
  moduleId?: number;
}

export interface ModuleData {
  id: number;
  title: string;
  subtitle: string;
  levelRange: string; // e.g., "0-20"
  description: string;
  iconName: string;
  tasks: Task[];
  isCustom?: boolean;
}

export interface AppState {
  globalScore: number;
  modules: ModuleData[];
}

export type ClientVertical = 'media' | 'ecom' | 'local' | 'national' | 'international';

export interface Note {
  id: string;
  content: string;
  createdAt: number;
  updatedAt?: number;
}

export interface Client {
  id: string;
  name: string;
  vertical: ClientVertical;
  modules: ModuleData[];
  createdAt: number;
  notes?: Note[];
  completedTasksLog?: CompletedTask[];
  customRoadmapOrder?: string[];
  aiRoadmap?: Task[];
  kanbanColumns?: KanbanColumn[];
}

export interface GeminiResponse {
  text: string;
  error?: string;
}

export interface ChallengeResult {
  score: number;
  feedback: string;
  timeSpent: number;
}

// GSC Types
export interface GSCProperty {
  siteUrl: string;
  permissionLevel: string;
}

export interface GSCRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCResponse {
  rows?: GSCRow[];
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

// Global definition for Google Identity
declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: any) => void;
          }) => any;
        };
      };
    };
  }
}
