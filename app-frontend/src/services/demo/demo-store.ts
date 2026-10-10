export function readDemoState<T>(storageKey: string, initialState: T): T {
  if (typeof window === "undefined") return initialState;

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return initialState;

  try {
    const state: unknown = JSON.parse(raw);
    const isValidArray = Array.isArray(initialState) && Array.isArray(state);
    const isValidObject =
      !Array.isArray(initialState) &&
      typeof state === "object" &&
      state !== null &&
      !Array.isArray(state);
    if (isValidArray || isValidObject) return state as T;

    throw new Error("El formato almacenado no coincide con el estado de demostración.");
  } catch (error) {
    console.error(`No se pudieron restaurar los datos demo de "${storageKey}".`, error);
    window.localStorage.removeItem(storageKey);
    return initialState;
  }
}

export function createDemoState<T extends object>(storageKey: string, initialState: T): T {
  const state = readDemoState(storageKey, initialState);

  return new Proxy(state, {
    set(target, property, value) {
      const updated = Reflect.set(target, property, value);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(target));
        } catch (error) {
          console.error(`No se pudieron guardar los datos demo de "${storageKey}".`, error);
        }
      }
      return updated;
    }
  });
}

export function createDemoStore<T extends { id: string }>(storageKey: string, initialRecords: T[]) {
  let records = readDemoState(storageKey, initialRecords);

  function save() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(records));
    } catch (error) {
      console.error(`No se pudieron guardar los datos demo de "${storageKey}".`, error);
    }
  }

  return {
    list(): T[] {
      return records.map((record) => ({ ...record }));
    },
    create(record: Omit<T, "id">): T {
      const created = { ...record, id: `demo-${Date.now()}` } as T;
      records = [...records, created];
      save();
      return created;
    },
    update(id: string, changes: Partial<Omit<T, "id">>): T {
      const current = records.find((record) => record.id === id);
      if (!current) throw new Error("No se encontro el elemento de demostracion.");

      const updated = { ...current, ...changes };
      records = records.map((record) => (record.id === id ? updated : record));
      save();
      return updated;
    },
    remove(id: string): void {
      records = records.filter((record) => record.id !== id);
      save();
    }
  };
}
