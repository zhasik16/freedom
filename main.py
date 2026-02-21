# main.py (полная версия с исправленным синтаксисом)
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import heapq
from enum import Enum
import httpx
import json
import asyncio
import re
import math
import random
from collections import defaultdict, deque

# ---------- КОНФИГУРАЦИЯ ДЛЯ GOOGLE GEMINI API ----------
YOUR_API_KEY = "AIzaSyDEUrHECahKcqd3wVw3SkWigpTu3WkuUY0"
AI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
AI_MODEL = "gemini-2.5-flash"

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
            initialize_round_robin_queues()
            return MANAGERS
    except Exception as e:
        print(f"❌ Ошибка загрузки менеджеров: {e}")
        return []

def initialize_round_robin_queues():
    """Инициализирует очереди Round Robin"""
    global round_robin_queues, assignment_history
    
    round_robin_queues.clear()
    assignment_history.clear()
    
    managers_by_office = defaultdict(list)
    for manager in MANAGERS:
        office = manager.get('Офис', 'Unknown')
        managers_by_office[office].append(manager)
    
    for office, managers in managers_by_office.items():
        vip_managers = [m for m in managers if 'VIP' in m.get('Навыки', [])]
        vip_managers.sort(key=lambda x: x.get('Количество обращений в работе', 0))
        for manager in vip_managers[:2]:
            round_robin_queues[office]['VIP'].append(manager)
        
        data_change_managers = [m for m in managers if 'Главный специалист' in m.get('Должность ', '')]
        data_change_managers.sort(key=lambda x: x.get('Количество обращений в работе', 0))
        for manager in data_change_managers[:2]:
            round_robin_queues[office]['DATA_CHANGE'].append(manager)
        
        kz_managers = [m for m in managers if 'KZ' in m.get('Навыки', [])]
        kz_managers.sort(key=lambda x: x.get('Количество обращений в работе', 0))
        for manager in kz_managers[:2]:
            round_robin_queues[office]['KZ'].append(manager)
        
        eng_managers = [m for m in managers if 'ENG' in m.get('Навыки', [])]
        eng_managers.sort(key=lambda x: x.get('Количество обращений в работе', 0))
        for manager in eng_managers[:2]:
            round_robin_queues[office]['ENG'].append(manager)
        
        all_special = (vip_managers[:2] + data_change_managers[:2] + 
                      kz_managers[:2] + eng_managers[:2])
        general_managers = [m for m in managers if m not in all_special]
        general_managers.sort(key=lambda x: x.get('Количество обращений в работе', 0))
        for manager in general_managers[:2]:
            round_robin_queues[office]['GENERAL'].append(manager)
    
    print("✅ Round Robin очереди инициализированы")

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

def select_office_for_foreign_client() -> Dict[str, Any]:
    """Распределяет иностранных клиентов 50/50"""
    astana = next((o for o in BUSINESS_UNITS if o['Офис'] == 'Астана'), None)
    almaty = next((o for o in BUSINESS_UNITS if o['Офис'] == 'Алматы'), None)
    
    if not astana or not almaty:
        return BUSINESS_UNITS[0] if BUSINESS_UNITS else None
    
    selected = random.choice([astana, almaty]).copy()
    selected['assignment_reason'] = 'foreign_client_random_50_50'
    selected['distance_km'] = None
    return selected

def get_manager_by_round_robin(office: str, required_skills: List[str]) -> Optional[Dict[str, Any]]:
    """Получает менеджера по Round Robin"""
    global round_robin_queues
    
    if 'VIP' in required_skills:
        skill_key = 'VIP'
    elif 'DATA_CHANGE' in required_skills:
        skill_key = 'DATA_CHANGE'
    elif 'KZ' in required_skills:
        skill_key = 'KZ'
    elif 'ENG' in required_skills:
        skill_key = 'ENG'
    else:
        skill_key = 'GENERAL'
    
    queue = round_robin_queues.get(office, {}).get(skill_key, deque())
    
    if not queue:
        queue = round_robin_queues.get(office, {}).get('GENERAL', deque())
    
    if not queue:
        return None
    
    manager = queue[0]
    queue.rotate(-1)
    assignment_history[office][skill_key] += 1
    
    return manager

def update_round_robin_queue(office: str, skill_key: str, old_manager: Dict[str, Any], new_manager: Dict[str, Any]):
    """Обновляет Round Robin очередь"""
    global round_robin_queues
    
    queue = round_robin_queues.get(office, {}).get(skill_key, deque())
    
    if queue:
        new_queue = deque()
        for manager in queue:
            if manager['ФИО'] == old_manager['ФИО']:
                new_queue.append(new_manager)
            else:
                new_queue.append(manager)
        round_robin_queues[office][skill_key] = new_queue

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
    
    if not selected_manager:
        print(f"     ⚠️ Не найден менеджер по Round Robin, ищем любого подходящего...")
        office_managers = [m for m in MANAGERS if m.get('Офис') == office_name]
        
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
        
        if suitable_managers:
            suitable_managers.sort(key=lambda x: x.get('Количество обращений в работе', 0))
            selected_manager = suitable_managers[0]
            print(f"     ✅ Найден резервный менеджер: {selected_manager['ФИО']}")
    
    if selected_manager:
        print(f"     ✅ Итоговое назначение: {selected_manager['ФИО']} в {office_name}")
        return {
            'manager': selected_manager,
            'office': selected_office,
            'reason': selected_office.get('assignment_reason', 'standard'),
            'required_skills': required_skills
        }
    
    print(f"     ❌ Не найден подходящий менеджер")
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
    
    def detect_priority_keywords(self, text: str) -> str:
        """Определение приоритета по ключевым словам"""
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
                return 'urgent'
        
        for word in high_words:
            if word in text_lower:
                return 'high'
        
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

Приоритет:
- urgent: срочно, немедленно, блокировка, заблокирован, !!!
- high: важно, проблема, ошибка, деньги, доступ
- medium: обычные вопросы
- low: спасибо, отзывы

Тональность:
- negative: клиент зол, кричит, угрожает
- positive: благодарит, хвалит
- neutral: спокойный тон, вежливый вопрос

Поля JSON:
- ticket_type: тип обращения
- summary: краткая суть (макс 150 символов)
- sentiment: positive/neutral/negative
- priority: low/medium/high/urgent
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
                    
                    ai_priority = enriched_data.get("priority", "").lower()
                    if priority_hint and ai_priority != priority_hint:
                        enriched_data["priority"] = priority_hint
                    
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
        
        if forced_priority:
            priority = forced_priority
        else:
            priority = self.detect_priority_keywords(text) or "medium"
        
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
        
        suggested_actions = {
            "urgent": "urgent_review",
            "high": "call_back",
            "medium": "email_reply",
            "low": "standard_review"
        }
        
        result = {
            "ticket_type": ticket_type,
            "summary": summary,
            "sentiment": sentiment,
            "priority": priority,
            "keywords": [],
            "language": language,
            "is_spam": ticket_type == "Спам",
            "suggested_action": suggested_actions.get(priority, "standard_review")
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

class TicketPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

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
    priority: TicketPriority
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
        priority_map = {
            TicketPriority.URGENT: 0,
            TicketPriority.HIGH: 1,
            TicketPriority.MEDIUM: 2,
            TicketPriority.LOW: 3
        }
        priority_value = priority_map.get(ticket['priority'], 2)
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
        "priority": enriched.get("priority", TicketPriority.MEDIUM),
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
        
        if 'VIP' in required_skills:
            update_round_robin_queue(office, 'VIP', old_manager, updated_manager)
        elif 'DATA_CHANGE' in required_skills:
            update_round_robin_queue(office, 'DATA_CHANGE', old_manager, updated_manager)
        elif 'KZ' in required_skills:
            update_round_robin_queue(office, 'KZ', old_manager, updated_manager)
        elif 'ENG' in required_skills:
            update_round_robin_queue(office, 'ENG', old_manager, updated_manager)
        else:
            update_round_robin_queue(office, 'GENERAL', old_manager, updated_manager)
    
    ticket_store.add(new_ticket)
    return new_ticket

@app.get("/api/tickets/{ticket_id}", response_model=TicketResponse)
async def get_ticket(ticket_id: str):
    ticket = ticket_store.get(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@app.get("/api/tickets")
async def list_tickets(skip: int = 0, limit: int = 100):
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

@app.on_event("startup")
async def startup_event():
    print("="*70)
    print("🚀 SMART ASSIGNMENT ENGINE STARTED")
    print("="*70)
    print(f"📊 Загружено офисов: {len(BUSINESS_UNITS)}")
    print(f"👥 Загружено менеджеров: {len(MANAGERS)}")
    print(f"📍 Офисы:")
    for office in BUSINESS_UNITS:
        print(f"   - {office['Офис']}: {office['Адрес']}")
    print("="*70)
    print("🔄 Round Robin очереди инициализированы")
    print("="*70)