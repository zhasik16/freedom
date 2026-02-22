import { useState } from "react";
import { Ticket } from "@/lib/types";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

interface Props {
  tickets: Ticket[];
}

export default function DistributionMap({ tickets }: Props) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Group tickets by assigned city coordinate
  const cityGroups = tickets.reduce(
    (acc, t) => {
      // Ищем город по назначенному офису из бэкенда
      const city = t.businessUnit || t.address.city || "Неизвестно";

      if (!acc[city]) {
        acc[city] = {
          count: 0,
          tickets: [],
          coordinates: t.address.coordinates || { lat: 43.2389, lng: 76.8897 }, // fallback to Almaty
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
    >
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
        {Object.entries(cityGroups)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 8)
          .map(([city, data]) => (
            <button
              key={city}
              onClick={() => setSelectedCity(selectedCity === city ? null : city)}
              className={`p-3 rounded-lg border transition-all text-left ${selectedCity === city
                ? "bg-blue-50 border-blue-500 shadow-md"
                : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
            >
              <div className="font-semibold text-gray-800">{city}</div>
              <div className="text-sm font-medium text-blue-600 mt-1">{data.count} обращений</div>
              <div className="text-xs text-gray-400 mt-2 flex gap-2">
                <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                  VIP: {data.tickets.filter((t) => t.segment === "VIP").length}
                </span>
                <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                  Priority: {data.tickets.filter((t) => t.segment === "Priority").length}
                </span>
              </div>
            </button>
          ))}
      </div>

      <div className="bg-[#f8f9fa] rounded-xl border border-gray-200 p-2 relative shadow-inner overflow-hidden flex justify-center items-center" style={{ height: '500px' }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: [68, 48], // В центр Казахстана
            scale: 1400,
          }}
          style={{ width: "100%", height: "100%", maxWidth: "800px" }}
        >
          <Geographies geography="/kazakhstan.json">
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#e5e7eb"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#d1d5db", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Маркеры городов */}
          {Object.entries(cityGroups).map(([city, data]) => {
            const { lng, lat } = data.coordinates;
            // Размер маркера зависит от числа тикетов (от 4 до 14)
            const radius = Math.min(Math.max(4, data.count * 1.5), 14);
            const isSelected = selectedCity === city;

            return (
              <Marker
                key={city}
                coordinates={[lng, lat]}
                onClick={() => setSelectedCity(isSelected ? null : city)}
                style={{ cursor: "pointer" }}
              >
                {/* Пульсирующий круг */}
                <circle
                  r={radius * 2}
                  fill={isSelected ? "#3b82f6" : "#ef4444"}
                  opacity={0.3}
                  className="animate-ping"
                  style={{ transformOrigin: "center", animationDuration: "2s" }}
                />

                {/* Основной маркер */}
                <circle
                  r={radius}
                  fill={isSelected ? "#2563eb" : "#dc2626"}
                  stroke="#ffffff"
                  strokeWidth={2}
                  className="transition-all duration-300"
                />

                <text
                  textAnchor="middle"
                  y={-radius - 6}
                  style={{
                    fontFamily: "system-ui",
                    fill: "#1f2937",
                    fontSize: isSelected ? "14px" : "12px",
                    fontWeight: isSelected ? "700" : "500",
                    pointerEvents: "none",
                    textShadow: "1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white"
                  }}
                >
                  {city} ({data.count})
                </text>
              </Marker>
            );
          })}
        </ComposableMap>
      </div>

      {/* Выбранный город (Детали) */}
      {selectedCity && cityGroups[selectedCity] && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Офис в г. {selectedCity}
            </h3>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              Всего тикетов: {cityGroups[selectedCity].count}
            </span>
          </div>

          <div className="p-0 overflow-y-auto" style={{ maxHeight: '400px' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сегмент & Тип</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Язык</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Суть обращения</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cityGroups[selectedCity].tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {ticket.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${ticket.segment === "VIP" ? "bg-purple-100 text-purple-800" :
                          ticket.segment === "Priority" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                          {ticket.segment}
                        </span>
                        <span className="text-xs text-gray-600">
                          {ticket.aiAnalysis?.type || "Консультация"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${ticket.aiAnalysis?.language === 'KZ' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                        ticket.aiAnalysis?.language === 'ENG' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                          'bg-gray-50 border-gray-200 text-gray-700'
                        }`}>
                        {ticket.aiAnalysis?.language || "RU"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                      <div className="line-clamp-2" title={ticket.description}>
                        {ticket.description}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
