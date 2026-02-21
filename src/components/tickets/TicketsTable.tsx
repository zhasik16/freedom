"use client";

import { useState } from "react";
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

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return "bg-red-100 text-red-800";
    if (priority >= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                  {ticket.id.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {ticket.clientGuid.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`badge ${
                      ticket.segment === "VIP"
                        ? "bg-purple-100 text-purple-800"
                        : ticket.segment === "Priority"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
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
                      className={`badge ${
                        ticket.aiAnalysis.sentiment === "positive"
                          ? "bg-green-100 text-green-800"
                          : ticket.aiAnalysis.sentiment === "negative"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
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
                      className={`badge ${getPriorityColor(ticket.aiAnalysis.priority)}`}
                    >
                      {ticket.aiAnalysis.priority}/10
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="text-blue-600 hover:text-blue-900"
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
