# Инструкция: Настройка GitHub Secrets для деплоя

## 1. JSON ключ сервисного аккаунта (YC_SA_JSON_KEY)

1. Yandex Cloud → IAM → Сервисные аккаунты → crimea-deployer
2. Вкладка "Ключи доступа" → "Создать ключ"
3. Формат: "Водительские удостоверения (JSON)"
4. Скачай файл, открой в редакторе, скопируй ВСЁ содержимое

## 2. API ключ реестра (YC_REGISTRY_LOGIN + YC_REGISTRY_PASSWORD)

1. Yandex Cloud → Containers → Container Registry → твой реестр
2. "Имена доступа" → "Создать имя доступа"
3. Скопируй Login и Secret

## 3. Секреты в GitHub

Зайди: https://github.com/MoonShiners82/crimea-transfer/settings/secrets/actions

Добавь:
- YC_SA_JSON_KEY = содержимое JSON файла
- YC_REGISTRY_LOGIN = Login из п.2
- YC_REGISTRY_PASSWORD = Secret из п.2
- DATABASE_URL = postgresql://... (твоя строка из .env)
- NEXTAUTH_SECRET = секретный ключ
- PLUSOFON_API_KEY = 43VkNjDgu9uxr6a5sMkk5RKuvhgbHksP
- YC_FOLDER_ID = b1gvnuqsklois79c98aj
