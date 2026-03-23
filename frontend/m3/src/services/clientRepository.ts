import { Client, Note, ModuleData, ClientVertical } from '../types';
import { StrategyFactory } from '../strategies/StrategyFactory';
import { INITIAL_MODULES } from '../constants';

const CLIENTS_KEY = 'mediaflow_clients';
const CURRENT_CLIENT_ID_KEY = 'mediaflow_current_client_id';
const GENERAL_NOTES_KEY = 'mediaflow_general_notes';
const LEGACY_MODULES_KEY = 'mediaflow_modules';

const CLIENT_VERTICAL_ALIASES: Record<string, ClientVertical> = {
  frontend: 'media',
};

const VALID_VERTICALS: ClientVertical[] = ['media', 'ecom', 'local', 'national', 'international'];

const normalizeClientVertical = (vertical: unknown): ClientVertical => {
  if (typeof vertical !== 'string') {
    return 'media';
  }

  const normalized = vertical.trim().toLowerCase();
  if (VALID_VERTICALS.includes(normalized as ClientVertical)) {
    return normalized as ClientVertical;
  }

  return CLIENT_VERTICAL_ALIASES[normalized] || 'media';
};

const normalizeClient = (client: Client): Client => ({
  ...client,
  vertical: normalizeClientVertical(client.vertical),
  notes: client.notes || [],
  completedTasksLog: client.completedTasksLog || [],
  customRoadmapOrder: client.customRoadmapOrder || [],
});

export class ClientRepository {
  static getClients(): Client[] {
    const savedClients = localStorage.getItem(CLIENTS_KEY);

    if (savedClients) {
      try {
        const parsedClients = JSON.parse(savedClients);
        const migratedClients = parsedClients.map(normalizeClient);

        return this.migrateModules(migratedClients);
      } catch (e) {
        console.error('Failed to parse clients', e);
      }
    }

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
        return this.migrateModules([legacyClient]);
      } catch (e) {
        console.error('Failed to migrate legacy modules', e);
      }
    }

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
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients.map(normalizeClient)));
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
    const verticalModulesCache = new Map<ClientVertical, ModuleData[]>();

    const updatedClients = clients.map((client) => {
      let currentModules = client.modules;
      let clientChanged = false;

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
      // no-op: state persistence happens in the consuming context
    }

    return updatedClients;
  }
}

export { normalizeClient, normalizeClientVertical };
