import { useState, useEffect, useCallback } from 'react';
import { Ticket, Manager, BusinessUnitOffice, DashboardFilters } from '../types';
import { ticketsApi, managersApi, businessUnitsApi } from '../api/endpoints';
import { loadAllData } from '../utils/csvLoader';

interface DatasetState {
  tickets: Ticket[];
  managers: Manager[];
  businessUnits: BusinessUnitOffice[];
  filteredTickets: Ticket[];
  loading: boolean;
  error: string | null;
  useBackend: boolean;
}

export function useDataset(filters?: DashboardFilters) {
  const [state, setState] = useState<DatasetState>({
    tickets: [],
    managers: [],
    businessUnits: [],
    filteredTickets: [],
    loading: true,
    error: null,
    useBackend: false
  });

  const loadFromBackend = useCallback(async () => {
    try {
      const [tickets, managers, units] = await Promise.all([
        ticketsApi.getAll(filters),
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
    } catch (error) {
      console.log('Backend unavailable, falling back to CSV...');
      // Если бэкенд недоступен, грузим из CSV
      const csvData = await loadAllData();
      setState({
        tickets: csvData.tickets,
        managers: csvData.managers,
        businessUnits: csvData.businessUnits,
        filteredTickets: csvData.tickets,
        loading: false,
        error: null,
        useBackend: false
      });
    }
  }, [filters]);

  const loadFromCSV = useCallback(async () => {
    const data = await loadAllData();
    setState({
      tickets: data.tickets,
      managers: data.managers,
      businessUnits: data.businessUnits,
      filteredTickets: data.tickets,
      loading: false,
      error: null,
      useBackend: false
    });
  }, []);

  useEffect(() => {
    setState(prev => ({ ...prev, loading: true }));
    
    // Пробуем загрузить с бэкенда, если не получится - грузим из CSV
    loadFromBackend().catch(() => loadFromCSV());
  }, [loadFromBackend, loadFromCSV]);

  // Применение фильтров
  useEffect(() => {
    if (!filters) return;

    if (state.useBackend) {
      // Если используем бэкенд, перезагружаем с фильтрами
      loadFromBackend();
    } else {
      // Если используем CSV, фильтруем локально
      let filtered = [...state.tickets];
      
      if (filters.businessUnit?.length) {
        filtered = filtered.filter(t => 
          t.businessUnit && filters.businessUnit?.includes(t.businessUnit)
        );
      }
      if (filters.ticketType?.length) {
        filtered = filtered.filter(t => 
          t.aiAnalysis && filters.ticketType?.includes(t.aiAnalysis.type)
        );
      }
      if (filters.segment?.length) {
        filtered = filtered.filter(t => 
          filters.segment?.includes(t.segment)
        );
      }
      if (filters.priorityMin !== undefined) {
        filtered = filtered.filter(t => 
          t.aiAnalysis && t.aiAnalysis.priority >= (filters.priorityMin || 1)
        );
      }
      if (filters.priorityMax !== undefined) {
        filtered = filtered.filter(t => 
          t.aiAnalysis && t.aiAnalysis.priority <= (filters.priorityMax || 10)
        );
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(t => 
          t.description.toLowerCase().includes(query) ||
          t.address.city?.toLowerCase().includes(query)
        );
      }

      setState(prev => ({ ...prev, filteredTickets: filtered }));
    }
  }, [filters, state.useBackend, state.tickets, loadFromBackend]);

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
    ...state,
    stats,
    refresh: state.useBackend ? loadFromBackend : loadFromCSV
  };
}