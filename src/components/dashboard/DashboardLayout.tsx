"use client";

import { useState } from "react";
import { useDataset } from "@/lib/hooks/useDataset";
import { DashboardFilters } from "@/lib/types";
import AnalyticsCards from "./AnalyticsCards";
import FiltersPanel from "./FiltersPanel";
import TicketsTable from "../tickets/TicketsTable";
import TypeDistributionChart from "./charts/TypeDistributionChart";
import SentimentChart from "./charts/SentimentChart";

export default function DashboardLayout() {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const { filteredTickets, tickets, managers, businessUnits } =
    useDataset(filters);

  // Аналитика для карточек
  const analytics = {
    totalTickets: filteredTickets.length,
    avgPriority:
      filteredTickets.reduce(
        (acc, t) => acc + (t.aiAnalysis?.priority || 0),
        0,
      ) / filteredTickets.length || 0,
    typeDistribution: filteredTickets.reduce((acc, t) => {
      const type = t.aiAnalysis?.type || "consultation";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as any),
    sentimentDistribution: filteredTickets.reduce((acc, t) => {
      const s = t.aiAnalysis?.sentiment || "neutral";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as any),
    languageDistribution: filteredTickets.reduce((acc, t) => {
      const l = t.aiAnalysis?.language || "RU";
      acc[l] = (acc[l] || 0) + 1;
      return acc;
    }, {} as any),
    segmentDistribution: filteredTickets.reduce((acc, t) => {
      acc[t.segment] = (acc[t.segment] || 0) + 1;
      return acc;
    }, {} as any),
    businessUnitDistribution: filteredTickets.reduce((acc, t) => {
      const unit = t.businessUnit || "Не назначен";
      acc[unit] = (acc[unit] || 0) + 1;
      return acc;
    }, {} as any),
    managerLoad: managers.map((m) => ({
      managerId: m.id,
      managerName: m.fullName,
      load: m.currentLoad,
      businessUnit: m.businessUnit,
      position: m.position,
      skills: m.skills,
    })),
    unassignedTickets: filteredTickets.filter((t) => !t.assignedManagerId)
      .length,
    ticketsByCity: filteredTickets.reduce(
      (acc, t) => {
        const city = t.address.city || "Не указан";
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <FiltersPanel filters={filters} onFilterChange={setFilters} />

      <div className="mt-8">
        <AnalyticsCards analytics={analytics} />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Типы обращений</h3>
          <TypeDistributionChart data={analytics.typeDistribution} />
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Тональность</h3>
          <SentimentChart data={analytics.sentimentDistribution} />
        </div>
      </div>

      <div className="mt-8 card">
        <h3 className="text-lg font-semibold mb-4">Список обращений</h3>
        <TicketsTable tickets={filteredTickets} />
      </div>
    </div>
  );
}
