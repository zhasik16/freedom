# test_runner.py (исправленная версия с географическим фильтром)
import asyncio
import json
import os
import sys
from datetime import datetime
from typing import List, Dict, Any
import random
from collections import defaultdict

# Добавляем текущую папку в путь поиска модулей
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

print("="*70)
print("🚀 SMART ASSIGNMENT ENGINE - ТЕСТИРОВАНИЕ ВСЕХ ТИКЕТОВ")
print("="*70)
print(f"📁 Рабочая папка: {current_dir}")
print(f"🐍 Python версия: {sys.version}")
print("="*70)

# Импортируем из main.py
try:
    from main import (
        GoogleAIClient, YOUR_API_KEY, AI_API_BASE_URL,
        find_best_manager_for_ticket, is_in_kazakhstan,
        find_nearest_office, BUSINESS_UNITS, MANAGERS,
        load_business_units_from_file, load_managers_from_file
    )
    print("✅ Импорт из main.py успешен")
    print(f"   🔑 API Key: {YOUR_API_KEY[:15]}...")
    print(f"   🌐 Base URL: {AI_API_BASE_URL}")
    print(f"   🤖 Модель: gemini-2.5-flash")
    print(f"   📍 Офисов загружено: {len(BUSINESS_UNITS)}")
    print(f"   👥 Менеджеров загружено: {len(MANAGERS)}")
except ImportError as e:
    print(f"❌ Ошибка импорта из main.py: {e}")
    print("\n📋 Файлы в папке:")
    for file in os.listdir(current_dir):
        print(f"   - {file}")
    sys.exit(1)

def prepare_ticket_for_ai(ticket: Dict[str, Any]) -> Dict[str, Any]:
    """
    Подготавливает тикет из датасета для отправки в AI
    """
    # Формируем текст для анализа
    text_parts = []
    
    # Добавляем описание (основной текст)
    if ticket.get('Описание '):
        text_parts.append(ticket['Описание '].strip())
    
    # Добавляем информацию о клиенте для контекста
    client_info = []
    if ticket.get('Сегмент клиента'):
        client_info.append(f"Сегмент: {ticket['Сегмент клиента']}")
    
    if client_info:
        text_parts.append("[" + ", ".join(client_info) + "]")
    
    # Объединяем все в один текст
    full_text = " ".join(text_parts)
    
    # Формируем адрес
    address_parts = []
    if ticket.get('Населённый пункт'):
        address_parts.append(ticket['Населённый пункт'])
    if ticket.get('Улица'):
        address_parts.append(ticket['Улица'])
    if ticket.get('Дом'):
        house = ticket['Дом']
        if house is not None and house != "":
            address_parts.append(f"д.{house}")
    if ticket.get('Область'):
        address_parts.append(ticket['Область'])
    if ticket.get('Страна'):
        address_parts.append(ticket['Страна'])
    
    address = ", ".join(address_parts) if address_parts else None
    
    # Очищаем текст от лишних пробелов
    clean_text = " ".join(full_text.split())
    
    return {
        'id': ticket.get('GUID клиента', 'unknown'),
        'text': clean_text if clean_text else "Пустое обращение",
        'address': address,
        'segment': ticket.get('Сегмент клиента'),
        'gender': ticket.get('Пол клиента'),
        'birth_date': ticket.get('Дата рождения'),
        'original': ticket
    }

async def test_dataset():
    """Тестирует ВСЕ тикеты в датасете используя твой реальный AI"""
    
    # Ищем JSON файл
    json_files = [f for f in os.listdir(current_dir) if f.endswith('.json')]
    print(f"\n📊 Найдено JSON файлов: {len(json_files)}")
    
    # Приоритет файлов
    preferred_files = ['datasets.json', 'test.json', 'dataset.json']
    json_path = None
    
    for pref in preferred_files:
        if pref in json_files:
            json_path = os.path.join(current_dir, pref)
            print(f"✅ Используем {pref}")
            break
    
    if not json_path and json_files:
        json_path = os.path.join(current_dir, json_files[0])
        print(f"⚠️ Используем {json_files[0]}")
    elif not json_path:
        print("❌ В папке нет JSON файлов!")
        return
    
    print(f"🔍 Путь к файлу: {json_path}")
    print(f"📏 Размер файла: {os.path.getsize(json_path)} байт")
    
    # Загружаем датасет
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Извлекаем тикеты
        if isinstance(data, dict):
            tickets = data.get('tickets', [])
            managers = data.get('managers', [])
            business_units = data.get('business_units', [])
        elif isinstance(data, list):
            tickets = data
            managers = []
            business_units = []
        else:
            tickets = []
            managers = []
            business_units = []
        
        total_tickets = len(tickets)
        print(f"\n✅ Загружено:")
        print(f"   - Тикетов: {total_tickets}")
        print(f"   - Менеджеров: {len(managers)}")
        print(f"   - Офисов: {len(business_units)}")
        
        if not tickets:
            print("❌ В файле нет тикетов!")
            return
            
        print(f"\n📋 БУДУТ ПРОТЕСТИРОВАНЫ ВСЕ {total_tickets} ТИКЕТОВ")
            
    except json.JSONDecodeError as e:
        print(f"❌ Ошибка в JSON: {e}")
        return
    except Exception as e:
        print(f"❌ Ошибка чтения файла: {e}")
        return
    
    # Создаем клиент AI
    print("\n🔄 Инициализация Google AI клиента...")
    try:
        ai_client = GoogleAIClient(api_key=YOUR_API_KEY, base_url=AI_API_BASE_URL)
        print("✅ Google AI клиент создан")
    except Exception as e:
        print(f"❌ Ошибка создания AI клиента: {e}")
        return
    
    # Статистика по менеджерам (для информации)
    if managers:
        print(f"\n📊 Статистика по менеджерам:")
        vip_managers = sum(1 for m in managers if 'VIP' in m.get('Навыки', []))
        eng_managers = sum(1 for m in managers if 'ENG' in m.get('Навыки', []))
        kz_managers = sum(1 for m in managers if 'KZ' in m.get('Навыки', []))
        
        total_load = sum(m.get('Количество обращений в работе', 0) for m in managers)
        
        print(f"   - Всего менеджеров: {len(managers)}")
        print(f"   - С VIP навыком: {vip_managers}")
        print(f"   - С ENG: {eng_managers}")
        print(f"   - С KZ: {kz_managers}")
        print(f"   - Общая загрузка: {total_load}")
        print(f"   - Средняя загрузка: {total_load/len(managers):.1f}")
    
    # Тестируем ВСЕ тикеты
    results = []
    start_time = datetime.now()
    
    print("\n" + "="*70)
    print(f"🚀 НАЧАЛО ТЕСТИРОВАНИЯ ВСЕХ {total_tickets} ТИКЕТОВ")
    print("="*70)
    
    # Статистика по географии
    geo_stats = {
        'in_kazakhstan': 0,
        'foreign': 0,
        'no_address': 0,
        'nearest_office_assignments': defaultdict(int),
        'foreign_assignments': defaultdict(int)
    }
    
    for i, ticket in enumerate(tickets, 1):
        print(f"\n{'='*70}")
        print(f"📌 ТИКЕТ {i}/{total_tickets} ({i/total_tickets*100:.1f}%)")
        print(f"{'='*70}")
        
        # Подготавливаем данные для AI
        prepared = prepare_ticket_for_ai(ticket)
        
        print(f"🆔 ID: {prepared['id'][:8]}...")
        print(f"👤 Сегмент: {prepared['segment'] or 'Не указан'}")
        print(f"👤 Пол: {prepared['gender'] or 'Не указан'}")
        print(f"📍 Адрес: {prepared['address'] or 'Не указан'}")
        print(f"📝 Текст: {prepared['text'][:150]}...")
        
        try:
            print("⏳ Отправка запроса к Google AI...")
            
            # Вызываем AI
            enriched = await ai_client.enrich(
                text=prepared['text'],
                address=prepared['address']
            )
            
            # Определяем географию
            is_kazakh = is_in_kazakhstan(prepared['address'] or '')
            
            if not prepared['address']:
                geo_stats['no_address'] += 1
                geo_status = "Нет адреса"
            elif is_kazakh:
                geo_stats['in_kazakhstan'] += 1
                geo_status = "Казахстан"
            else:
                geo_stats['foreign'] += 1
                geo_status = "Иностранный"
            
            # Находим лучшего менеджера
            manager_assignment = find_best_manager_for_ticket(
                ticket_data={
                    'segment': prepared['segment'],
                    'address': prepared['address']
                },
                enriched_data=enriched
            )
            
            # Сохраняем результат
            result = {
                'ticket_id': prepared['id'],
                'segment': prepared['segment'],
                'gender': prepared['gender'],
                'text_preview': prepared['text'][:200],
                'address': prepared['address'],
                'geo_status': geo_status,
                'ai_result': enriched,
                'assignment': manager_assignment,
                'status': 'success',
                'processing_time': (datetime.now() - start_time).total_seconds()
            }
            results.append(result)
            
            # Показываем результат
            print(f"\n✅ РЕЗУЛЬТАТ ОБРАБОТКИ:")
            print(f"   🏷️ Тип обращения: {enriched.get('ticket_type', 'Н/Д')}")
            print(f"   📝 Саммари: {enriched.get('summary', 'Н/Д')[:100]}")
            print(f"   😊 Тональность: {enriched.get('sentiment', 'Н/Д')}")
            print(f"   ⚡ Приоритет: {enriched.get('priority', 'Н/Д')}")
            print(f"   🔤 Язык: {enriched.get('language', 'Н/Д')}")
            print(f"   🚫 Спам: {enriched.get('is_spam', False)}")
            print(f"   🌍 Статус: {geo_status}")
            
            if manager_assignment:
                office = manager_assignment['office']
                manager = manager_assignment['manager']
                print(f"\n   📍 НАЗНАЧЕНИЕ:")
                print(f"      🏢 Офис: {office['Офис']} ({office.get('distance_km', '?')} км)")
                print(f"      👤 Менеджер: {manager['ФИО']}")
                print(f"      📊 Причина: {manager_assignment['reason']}")
                
                # Собираем статистику по назначениям
                if manager_assignment['reason'] == 'nearest_office':
                    geo_stats['nearest_office_assignments'][office['Офис']] += 1
                elif manager_assignment['reason'] == 'foreign_client_random_50_50':
                    geo_stats['foreign_assignments'][office['Офис']] += 1
            
            if 'keywords' in enriched and enriched['keywords']:
                print(f"   🔑 Ключевые слова: {', '.join(enriched['keywords'])}")
            
            if 'coordinates' in enriched and enriched['coordinates']:
                coords = enriched['coordinates']
                print(f"   🗺️ Координаты: {coords['lat']:.4f}, {coords['lon']:.4f}")
            
        except Exception as e:
            print(f"❌ ОШИБКА: {e}")
            results.append({
                'ticket_id': prepared['id'],
                'segment': prepared['segment'],
                'status': 'error',
                'error': str(e),
                'processing_time': (datetime.now() - start_time).total_seconds()
            })
        
        # Показываем прогресс
        elapsed = (datetime.now() - start_time).total_seconds()
        avg_time = elapsed / i
        remaining = avg_time * (total_tickets - i)
        
        print(f"\n⏱️  Прошло: {elapsed:.1f} сек | Среднее: {avg_time:.1f} сек/тикет | Осталось: {remaining:.1f} сек")
    
    # Сохраняем результаты
    end_time = datetime.now()
    total_time = (end_time - start_time).total_seconds()
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_path = os.path.join(current_dir, f'test_results_{timestamp}.json')
    
    # Собираем статистику
    successful = [r for r in results if r['status'] == 'success']
    
    # Статистика по типам обращений
    ticket_types = {}
    sentiments = {}
    priorities = {}
    segments = {}
    languages = {}
    spam_count = 0
    
    for r in successful:
        ticket_type = r['ai_result'].get('ticket_type', 'unknown')
        ticket_types[ticket_type] = ticket_types.get(ticket_type, 0) + 1
        
        sent = r['ai_result'].get('sentiment', 'unknown')
        sentiments[sent] = sentiments.get(sent, 0) + 1
        
        pri = r['ai_result'].get('priority', 'unknown')
        priorities[pri] = priorities.get(pri, 0) + 1
        
        seg = r.get('segment', 'unknown')
        segments[seg] = segments.get(seg, 0) + 1
        
        lang = r['ai_result'].get('language', 'unknown')
        languages[lang] = languages.get(lang, 0) + 1
        
        if r['ai_result'].get('is_spam', False):
            spam_count += 1
    
    output = {
        'test_info': {
            'date': datetime.now().isoformat(),
            'total_tickets': total_tickets,
            'successful': len(successful),
            'failed': len(results) - len(successful),
            'success_rate': f"{len(successful)/total_tickets*100:.1f}%",
            'total_time_seconds': total_time,
            'avg_time_per_ticket': total_time / total_tickets if total_tickets > 0 else 0
        },
        'geo_statistics': {
            'in_kazakhstan': geo_stats['in_kazakhstan'],
            'foreign': geo_stats['foreign'],
            'no_address': geo_stats['no_address'],
            'nearest_office_assignments': dict(geo_stats['nearest_office_assignments']),
            'foreign_assignments': dict(geo_stats['foreign_assignments'])
        },
        'statistics': {
            'by_segment': dict(sorted(segments.items(), key=lambda x: x[1], reverse=True)),
            'by_ticket_type': dict(sorted(ticket_types.items(), key=lambda x: x[1], reverse=True)),
            'by_sentiment': dict(sorted(sentiments.items(), key=lambda x: x[1], reverse=True)),
            'by_priority': dict(sorted(priorities.items(), key=lambda x: x[1], reverse=True)),
            'by_language': dict(sorted(languages.items(), key=lambda x: x[1], reverse=True)),
            'spam_count': spam_count
        },
        'results': results
    }
    
    with open(results_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    # Выводим итоговую статистику
    print("\n" + "="*70)
    print("📊 ИТОГОВАЯ СТАТИСТИКА")
    print("="*70)
    print(f"📅 Дата теста: {output['test_info']['date']}")
    print(f"📁 Файл: {json_path}")
    print(f"📊 Всего тикетов: {output['test_info']['total_tickets']}")
    print(f"✅ Успешно: {output['test_info']['successful']}")
    print(f"❌ Ошибок: {output['test_info']['failed']}")
    print(f"📈 Успешность: {output['test_info']['success_rate']}")
    print(f"⏱️  Общее время: {output['test_info']['total_time_seconds']:.1f} сек")
    print(f"⚡ Среднее время: {output['test_info']['avg_time_per_ticket']:.1f} сек/тикет")
    
    print("\n🌍 ГЕОГРАФИЧЕСКАЯ СТАТИСТИКА:")
    print(f"   🇰🇿 В Казахстане: {geo_stats['in_kazakhstan']}")
    print(f"   🌏 Иностранные: {geo_stats['foreign']}")
    print(f"   ❓ Нет адреса: {geo_stats['no_address']}")
    
    if geo_stats['nearest_office_assignments']:
        print("\n   🏢 Назначения по ближайшим офисам:")
        for office, count in sorted(geo_stats['nearest_office_assignments'].items(), key=lambda x: x[1], reverse=True):
            print(f"      {office}: {count}")
    
    if geo_stats['foreign_assignments']:
        print("\n   🌍 Назначения иностранных клиентов (50/50):")
        for office, count in geo_stats['foreign_assignments'].items():
            print(f"      {office}: {count}")
    
    if segments:
        print("\n📊 РАСПРЕДЕЛЕНИЕ ПО СЕГМЕНТАМ:")
        for seg, count in sorted(segments.items(), key=lambda x: x[1], reverse=True):
            percentage = (count/output['test_info']['successful'])*100
            print(f"   {seg}: {count} ({percentage:.1f}%)")
    
    if ticket_types:
        print("\n📊 РАСПРЕДЕЛЕНИЕ ПО ТИПАМ ОБРАЩЕНИЙ:")
        for tt, count in sorted(ticket_types.items(), key=lambda x: x[1], reverse=True):
            percentage = (count/output['test_info']['successful'])*100
            print(f"   {tt}: {count} ({percentage:.1f}%)")
    
    if languages:
        print("\n🔤 РАСПРЕДЕЛЕНИЕ ПО ЯЗЫКАМ:")
        for lang, count in sorted(languages.items(), key=lambda x: x[1], reverse=True):
            percentage = (count/output['test_info']['successful'])*100
            print(f"   {lang}: {count} ({percentage:.1f}%)")
    
    if sentiments:
        print("\n😊 РАСПРЕДЕЛЕНИЕ ПО ТОНАЛЬНОСТИ:")
        for sent, count in sorted(sentiments.items(), key=lambda x: x[1], reverse=True):
            percentage = (count/output['test_info']['successful'])*100
            print(f"   {sent}: {count} ({percentage:.1f}%)")
    
    if priorities:
        print("\n⚡ РАСПРЕДЕЛЕНИЕ ПО ПРИОРИТЕТАМ:")
        for pri, count in sorted(priorities.items(), key=lambda x: x[1], reverse=True):
            percentage = (count/output['test_info']['successful'])*100
            print(f"   {pri}: {count} ({percentage:.1f}%)")
    
    print(f"\n💾 Полные результаты сохранены в: {results_path}")
    print(f"\n📝 Файл с результатами содержит детальную информацию по каждому тикету")

async def quick_test():
    """Быстрый тест одного тикета"""
    print("\n" + "="*70)
    print("🚀 БЫСТРЫЙ ТЕСТ ОДНОГО ТИКЕТА")
    print("="*70)
    
    # Создаем клиент AI
    ai_client = GoogleAIClient(api_key=YOUR_API_KEY, base_url=AI_API_BASE_URL)
    
    # Тестовый тикет из датасета
    test_text = """Здравствуйте.
Покупка акций в приложении Freedom Broker
Вопрос: можно ли в приложении совершать покупки акций дробно (когда
инвестируется небольшие средства 15-20$)?

Если да, то подскажите последовательность действий."""
    
    test_address = "Тургень, ул. Садовая, д.7, Алматинская, Казахстан"
    
    print(f"📝 Текст: {test_text[:100]}...")
    print(f"📍 Адрес: {test_address}")
    print("\n⏳ Отправка запроса к Google AI...")
    
    try:
        result = await ai_client.enrich(text=test_text, address=test_address)
        print("\n✅ РЕЗУЛЬТАТ AI:")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        # Тестируем географический фильтр
        print("\n📍 ТЕСТ ГЕОГРАФИЧЕСКОГО ФИЛЬТРА:")
        is_kazakh = is_in_kazakhstan(test_address)
        print(f"   Клиент в Казахстане: {is_kazakh}")
        
        if is_kazakh and result.get('coordinates'):
            nearest = find_nearest_office(result['coordinates'])
            if nearest:
                print(f"   Ближайший офис: {nearest['Офис']} ({nearest.get('distance_km', '?')} км)")
        
        # Находим менеджера
        manager = find_best_manager_for_ticket(
            ticket_data={'address': test_address, 'segment': 'VIP'},
            enriched_data=result
        )
        
        if manager:
            print(f"\n👤 НАЗНАЧЕННЫЙ МЕНЕДЖЕР:")
            print(f"   ФИО: {manager['manager']['ФИО']}")
            print(f"   Офис: {manager['office']['Офис']} ({manager['office'].get('distance_km', '?')} км)")
            print(f"   Причина: {manager['reason']}")
            print(f"   Должность: {manager['manager'].get('Должность ', 'Н/Д')}")
            print(f"   Навыки: {', '.join(manager['manager'].get('Навыки', []))}")
        
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--quick":
            asyncio.run(quick_test())
        elif sys.argv[1] == "--help":
            print("Использование:")
            print("  python3 test_runner.py        # Полный тест ВСЕХ тикетов в датасете")
            print("  python3 test_runner.py --quick # Быстрый тест одного тикета")
            print("  python3 test_runner.py --help  # Показать помощь")
    else:
        asyncio.run(test_dataset())