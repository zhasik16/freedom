"use client";

import { useState, useMemo } from "react";
import { Ticket } from "@/lib/types";
import TicketModal from "./TicketModal";
import {
  TICKET_TYPE_LABELS,
  SENTIMENT_LABELS,
  SEGMENT_LABELS,
} from "@/lib/types";

interface Props {
  tickets: Ticket[];
}

export default function TicketsTable({ tickets }: Props) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Генерируем гарантированно уникальные ключи
  const ticketsWithUniqueKeys = useMemo(() => {
    return tickets.map((ticket, index) => {
      // Создаем уникальный ключ на основе нескольких параметров
      const uniqueKey = `${ticket.id || "no-id"}-${ticket.clientGuid || "no-guid"}-${index}-${Date.now()}`;
      return { ...ticket, uniqueKey };
    });
  }, [tickets]);

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return "bg-red-100 text-red-800";
    if (priority >= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getSegmentClass = (segment: string) => {
    switch (segment) {
      case "VIP":
        return "bg-purple-100 text-purple-800";
      case "Priority":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSentimentClass = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800";
      case "negative":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Нет обращений для отображения
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Клиент
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Сегмент
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Тип
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Тональность
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Город
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Приоритет
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ticketsWithUniqueKeys.map((ticket) => (
              <tr
                key={ticket.uniqueKey}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {ticket.id ? ticket.id.slice(0, 8) + "..." : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ticket.clientGuid
                    ? ticket.clientGuid.slice(0, 8) + "..."
                    : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getSegmentClass(ticket.segment)}`}
                  >
                    {SEGMENT_LABELS[ticket.segment]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ticket.aiAnalysis
                    ? TICKET_TYPE_LABELS[ticket.aiAnalysis.type]
                    : "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {ticket.aiAnalysis && (
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getSentimentClass(ticket.aiAnalysis.sentiment)}`}
                    >
                      {SENTIMENT_LABELS[ticket.aiAnalysis.sentiment]}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ticket.address.city || "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {ticket.aiAnalysis && (
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.aiAnalysis.priority)}`}
                    >
                      {ticket.aiAnalysis.priority}/10
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    className="text-blue-600 hover:text-blue-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTicket(ticket);
                    }}
                  >
                    Детали
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </>
  );
}
