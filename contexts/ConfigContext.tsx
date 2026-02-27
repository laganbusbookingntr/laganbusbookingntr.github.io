import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BUS_SERVICES, CITIES } from '../constants';
import { BusService } from '../types';

interface ConfigContextType {
  busServices: Record<string, BusService>;
  cities: string[];
  addBus: (name: string, service: BusService) => void;
  updateBus: (name: string, service: BusService) => void;
  deleteBus: (name: string) => void;
  addCity: (city: string) => void;
  deleteCity: (city: string) => void;
  resetConfig: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [busServices, setBusServices] = useState<Record<string, BusService>>(() => {
    const saved = localStorage.getItem('lagan_bus_services');
    return saved ? JSON.parse(saved) : BUS_SERVICES;
  });

  const [cities, setCities] = useState<string[]>(() => {
    const saved = localStorage.getItem('lagan_cities');
    return saved ? JSON.parse(saved) : CITIES;
  });

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('lagan_bus_services', JSON.stringify(busServices));
  }, [busServices]);

  useEffect(() => {
    localStorage.setItem('lagan_cities', JSON.stringify(cities));
  }, [cities]);

  const addBus = (name: string, service: BusService) => {
    setBusServices(prev => ({ ...prev, [name]: service }));
  };

  const updateBus = (name: string, service: BusService) => {
    setBusServices(prev => ({ ...prev, [name]: service }));
  };

  const deleteBus = (name: string) => {
    setBusServices(prev => {
      const newState = { ...prev };
      delete newState[name];
      return newState;
    });
  };

  const addCity = (city: string) => {
    if (!cities.includes(city)) {
      setCities(prev => [...prev, city].sort());
    }
  };

  const deleteCity = (city: string) => {
    setCities(prev => prev.filter(c => c !== city));
  };

  const resetConfig = () => {
    setBusServices(BUS_SERVICES);
    setCities(CITIES);
    localStorage.removeItem('lagan_bus_services');
    localStorage.removeItem('lagan_cities');
  };

  return (
    <ConfigContext.Provider value={{ 
      busServices, 
      cities, 
      addBus, 
      updateBus, 
      deleteBus, 
      addCity, 
      deleteCity,
      resetConfig
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
