
import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import csv
from io import StringIO
import heapq
from enum import Enum
import httpx
import json
import asyncio
import chardet
import re
import math
import random
from collections import defaultdict, deque
import asyncpg
import ssl
import traceback

# ---------- КОНФИГУРАЦИЯ ----------
YOUR_API_KEY = os.getenv("GEMINI_API")
AI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
AI_MODEL = "gemini-2.5-flash"
DATABASE_URL = os.getenv("DATABASE_URL")

# ---------- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ БД ----------
db_pool: Optional[asyncpg.Pool] = None

# ---------- ГЛОБАЛЬНЫЕ ДАННЫЕ ----------
BUSINESS_UNITS = []
MANAGERS = []

# ---------- ROUND ROBIN ХРАНИЛИЩЕ ----------
round_robin_queues = defaultdict(lambda: defaultdict(deque))
assignment_history = defaultdict(lambda: defaultdict(int))

# ---------- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ----------

def get_city_coordinates(city_name: str) -> Dict[str, float]:
    """Получить координаты города"""
    cities = {
        "Актау": {"lat": 43.65, "lon": 51.15},
        "Актобе": {"lat": 50.28, "lon": 57.15},
        "Алматы": {"lat": 43.22, "lon": 76.85},
        "Астана": {"lat": 51.16, "lon": 71.43},
        "Атырау": {"lat": 47.10, "lon": 51.92},
        "Караганда": {"lat": 49.80, "lon": 73.10},
        "Кокшетау": {"lat": 53.28, "lon": 69.38},
        "Костанай": {"lat": 53.20, "lon": 63.62},
        "Кызылорда": {"lat": 44.85, "lon": 65.50},
        "Павлодар": {"lat": 52.28, "lon": 76.95},
        "Петропавловск": {"lat": 54.87, "lon": 69.15},
        "Тараз": {"lat": 42.90, "lon": 71.37},
        "Уральск": {"lat": 51.22, "lon": 51.37},
        "Усть-Каменогорск": {"lat": 49.95, "lon": 82.62},
        "Шымкент": {"lat": 42.30, "lon": 69.60},
    }
    
    if city_name in cities:
        return cities[city_name]
    
    for city, coords in cities.items():
        if city.lower() in city_name.lower():
            return coords
    
    return {"lat": 51.16, "lon": 71.43}

def get_address_coordinates(address: str) -> Dict[str, float]:
    """Получить координаты из полного адреса"""
    if not address:
        return {"lat": 51.16, "lon": 71.43}
    
    address_lower = address.lower()
    
    coordinates_db = {
        "алматы": {"lat": 43.22, "lon": 76.85},
        "астана": {"lat": 51.16, "lon": 71.43},
        "шымкент": {"lat": 42.30, "lon": 69.60},
        "караганда": {"lat": 49.80, "lon": 73.10},
        "актобе": {"lat": 50.28, "lon": 57.15},
        "тараз": {"lat": 42.90, "lon": 71.37},
        "павлодар": {"lat": 52.28, "lon": 76.95},
        "усть-каменогорск": {"lat": 49.95, "lon": 82.62},
        "семей": {"lat": 50.41, "lon": 80.25},
        "атырау": {"lat": 47.10, "lon": 51.92},
        "кызылорда": {"lat": 44.85, "lon": 65.50},
        "костанай": {"lat": 53.20, "lon": 63.62},
        "петропавловск": {"lat": 54.87, "lon": 69.15},
        "уральск": {"lat": 51.22, "lon": 51.37},
        "кокшетау": {"lat": 53.28, "lon": 69.38},
        "туркестан": {"lat": 43.30, "lon": 68.25},
        "красный яр": {"lat": 53.08, "lon": 70.45},
        "щучинск": {"lat": 52.93, "lon": 70.20},
        "бурабай": {"lat": 53.08, "lon": 70.30},
        "макинск": {"lat": 52.63, "lon": 70.42},
        "степняк": {"lat": 52.83, "lon": 70.78},
        "акколь": {"lat": 52.00, "lon": 70.93},
        "атбасар": {"lat": 51.82, "lon": 68.33},
        "державинск": {"lat": 51.10, "lon": 66.32},
        "есиль": {"lat": 51.95, "lon": 66.40},
        "ерментау": {"lat": 51.62, "lon": 73.10},
        "тургень": {"lat": 43.40, "lon": 77.60},
        "капчагай": {"lat": 43.88, "lon": 77.08},
        "конаев": {"lat": 43.88, "lon": 77.08},
        "талдыкорган": {"lat": 45.00, "lon": 78.37},
        "текели": {"lat": 44.83, "lon": 78.82},
        "темиртау": {"lat": 50.05, "lon": 72.95},
        "балхаш": {"lat": 46.85, "lon": 75.00},
        "жезказган": {"lat": 47.78, "lon": 67.70},
        "сатпаев": {"lat": 47.90, "lon": 67.53},
        "шахтинск": {"lat": 49.72, "lon": 72.58},
        "сарань": {"lat": 49.78, "lon": 72.83},
        "абай": {"lat": 49.63, "lon": 72.85},
        "айагоз": {"lat": 47.97, "lon": 80.43},
        "шемонаиха": {"lat": 50.63, "lon": 81.90},
        "аксу": {"lat": 52.03, "lon": 76.92},
        "экибастуз": {"lat": 51.73, "lon": 75.32},
        "рудный": {"lat": 52.97, "lon": 63.13},
        "лисаковск": {"lat": 52.53, "lon": 62.50},
        "кандыагаш": {"lat": 49.47, "lon": 57.42},
        "хромтау": {"lat": 50.25, "lon": 58.43},
        "алга": {"lat": 49.90, "lon": 57.33},
        "емби": {"lat": 48.83, "lon": 58.15},
    }
    
    for place, coords in coordinates_db.items():
        if place in address_lower:
            print(f"  🗺️ Найдены координаты для: {place}")
            return coords
    
    if "акмолинская" in address_lower:
        print("  🗺️ Определено по области: Акмолинская -> Кокшетау")
        return {"lat": 53.28, "lon": 69.38}
    elif "алматинская" in address_lower:
        return {"lat": 43.22, "lon": 76.85}
    elif "карагандинская" in address_lower:
        return {"lat": 49.80, "lon": 73.10}
    elif "восточно-казахстанская" in address_lower:
        return {"lat": 49.95, "lon": 82.62}
    elif "павлодарская" in address_lower:
        return {"lat": 52.28, "lon": 76.95}
    elif "костанайская" in address_lower:
        return {"lat": 53.20, "lon": 63.62}
    elif "северо-казахстанская" in address_lower:
        return {"lat": 54.87, "lon": 69.15}
    elif "западно-казахстанская" in address_lower:
        return {"lat": 51.22, "lon": 51.37}
    elif "атырауская" in address_lower:
        return {"lat": 47.10, "lon": 51.92}
    elif "мангыстауская" in address_lower:
        return {"lat": 43.65, "lon": 51.15}
    elif "кызылординская" in address_lower:
        return {"lat": 44.85, "lon": 65.50}
    elif "туркестанская" in address_lower:
        return {"lat": 42.30, "lon": 69.60}
    elif "актюбинская" in address_lower:
        return {"lat": 50.28, "lon": 57.15}
    
    print("  ⚠️ Координаты не найдены, используется Астана")
    return {"lat": 51.16, "lon": 71.43}

def load_business_units_from_file():
    """Загружает офисы из datasets.json"""
    global BUSINESS_UNITS
    try:
        with open('datasets.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            BUSINESS_UNITS = data.get('business_units', [])
            for unit in BUSINESS_UNITS:
                unit['coordinates'] = get_city_coordinates(unit['Офис'])
            print(f"✅ Загружено {len(BUSINESS_UNITS)} офисов")
            return BUSINESS_UNITS
    except Exception as e:
        print(f"❌ Ошибка загрузки офисов: {e}")
        return []

def load_managers_from_file():
    """Загружает менеджеров из datasets.json"""
    global MANAGERS
    try:
        with open('datasets.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            MANAGERS = data.get('managers', [])
            print(f"✅ Загружено {len(MANAGERS)} менеджеров")
            return MANAGERS
    except Exception as e:
        print(f"❌ Ошибка загрузки менеджеров: {e}")
        return []

load_business_units_from_file()
load_managers_from_file()

def calculate_distance(coord1: Dict[str, float], coord2: Dict[str, float]) -> float:
    """Рассчитывает расстояние между двумя точками в км"""
    R = 6371
    lat1 = math.radians(coord1['lat'])
    lon1 = math.radians(coord1['lon'])
    lat2 = math.radians(coord2['lat'])
    lon2 = math.radians(coord2['lon'])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c

def is_in_kazakhstan(address: str) -> bool:
    """Проверяет, находится ли клиент в Казахстане"""
    if not address:
        return False
    
    address_lower = address.lower()
    
    foreign_indicators = [
        'россия', 'russia', 'рф', 'москва', 'moscow',
        'украина', 'ukraine', 'киев', 'kiev',
        'беларусь', 'belarus', 'минск', 'minsk',
        'германия', 'germany', 'берлин', 'berlin',
        'сша', 'usa', 'америка', 'america',
        'великобритания', 'uk', 'london', 'лондон',
        'китай', 'china', 'пекин', 'beijing',
        'узбекистан', 'uzbekistan', 'ташкент', 'tashkent'
    ]
    
    for indicator in foreign_indicators:
        if indicator in address_lower:
            return False
    
    kazakhstan_indicators = [
        'казахстан', 'kazakhstan', 'kz', 'қазақстан',
        'акмолинская', 'алматинская', 'карагандинская',
        'восточно-казахстанская', 'западно-казахстанская',
        'северо-казахстанская', 'южно-казахстанская',
        'павлодарская', 'костанайская', 'кызылординская',
        'атырауская', 'мангыстауская', 'актюбинская',
        'туркестанская', 'абайская', 'жезказганская'
    ]
    
    for indicator in kazakhstan_indicators:
        if indicator in address_lower:
            return True
    
    kazakh_cities = [
        'астана', 'алматы', 'шымкент', 'караганда', 'актобе',
        'тараз', 'павлодар', 'усть-каменогорск', 'семей',
        'атырау', 'кызылорда', 'костанай', 'петропавловск',
        'уральск', 'кокшетау', 'туркестан', 'жезказган',
        'красный яр', 'щучинск', 'бурабай', 'темиртау',
        'экибастуз', 'рудный', 'аксу'
    ]
    
    for city in kazakh_cities:
        if city in address_lower:
            return True
    
    return True

def find_nearest_office(client_coords: Dict[str, float]) -> Dict[str, Any]:
    """Находит ближайший офис к клиенту"""
    if not client_coords or not BUSINESS_UNITS:
        return None
    
    nearest_office = None
    min_distance = float('inf')
    offices_with_distance = []
    
    for office in BUSINESS_UNITS:
        office_coords = office.get('coordinates')
        if office_coords:
            distance = calculate_distance(client_coords, office_coords)
            offices_with_distance.append((office, distance))
            if distance < min_distance:
                min_distance = distance
                nearest_office = office.copy()
                nearest_office['distance_km'] = round(distance, 1)
    
    offices_with_distance.sort(key=lambda x: x[1])
    print(f"  📊 Расстояния до офисов:")
    for office, dist in offices_with_distance[:3]:
        print(f"     - {office['Офис']}: {round(dist, 1)} км")
    
    return nearest_office

foreign_distribution_counter = 0

def select_office_for_foreign_client() -> Dict[str, Any]:
    """Распределяет иностранных клиентов 50/50"""
    global foreign_distribution_counter
    astana = next((o for o in BUSINESS_UNITS if o['Офис'] == 'Астана'), None)
    almaty = next((o for o in BUSINESS_UNITS if o['Офис'] == 'Алматы'), None)
    
    if not astana or not almaty:
        return BUSINESS_UNITS[0] if BUSINESS_UNITS else None
    
    # Строго по очереди (Round Robin 50/50)
    office_to_pick = astana if foreign_distribution_counter % 2 == 0 else almaty
    foreign_distribution_counter += 1
    
    selected = office_to_pick.copy()
    selected['assignment_reason'] = 'foreign_client_50_50'
    selected['distance_km'] = None
    return selected

def get_manager_by_round_robin(office: str, required_skills: List[str]) -> Optional[Dict[str, Any]]:
    """Получает менеджера по Round Robin среди 2 самых свободных подходящих менеджеров"""
    global MANAGERS
    
    office_managers = [m for m in MANAGERS if m.get('Офис') == office]
    
    # Оставляем только тех, кто удовлетворяет ВСЕМ required_skills
    suitable_managers = []
    for manager in office_managers:
        skills = manager.get('Навыки', [])
        position = manager.get('Должность ', '')
        
        meets_requirements = True
        if 'VIP' in required_skills and 'VIP' not in skills:
            meets_requirements = False
        if 'DATA_CHANGE' in required_skills and 'Главный специалист' not in position:
            meets_requirements = False
        if 'KZ' in required_skills and 'KZ' not in skills:
            meets_requirements = False
        if 'ENG' in required_skills and 'ENG' not in skills:
            meets_requirements = False
            
        if meets_requirements:
            suitable_managers.append(manager)
            
    if not suitable_managers:
        return None
        
    # Сортируем по нагрузке и берём топ-2
    suitable_managers.sort(key=lambda x: x.get('Количество обращений в работе', 0))
    top_2_managers = suitable_managers[:2]
    
    # Если их 2 и нагрузка одинаковая, берем первого (менее загруженные окажутся первыми)
    # При следующем запросе нагрузка первого вырастет, и он уйдет на второе место — это и есть Round Robin
    manager = top_2_managers[0]
    return manager

def update_round_robin_queue(*args, **kwargs):
    # Pass as queuing is now fully dynamic based on load
    pass

def find_best_manager_for_ticket(ticket_data: Dict[str, Any], enriched_data: Dict[str, Any]) -> Dict[str, Any]:
    """Находит лучшего менеджера для тикета"""
    global MANAGERS
    
    if not MANAGERS:
        return None
    
    client_coords = enriched_data.get('coordinates')
    client_address = ticket_data.get('address')
    ticket_type = enriched_data.get('ticket_type', '')
    segment = ticket_data.get('segment')
    language = enriched_data.get('language', 'ru')
    
    print(f"\n  🔍 Поиск менеджера для тикета:")
    print(f"     Сегмент: {segment}, Тип: {ticket_type}, Язык: {language}")
    
    required_skills = []
    
    if segment in ['VIP', 'Priority']:
        required_skills.append('VIP')
        print(f"     ✅ Требуется VIP навык")
    
    if ticket_type == 'Смена данных':
        required_skills.append('DATA_CHANGE')
        print(f"     ✅ Требуется Главный специалист")
    
    if language == 'kz':
        required_skills.append('KZ')
        print(f"     ✅ Требуется KZ язык")
    elif language == 'en':
        required_skills.append('ENG')
        print(f"     ✅ Требуется ENG язык")
    
    selected_office = None
    
    if client_coords and is_in_kazakhstan(client_address or ''):
        print(f"     🌍 Клиент в Казахстане, ищем ближайший офис...")
        selected_office = find_nearest_office(client_coords)
        if selected_office:
            selected_office['assignment_reason'] = 'nearest_office'
            print(f"     ✅ Ближайший офис: {selected_office['Офис']} ({selected_office.get('distance_km', '?')} км)")
    else:
        print(f"     🌍 Иностранный клиент или нет адреса, распределяем 50/50...")
        selected_office = select_office_for_foreign_client()
        if selected_office:
            print(f"     ✅ Выбран офис: {selected_office['Офис']} (50/50 распределение)")
    
    if not selected_office:
        print(f"     ❌ Не удалось выбрать офис")
        return None
    
    office_name = selected_office['Офис']
    
    selected_manager = get_manager_by_round_robin(office_name, required_skills)
    
    if selected_manager:
        print(f"     ✅ Итоговое назначение: {selected_manager['ФИО']} в {office_name}")
        return {
            'manager': selected_manager,
            'office': selected_office,
            'reason': selected_office.get('assignment_reason', 'standard'),
            'required_skills': required_skills
        }
    
    # If no one is found (the warning was already printed above)
    print(f"     ❌ Назначение на менеджера невозможно (нет подходящего сотрудника)")
    return None

class GoogleAIClient:
    """Клиент для работы с Google Gemini API"""
    
    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url
    
    def detect_language_simple(self, text: str) -> str:
        """Простое определение языка"""
        kazakh_pattern = re.compile(r'[әіңғүұқөһӘІҢҒҮҰҚӨҺ]')
        english_words = ['hello', 'dear', 'please', 'thank', 'would', 'could']
        
        text_lower = text.lower()
        
        if kazakh_pattern.search(text):
            return 'kz'
        
        for word in english_words:
            if word in text_lower:
                return 'en'
        
        return 'ru'
    
    def detect_priority_keywords(self, text: str) -> Optional[int]:
        """Определение приоритета по ключевым словам (1-10 шкала)"""
        text_lower = text.lower()
        
        urgent_words = [
            'срочно', 'немедленно', 'быстро', 'срочный', 'срочная',
            '!!!', '❗', '⚠️', '🔥', '💢',
            'блокировка', 'заблокирован', 'критично',
            'urgent', 'asap', 'immediately', 'emergency',
            'шұғыл', 'тез', 'асығыс'
        ]
        
        high_words = [
            'важно', 'важный', 'проблема', 'ошибка', 'не работает',
            'деньги', 'потерял', 'пропали', 'доступ', 'пароль',
            'important', 'problem', 'error', 'broken',
            'маңызды', 'қате', 'бұзылған'
        ]
        
        for word in urgent_words:
            if word in text_lower:
                return 1
        
        for word in high_words:
            if word in text_lower:
                return 3
        
        return None
    
    async def enrich(self, text: str, address: str = None) -> Dict[str, Any]:
        """Обогащение данных через Google Gemini API"""
        try:
            priority_hint = self.detect_priority_keywords(text)
            simple_lang = self.detect_language_simple(text)
            
            prompt = f"""Ты - AI ассистент для обработки обращений в службу поддержки финансовой компании в Казахстане.

Проанализируй текст обращения клиента и верни ТОЛЬКО JSON без дополнительного текста.

Тип обращения (строго из списка):
- Жалоба: клиент недоволен, жалуется на сервис
- Смена данных: смена номера, адреса, персональных данных
- Консультация: вопросы как что работает, как сделать
- Претензия: официальная претензия, требования вернуть деньги
- Неработоспособность приложения: приложение не работает, ошибки
- Мошеннические действия: подозрения на мошенничество
- Спам: реклама, рассылки

Приоритетность: целое число от 1 до 10, где:
- 1-2: критическая срочность (блокировка, мошенничество, угрозы судом)
- 3-4: высокая срочность (деньги не пришли, доступ потерян)
- 5-6: средняя (обычные вопросы, консультации)
- 7-8: низкая (информационные запросы)
- 9-10: минимальная (спам, благодарности)

Тональность:
- negative: клиент зол, кричит, угрожает
- positive: благодарит, хвалит
- neutral: спокойный тон, вежливый вопрос

Поля JSON:
- ticket_type: тип обращения
- summary: краткая суть (макс 150 символов)
- sentiment: positive/neutral/negative
- priority: целое число от 1 до 10
- keywords: список ключевых слов (макс 3)
- language: ru/kz/en
- is_spam: true/false
- suggested_action: call_back/email_reply/urgent_review/standard_review

Текст обращения: {text}
"""
            
            if address:
                prompt += f"\nАдрес клиента: {address}"
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/models/{AI_MODEL}:generateContent",
                    params={"key": self.api_key},
                    json={
                        "contents": [{
                            "parts": [{"text": prompt}]
                        }],
                        "generationConfig": {
                            "temperature": 0.1,
                            "topK": 1,
                            "topP": 1,
                            "maxOutputTokens": 500,
                        }
                    }
                )
                
                if response.status_code != 200:
                    print(f"Google AI API Error: {response.status_code}")
                    return self._fallback_enrich(text, address, simple_lang, priority_hint)
                
                result = response.json()
                
                try:
                    candidate = result.get("candidates", [{}])[0]
                    content = candidate.get("content", {})
                    parts = content.get("parts", [{}])
                    response_text = parts[0].get("text", "{}")
                    
                    response_text = response_text.replace("```json", "").replace("```", "").strip()
                    enriched_data = json.loads(response_text)
                    
                    ai_priority = enriched_data.get("priority", 5)
                    try:
                        ai_priority = int(ai_priority)
                    except (ValueError, TypeError):
                        ai_priority = 5
                    if priority_hint is not None:
                        enriched_data["priority"] = priority_hint
                    else:
                        enriched_data["priority"] = max(1, min(10, ai_priority))
                    
                    ai_lang = enriched_data.get("language", "")
                    if ai_lang not in ["ru", "kz", "en"]:
                        enriched_data["language"] = simple_lang
                    
                    summary = enriched_data.get("summary", "")
                    if "рекомендация" not in summary.lower():
                        priority = enriched_data.get("priority", "medium")
                        if priority == "urgent":
                            enriched_data["summary"] = summary + " Рекомендация: срочно связаться"
                        elif priority == "high":
                            enriched_data["summary"] = summary + " Рекомендация: приоритетно"
                        else:
                            enriched_data["summary"] = summary + " Рекомендация: стандартно"
                    
                    if address and "coordinates" not in enriched_data:
                        enriched_data["coordinates"] = get_address_coordinates(address)
                        print(f"  🗺️ Координаты определены: {enriched_data['coordinates']}")
                    
                    return enriched_data
                    
                except Exception as e:
                    print(f"Error parsing Gemini response: {e}")
                    return self._fallback_enrich(text, address, simple_lang, priority_hint)
                    
        except Exception as e:
            print(f"Google AI API Error: {e}")
            return self._fallback_enrich(text, address)
    
    def _fallback_enrich(self, text: str, address: str = None, forced_lang: str = None, forced_priority: str = None) -> Dict[str, Any]:
        """Резервный метод"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ["спам", "реклама", "купите", "предложение"]):
            ticket_type = "Спам"
        elif any(word in text_lower for word in ["мошенник", "взлом", "фишинг"]):
            ticket_type = "Мошеннические действия"
        elif any(word in text_lower for word in ["смена", "изменить", "номер", "телефон"]):
            ticket_type = "Смена данных"
        elif any(word in text_lower for word in ["приложение", "не работает", "вылетает", "ошибка"]):
            ticket_type = "Неработоспособность приложения"
        elif any(word in text_lower for word in ["жалоба", "недоволен", "плохо", "ужасно"]):
            ticket_type = "Жалоба"
        elif any(word in text_lower for word in ["претензия", "верните", "суд", "подам"]):
            ticket_type = "Претензия"
        else:
            ticket_type = "Консультация"
        
        if forced_priority is not None:
            priority = int(forced_priority)
        else:
            base_prio = {
                "Спам": 10,
                "Мошеннические действия": 2,
                "Смена данных": 6,
                "Неработоспособность приложения": 3,
                "Жалоба": 4,
                "Претензия": 2,
                "Консультация": 8
            }.get(ticket_type, 5)
            
            offset = (len(text) % 5) - 2 # Gives -2, -1, 0, 1, 2
            priority = max(1, min(10, base_prio + offset))
            
            keyword_prio = self.detect_priority_keywords(text)
            if keyword_prio:
                priority = min(priority, keyword_prio)
        
        if forced_lang:
            language = forced_lang
        else:
            language = self.detect_language_simple(text)
        
        sentiment = "neutral"
        
        negative_indicators = ["!!!", "крик", "зол", "злой", "бесит", "мошенник", "верните деньги", "суд"]
        positive_indicators = ["спасибо", "благодарю", "отлично", "прекрасно", "хорошо"]
        
        for word in negative_indicators:
            if word in text_lower:
                sentiment = "negative"
                break
        
        if sentiment == "neutral":
            for word in positive_indicators:
                if word in text_lower:
                    sentiment = "positive"
                    break
        
        summary = text[:100] + "..." if len(text) > 100 else text
        
        if isinstance(priority, int):
            if priority <= 2:
                suggested_action = "urgent_review"
            elif priority <= 4:
                suggested_action = "call_back"
            elif priority <= 7:
                suggested_action = "email_reply"
            else:
                suggested_action = "standard_review"
        else:
            suggested_action = "standard_review"
        
        result = {
            "ticket_type": ticket_type,
            "summary": summary,
            "sentiment": sentiment,
            "priority": priority,
            "keywords": [],
            "language": language,
            "is_spam": ticket_type == "Спам",
            "suggested_action": suggested_action
        }
        
        if address:
            result["coordinates"] = get_address_coordinates(address)
            print(f"  🗺️ Координаты определены (fallback): {result['coordinates']}")
        
        return result

ai_client = GoogleAIClient(api_key=YOUR_API_KEY, base_url=AI_API_BASE_URL)

class TicketStatus(str, Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

# Priority is now an integer 1-10 (no enum)

class TicketType(str, Enum):
    COMPLAINT = "Жалоба"
    DATA_CHANGE = "Смена данных"
    CONSULTATION = "Консультация"
    CLAIM = "Претензия"
    APP_ISSUE = "Неработоспособность приложения"
    FRAUD = "Мошеннические действия"
    SPAM = "Спам"

class TicketCreate(BaseModel):
    client_guid: str
    description: str
    segment: Optional[str] = None
    address: Optional[str] = None
    attachments: Optional[List[str]] = None

class TicketResponse(BaseModel):
    id: str
    client_guid: str
    description: str
    status: TicketStatus
    priority: int  # 1-10 scale
    ticket_type: TicketType
    summary: str
    sentiment: str
    language: str
    is_spam: bool
    suggested_action: str
    assigned_manager: Optional[str] = None
    assigned_office: Optional[str] = None
    assignment_reason: Optional[str] = None
    distance_to_office: Optional[float] = None
    required_skills: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime
    enriched_data: Dict[str, Any]

class TicketStore:
    def __init__(self):
        self.tickets = {}
        self.queue = []
    
    def add(self, ticket: Dict[str, Any]):
        self.tickets[ticket['id']] = ticket
        priority_value = ticket.get('priority', 5)  # 1-10 int, lower = more urgent
        heapq.heappush(self.queue, (priority_value, ticket['created_at'], ticket['id']))
    
    def get(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        return self.tickets.get(ticket_id)
    
    def get_next(self) -> Optional[Dict[str, Any]]:
        if self.queue:
            _, _, ticket_id = heapq.heappop(self.queue)
            return self.tickets.get(ticket_id)
        return None
    
    def update(self, ticket_id: str, data: Dict[str, Any]):
        if ticket_id in self.tickets:
            self.tickets[ticket_id].update(data)
    
    def list(self) -> List[Dict[str, Any]]:
        return list(self.tickets.values())

ticket_store = TicketStore()
app = FastAPI(title="Smart Assignment Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js default port
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # OPTIONS обязателен
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
)

@app.get("/")
async def root():
    return {
        "name": "F.I.R.E. — Freedom Intelligent Routing Engine",
        "version": "1.0.0",
        "status": "running",
        "offices": len(BUSINESS_UNITS),
        "managers": len(MANAGERS),
        "db_connected": db_pool is not None
    }

@app.post("/api/seed")
async def seed_tickets():
    """Обработать все тикеты из datasets.json через AI и сохранить"""
    try:
        with open('datasets.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        raw_tickets = data.get('tickets', [])
        processed = 0
        errors = 0
        
        for i, t in enumerate(raw_tickets):
            try:
                description = t.get('Описание ', '') or t.get('Описание', '') or ''
                if not description and t.get('Вложения'):
                    description = 'Обращение без текста (только вложение)'
                elif not description:
                    continue
                
                segment = t.get('Сегмент клиента', 'Mass')
                address_parts = [p for p in [
                    t.get('Страна', ''), t.get('Область', ''),
                    t.get('Населённый пункт', ''), t.get('Улица', ''),
                    str(t.get('Дом', '')) if t.get('Дом') else ''
                ] if p]
                address = ', '.join(address_parts)
                
                print(f"\n📝 [{i+1}/{len(raw_tickets)}] {t.get('GUID клиента', '?')[:8]}...")
                
                enriched = await ai_client.enrich(text=description, address=address)
                
                now = datetime.now()
                ticket_id = str(uuid.uuid4())
                
                new_ticket = {
                    "id": ticket_id,
                    "client_guid": t.get('GUID клиента', str(uuid.uuid4())),
                    "description": description,
                    "segment": segment,
                    "address": address,
                    "attachments": [t['Вложения']] if t.get('Вложения') else [],
                    "status": TicketStatus.NEW,
                    "priority": enriched.get("priority", 5),
                    "ticket_type": enriched.get("ticket_type", TicketType.CONSULTATION),
                    "summary": enriched.get("summary", ""),
                    "sentiment": enriched.get("sentiment", "neutral"),
                    "language": enriched.get("language", "ru"),
                    "is_spam": enriched.get("is_spam", False),
                    "suggested_action": enriched.get("suggested_action", "standard_review"),
                    "assigned_manager": None, "assigned_office": None,
                    "assignment_reason": None, "distance_to_office": None,
                    "required_skills": None,
                    "created_at": now, "updated_at": now,
                    "enriched_data": enriched
                }
                
                assignment = find_best_manager_for_ticket(
                    {"segment": segment, "address": address}, enriched
                )
                if assignment:
                    new_ticket["assigned_manager"] = assignment['manager']['ФИО']
                    new_ticket["assigned_office"] = assignment['office']['Офис']
                    new_ticket["assignment_reason"] = assignment['reason']
                    new_ticket["distance_to_office"] = assignment['office'].get('distance_km')
                    new_ticket["required_skills"] = assignment.get('required_skills', [])
                    mgr = assignment['manager']
                    new_load = mgr.get('Количество обращений в работе', 0) + 1
                    for j, m in enumerate(MANAGERS):
                        if m['ФИО'] == mgr['ФИО']:
                            MANAGERS[j]['Количество обращений в работе'] = new_load
                            break
                    await update_manager_load_in_db(mgr['ФИО'], new_load)
                
                ticket_store.add(new_ticket)
                await save_ticket_to_db(new_ticket)
                processed += 1
                print(f"  ✅ {enriched.get('ticket_type','?')} | p={enriched.get('priority','?')} | → {new_ticket.get('assigned_manager','—')}")
                await asyncio.sleep(0.3)
            except Exception as e:
                errors += 1
                print(f"  ❌ Ошибка: {e}")
        
        return {"success": True, "processed": processed, "total": len(raw_tickets), "errors": errors}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tickets", response_model=TicketResponse)
async def create_ticket(ticket: TicketCreate):
    ticket_id = str(uuid.uuid4())
    now = datetime.now()
    
    enriched = await ai_client.enrich(
        text=ticket.description,
        address=ticket.address
    )
    
    new_ticket = {
        "id": ticket_id,
        "client_guid": ticket.client_guid,
        "description": ticket.description,
        "segment": ticket.segment,
        "address": ticket.address,
        "attachments": ticket.attachments or [],
        "status": TicketStatus.NEW,
        "priority": enriched.get("priority", 5),
        "ticket_type": enriched.get("ticket_type", TicketType.CONSULTATION),
        "summary": enriched.get("summary", ""),
        "sentiment": enriched.get("sentiment", "neutral"),
        "language": enriched.get("language", "ru"),
        "is_spam": enriched.get("is_spam", False),
        "suggested_action": enriched.get("suggested_action", "standard_review"),
        "assigned_manager": None,
        "assigned_office": None,
        "assignment_reason": None,
        "distance_to_office": None,
        "required_skills": None,
        "created_at": now,
        "updated_at": now,
        "enriched_data": enriched
    }
    
    manager_assignment = find_best_manager_for_ticket(
        ticket_data={
            "segment": ticket.segment,
            "address": ticket.address
        },
        enriched_data=enriched
    )
    
    if manager_assignment:
        new_ticket["assigned_manager"] = manager_assignment['manager']['ФИО']
        new_ticket["assigned_office"] = manager_assignment['office']['Офис']
        new_ticket["assignment_reason"] = manager_assignment['reason']
        new_ticket["distance_to_office"] = manager_assignment['office'].get('distance_km')
        new_ticket["required_skills"] = manager_assignment.get('required_skills', [])
        
        old_manager = manager_assignment['manager']
        updated_manager = old_manager.copy()
        updated_manager['Количество обращений в работе'] = old_manager.get('Количество обращений в работе', 0) + 1
        
        for i, m in enumerate(MANAGERS):
            if m['ФИО'] == old_manager['ФИО']:
                MANAGERS[i] = updated_manager
                break
        
        office = manager_assignment['office']['Офис']
        required_skills = manager_assignment.get('required_skills', [])
    
    ticket_store.add(new_ticket)
    
    # Persist to PostgreSQL
    await save_ticket_to_db(new_ticket)
    if manager_assignment:
        mgr_fio = manager_assignment['manager']['ФИО']
        new_load = updated_manager.get('Количество обращений в работе', 0)
        await update_manager_load_in_db(mgr_fio, new_load)
    
    return new_ticket

@app.get("/api/tickets/{ticket_id}", response_model=TicketResponse)
async def get_ticket(ticket_id: str):
    ticket = ticket_store.get(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@app.get("/api/tickets")
async def list_tickets(skip: int = 0, limit: int = 100):
    # Try DB first, fallback to in-memory
    if db_pool:
        db_tickets = await get_all_tickets_from_db()
        if db_tickets:
            return db_tickets[skip:skip + limit]
    tickets = ticket_store.list()
    return tickets[skip:skip + limit]

@app.post("/api/tickets/next")
async def get_next_ticket():
    ticket = ticket_store.get_next()
    if not ticket:
        raise HTTPException(status_code=404, detail="No tickets in queue")
    
    ticket["status"] = TicketStatus.IN_PROGRESS
    ticket["updated_at"] = datetime.now()
    ticket_store.update(ticket["id"], ticket)
    return ticket

@app.get("/api/offices/nearby")
async def find_nearby_offices(address: str):
    if not address:
        raise HTTPException(status_code=400, detail="Address is required")
    
    coords = get_address_coordinates(address)
    nearest = find_nearest_office(coords)
    
    if not nearest:
        raise HTTPException(status_code=404, detail="No offices found")
    
    offices_with_distance = []
    for office in BUSINESS_UNITS:
        office_coords = office.get('coordinates')
        if office_coords:
            distance = calculate_distance(coords, office_coords)
            offices_with_distance.append({
                **office,
                'distance_km': round(distance, 1)
            })
    
    offices_with_distance.sort(key=lambda x: x['distance_km'])
    
    return {
        'client_coordinates': coords,
        'nearest_office': nearest,
        'all_offices': offices_with_distance[:10]
    }

@app.get("/api/stats/offices")
async def get_office_statistics():
    office_stats = defaultdict(lambda: {
        'total_managers': 0,
        'total_load': 0,
        'avg_load': 0,
        'managers': []
    })
    
    for manager in MANAGERS:
        office = manager.get('Офис', 'Unknown')
        load = manager.get('Количество обращений в работе', 0)
        
        office_stats[office]['total_managers'] += 1
        office_stats[office]['total_load'] += load
        office_stats[office]['managers'].append({
            'name': manager['ФИО'],
            'load': load,
            'skills': manager.get('Навыки', []),
            'position': manager.get('Должность ', '')
        })
    
    result = []
    for office in BUSINESS_UNITS:
        office_name = office['Офис']
        stats = office_stats[office_name]
        
        result.append({
            'office': office_name,
            'address': office['Адрес'],
            'coordinates': office.get('coordinates'),
            'total_managers': stats['total_managers'],
            'total_load': stats['total_load'],
            'avg_load': stats['total_load'] / stats['total_managers'] if stats['total_managers'] > 0 else 0,
            'managers': stats['managers']
        })
    
    return result

@app.get("/api/stats/assignments")
async def get_assignment_statistics():
    tickets = ticket_store.list()
    
    stats = {
        'total_tickets': len(tickets),
        'by_office': defaultdict(int),
        'by_reason': defaultdict(int),
        'by_priority': defaultdict(int),
        'by_type': defaultdict(int),
        'by_segment': defaultdict(int),
        'by_required_skills': defaultdict(int),
        'round_robin_stats': dict(assignment_history)
    }
    
    for ticket in tickets:
        stats['by_office'][ticket.get('assigned_office', 'Unassigned')] += 1
        stats['by_reason'][ticket.get('assignment_reason', 'unknown')] += 1
        stats['by_priority'][ticket.get('priority', 'unknown')] += 1
        stats['by_type'][ticket.get('ticket_type', 'unknown')] += 1
        stats['by_segment'][ticket.get('segment', 'unknown')] += 1
        
        required_skills = ticket.get('required_skills', [])
        for skill in required_skills:
            stats['by_required_skills'][skill] += 1
    
    return stats

@app.get("/api/stats/round-robin")
async def get_round_robin_stats():
    result = {}
    
    for office, skills in round_robin_queues.items():
        result[office] = {}
        for skill, queue in skills.items():
            result[office][skill] = {
                'managers': [m['ФИО'] for m in queue],
                'assignments': assignment_history.get(office, {}).get(skill, 0)
            }
    
    return result

# Добавьте эти эндпоинты в main.py после существующих

@app.get("/api/managers", response_model=List[Dict[str, Any]])
async def get_all_managers():
    """Получить список всех менеджеров"""
    return MANAGERS

@app.get("/api/managers/{manager_id}", response_model=Dict[str, Any])
async def get_manager_by_id(manager_id: str):
    """Получить менеджера по ID (фио)"""
    for manager in MANAGERS:
        if manager.get('ФИО') == manager_id or manager.get('id') == manager_id:
            return manager
    raise HTTPException(status_code=404, detail="Manager not found")

@app.get("/api/managers/load", response_model=List[Dict[str, Any]])
async def get_managers_load():
    """Получить загрузку менеджеров"""
    return [
        {
            "managerId": m.get('ФИО'),
            "load": m.get('Количество обращений в работе', 0)
        }
        for m in MANAGERS
    ]

@app.get("/api/business-units", response_model=List[Dict[str, Any]])
async def get_business_units():
    """Получить список всех офисов"""
    return BUSINESS_UNITS

@app.get("/api/geo-data")
async def get_geo_data():
    """Получить геоданные для тикетов"""
    tickets = ticket_store.list()
    geo_data = []
    
    for ticket in tickets:
        enriched = ticket.get('enriched_data', {})
        coords = enriched.get('coordinates')
        if coords:
            geo_data.append({
                "ticketId": ticket['id'],
                "coordinates": [coords.get('lat', 0), coords.get('lon', 0)],
                "type": ticket.get('ticket_type', 'unknown'),
                "priority": ticket.get('priority', 'medium')
            })
    
    return geo_data

# Добавьте Pydantic модель для DashboardFilters, если её нет
class DashboardFilters(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    office: Optional[str] = None
    priority: Optional[str] = None
    type: Optional[str] = None

@app.post("/api/tickets/upload")
async def upload_csv(file: UploadFile = File(...)):
    """Загрузка CSV файла с данными"""
    try:
        # Читаем файл с определением кодировки
        contents = await file.read()
        
        # Определяем кодировку
        encoding_result = chardet.detect(contents)
        encoding = encoding_result['encoding'] or 'utf-8'
        print(f"📄 Определена кодировка файла: {encoding}")
        
        # Декодируем содержимое
        csv_data = contents.decode(encoding, errors='ignore')
        
        # Пробуем разные разделители
        delimiters = [',', ';', '\t', '|']
        csv_reader = None
        used_delimiter = None
        
        # Проверяем начало файла для определения разделителя
        sample = csv_data[:1000]
        
        for delimiter in delimiters:
            try:
                reader = csv.DictReader(StringIO(sample), delimiter=delimiter)
                # Пробуем прочитать первую строку
                next(reader)
                csv_reader = csv.DictReader(StringIO(csv_data), delimiter=delimiter)
                used_delimiter = delimiter
                print(f"📊 Используется разделитель: '{delimiter}'")
                break
            except:
                continue
        
        if not csv_reader:
            # Если ничего не подошло, используем стандартный с автоопределением
            csv_reader = csv.DictReader(StringIO(csv_data))
            used_delimiter = 'auto'
            print(f"📊 Используется автоопределение разделителя")
        
        tickets_created = 0
        managers_updated = 0
        business_units_updated = 0
        
        # Приводим названия колонок к нижнему регистру и убираем пробелы
        fieldnames = [col.strip().lower() for col in csv_reader.fieldnames]
        print(f"📋 Найдены колонки: {fieldnames}")
        
        rows = list(csv_reader)
        print(f"📊 Всего строк в CSV: {len(rows)}")
        
        for i, row in enumerate(rows):
            try:
                # Приводим ключи к нижнему регистру
                row_lower = {k.strip().lower(): v for k, v in row.items()}
                
                # Проверяем, есть ли обязательные поля для разных типов данных
                has_client_fields = any(k in row_lower for k in ['client_guid', 'clientguid', 'client guid', 'guid'])
                has_description = any(k in row_lower for k in ['description', 'описание', 'text', 'текст'])
                has_manager_fields = any(k in row_lower for k in ['фио', 'fio', 'fullname', 'name'])
                has_unit_fields = any(k in row_lower for k in ['офис', 'office', 'businessunit', 'business unit'])
                
                if has_client_fields or has_description:
                    # Это тикет - вызываем вспомогательную функцию
                    ticket = await process_csv_ticket_row(row_lower)  # 👈 await здесь обязателен!
                    if ticket:
                        ticket_store.add(ticket)
                        tickets_created += 1
                        print(f"  ✅ Создан тикет {i+1}: {ticket.get('id')}")
                
                elif has_manager_fields:
                    # Это менеджер
                    manager = process_csv_manager_row(row_lower)
                    if manager:
                        # Обновляем или добавляем менеджера
                        found = False
                        for j, m in enumerate(MANAGERS):
                            if m['ФИО'] == manager['ФИО']:
                                MANAGERS[j] = manager
                                found = True
                                break
                        
                        if not found:
                            MANAGERS.append(manager)
                        
                        managers_updated += 1
                        print(f"  ✅ Обновлен менеджер {i+1}: {manager.get('ФИО')}")
                
                elif has_unit_fields:
                    # Это офис
                    unit = process_csv_unit_row(row_lower)
                    if unit:
                        # Обновляем или добавляем офис
                        found = False
                        for j, u in enumerate(BUSINESS_UNITS):
                            if u['Офис'] == unit['Офис']:
                                BUSINESS_UNITS[j] = unit
                                found = True
                                break
                        
                        if not found:
                            BUSINESS_UNITS.append(unit)
                        
                        business_units_updated += 1
                        print(f"  ✅ Обновлен офис {i+1}: {unit.get('Офис')}")
            
            except Exception as e:
                print(f"❌ Ошибка обработки строки {i+1}: {e}")
                continue
        
        # Переинициализируем Round Robin очереди после обновления менеджеров
        if managers_updated > 0:
            initialize_round_robin_queues()
            print("🔄 Round Robin очереди переинициализированы")
        
        result = {
            "success": True,
            "message": f"Загружено: {tickets_created} тикетов, {managers_updated} менеджеров, {business_units_updated} офисов",
            "ticketsCount": tickets_created,
            "managersCount": managers_updated,
            "businessUnitsCount": business_units_updated
        }
        
        print("✅ CSV загрузка завершена:", result)
        return result
        
    except Exception as e:
        print(f"❌ Ошибка при загрузке CSV: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Ошибка при загрузке CSV: {str(e)}")

# ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ CSV (ДОБАВЬТЕ ПОСЛЕ ЭНДПОИНТА) ==========

async def process_csv_ticket_row(row: dict) -> Optional[Dict[str, Any]]:
    """Обработка строки CSV как тикета"""
    try:
        # Ищем нужные поля
        client_guid = (
            row.get('client_guid') or 
            row.get('clientguid') or 
            row.get('client guid') or 
            row.get('guid') or 
            str(uuid.uuid4())
        )
        
        description = (
            row.get('description') or 
            row.get('описание') or 
            row.get('text') or 
            row.get('текст') or 
            ''
        )
        
        segment = (
            row.get('segment') or 
            row.get('сегмент') or 
            'Mass'
        )
        
        address = (
            row.get('address') or 
            row.get('адрес') or 
            row.get('fulladdress') or 
            ''
        )
        
        if not description:
            return None
        
        # Обогащаем данные через AI
        enriched = await ai_client.enrich(
            text=description,
            address=address
        )
        
        now = datetime.now()
        
        new_ticket = {
            "id": str(uuid.uuid4()),
            "client_guid": client_guid,
            "description": description,
            "segment": segment,
            "address": address,
            "attachments": [],
            "status": TicketStatus.NEW,
            "priority": enriched.get("priority", 5),
            "ticket_type": enriched.get("ticket_type", TicketType.CONSULTATION),
            "summary": enriched.get("summary", ""),
            "sentiment": enriched.get("sentiment", "neutral"),
            "language": enriched.get("language", "ru"),
            "is_spam": enriched.get("is_spam", False),
            "suggested_action": enriched.get("suggested_action", "standard_review"),
            "assigned_manager": None,
            "assigned_office": None,
            "assignment_reason": None,
            "distance_to_office": None,
            "required_skills": None,
            "created_at": now,
            "updated_at": now,
            "enriched_data": enriched
        }
        
        # Назначаем менеджера
        manager_assignment = find_best_manager_for_ticket(
            ticket_data={
                "segment": segment,
                "address": address
            },
            enriched_data=enriched
        )
        
        if manager_assignment:
            new_ticket["assigned_manager"] = manager_assignment['manager']['ФИО']
            new_ticket["assigned_office"] = manager_assignment['office']['Офис']
            new_ticket["assignment_reason"] = manager_assignment['reason']
            new_ticket["distance_to_office"] = manager_assignment['office'].get('distance_km')
            new_ticket["required_skills"] = manager_assignment.get('required_skills', [])
            
            # Обновляем нагрузку менеджера
            for i, m in enumerate(MANAGERS):
                if m['ФИО'] == manager_assignment['manager']['ФИО']:
                    MANAGERS[i]['Количество обращений в работе'] = \
                        MANAGERS[i].get('Количество обращений в работе', 0) + 1
                    break
        
        # Persist to PostgreSQL
        await save_ticket_to_db(new_ticket)
        if manager_assignment:
            mgr_fio = manager_assignment['manager']['ФИО']
            for m in MANAGERS:
                if m['ФИО'] == mgr_fio:
                    await update_manager_load_in_db(mgr_fio, m.get('Количество обращений в работе', 0))
                    break
        
        return new_ticket
        
    except Exception as e:
        print(f"❌ Ошибка обработки тикета: {e}")
        return None

def process_csv_manager_row(row: dict) -> Optional[Dict[str, Any]]:
    """Обработка строки CSV как менеджера"""
    try:
        fio = (
            row.get('фио') or 
            row.get('fio') or 
            row.get('fullname') or 
            row.get('name') or 
            ''
        )
        
        if not fio:
            return None
        
        position = (
            row.get('должность') or 
            row.get('position') or 
            row.get('role') or 
            'Специалист'
        )
        
        # Обработка навыков (могут быть строкой через запятую или список)
        skills_raw = row.get('навыки') or row.get('skills') or ''
        if isinstance(skills_raw, str):
            skills = [s.strip() for s in skills_raw.split(',') if s.strip()]
        else:
            skills = skills_raw or []
        
        office = (
            row.get('офис') or 
            row.get('office') or 
            row.get('businessunit') or 
            row.get('business unit') or 
            'Астана'
        )
        
        load = 0
        load_val = row.get('количество обращений в работе') or row.get('load') or row.get('currentload')
        if load_val:
            try:
                load = int(float(str(load_val).strip()))
            except:
                load = 0
        
        return {
            "ФИО": fio,
            "Должность ": position,
            "Навыки": skills,
            "Офис": office,
            "Количество обращений в работе": load
        }
        
    except Exception as e:
        print(f"❌ Ошибка обработки менеджера: {e}")
        return None

def process_csv_unit_row(row: dict) -> Optional[Dict[str, Any]]:
    """Обработка строки CSV как офиса"""
    try:
        office = (
            row.get('офис') or 
            row.get('office') or 
            row.get('businessunit') or 
            row.get('business unit') or 
            row.get('name') or 
            ''
        )
        
        if not office:
            return None
        
        address = (
            row.get('адрес') or 
            row.get('address') or 
            ''
        )
        
        return {
            "Офис": office,
            "Адрес": address,
            "coordinates": get_city_coordinates(office)
        }
        
    except Exception as e:
        print(f"❌ Ошибка обработки офиса: {e}")
        return None

    

@app.on_event("startup")
async def startup_event():
    global db_pool, BUSINESS_UNITS, MANAGERS
    print("="*70)
    print("🚀 SMART ASSIGNMENT ENGINE STARTED")
    print("="*70)

    # ---------- PostgreSQL ----------
    if DATABASE_URL:
        try:
            print("⏳ Идет подключение к PostgreSQL...")
            # Use asyncio.wait_for to prevent infinite hanging if port is blocked
            db_pool = await asyncio.wait_for(
                asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5, ssl="require"),
                timeout=10.0
            )
            print("✅ Подключено к PostgreSQL")

            async with db_pool.acquire() as conn:
                # Create tables
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS tickets (
                        id UUID PRIMARY KEY,
                        client_guid VARCHAR(255),
                        description TEXT,
                        segment VARCHAR(20),
                        address TEXT,
                        attachments TEXT[],
                        status VARCHAR(20) DEFAULT 'new',
                        priority INTEGER DEFAULT 5,
                        ticket_type VARCHAR(50),
                        summary TEXT,
                        sentiment VARCHAR(20),
                        language VARCHAR(10) DEFAULT 'ru',
                        is_spam BOOLEAN DEFAULT FALSE,
                        suggested_action VARCHAR(50),
                        assigned_manager VARCHAR(100),
                        assigned_office VARCHAR(100),
                        assignment_reason VARCHAR(100),
                        distance_to_office FLOAT,
                        required_skills TEXT[],
                        enriched_data JSONB,
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW()
                    );

                    CREATE TABLE IF NOT EXISTS managers (
                        id SERIAL PRIMARY KEY,
                        fio VARCHAR(100) UNIQUE,
                        position VARCHAR(50),
                        skills TEXT[],
                        office VARCHAR(100),
                        current_load INTEGER DEFAULT 0
                    );

                    CREATE TABLE IF NOT EXISTS business_units (
                        id SERIAL PRIMARY KEY,
                        office VARCHAR(100) UNIQUE,
                        address TEXT,
                        lat FLOAT,
                        lon FLOAT
                    );
                """)
                print("✅ Таблицы созданы/проверены")

                # Seed data if tables are empty
                mgr_count = await conn.fetchval("SELECT COUNT(*) FROM managers")
                bu_count = await conn.fetchval("SELECT COUNT(*) FROM business_units")

                if mgr_count == 0 or bu_count == 0:
                    print("📦 Таблицы пусты, загружаем из datasets.json...")
                    try:
                        with open('datasets.json', 'r', encoding='utf-8') as f:
                            data = json.load(f)

                        if bu_count == 0:
                            for unit in data.get('business_units', []):
                                coords = get_city_coordinates(unit['Офис'])
                                await conn.execute(
                                    "INSERT INTO business_units (office, address, lat, lon) VALUES ($1, $2, $3, $4) ON CONFLICT (office) DO NOTHING",
                                    unit['Офис'], unit['Адрес'], coords['lat'], coords['lon']
                                )
                            print(f"  ✅ Загружено {len(data.get('business_units', []))} офисов в БД")

                        if mgr_count == 0:
                            for mgr in data.get('managers', []):
                                await conn.execute(
                                    "INSERT INTO managers (fio, position, skills, office, current_load) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (fio) DO NOTHING",
                                    mgr['ФИО'], mgr.get('Должность ', ''), mgr.get('Навыки', []),
                                    mgr.get('Офис', ''), mgr.get('Количество обращений в работе', 0)
                                )
                            print(f"  ✅ Загружено {len(data.get('managers', []))} менеджеров в БД")
                    except Exception as e:
                        print(f"  ⚠️ Ошибка seed: {e}")

                # Load from DB into memory for Round Robin
                rows = await conn.fetch("SELECT * FROM business_units")
                BUSINESS_UNITS = []
                for r in rows:
                    BUSINESS_UNITS.append({
                        'Офис': r['office'],
                        'Адрес': r['address'],
                        'coordinates': {'lat': r['lat'], 'lon': r['lon']}
                    })

                rows = await conn.fetch("SELECT * FROM managers")
                MANAGERS = []
                for r in rows:
                    MANAGERS.append({
                        'ФИО': r['fio'],
                        'Должность ': r['position'],
                        'Навыки': list(r['skills']) if r['skills'] else [],
                        'Офис': r['office'],
                        'Количество обращений в работе': r['current_load']
                    })

        except Exception as e:
            print(f"❌ PostgreSQL Error: {e}")
            traceback.print_exc()
            print("⚠️ Falling back to in-memory mode")
    else:
        print("⚠️ DATABASE_URL не задан, используется in-memory режим")

    print(f"📊 Загружено офисов: {len(BUSINESS_UNITS)}")
    print(f"👥 Загружено менеджеров: {len(MANAGERS)}")
    print(f"📍 Офисы:")
    for office in BUSINESS_UNITS:
        print(f"   - {office['Офис']}: {office.get('Адрес', '')}")
    print("="*70)


@app.on_event("shutdown")
async def shutdown_event():
    global db_pool
    if db_pool:
        await db_pool.close()
        print("🔌 PostgreSQL pool closed")


# ---------- DB HELPER FUNCTIONS ----------
async def save_ticket_to_db(ticket: Dict[str, Any]):
    """Save ticket to PostgreSQL"""
    if not db_pool:
        return
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO tickets (id, client_guid, description, segment, address, attachments,
                    status, priority, ticket_type, summary, sentiment, language, is_spam,
                    suggested_action, assigned_manager, assigned_office, assignment_reason,
                    distance_to_office, required_skills, enriched_data, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20::jsonb, $21, $22)
                ON CONFLICT (id) DO UPDATE SET
                    priority=$8, assigned_manager=$15, assigned_office=$16,
                    assignment_reason=$17, updated_at=$22
            """,
                uuid.UUID(ticket['id']),
                ticket.get('client_guid', ''),
                ticket.get('description', ''),
                ticket.get('segment', 'Mass'),
                ticket.get('address', ''),
                ticket.get('attachments', []),
                str(ticket.get('status', 'new')),
                int(ticket.get('priority', 5)),
                str(ticket.get('ticket_type', 'Консультация')),
                ticket.get('summary', ''),
                ticket.get('sentiment', 'neutral'),
                ticket.get('language', 'ru'),
                ticket.get('is_spam', False),
                ticket.get('suggested_action', 'standard_review'),
                ticket.get('assigned_manager'),
                ticket.get('assigned_office'),
                ticket.get('assignment_reason'),
                ticket.get('distance_to_office'),
                ticket.get('required_skills', []),
                json.dumps(ticket.get('enriched_data', {}), ensure_ascii=False, default=str),
                ticket.get('created_at', datetime.now()),
                ticket.get('updated_at', datetime.now())
            )
    except Exception as e:
        print(f"❌ DB save ticket error: {e}")


async def update_manager_load_in_db(fio: str, new_load: int):
    """Update manager load in PostgreSQL"""
    if not db_pool:
        return
    try:
        async with db_pool.acquire() as conn:
            await conn.execute(
                "UPDATE managers SET current_load = $1 WHERE fio = $2",
                new_load, fio
            )
    except Exception as e:
        print(f"❌ DB update manager error: {e}")


async def get_all_tickets_from_db() -> List[Dict[str, Any]]:
    """Get all tickets from PostgreSQL"""
    if not db_pool:
        return []
    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM tickets ORDER BY priority ASC, created_at DESC")
            tickets = []
            for r in rows:
                ticket = dict(r)
                ticket['id'] = str(ticket['id'])
                ticket['enriched_data'] = ticket.get('enriched_data', {})
                tickets.append(ticket)
            return tickets
    except Exception as e:
        print(f"❌ DB get tickets error: {e}")
        return []