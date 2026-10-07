import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Database, User } from '../types';
import { BrowserStorageAdapter, sessionStorageAdapter } from '../services/storage';
import { PortalService } from '../services/portal';
export const portal = new PortalService(new BrowserStorageAdapter());
interface Context {
  data: Database;
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
  act: (fn: () => unknown, message?: string) => boolean;
  refresh: () => void;
  toast: string;
}
const Context = createContext<Context>(null!);
export function Provider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(() => portal.snapshot());
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorageAdapter.read();
    return saved ? portal.snapshot().users.find((u) => u.id === saved.id) || saved : null;
  });
  const [toast, setToast] = useState('');
  const refresh = () => setData(portal.snapshot());
  function act(fn: () => unknown, message = 'Changes saved') {
    try {
      fn();
      refresh();
      setToast(message);
      return true;
    } catch (e) {
      setToast('Error: ' + (e as Error).message);
      return false;
    }
  }
  return (
    <Context.Provider
      value={{
        data,
        user,
        login: (u) => {
          sessionStorageAdapter.write(u);
          setUser(u);
        },
        logout: () => {
          sessionStorageAdapter.write(null);
          setUser(null);
        },
        act,
        refresh,
        toast,
      }}
    >
      {children}
      {toast && (
        <div
          className={'toast ' + (toast.startsWith('Error') ? 'error' : '')}
          role="status"
          onClick={() => setToast('')}
        >
          {toast}
          <button aria-label="Dismiss notification" onClick={() => setToast('')}>
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export const usePortal = () => useContext(Context);
