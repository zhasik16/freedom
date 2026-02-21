"use client";

import { useState } from "react";
import {
  DashboardFilters,
  TicketType,
  Sentiment,
  Segment,
  TICKET_TYPE_LABELS,
  SENTIMENT_LABELS,
  SEGMENT_LABELS,
} from "@/lib/types";

interface Props {
  filters: DashboardFilters;
  onFilterChange: (filters: DashboardFilters) => void;
}

export default function FiltersPanel({ filters, onFilterChange }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChange = (key: keyof DashboardFilters, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div
        className="px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Фильтры</h3>
          {Object.keys(filters).length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {Object.keys(filters).length}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Тип обращения */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип обращения
              </label>
              <select
                className="input w-full"
                value={filters.ticketType?.[0] || ""}
                onChange={(e) =>
                  handleChange(
                    "ticketType",
                    e.target.value ? [e.target.value as TicketType] : undefined,
                  )
                }
              >
                <option value="">Все типы</option>
                {Object.entries(TICKET_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Сегмент клиента */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сегмент
              </label>
              <select
                className="input w-full"
                value={filters.segment?.[0] || ""}
                onChange={(e) =>
                  handleChange(
                    "segment",
                    e.target.value ? [e.target.value as Segment] : undefined,
                  )
                }
              >
                <option value="">Все сегменты</option>
                {Object.entries(SEGMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Тональность */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тональность
              </label>
              <select
                className="input w-full"
                value={filters.sentiment?.[0] || ""}
                onChange={(e) =>
                  handleChange(
                    "sentiment",
                    e.target.value ? [e.target.value as Sentiment] : undefined,
                  )
                }
              >
                <option value="">Все</option>
                {Object.entries(SENTIMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Приоритет */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Приоритет: {filters.priorityMin || 1} -{" "}
                {filters.priorityMax || 10}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={filters.priorityMin || 1}
                  onChange={(e) =>
                    handleChange("priorityMin", parseInt(e.target.value))
                  }
                  className="w-full"
                />
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={filters.priorityMax || 10}
                  onChange={(e) =>
                    handleChange("priorityMax", parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>
            </div>

            {/* Поиск */}
            <div className="lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Поиск
              </label>
              <input
                type="text"
                placeholder="Поиск по описанию или городу..."
                className="input w-full"
                value={filters.searchQuery || ""}
                onChange={(e) => handleChange("searchQuery", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button onClick={clearFilters} className="btn-secondary">
              Сбросить
            </button>
            <button
              onClick={() => onFilterChange(filters)}
              className="btn-primary"
            >
              Применить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
