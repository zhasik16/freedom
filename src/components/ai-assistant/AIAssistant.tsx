"use client";

import { useState } from "react";
import { AIQueryResponse } from "@/lib/types";

interface Props {
  onClose: () => void;
}

export default function AIAssistant({ onClose }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIQueryResponse | null>(null);
  const [chatHistory, setChatHistory] = useState<
    Array<{ query: string; response: AIQueryResponse }>
  >([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);

    // Имитация ответа от AI (в реальном проекте здесь будет API вызов)
    setTimeout(() => {
      const mockResponse: AIQueryResponse = {
        type: "chart",
        title: "Анализ по вашему запросу",
        description: `Результаты для: "${query}"`,
        data: {
          labels: ["Алматы", "Астана", "Шымкент", "Караганда"],
          values: [15, 12, 8, 5],
        },
        visualization: {
          chartType: "bar",
        },
      };

      setResponse(mockResponse);
      setChatHistory([...chatHistory, { query, response: mockResponse }]);
      setQuery("");
      setLoading(false);
    }, 1000);
  };

  const renderVisualization = (response: AIQueryResponse) => {
    switch (response.type) {
      case "chart":
        return (
          <div className="mt-4">
            <h4 className="font-medium mb-2">{response.title}</h4>
            <div className="bg-gray-50 p-4 rounded-lg h-64 flex items-center justify-center">
              <p className="text-gray-500">
                Здесь будет график: {response.visualization?.chartType}
                <br />
                {JSON.stringify(response.data)}
              </p>
            </div>
          </div>
        );

      case "table":
        return (
          <div className="mt-4">
            <h4 className="font-medium mb-2">{response.title}</h4>
            <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          </div>
        );

      default:
        return (
          <div className="mt-4">
            <h4 className="font-medium mb-2">{response.title}</h4>
            <p className="text-gray-700">{response.description}</p>
          </div>
        );
    }
  };

  const examples = [
    "Покажи распределение типов обращений по городам",
    "Какая тональность у VIP клиентов?",
    "График нагрузки менеджеров",
    "Топ 5 самых срочных обращений",
    "Сколько обращений из Алматы?",
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-lg bg-white">
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">AI</span>
            </div>
            <h3 className="ml-2 text-xl font-semibold text-gray-900">
              ИИ-ассистент
            </h3>
            <span className="ml-3 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
              Star Task
            </span>
          </div>
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

        {/* Примеры запросов */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Примеры запросов:</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(example)}
                className="text-xs bg-white px-3 py-1 rounded-full border border-gray-300 hover:bg-purple-50 hover:border-purple-300"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* История чата */}
        <div className="h-96 overflow-y-auto mb-4 p-4 border rounded-lg">
          {chatHistory.map((chat, idx) => (
            <div key={idx} className="mb-4">
              <div className="flex justify-end mb-2">
                <div className="bg-purple-100 text-purple-800 rounded-lg py-2 px-4 max-w-md">
                  {chat.query}
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                {renderVisualization(chat.response)}
              </div>
            </div>
          ))}

          {response && !chatHistory.length && (
            <div className="bg-gray-100 rounded-lg p-4">
              {renderVisualization(response)}
            </div>
          )}

          {!response && chatHistory.length === 0 && (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p>Задайте вопрос о данных</p>
                <p className="text-sm">
                  Например: "Покажи распределение по городам"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Форма ввода */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Введите ваш запрос..."
            className="flex-1 input"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Отправка...
              </>
            ) : (
              "Отправить"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
