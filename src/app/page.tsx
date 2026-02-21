"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AIAssistant from "@/components/ai-assistant/AIAssistant";
import DistributionMap from "@/components/map/DistributionMap";
import { useDataset } from "@/lib/hooks/useDataset";
import { ticketsApi } from "@/lib/api/endpoints";

export default function Home() {
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "map">("dashboard");
  const [isUploading, setIsUploading] = useState(false);
  const { filteredTickets, loading, stats, refresh, useBackend } = useDataset();

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const result = await ticketsApi.upload(file);
      alert(result.message || "Файл успешно загружен");
      refresh();
    } catch (error) {
      alert("Ошибка при загрузке файла");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "4rem",
              height: "4rem",
              border: "4px solid #e5e7eb",
              borderTopColor: "#2563eb",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "0.5rem",
            }}
          >
            Загрузка F.I.R.E.
          </h2>
          <p style={{ color: "#6b7280" }}>
            {useBackend
              ? "Подключение к бэкенду..."
              : "Загрузка из CSV файлов..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      {/* Навигация */}
      <nav
        style={{
          backgroundColor: "white",
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 1rem",
            height: "4rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: "2rem",
                height: "2rem",
                backgroundColor: "#2563eb",
                borderRadius: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "1.125rem",
                }}
              >
                F
              </span>
            </div>
            <h1
              style={{
                marginLeft: "0.5rem",
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "#111827",
              }}
            >
              F.I.R.E.
            </h1>
            <span
              style={{
                marginLeft: "1rem",
                fontSize: "0.875rem",
                color: "#6b7280",
                display: "none",
              }}
              className="sm:block"
            >
              Freedom Intelligent Routing Engine
            </span>

            {/* Индикатор источника данных */}
            <div style={{ marginLeft: "1rem" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "9999px",
                  backgroundColor: useBackend ? "#dcfce7" : "#fef9c3",
                  color: useBackend ? "#166534" : "#854d0e",
                }}
              >
                {useBackend ? "Бэкенд" : "CSV (демо)"}
              </span>
            </div>

            {/* Статистика */}
            <div
              style={{
                marginLeft: "2rem",
                display: "flex",
                gap: "1rem",
                fontSize: "0.875rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ color: "#6b7280" }}>Тикеты:</span>
                <span
                  style={{
                    marginLeft: "0.25rem",
                    fontWeight: "600",
                    color: "#2563eb",
                  }}
                >
                  {stats.totalTickets}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ color: "#6b7280" }}>Не назначено:</span>
                <span
                  style={{
                    marginLeft: "0.25rem",
                    fontWeight: "600",
                    color: "#eab308",
                  }}
                >
                  {stats.unassignedTickets}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Кнопка загрузки CSV */}
            <label style={{ cursor: isUploading ? "not-allowed" : "pointer" }}>
              <input
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                disabled={isUploading}
              />
              <div
                style={{
                  backgroundColor: "#e5e7eb",
                  color: "#1f2937",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  opacity: isUploading ? 0.5 : 1,
                }}
              >
                <svg
                  style={{
                    width: "1.25rem",
                    height: "1.25rem",
                    marginRight: "0.5rem",
                  }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                {isUploading ? "Загрузка..." : "Загрузить CSV"}
              </div>
            </label>

            {/* Вкладки */}
            <div
              style={{
                display: "flex",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setActiveTab("dashboard")}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  backgroundColor:
                    activeTab === "dashboard" ? "#2563eb" : "white",
                  color: activeTab === "dashboard" ? "white" : "#374151",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Дашборд
              </button>
              <button
                onClick={() => setActiveTab("map")}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  backgroundColor: activeTab === "map" ? "#2563eb" : "white",
                  color: activeTab === "map" ? "white" : "#374151",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Карта
              </button>
            </div>

            {/* Кнопка ИИ-ассистента */}
            <button
              onClick={() => setShowAIAssistant(true)}
              style={{
                backgroundColor: "#9333ea",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                display: "flex",
                alignItems: "center",
                border: "none",
                cursor: "pointer",
              }}
            >
              <svg
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  marginRight: "0.5rem",
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              ИИ-ассистент
              <span
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.125rem 0.375rem",
                  backgroundColor: "#fde047",
                  color: "#581c87",
                  fontSize: "0.75rem",
                  borderRadius: "9999px",
                }}
              >
                Star
              </span>
            </button>
          </div>
        </div>
      </nav>

      <main>
        {activeTab === "dashboard" ? (
          <DashboardLayout />
        ) : (
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              padding: "2rem 1rem",
            }}
          >
            <div className="card">
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                }}
              >
                Геораспределение обращений
              </h2>
              <DistributionMap tickets={filteredTickets} />
            </div>
          </div>
        )}
      </main>

      {showAIAssistant && (
        <AIAssistant onClose={() => setShowAIAssistant(false)} />
      )}
    </div>
  );
}
