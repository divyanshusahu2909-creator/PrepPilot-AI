import React, { createContext, useContext, useEffect, useState } from 'react';
import { ServiceConfig } from '../types';
import { configService } from '../services/configService';

const ConfigContext = createContext<ServiceConfig | null>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ServiceConfig | null>(null);

  useEffect(() => {
    configService.getConfig().then(setConfig).catch(() => setConfig(null));
  }, []);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useServiceConfig() {
  return useContext(ConfigContext);
}