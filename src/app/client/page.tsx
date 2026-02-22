"use client";

import { useState } from "react";
import { ticketsApi } from "@/lib/api/endpoints";

export default function ClientPage() {
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [segment, setSegment] = useState("Mass");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorText, setErrorText] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorText("");

        if (!description.trim()) {
            setErrorText("Опишите вашу проблему, пожалуйста.");
            return;
        }

        setIsSubmitting(true);

        try {
            // Сгенерируем случайный GUID клиента для демо
            const client_guid = crypto.randomUUID();

            await ticketsApi.create({
                client_guid,
                description,
                segment,
                address
            });

            setIsSuccess(true);
            setDescription("");
            setAddress("");
            setSegment("Mass");

            // Скрываем плашку успеха через 5 секунд
            setTimeout(() => setIsSuccess(false), 5000);

        } catch (err: any) {
            console.error(err);
            setErrorText(err.message || "Произошла ошибка при отправке заявки.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", display: "flex", flexDirection: "column" }}>
            {/* Навигация аналогично главной */}
            <nav style={{ backgroundColor: "white", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)", borderBottom: "1px solid #e5e7eb", padding: "0 1rem", height: "4rem", display: "flex", alignItems: "center" }}>
                <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%", display: "flex", alignItems: "center" }}>
                    <div style={{ width: "2rem", height: "2rem", backgroundColor: "#2563eb", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "white", fontWeight: "bold", fontSize: "1.125rem" }}>F</span>
                    </div>
                    <h1 style={{ marginLeft: "0.5rem", fontSize: "1.25rem", fontWeight: "bold", color: "#111827" }}>
                        F.I.R.E. | Поддержка
                    </h1>
                </div>
            </nav>

            {/* Контент формы */}
            <main style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "2rem 1rem" }}>
                <div style={{ backgroundColor: "white", padding: "2.5rem", borderRadius: "0.75rem", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", width: "100%", maxWidth: "600px" }}>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", marginBottom: "0.5rem" }}>Создать обращение</h2>
                    <p style={{ color: "#6b7280", marginBottom: "2rem", fontSize: "0.875rem" }}>
                        Ваша заявка будет автоматически проанализирована нашим ИИ и мгновенно направлена наиболее подходящему специалисту.
                    </p>

                    {isSuccess && (
                        <div style={{ backgroundColor: "#dcfce7", color: "#166534", padding: "1rem", borderRadius: "0.5rem", marginBottom: "1.5rem", fontSize: "0.875rem", display: "flex", alignItems: "center" }}>
                            <span style={{ marginRight: "0.5rem", fontSize: "1.2rem" }}>✅</span>
                            Ваша заявка успешно отправлена!
                        </div>
                    )}

                    {errorText && (
                        <div style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "1rem", borderRadius: "0.5rem", marginBottom: "1.5rem", fontSize: "0.875rem", display: "flex", alignItems: "center" }}>
                            <span style={{ marginRight: "0.5rem", fontSize: "1.2rem" }}>❌</span>
                            {errorText}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                        {/* Текст проблемы */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <label htmlFor="description" style={{ fontSize: "0.875rem", fontWeight: "500", color: "#374151" }}>Опишите вашу проблему *</label>
                            <textarea
                                id="description"
                                placeholder="Я хочу сменить персональные данные, но не приходит SMS код..."
                                rows={5}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.875rem", outline: "none", resize: "vertical" }}
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Адрес */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <label htmlFor="address" style={{ fontSize: "0.875rem", fontWeight: "500", color: "#374151" }}>Ваш город или область (опционально)</label>
                            <input
                                id="address"
                                type="text"
                                placeholder="г. Алматы"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.875rem", outline: "none" }}
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Сегмент клиента */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <label htmlFor="segment" style={{ fontSize: "0.875rem", fontWeight: "500", color: "#374151" }}>Ваш текущий сегмент (ДЛЯ ДЕМО)</label>
                            <select
                                id="segment"
                                value={segment}
                                onChange={e => setSegment(e.target.value)}
                                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.875rem", outline: "none", backgroundColor: "white" }}
                                disabled={isSubmitting}
                            >
                                <option value="Mass">Mass (Обычный клиент)</option>
                                <option value="Priority">Priority (Приоритетный)</option>
                                <option value="VIP">VIP (Особый клиент)</option>
                            </select>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                marginTop: "0.5rem",
                                padding: "0.875rem",
                                backgroundColor: isSubmitting ? "#93c5fd" : "#2563eb",
                                color: "white",
                                fontWeight: "600",
                                borderRadius: "0.5rem",
                                border: "none",
                                cursor: isSubmitting ? "not-allowed" : "pointer",
                                transition: "background-color 0.2s"
                            }}
                        >
                            {isSubmitting ? "Отправка..." : "Отправить заявку"}
                        </button>

                    </form>
                </div>
            </main>
        </div>
    );
}
