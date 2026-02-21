"use client";

import { DashboardAnalytics } from "@/lib/types";

interface Props {
  analytics: DashboardAnalytics;
}

export default function AnalyticsCards({ analytics }: Props) {
  const cards = [
    {
      title: "Всего обращений",
      value: analytics.totalTickets,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      ),
      color: "bg-blue-500",
    },
    {
      title: "Средний приоритет",
      value: analytics.avgPriority.toFixed(1),
      suffix: "/10",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      color: "bg-yellow-500",
    },
    {
      title: "Не назначено",
      value: analytics.unassignedTickets,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "bg-red-500",
    },
    {
      title: "Менеджеров",
      value: analytics.managerLoad.length,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      color: "bg-purple-500",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(1, 1fr)",
        gap: "1.5rem",
        marginBottom: "2rem",
      }}
    >
      {cards.map((card, index) => (
        <div
          key={index}
          className="card"
          style={{ transition: "box-shadow 0.2s" }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                backgroundColor: card.color.replace("bg-", ""),
                borderRadius: "0.5rem",
                padding: "0.75rem",
                color: "white",
              }}
            >
              {card.icon}
            </div>
            <div style={{ marginLeft: "1rem" }}>
              <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                {card.title}
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                {card.value}
                {card.suffix && (
                  <span
                    style={{
                      fontSize: "1.125rem",
                      color: "#6b7280",
                      marginLeft: "0.25rem",
                    }}
                  >
                    {card.suffix}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
