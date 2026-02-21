"use client";

import { useState } from "react";
import { Ticket } from "@/lib/types";

interface Props {
  tickets: Ticket[];
}

export default function DistributionMap({ tickets }: Props) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Группировка по городам
  const cityGroups = tickets.reduce(
    (acc, t) => {
      const city = t.address.city || "Неизвестно";
      if (!acc[city]) {
        acc[city] = {
          count: 0,
          tickets: [],
          coordinates: t.address.coordinates || { lat: 43.2389, lng: 76.8897 }, // Алматы по умолчанию
        };
      }
      acc[city].count++;
      acc[city].tickets.push(t);
      return acc;
    },
    {} as Record<
      string,
      {
        count: number;
        tickets: Ticket[];
        coordinates: { lat: number; lng: number };
      }
    >,
  );

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Нет данных</h3>
        <p className="mt-1 text-sm text-gray-500">Обращения не найдены</p>
      </div>
    );
  }

  return (
    <div>
      {/* Статистика по городам */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(cityGroups).map(([city, data]) => (
          <button
            key={city}
            onClick={() => setSelectedCity(selectedCity === city ? null : city)}
            className={`p-3 rounded-lg border transition-all ${
              selectedCity === city
                ? "bg-blue-50 border-blue-500 shadow-md"
                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <div className="font-medium">{city}</div>
            <div className="text-sm text-gray-600">{data.count} обращений</div>
            <div className="text-xs text-gray-400">
              {data.tickets.filter((t) => t.segment === "VIP").length} VIP
            </div>
          </button>
        ))}
      </div>

      {/* Карта */}
      <div className="bg-gray-100 rounded-lg p-6 h-96 relative overflow-hidden">
        {/* Сетка карты */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(#ddd 1px, transparent 1px), linear-gradient(90deg, #ddd 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        ></div>

        {/* Маркеры городов */}
        {Object.entries(cityGroups).map(([city, data]) => {
          // Простая проекция для демо
          const left = 20 + Math.random() * 60; // Случайная позиция для демо
          const top = 20 + Math.random() * 60;

          return (
            <div
              key={city}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
                selectedCity && selectedCity !== city ? "opacity-30" : ""
              }`}
              style={{ left: `${left}%`, top: `${top}%` }}
              onClick={() =>
                setSelectedCity(selectedCity === city ? null : city)
              }
            >
              <div
                className={`w-4 h-4 rounded-full ${
                  data.count > 10
                    ? "bg-red-500 w-6 h-6"
                    : data.count > 5
                      ? "bg-orange-500 w-5 h-5"
                      : "bg-yellow-500"
                } animate-pulse`}
              />
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {city}: {data.count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Детали выбранного города */}
      {selectedCity && cityGroups[selectedCity] && (
        <div className="mt-6 p-4 bg-white rounded-lg border">
          <h4 className="font-semibold mb-3">Обращения в {selectedCity}</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {cityGroups[selectedCity].tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="text-sm p-2 bg-gray-50 rounded hover:bg-gray-100"
              >
                <div className="flex justify-between">
                  <span className="font-mono text-xs">
                    {ticket.id.slice(0, 8)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      ticket.segment === "VIP"
                        ? "bg-purple-100 text-purple-800"
                        : ticket.segment === "Priority"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {ticket.segment}
                  </span>
                </div>
                <p className="text-gray-600 mt-1 line-clamp-2">
                  {ticket.description.substring(0, 100)}...
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
