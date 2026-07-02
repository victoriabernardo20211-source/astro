import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Order, ImportRecord, Lookup } from "./types";
import * as api from "./api";

interface AdminContextValue {
  orders: Order[];
  imports: ImportRecord[];
  lookups: Lookup[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  importCsv: (
    csv: string,
    mode: "merge" | "replace",
    name: string
  ) => Promise<api.ImportResult>;
  deleteOrders: (codigos: string[]) => Promise<void>;
  deleteAll: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminDataProvider({
  children,
  onUnauthorized,
}: {
  children: React.ReactNode;
  onUnauthorized?: () => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [lookups, setLookups] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.fetchAdminData();
      setOrders(data.orders);
      setImports(data.imports);
      setLookups(data.lookups ?? []);
    } catch (e) {
      if (e instanceof Error && e.message === "unauthorized") {
        onUnauthorized?.();
      } else {
        setError(e instanceof Error ? e.message : "Erro ao carregar.");
      }
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const importCsv = useCallback(
    async (csv: string, mode: "merge" | "replace", name: string) => {
      const result = await api.importCsv(csv, mode, name);
      await refresh();
      return result;
    },
    [refresh]
  );

  const deleteOrders = useCallback(
    async (codigos: string[]) => {
      await api.deleteOrders(codigos);
      await refresh();
    },
    [refresh]
  );

  const deleteAll = useCallback(async () => {
    await api.deleteAllOrders();
    await refresh();
  }, [refresh]);

  return (
    <AdminContext.Provider
      value={{
        orders,
        imports,
        lookups,
        loading,
        error,
        refresh,
        importCsv,
        deleteOrders,
        deleteAll,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminDataProvider");
  return ctx;
}
