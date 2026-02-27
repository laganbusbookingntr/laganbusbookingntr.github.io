import React, { createContext, useContext, useState, useEffect } from 'react';
import { BUS_SERVICES, CITIES, GOOGLE_SCRIPT_URL } from '../constants';
import { BusService } from '../types';

interface SettingsContextType {
  busServices: Record<string, BusService>;
  cities: string[];
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateBusService: (name: string, service: BusService) => Promise<void>;
  deleteBusService: (name: string) => Promise<void>;
  addCity: (city: string) => Promise<void>;
  deleteCity: (city: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [busServices, setBusServices] = useState<Record<string, BusService>>(BUS_SERVICES);
  const [cities, setCities] = useState<string[]>(CITIES);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?method=getSettings`);
      const data = await response.json();
      
      if (data.success) {
        if (data.busServices && Object.keys(data.busServices).length > 0) {
          setBusServices(data.busServices);
        }
        if (data.cities && data.cities.length > 0) {
          setCities(data.cities);
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBusService = async (name: string, service: BusService) => {
    // Optimistic update
    setBusServices(prev => ({ ...prev, [name]: service }));
    
    const params = new URLSearchParams();
    params.append('method', 'saveSetting');
    params.append('type', 'bus');
    params.append('key', name);
    params.append('value', JSON.stringify(service));

    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: params,
      mode: 'no-cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  };

  const deleteBusService = async (name: string) => {
    const newServices = { ...busServices };
    delete newServices[name];
    setBusServices(newServices);

    const params = new URLSearchParams();
    params.append('method', 'deleteSetting');
    params.append('type', 'bus');
    params.append('key', name);

    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: params,
      mode: 'no-cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  };

  const addCity = async (city: string) => {
    if (cities.includes(city)) return;
    setCities(prev => [...prev, city]);

    const params = new URLSearchParams();
    params.append('method', 'saveSetting');
    params.append('type', 'city');
    params.append('key', city);
    params.append('value', city);

    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: params,
      mode: 'no-cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  };

  const deleteCity = async (city: string) => {
    setCities(prev => prev.filter(c => c !== city));

    const params = new URLSearchParams();
    params.append('method', 'deleteSetting');
    params.append('type', 'city');
    params.append('key', city);

    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: params,
      mode: 'no-cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ 
      busServices, 
      cities, 
      isLoading, 
      refreshSettings,
      updateBusService,
      deleteBusService,
      addCity,
      deleteCity
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
