import asyncio
import json
import os
import sys
import csv
from datetime import datetime
from typing import List, Dict, Any
from collections import defaultdict

# Добавляем текущую папку в путь поиска модулей
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

print("="*70)
print("🚀 SMART ASSIGNMENT ENGINE - EVALUATION (IMAGES SUPPORTED)")
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
except ImportError as e:
    print(f"❌ Ошибка импорта из main.py: {e}")
    sys.exit(1)

def build_address(row: dict) -> str:
    parts = []
    if row.get('Населённый пункт'): parts.append(row['Населённый пункт'])
    if row.get('Улица'): parts.append(row['Улица'])
    if row.get('Дом'): parts.append("д." + row['Дом'])
    if row.get('Область'): parts.append(row['Область'])
    if row.get('Страна'): parts.append(row['Страна'])
    return ", ".join(parts) if parts else None

async def process_ticket(ticket: dict, i: int, total_tickets: int, ai_client: GoogleAIClient, sem: asyncio.Semaphore, results: list):
    async with sem:
        guid = ticket.get('GUID клиента', f'unknown_{i}')
        text = ticket.get('Описание ', '').strip()
        address = build_address(ticket)
        segment = ticket.get('Сегмент клиента', '')
        attachment = ticket.get('Вложения', '').strip()
        
        # Строим итоговый текст для AI (добавляем сегмент для контекста)
        full_text = f"{text}\n\n[Контекст] Сегмент клиента: {segment}"
        
        print(f"\n{'='*50}")
        print(f"🔄 Обработка {i}/{total_tickets}: {guid}")
        print(f"📝 Текст: {text[:50]}...")
            
        try:
            # Изображения временно отключены по просьбе пользователя
            enriched_data = await ai_client.enrich(
                text=full_text, 
                address=address,
                image_paths=None # Отключено: image_paths if image_paths else None
            )
            print(f"✅ AI ответил для {guid}!")
            
            # Подготовка для find_best_manager_for_ticket
            ticket_data = {
                'id': guid,
                'description': text,
                'address': address,
                'segment': segment
            }
            
            assignment = find_best_manager_for_ticket(ticket_data, enriched_data)
            
            result = {
                'ticket_id': guid,
                'input': {
                    'text': text,
                    'address': address,
                    'segment': segment,
                    'attachments': attachment
                },
                'ai_analysis': enriched_data,
                'assignment': assignment,
                'success': True
            }
            results.append(result)
            
        except Exception as e:
            print(f"❌ Ошибка обработки {guid}: {e}")
            results.append({
                'ticket_id': guid,
                'error': str(e),
                'success': False
            })

async def run_evaluation():
    csv_file = os.path.join(current_dir, 'eval', 'tickets.csv')
    if not os.path.exists(csv_file):
        print(f"❌ Файл {csv_file} не найден!")
        return
        
    tickets = []
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            tickets.append(row)
            
    total_tickets = len(tickets)
    print(f"\n✅ Загружено тикетов из CSV: {total_tickets}")
    
    ai_client = GoogleAIClient(api_key=YOUR_API_KEY, base_url=AI_API_BASE_URL)
    
    results = []
    start_time = datetime.now()
    
    sem = asyncio.Semaphore(15) # Батч в 15 запросов одновременно
    tasks = [process_ticket(ticket, i, total_tickets, ai_client, sem, results) for i, ticket in enumerate(tickets, 1)]
    await asyncio.gather(*tasks)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    output_file = os.path.join(current_dir, 'eval_results.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'metadata': {
                'total_processed': total_tickets,
                'successful': sum(1 for r in results if r.get('success')),
                'failed': sum(1 for r in results if not r.get('success')),
                'duration_seconds': duration
            },
            'results': results
        }, f, ensure_ascii=False, indent=2)
        
    print(f"\n✅ Оценка завершена. Результаты сохранены в {output_file}")
    print(f"⏱️ Общее время: {duration:.1f} сек")

if __name__ == "__main__":
    asyncio.run(run_evaluation())
