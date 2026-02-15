# CloudPOS Scaffolding - Walkthrough

## Summary

Berhasil melakukan inisialisasi struktur proyek **CloudPOS** sesuai dengan spesifikasi di

blueprint.md.

---

## Project Structure Created

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all p-3 my-2 rounded-sm bg-list-hover-subtle"><div class="w-full h-full text-xs cursor-text"><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk1">fnb/</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1">├── .gitignore</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1">├── README.md</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk1">├── blueprint.md</span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk1">└── apps/</span></div></div><div class="code-line" data-line-number="6" data-line-start="6" data-line-end="6"><div class="line-content"><span class="mtk1">    ├── api/                    # Django Backend</span></div></div><div class="code-line" data-line-number="7" data-line-start="7" data-line-end="7"><div class="line-content"><span class="mtk1">    │   ├── config/             # Django settings</span></div></div><div class="code-line" data-line-number="8" data-line-start="8" data-line-end="8"><div class="line-content"><span class="mtk1">    │   ├── core/               # Utilities & Abstract Models</span></div></div><div class="code-line" data-line-number="9" data-line-start="9" data-line-end="9"><div class="line-content"><span class="mtk1">    │   ├── users/              # Auth Management</span></div></div><div class="code-line" data-line-number="10" data-line-start="10" data-line-end="10"><div class="line-content"><span class="mtk1">    │   ├── catalog/            # Products & Categories</span></div></div><div class="code-line" data-line-number="11" data-line-start="11" data-line-end="11"><div class="line-content"><span class="mtk1">    │   ├── inventory/          # Ingredients & Stock Logic</span></div></div><div class="code-line" data-line-number="12" data-line-start="12" data-line-end="12"><div class="line-content"><span class="mtk1">    │   │   ├── services.py     # Business Logic (Stock deduction)</span></div></div><div class="code-line" data-line-number="13" data-line-start="13" data-line-end="13"><div class="line-content"><span class="mtk1">    │   │   └── selectors.py    # Complex Queries</span></div></div><div class="code-line" data-line-number="14" data-line-start="14" data-line-end="14"><div class="line-content"><span class="mtk1">    │   ├── sales/              # Orders & Payments</span></div></div><div class="code-line" data-line-number="15" data-line-start="15" data-line-end="15"><div class="line-content"><span class="mtk1">    │   ├── manage.py</span></div></div><div class="code-line" data-line-number="16" data-line-start="16" data-line-end="16"><div class="line-content"><span class="mtk1">    │   └── requirements.txt</span></div></div><div class="code-line" data-line-number="17" data-line-start="17" data-line-end="17"><div class="line-content"><span class="mtk1">    │</span></div></div><div class="code-line" data-line-number="18" data-line-start="18" data-line-end="18"><div class="line-content"><span class="mtk1">    └── web/                    # Next.js Frontend</span></div></div><div class="code-line" data-line-number="19" data-line-start="19" data-line-end="19"><div class="line-content"><span class="mtk1">        ├── public/</span></div></div><div class="code-line" data-line-number="20" data-line-start="20" data-line-end="20"><div class="line-content"><span class="mtk1">        │   └── manifest.json   # PWA Configuration</span></div></div><div class="code-line" data-line-number="21" data-line-start="21" data-line-end="21"><div class="line-content"><span class="mtk1">        └── src/</span></div></div><div class="code-line" data-line-number="22" data-line-start="22" data-line-end="22"><div class="line-content"><span class="mtk1">            ├── app/            # Next.js App Router</span></div></div><div class="code-line" data-line-number="23" data-line-start="23" data-line-end="23"><div class="line-content"><span class="mtk1">            ├── components/</span></div></div><div class="code-line" data-line-number="24" data-line-start="24" data-line-end="24"><div class="line-content"><span class="mtk1">            │   ├── pos/        # POS View Components</span></div></div><div class="code-line" data-line-number="25" data-line-start="25" data-line-end="25"><div class="line-content"><span class="mtk1">            │   │   ├── ProductGrid.tsx</span></div></div><div class="code-line" data-line-number="26" data-line-start="26" data-line-end="26"><div class="line-content"><span class="mtk1">            │   │   ├── CartSheet.tsx</span></div></div><div class="code-line" data-line-number="27" data-line-start="27" data-line-end="27"><div class="line-content"><span class="mtk1">            │   │   └── ReceiptPrint.tsx</span></div></div><div class="code-line" data-line-number="28" data-line-start="28" data-line-end="28"><div class="line-content"><span class="mtk1">            │   └── admin/      # Admin View Components</span></div></div><div class="code-line" data-line-number="29" data-line-start="29" data-line-end="29"><div class="line-content"><span class="mtk1">            ├── hooks/</span></div></div><div class="code-line" data-line-number="30" data-line-start="30" data-line-end="30"><div class="line-content"><span class="mtk1">            │   ├── useCart.ts</span></div></div><div class="code-line" data-line-number="31" data-line-start="31" data-line-end="31"><div class="line-content"><span class="mtk1">            │   └── usePrinter.ts</span></div></div><div class="code-line" data-line-number="32" data-line-start="32" data-line-end="32"><div class="line-content"><span class="mtk1">            ├── store/</span></div></div><div class="code-line" data-line-number="33" data-line-start="33" data-line-end="33"><div class="line-content"><span class="mtk1">            │   └── useCartStore.ts  # Zustand Store</span></div></div><div class="code-line" data-line-number="34" data-line-start="34" data-line-end="34"><div class="line-content"><span class="mtk1">            ├── lib/</span></div></div><div class="code-line" data-line-number="35" data-line-start="35" data-line-end="35"><div class="line-content"><span class="mtk1">            │   ├── api.ts      # Axios Instance</span></div></div><div class="code-line" data-line-number="36" data-line-start="36" data-line-end="36"><div class="line-content"><span class="mtk1">            │   └── utils.ts    # cn(), formatRupiah()</span></div></div><div class="code-line" data-line-number="37" data-line-start="37" data-line-end="37"><div class="line-content"><span class="mtk1">            └── types/</span></div></div><div class="code-line" data-line-number="38" data-line-start="38" data-line-end="38"><div class="line-content"><span class="mtk1">                └── api.d.ts    # TypeScript Interfaces</span></div></div></div></div></div></pre>

---

## Dependencies Installed

### Backend (

apps/api/requirements.txt)

| Package             | Purpose           |
| ------------------- | ----------------- |
| Django              | Web Framework     |
| djangorestframework | REST API          |
| django-cors-headers | CORS Support      |
| psycopg2-binary     | PostgreSQL Driver |
| celery              | Task Queue        |
| redis               | Celery Broker     |

### Frontend (`apps/web`)

| Package               | Purpose                 |
| --------------------- | ----------------------- |
| zustand               | State Management (Cart) |
| lucide-react          | Icons                   |
| axios                 | HTTP Client             |
| clsx + tailwind-merge | Utility for Tailwind    |

---

## Key Files Created

### Backend Service Layer

* services.py - Stock deduction logic placeholder
* selectors.py - Complex queries placeholder

### Frontend Store & Hooks

* useCartStore.ts - Zustand cart with persistence
* usePrinter.ts - Browser & RawBT printing

### TypeScript Types

* api.d.ts - API contract interfaces

---

## Next Steps

Proyek siap untuk Phase 1 development:

1. Buat Master Data Produk (Django models)
2. Buat UI Kasir (Product Grid & Cart)
3. Implementasi API endpoint `/api/v1/catalog/products/`
