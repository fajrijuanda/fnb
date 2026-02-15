# CloudPOS - FnB Management System

Sistem kasir berbasis web (PWA) yang dirancang untuk bisnis F&B (Warung Makan/Restoran). Menyatukan operasional kasir (POS) dan manajemen gudang (Inventory) dalam satu platform responsif.

## 🚀 Tech Stack

### Backend (apps/api)

- **Framework:** Django + Django REST Framework
- **Database:** PostgreSQL
- **Task Queue:** Celery + Redis
- **Architecture:** Service Layer Pattern

### Frontend (apps/web)

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS + Shadcn/UI
- **State:** Zustand
- **PWA:** next-pwa

## 📁 Project Structure

```
cloudpos/
├── apps/
│   ├── api/          # Django Backend
│   │   ├── core/     # Utilities & Abstract Models
│   │   ├── users/    # Auth Management
│   │   ├── catalog/  # Products & Categories
│   │   ├── inventory/# Ingredients & Stock Logic
│   │   └── sales/    # Orders & Payments
│   └── web/          # Next.js Frontend
│       └── src/
│           ├── app/  # App Router Pages
│           ├── components/
│           ├── hooks/
│           ├── store/
│           └── lib/
├── blueprint.md      # Architecture Documentation
└── README.md
```

## 🛠️ Getting Started

### Backend Setup

```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup

```bash
cd apps/web
npm install
npm run dev
```

## 📋 Development Phases

1. **Phase 1:** Core Catalog & POS UI
2. **Phase 2:** Transaction & Receipt
3. **Phase 3:** Inventory Logic
4. **Phase 4:** Reporting & Dashboard

## 📄 License

Private - All rights reserved.
