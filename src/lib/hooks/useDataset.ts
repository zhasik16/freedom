import { useState, useEffect, useCallback } from 'react';
import { Ticket, Manager, BusinessUnitOffice, DashboardFilters } from '../types';
import { ticketsApi, managersApi, businessUnitsApi } from '../api/endpoints';

interface DatasetState {
  tickets: Ticket[];
  managers: Manager[];
  businessUnits: BusinessUnitOffice[];
  filteredTickets: Ticket[];
  loading: boolean;
  error: string | null;
  useBackend: boolean;  // 👈 Добавляем поле
}

export function useDataset(filters?: DashboardFilters) {
  const [state, setState] = useState<DatasetState>({
    tickets: [],
    managers: [],
    businessUnits: [],
    filteredTickets: [],
    loading: true,
    error: null,
    useBackend: true  // 👈 По умолчанию true
  });

  const loadFromBackend = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null, useBackend: true }));
      
      const [tickets, managers, units] = await Promise.all([
        ticketsApi.getAll(filters?.skip, filters?.limit),
        managersApi.getAll(),
        businessUnitsApi.getAll()
      ]);

      setState({
        tickets,
        managers,
        businessUnits: units,
        filteredTickets: tickets,
        loading: false,
        error: null,
        useBackend: true
      });

      console.log('✅ Данные успешно загружены с бэкенда:', {
        tickets: tickets.length,
        managers: managers.length,
        units: units.length
      });
    } catch (error) {
      console.error('❌ Ошибка загрузки с бэкенда:', error);
      // Если бэкенд недоступен, пробуем загрузить из CSV (если есть такие данные)
      try {
        // Здесь можно добавить загрузку из локальных CSV если нужно
        setState({
          tickets: [],
          managers: [],
          businessUnits: [],
          filteredTickets: [],
          loading: false,
          error: null,
          useBackend: false
        });
      } catch {
        setState({
          tickets: [],
          managers: [],
          businessUnits: [],
          filteredTickets: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Ошибка подключения к бэкенду',
          useBackend: false
        });
      }
    }
  }, [filters]);

  // Загрузка при монтировании и изменении фильтров
  useEffect(() => {
    loadFromBackend();
  }, [loadFromBackend]);

  const stats = {
    totalTickets: state.tickets.length,
    filteredCount: state.filteredTickets.length,
    totalManagers: state.managers.length,
    totalOffices: state.businessUnits.length,
    unassignedTickets: state.tickets.filter(t => !t.assignedManagerId).length,
    vipTickets: state.tickets.filter(t => t.segment === 'VIP').length,
    priorityTickets: state.tickets.filter(t => t.segment === 'Priority').length,
    massTickets: state.tickets.filter(t => t.segment === 'Mass').length
  };

  return {
    tickets: state.tickets,
    managers: state.managers,
    businessUnits: state.businessUnits,
    filteredTickets: state.filteredTickets,
    loading: state.loading,
    error: state.error,
    useBackend: state.useBackend,  
    stats,
    refresh: loadFromBackend
  };
}