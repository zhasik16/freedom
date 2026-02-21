"use client";

import {
  Ticket,
  TICKET_TYPE_LABELS,
  SENTIMENT_LABELS,
  LANGUAGE_LABELS,
  SEGMENT_LABELS,
} from "@/lib/types";

interface Props {
  ticket: Ticket;
  onClose: () => void;
}

export default function TicketModal({ ticket, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Детали обращения #{ticket.id.slice(0, 8)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Информация о клиенте */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 border-b pb-2">
              Информация о клиенте
            </h4>

            <div>
              <label className="text-sm text-gray-500">GUID</label>
              <p className="font-mono text-sm break-all">{ticket.clientGuid}</p>
            </div>

            <div>
              <label className="text-sm text-gray-500">Пол</label>
              <p>{ticket.gender === "male" ? "Мужской" : "Женский"}</p>
            </div>

            <div>
              <label className="text-sm text-gray-500">Дата рождения</label>
              <p>{new Date(ticket.birthDate).toLocaleDateString("ru-RU")}</p>
            </div>

            <div>
              <label className="text-sm text-gray-500">Сегмент</label>
              <p
                className={`font-semibold ${
                  ticket.segment === "VIP"
                    ? "text-purple-600"
                    : ticket.segment === "Priority"
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
              >
                {SEGMENT_LABELS[ticket.segment]}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-500">Адрес</label>
              <p className="text-sm">
                {ticket.address.fullAddress ||
                  `${ticket.address.country}, ${ticket.address.city}, ${ticket.address.street} ${ticket.address.building}`}
              </p>
            </div>
          </div>

          {/* AI Анализ */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 border-b pb-2">
              AI Анализ
            </h4>

            {ticket.aiAnalysis ? (
              <>
                <div>
                  <label className="text-sm text-gray-500">Тип обращения</label>
                  <p className="font-semibold">
                    {TICKET_TYPE_LABELS[ticket.aiAnalysis.type]}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Тональность</label>
                  <p
                    className={`font-semibold ${
                      ticket.aiAnalysis.sentiment === "positive"
                        ? "text-green-600"
                        : ticket.aiAnalysis.sentiment === "negative"
                          ? "text-red-600"
                          : "text-yellow-600"
                    }`}
                  >
                    {SENTIMENT_LABELS[ticket.aiAnalysis.sentiment]}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Приоритет</label>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${ticket.aiAnalysis.priority * 10}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {ticket.aiAnalysis.priority}/10
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Язык</label>
                  <p>{LANGUAGE_LABELS[ticket.aiAnalysis.language]}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">
                    Краткое содержание
                  </label>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">
                    {ticket.aiAnalysis.summary}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Рекомендация</label>
                  <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                    {ticket.aiAnalysis.recommendedAction}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-gray-500 italic">AI анализ не выполнен</p>
            )}
          </div>
        </div>

        {/* Назначение */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium text-gray-700 mb-2">Назначение</h4>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {ticket.assignedManagerId ? (
                <>
                  Назначен на менеджера:{" "}
                  <span className="font-medium">
                    {ticket.assignedManagerId}
                  </span>
                </>
              ) : (
                "Не назначен"
              )}
            </p>
            {ticket.businessUnit && (
              <p className="text-sm text-gray-500">
                Офис: <span className="font-medium">{ticket.businessUnit}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
