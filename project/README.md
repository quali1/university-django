# Dokumentacja dla projektu „System Zarządzania Restauracją"

## Opis projektu

System Zarządzania Restauracją to kompleksowa aplikacja internetowa, która zapewnia pełną funkcjonalność do zarządzania operacjami restauracyjnymi, w tym rezerwacjami, zamówieniami, menu, składnikami i raportami.

Aplikacja wykorzystuje architekturę REST API (Django REST Framework) z oddzielnym frontendem w JavaScript, co pozwala na skalowalne i nowoczesne podejście do zarządzania restauracją.

## Funkcjonalność

### 1. Zarządzanie użytkownikami:
- Trzy role użytkowników: klient, kelner, administrator
- Rejestracja i logowanie z wykorzystaniem JWT
- Profil użytkownika z możliwością edycji danych
- Zmiana hasła

### 2. Zarządzanie menu:
- Przeglądanie dostępnych pozycji menu
- Dodawanie nowych pozycji (dla kelnerów/administratorów)
- Edycja istniejących pozycji
- Kategoryzacja: przystawki, dania główne, desery, napoje
- Oznaczenia dietetyczne: wegetariańskie, wegańskie, bezglutenowe
- Zarządzanie dostępnością pozycji

### 3. System rezerwacji:
- Tworzenie rezerwacji stolików przez klientów
- Zarządzanie statusami rezerwacji
- Przypisywanie numerów stolików
- Specjalne życzenia i uwagi

### 4. Zarządzanie zamówieniami:
- Składanie zamówień na miejscu, na wynos lub z dostawą
- Śledzenie statusów zamówień
- Przypisywanie kelnerów do zamówień
- Kalkulacja sum i rabatów
- System promocji z kodami

### 5. Zarządzanie składnikami:
- Inwentaryzacja składników
- Monitorowanie stanów magazynowych
- Alerty dla składników poniżej minimum
- Przypisywanie składników do pozycji menu

### 6. Raportowanie (dla administratorów):
- Raporty sprzedaży z analizą czasową
- Raporty magazynowe
- Statystyki najpopularniejszych pozycji
- Analiza kategorii produktów

## Szczegóły techniczne

### Wykorzystane technologie

**Backend:**
- Język programowania: Python 3.13
- Framework: Django 5.2.3
- API: Django REST Framework 3.16.0
- Autentykacja: JWT (djangorestframework-simplejwt)
- Baza danych: PostgreSQL
- Kontenery: Docker + Docker Compose

**Frontend:**
- JavaScript (vanilla)
- HTML5 + CSS3
- Bootstrap 5.1.3
- Fetch API do komunikacji z backend

**Narzędzia:**
- uv - zarządzanie zależnościami Python
- nginx - serwer HTTP dla frontend
- CORS headers - komunikacja cross-origin

### Struktura plików:
```
src/
├── backend/
│   ├── authentication/     # Moduł użytkowników
│   ├── restaurant/         # Główny moduł restauracji
│   ├── restaurant_system/  # Konfiguracja Django
│   └── manage.py          # Django management
├── frontend/
│   ├── css/               # Style CSS
│   ├── js/                # Logika JavaScript
│   ├── pages/             # Strony HTML
│   └── index.html         # Strona główna
```

## Tabele bazy danych

### 1. authentication_user:
- `id` (INT) - unikalny identyfikator użytkownika
- `email` (VARCHAR) - adres email (login)
- `first_name` (VARCHAR) - imię
- `last_name` (VARCHAR) - nazwisko
- `phone` (VARCHAR) - numer telefonu
- `role` (VARCHAR) - rola (client/waiter/admin)
- `is_active` (BOOLEAN) - status aktywności
- `created_at` (DATETIME) - data utworzenia

### 2. restaurant_menuitem:
- `id` (INT) - identyfikator pozycji menu
- `name` (VARCHAR) - nazwa dania
- `description` (TEXT) - opis
- `price` (DECIMAL) - cena
- `category` (VARCHAR) - kategoria
- `is_available` (BOOLEAN) - dostępność
- `is_vegetarian` (BOOLEAN) - wegetariańskie
- `is_vegan` (BOOLEAN) - wegańskie
- `is_gluten_free` (BOOLEAN) - bezglutenowe
- `preparation_time` (INT) - czas przygotowania w minutach

### 3. restaurant_reservation:
- `id` (INT) - identyfikator rezerwacji
- `user_id` (INT) - identyfikator użytkownika
- `date` (DATE) - data rezerwacji
- `time` (TIME) - godzina rezerwacji
- `party_size` (INT) - liczba osób
- `status` (VARCHAR) - status (pending/confirmed/cancelled/completed)
- `table_number` (INT) - numer stolika
- `special_requests` (TEXT) - specjalne życzenia

### 4. restaurant_order:
- `id` (INT) - identyfikator zamówienia
- `user_id` (INT) - identyfikator klienta
- `waiter_id` (INT) - identyfikator kelnera
- `status` (VARCHAR) - status zamówienia
- `order_type` (VARCHAR) - typ (dine_in/takeout/delivery)
- `table_number` (INT) - numer stolika
- `total_amount` (DECIMAL) - suma brutto
- `discount_percentage` (DECIMAL) - procent rabatu
- `final_amount` (DECIMAL) - suma końcowa
- `created_at` (DATETIME) - czas złożenia

### 5. restaurant_orderitem:
- `id` (INT) - identyfikator pozycji zamówienia
- `order_id` (INT) - identyfikator zamówienia
- `menu_item_id` (INT) - identyfikator pozycji menu
- `quantity` (INT) - ilość
- `price` (DECIMAL) - cena jednostkowa
- `subtotal` (DECIMAL) - suma cząstkowa
- `notes` (TEXT) - uwagi

### 6. restaurant_ingredient:
- `id` (INT) - identyfikator składnika
- `name` (VARCHAR) - nazwa składnika
- `quantity` (DECIMAL) - ilość w magazynie
- `unit` (VARCHAR) - jednostka miary
- `minimum_quantity` (DECIMAL) - minimalna ilość
- `price_per_unit` (DECIMAL) - cena za jednostkę
- `supplier` (VARCHAR) - dostawca

### 7. restaurant_promotion:
- `id` (INT) - identyfikator promocji
- `name` (VARCHAR) - nazwa promocji
- `promo_code` (VARCHAR) - kod promocyjny
- `discount_percentage` (DECIMAL) - procent rabatu
- `start_date` (DATETIME) - data rozpoczęcia
- `end_date` (DATETIME) - data zakończenia
- `minimum_order_amount` (DECIMAL) - minimalna kwota zamówienia

## Struktura API

### Endpointy autentykacji (`/api/auth/`):
- `POST /register/` - rejestracja użytkownika
- `POST /login/` - logowanie (zwraca JWT token)
- `POST /token/refresh/` - odświeżenie tokena
- `GET /me/` - pobranie danych aktualnego użytkownika
- `GET /profile/` - profil użytkownika
- `POST /change-password/` - zmiana hasła

### Endpointy restauracji (`/api/`):
- `GET /menu-items/` - lista pozycji menu
- `POST /menu-items/` - dodanie pozycji menu
- `GET|PUT|DELETE /menu-items/{id}/` - operacje na pozycji menu

- `GET /reservations/` - lista rezerwacji
- `POST /reservations/` - tworzenie rezerwacji
- `GET|PUT|DELETE /reservations/{id}/` - operacje na rezerwacji

- `GET /orders/` - lista zamówień
- `POST /orders/` - tworzenie zamówienia
- `GET|PUT|DELETE /orders/{id}/` - operacje na zamówieniu
- `POST /orders/{id}/update-status/` - aktualizacja statusu
- `POST /orders/{id}/assign-waiter/` - przypisanie kelnera

- `GET /ingredients/` - lista składników
- `GET /ingredients/low-stock/` - składniki poniżej minimum

- `GET /reports/sales/` - raport sprzedaży
- `GET /reports/inventory/` - raport magazynowy

## Podręcznik użytkownika

### 1. Instalacja i uruchomienie:

#### Wymagania:
- Docker
- Docker Compose

#### Kroki instalacji:
1. Sklonuj repozytorium:
```bash
git clone <https://github.com/quali1/university-django>
cd project/
```

2. Utwórz plik `.env` na podstawie `.env.example`:
```bash
cp .env.example .env
```

3. Uruchom aplikację:
```bash
docker-compose up -d
```

4. Aplikacje będą dostępne pod adresami:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8000
   - Admin Django: http://localhost:8000/admin

### 2. Tworzenie superużytkownika:

```bash
docker-compose exec backend python src/backend/manage.py createsuperuser
```

### 3. Obsługa aplikacji:

#### Dla klientów:
- Rejestracja i logowanie przez stronę główną
- Przeglądanie menu
- Składanie rezerwacji
- Przeglądanie własnych zamówień

#### Dla kelnerów:
- Logowanie przez stronę główną
- Zarządzanie menu (dodawanie pozycji)
- Obsługa zamówień i zmiana statusów
- Przypisywanie się do zamówień

#### Dla administratorów:
- Dostęp do panelu administracyjnego
- Pełne zarządzanie systemem
- Dostęp do raportów sprzedaży i magazynowych
- Zarządzanie użytkownikami i uprawnieniami