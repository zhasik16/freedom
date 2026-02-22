"use client";

import { useState, useEffect } from "react";
import { managersApi, ticketsApi } from "@/lib/api/endpoints";
import { Manager, Ticket } from "@/lib/types";

export default function ManagerPage() {
    const [managers, setManagers] = useState<Manager[]>([]);
    const [selectedManagerId, setSelectedManagerId] = useState<string>("");
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    // 1. Fetch Managers on Load
    useEffect(() => {
        managersApi.getAll().then(res => {
            setManagers(res);
            setLoading(false);
        }).catch(err => {
            console.error("Error fetching managers", err);
            setLoading(false);
        });
    }, []);

    // 2. Fetch Tickets when Manager is selected
    useEffect(() => {
        if (!selectedManagerId) {
            setTickets([]);
            return;
        }

        ticketsApi.getAll(0, 1000).then(allTickets => {
            const myTickets = allTickets.filter(t => t.assignedManagerId === selectedManagerId);
            // Sort newest first
            myTickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setTickets(myTickets);
        }).catch(err => {
            console.error("Error fetching tickets", err);
        });
    }, [selectedManagerId]);

    const selectedManager = managers.find(m => m.id === selectedManagerId);

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
            {/* Navbar */}
            <nav style={{ backgroundColor: "#1e1b4b", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", color: "white" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ padding: "0.25rem 0.5rem", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold" }}>CRM</div>
                    <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "600" }}>Рабочее Место Менеджера</h1>
                </div>

                {/* Dummy Login Selector */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ fontSize: "0.875rem", color: "#cbd5e1" }}>Войти как:</span>
                    <select
                        value={selectedManagerId}
                        onChange={(e) => setSelectedManagerId(e.target.value)}
                        style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "none", outline: "none", backgroundColor: "white", color: "#0f172a", minWidth: "200px" }}
                    >
                        <option value="">-- Выберите профиль --</option>
                        {managers.map(m => (
                            <option key={m.id} value={m.id}>{m.fullName} ({m.businessUnit})</option>
                        ))}
                    </select>
                </div>
            </nav>

            <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem" }}>
                {loading ? (
                    <div style={{ textAlign: "center", marginTop: "4rem", color: "#64748b" }}>Загрузка...</div>
                ) : !selectedManagerId ? (
                    <div style={{
                        marginTop: "4rem",
                        textAlign: "center",
                        padding: "4rem",
                        backgroundColor: "white",
                        borderRadius: "1rem",
                        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                        color: "#64748b"
                    }}>
                        <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>👤</span>
                        <h2>Пожалуйста, авторизуйтесь (выберите профиль в правом верхнем углу)</h2>
                    </div>
                ) : (
                    <div>
                        {/* Header / Profile Info */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
                            <div>
                                <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a", margin: "0 0 0.5rem 0" }}>Мои задачи</h2>
                                <div style={{ display: "flex", gap: "1rem", color: "#64748b", fontSize: "0.875rem" }}>
                                    <span>📍 {selectedManager?.businessUnit}</span>
                                    <span>💼 {selectedManager?.position}</span>
                                    {selectedManager?.skills.length ? (
                                        <span>🛠️ {selectedManager.skills.join(", ")}</span>
                                    ) : null}
                                </div>
                            </div>
                            <div style={{ backgroundColor: "#dbeafe", color: "#1e40af", padding: "0.5rem 1rem", borderRadius: "9999px", fontWeight: "600", fontSize: "0.875rem" }}>
                                В очереди: {tickets.length}
                            </div>
                        </div>

                        {/* Tickets Grid */}
                        {tickets.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "4rem", backgroundColor: "white", borderRadius: "1rem", color: "#94a3b8" }}>
                                У вас нет активных задач. Отличная работа! 🎉
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
                                {tickets.map(ticket => (
                                    <div key={ticket.id} style={{
                                        backgroundColor: "white",
                                        borderRadius: "0.75rem",
                                        padding: "1.5rem",
                                        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                                        border: "1px solid #e2e8f0",
                                        borderTop: `4px solid ${getPriorityColor(ticket.aiAnalysis?.priority)}`,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "1rem"
                                    }}>
                                        {/* Tags Header */}
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                                <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", backgroundColor: "#f1f5f9", borderRadius: "4px", color: "#475569", fontWeight: "500" }}>
                                                    {ticket.aiAnalysis?.type}
                                                </span>
                                                <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", backgroundColor: getSentimentColor(ticket.aiAnalysis?.sentiment), borderRadius: "4px", fontWeight: "500" }}>
                                                    {ticket.aiAnalysis?.sentiment}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                                                {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {/* Metadata */}
                                        <div style={{ fontSize: "0.875rem", color: "#334155", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                            <div><b>Сегмент:</b> {ticket.segment}</div>
                                            <div><b>Язык:</b> {ticket.aiAnalysis?.language}</div>
                                            <div style={{ gridColumn: "span 2" }}><b>Адрес:</b> {ticket.address?.fullAddress || "—"}</div>
                                        </div>

                                        {/* Description */}
                                        <div style={{
                                            padding: "0.75rem",
                                            backgroundColor: "#f8fafc",
                                            borderRadius: "0.5rem",
                                            fontSize: "0.875rem",
                                            color: "#1e293b",
                                            borderLeft: "2px solid #cbd5e1"
                                        }}>
                                            {ticket.description}
                                        </div>

                                        {/* AI Info */}
                                        {(ticket.aiAnalysis?.summary || ticket.aiAnalysis?.recommendedAction) && (
                                            <div style={{ marginTop: "auto", fontSize: "0.875rem", borderTop: "1px dashed #e2e8f0", paddingTop: "1rem" }}>
                                                <div style={{ color: "#2563eb", fontWeight: "600", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                                                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                                    </svg>
                                                    AI Резюме
                                                </div>
                                                <p style={{ margin: "0 0 0.5rem 0", color: "#475569" }}>{ticket.aiAnalysis.summary}</p>
                                                {ticket.aiAnalysis.recommendedAction && (
                                                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Действие: {ticket.aiAnalysis.recommendedAction}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

// Helpers for colors
function getPriorityColor(p?: number) {
    if (!p) return "#94a3b8"; // Gray
    if (p <= 2) return "#ef4444"; // Red (Critical)
    if (p <= 5) return "#f59e0b"; // Orange/Yellow
    return "#22c55e"; // Green
}

function getSentimentColor(s?: string) {
    switch (s) {
        case 'negative': return "#fee2e2"; // light red
        case 'positive': return "#dcfce7"; // light green
        default: return "#f1f5f9"; // light gray
    }
}
