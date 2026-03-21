📌 texnostrelka2026 — Монитор подписок<br>

🚀 О проекте<br>

texnostrelka2026 — это кроссплатформенное решение для управления подписками пользователя.

🎯 Цель<br>

Создать единую платформу, которая позволяет:<br>
отслеживать все подписки<br>
анализировать расходы<br>
получать уведомления<br>
управлять подписками из одного интерфейса<br>

🧩 Архитектура проекта<br>

Проект состоит из трех частей:<br>
🖥 Backend (Django + Celery + Redis)<br>
🌐 Web-приложение<br>
📱 Mobile (React Native / Expo)<br>
⚙️ Основной функционал<br>
<br>
В соответствии с ТЗ реализовано:
✅ Обязательный функционал
Регистрация и авторизация пользователей
Добавление / редактирование / удаление подписок
Категоризация подписок
Централизованная панель управления<br>
📊 Аналитика
Графики расходов
Группировка по категориям
Анализ затрат<br>
🔔 Уведомления
Напоминания о списаниях (за 1–3 дня)<br>
🔄 Синхронизация
Общий backend для web и mobile<br>
📈 Прогнозирование
Расчет будущих расходов<br>
🤖 Дополнительно
Firebase (уведомления)
Celery (фоновые задачи)<br>
🛠️ Стек технологий
Backend
Python / Django
PostgreSQL / SQLite
Redis
Celery
Frontend
HTML / CSS / JS (Web)
React Native + Expo (Mobile)
Инфраструктура
Firebase
REST API<br>
📦 Установка и запуск

Полная инструкция:<br>

💻 Быстрый старт (Windows)<br>
1. Установка зависимостей
pip install -r requirements.txt
2. Создать .env
SECRET_KEY=change-me
DEBUG=True

POSTGRES_DB=texnostrelka
POSTGRES_USER=user
POSTGRES_PASSWORD=password

REDIS_URL=redis://localhost:6379/0
3. Миграции
python manage.py migrate
4. Создать суперпользователя
python manage.py createsuperuser
5. Запуск сервера
python manage.py runserver
⚡ Celery (обязательно)
celery -A <project_name> worker -l info --pool=solo
celery -A <project_name> beat -l info
🔥 Firebase настройка
Перейти в Firebase Console
Создать проект
Скачать firebase_key.json
Поместить в корень проекта
📱 Mobile (Expo)
cd mobile
npm install
npx expo run:android
🍏 iOS (только macOS)
npx expo run:ios
🧪 Проверка работы

После запуска:

Backend: http://127.0.0.1:8000
Admin: http://127.0.0.1:8000/admin
📁 Структура проекта
texnostrelka2026/
│
├── backend/
├── mobile/
├── web/
├── .env
├── requirements.txt
└── README.md
🎥 Видеопрезентация

📌 Важно:
Согласно ТЗ, если функционал не показан в видео — он не оценивается

Рекомендуется:

показать ВСЕ функции
озвучить действия
записывать без шумов
📌 Важные требования (ТЗ)

Чтобы проект был засчитан, обязательно:

✅ Есть backend
✅ Есть web + mobile
✅ Есть инструкция
✅ Есть видео
✅ Есть доступ к материалам

Иначе работа не оценивается

🏆 Критерии оценки

Ключевые моменты:

Архитектура (единый API)
Полный функционал
Аналитика
Уведомления
Синхронизация
Прогнозирование
📎 Репозиторий
git clone https://github.com/Pryanik-M/texnostrelka2026.git
👨‍💻 Автор

Разработано в рамках хакатона Технострелка 2026
