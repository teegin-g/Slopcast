import { createContext, useContext, type ReactNode } from 'react';
import React from 'react';

interface RecalcStatusContextValue {
  isRecalculating: boolean;
}

const RecalcStatusContext = createContext<RecalcStatusContextValue>({
  isRecalculating: false,
});

export function RecalcStatusProvider({
  isRecalculating,
  children,
}: {
  isRecalculating: boolean;
  children: ReactNode;
}) {
  return React.createElement(
    RecalcStatusContext.Provider,
    { value: { isRecalculating } },
    children,
  );
}

export function useRecalcStatus() {
  return useContext(RecalcStatusContext);
}
