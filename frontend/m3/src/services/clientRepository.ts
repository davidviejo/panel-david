import { Client, Note, ModuleData, ClientVertical } from '../types';
import { StrategyFactory } from '../strategies/StrategyFactory';
import { INITIAL_MODULES } from '../constants';

const CLIENTS_KEY = 'mediaflow_clients';
const CURRENT_CLIENT_ID_KEY = 'mediaflow_current_client_id';
const GENERAL_NOTES_KEY = 'mediaflow_general_notes';
const LEGACY_MODULES_KEY = 'mediaflow_modules';

export class ClientRepository {
  static getClients(): Client[] {
    const savedClients = localStorage.getItem(CLIENTS_KEY);

    if (savedClients) {
      try {
        const parsedClients = JSON.parse(savedClients);
        // Ensure all clients have a notes array and completedTasksLog (migration)
        const migratedClients = parsedClients.map((c: Client) => ({
          ...c,
          notes: c.notes || [],
          completedTasksLog: c.completedTasksLog || [],
          customRoadmapOrder: c.customRoadmapOrder || [],
        }));

        // Run Module Migrations (e.g., adding Extras module)
        return this.migrateModules(migratedClients);
      } catch (e) {
        console.error('Failed to parse clients', e);
      }
    }

    // Migration: Check for legacy single-project modules
    const savedLegacyModules = localStorage.getItem(LEGACY_MODULES_KEY);
    if (savedLegacyModules) {
      try {
        const legacyModules = JSON.parse(savedLegacyModules);
        const legacyClient: Client = {
          id: 'legacy-project',
          name: 'Mi Primer Proyecto',
          vertical: 'media',
          modules: legacyModules,
          createdAt: Date.now(),
          notes: [],
          completedTasksLog: [],
          customRoadmapOrder: [],
        };
        // Migrate legacy client too
        return this.migrateModules([legacyClient]);
      } catch (e) {
        console.error('Failed to migrate legacy modules', e);
      }
    }

    // Default Initialization
    return [
      {
        id: crypto.randomUUID(),
        name: 'Proyecto Demo',
        vertical: 'media',
        modules: JSON.parse(JSON.stringify(INITIAL_MODULES)),
        createdAt: Date.now(),
        notes: [],
        completedTasksLog: [],
        customRoadmapOrder: [],
      },
    ];
  }

  static saveClients(clients: Client[]): void {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  }

  static getCurrentClientId(): string {
    return localStorage.getItem(CURRENT_CLIENT_ID_KEY) || '';
  }

  static saveCurrentClientId(id: string): void {
    localStorage.setItem(CURRENT_CLIENT_ID_KEY, id);
  }

  static getGeneralNotes(): Note[] {
    const saved = localStorage.getItem(GENERAL_NOTES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse general notes', e);
      }
    }
    return [];
  }

  static saveGeneralNotes(notes: Note[]): void {
    localStorage.setItem(GENERAL_NOTES_KEY, JSON.stringify(notes));
  }

  private static migrateModules(clients: Client[]): Client[] {
    let changed = false;
    // Cache strategy modules by vertical to avoid redundant deep cloning
    const verticalModulesCache = new Map<ClientVertical, ModuleData[]>();

    const updatedClients = clients.map((client) => {
      let currentModules = client.modules;
      let clientChanged = false;

      // Check if migration is needed before fetching full modules list
      const needsExtras = !currentModules.some((m) => m.id === 8);
      const needsMia = !currentModules.some((m) => m.id === 9);

      if (needsExtras || needsMia) {
        if (!verticalModulesCache.has(client.vertical)) {
          const strategy = StrategyFactory.getStrategy(client.vertical);
          verticalModulesCache.set(client.vertical, strategy.getModules());
        }
        const fullModules = verticalModulesCache.get(client.vertical)!;

        if (needsExtras) {
          const extrasModule = fullModules.find((m) => m.id === 8);
          if (extrasModule) {
            if (!clientChanged) {
              currentModules = [...currentModules];
              clientChanged = true;
            }
            // Clone the specific module to ensure it's a unique instance for this client
            currentModules.push(JSON.parse(JSON.stringify(extrasModule)));
          }
        }

        if (needsMia) {
          const miaModule = fullModules.find((m) => m.id === 9);
          if (miaModule) {
            if (!clientChanged) {
              currentModules = [...currentModules];
              clientChanged = true;
            }
            // Clone the specific module to ensure it's a unique instance for this client
            currentModules.push(JSON.parse(JSON.stringify(miaModule)));
          }
        }
      }

      if (clientChanged) {
        changed = true;
        return { ...client, modules: currentModules };
      }

      return client;
    });

    if (changed) {
      // We don't save here automatically to avoid side effects during 'get',
      // but since this is called on init, the state will eventually settle.
      // For robustness, we could save, but let's leave it to the consumer (Context) to save state updates.
      // Actually, if we return modified data but don't save it, it will be re-migrated every time until saved.
      // The Context should save it when it initializes state.
    }

    return updatedClients;
  }
}
