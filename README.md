# OMDEN - FnB Management System (CloudPOS)

Sistem kasir dan manajemen stok terintegrasi untuk bisnis F&B modern. Mendukung multi-outlet (Mitra), manajemen inventaris real-time, dan pelaporan yang komprehensif.

## 🌟 Fitur Utama

### 🛒 Point of Sales (Kasir)

- **Interactive POS**: Tampilan kasir yang responsif (Mobile First) dan mudah digunakan.
- **Product Variants & Modifiers**: Dukungan penuh untuk varian produk dan topping/level.
- **Automated Availability**: Ketersediaan produk otomatis non-aktif jika stok bahan baku habis (Real-time check).
- **Smart Cart**: Keranjang belanja dinamis dengan perhitungan total otomatis.

### 📦 Manajemen Inventaris & Stok

- **Recipe Management**: Mapping produk ke bahan baku (Ingredient) via Resep.
- **Automated Deduction**: Stok bahan baku berkurang otomatis saat terjadi penjualan.
- **Stock Logs**: Pencatatan riwayat pergerakan stok (masuk/keluar/adjustment).
- **Per-Mitra Inventory**: Stok dikelola terpisah untuk setiap Mitra/Outlet.

### 👥 Manajemen Pengguna & Peran

- **Super Admin**: Akses penuh ke seluruh sistem, manajemen Mitra, Produk Global, dan Laporan.
- **Mitra (Franchise Owner)**: Manajemen outlet sendiri, stok bahan baku, toggle ketersediaan topping, dan laporan penjualan outlet.
- **Kasir**: Akses terbatas khusus untuk melakukan transaksi penjualan (POS).

### 📊 Laporan & Analitik

- Dashboard real-time untuk omzet dan transaksi harian.
- Laporan penjualan terperinci.
- Analisis produk terlaris (Top Selling Items).

## 🚀 Teknologi yang Digunakan

### Backend (`apps/api`)

- **Framework**: Django 5.0 + Django REST Framework
- **Database**: PostgreSQL (Production) / SQLite (Dev)
- **Auth**: JWT (Simple JWT) + Role Based Access Control
- **Task Queue**: Celery + Redis (Background tasks)
- **AI Integration**: Google Gemini (AI Assistant capability)

### Frontend (`apps/web`)

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **State Management**: Zustand
- **Icons**: Lucide React
- **Data Fetching**: Axios + SWR (implied patterns)
- **Charts**: Recharts

## 🛠️ Panduan Instalasi (Development)

### Prasyarat

- Python 3.10 atau lebih baru
- Node.js 18 atau lebih baru
- PostgreSQL (Disarankan) atau SQLite
- Redis (Opsional, untuk fitur background task penuh)

### 1. Setup Backend

Masuk ke direktori backend:

```bash
cd apps/api
```

Buat virtual environment dan aktifkan:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r ../../requirements.txt
```

Migrasi database dan buat superuser:

```bash
python manage.py migrate
python manage.py createsuperuser
```

(Opsional) Seed data awal:

```bash
python seed_users.py
python seed_products.py
```

Jalankan server:

```bash
python manage.py runserver
```

Server akan berjalan di `http://localhost:8000`.

### 2. Setup Frontend

Masuk ke direktori frontend:

```bash
cd apps/web
```

Install dependencies:

```bash
npm install
```

Buat file `.env.local` (sesuaikan dengan `.env.example` jika ada, atau gunakan default):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Jalankan server dev:

```bash
npm run dev
```

Akses aplikasi di `http://localhost:3000`.

## 📂 Struktur Proyek

```
cloudpos/
├── apps/
│   ├── api/          # Django Backend
│   │   ├── config/   # Project Settings
│   │   ├── core/     # Core logic & Utils
│   │   ├── users/    # User Models & Auth
│   │   ├── catalog/  # Models: Product, Category, Modifier
│   │   ├── inventory/# Models: Ingredient, Stock, Recipe
│   │   ├── sales/    # Models: Order, Payment
│   │   └── ai_assistant/ # AI Logic
│   └── web/          # Next.js Frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── (admin)/   # Admin Dashboard Layout & Pages
│       │   │   ├── (pos)/     # POS/Cashier Layout & Pages
│       │   │   └── (auth)/    # Login Page
│       │   ├── components/    # Reusable UI Components
│       │   ├── lib/           # API Client & Utils
│       │   ├── store/         # Zustand Stores (Auth, Cart)
│       │   └── types/         # TypeScript Interfaces
├── requirements.txt
└── README.md
```

## 🔒 Matriks Hak Akses

| Fitur                | Super Admin | Mitra                    | Kasir |
| -------------------- | ----------- | ------------------------ | ----- |
| **POS Access**       | ✅          | ✅                       | ✅    |
| **Manage Products**  | ✅ (CRUD)   | ❌ (View Only)           | ❌    |
| **Manage Toppings**  | ✅ (CRUD)   | ✅ (Toggle Availability) | ❌    |
| **Manage Inventory** | ❌          | ✅ (Outlet Stock)        | ❌    |
| **Sales Reports**    | ✅ (Global) | ✅ (Own Outlet)          | ❌    |
| **Manage Cashiers**  | ❌          | ✅ (Own Cashiers)        | ❌    |

## 📄 Lisensi

Private Proprietary Software - OMDEN.
