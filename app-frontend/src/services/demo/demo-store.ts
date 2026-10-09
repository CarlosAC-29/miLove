export function createDemoStore<T extends { id: string }>(initialRecords: T[]) {
  let records = [...initialRecords];

  return {
    list(): T[] {
      return records.map((record) => ({ ...record }));
    },
    create(record: Omit<T, "id">): T {
      const created = { ...record, id: `demo-${Date.now()}` } as T;
      records = [...records, created];
      return created;
    },
    update(id: string, changes: Partial<Omit<T, "id">>): T {
      const current = records.find((record) => record.id === id);
      if (!current) throw new Error("No se encontro el elemento de demostracion.");

      const updated = { ...current, ...changes };
      records = records.map((record) => (record.id === id ? updated : record));
      return updated;
    },
    remove(id: string): void {
      records = records.filter((record) => record.id !== id);
    }
  };
}
