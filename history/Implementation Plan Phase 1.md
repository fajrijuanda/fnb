# Phase 1: Core Catalog & POS UI

Implementasi master data produk dan UI kasir dasar sesuai blueprint.

---

## Proposed Changes

### Backend - Catalog Module

#### [MODIFY]

models.py

* Create

  Category model (id, name, slug, icon, order)
* Create

  Product model dengan fields sesuai ERD:

  * id, `name`, `price`, `image`, `category` (FK)
  * `track_inventory` (Boolean: True=Barang Jadi, False=Racikan)
  * `current_stock` (untuk Barang Jadi)
  * `is_available` (manual toggle)

#### [NEW]

serializers.py

* `CategorySerializer`
* `ProductSerializer` dengan computed field

  stock_status

#### [MODIFY]

views.py

* `CategoryViewSet` (list, retrieve)
* `ProductViewSet` (list with category filter, retrieve)

#### [NEW]

urls.py

* Route: `/api/v1/catalog/categories/`
* Route: `/api/v1/catalog/products/`

---

### Backend - Core Configuration

#### [MODIFY]

settings.py

* Add installed apps: `rest_framework`, `corsheaders`, `catalog`, `inventory`, `sales`
* Configure DRF settings
* Configure CORS for Next.js dev server

#### [NEW]

urls.py (update)

* Include catalog URLs with `/api/v1/` prefix

---

### Frontend - POS UI

#### [MODIFY]

ProductGrid.tsx

* Implement actual product fetching from API
* Add category filter tabs
* Create `ProductCard` sub-component

#### [MODIFY]

CartSheet.tsx

* Connect to Zustand cart store
* Implement quantity controls (+/-)
* Show running total with

  formatRupiah()

#### [NEW]

page.tsx

* Main POS cashier page layout
* Split view: ProductGrid + CartSheet
* Responsive design (mobile: bottom cart, tablet: side panel)

---

## Verification Plan

### Automated Tests

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all p-3 my-2 rounded-sm bg-list-hover-subtle"><div class="w-full h-full text-xs cursor-text"><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk5"># Backend</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk14">cd</span><span class="mtk1"></span><span class="mtk12">apps/api</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk14">python</span><span class="mtk1"></span><span class="mtk12">manage.py</span><span class="mtk1"></span><span class="mtk12">makemigrations</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk14">python</span><span class="mtk1"></span><span class="mtk12">manage.py</span><span class="mtk1"></span><span class="mtk12">migrate</span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk14">python</span><span class="mtk1"></span><span class="mtk12">manage.py</span><span class="mtk1"></span><span class="mtk12">runserver</span></div></div><div class="code-line" data-line-number="6" data-line-start="6" data-line-end="6"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="7" data-line-start="7" data-line-end="7"><div class="line-content"><span class="mtk5"># Frontend</span></div></div><div class="code-line" data-line-number="8" data-line-start="8" data-line-end="8"><div class="line-content"><span class="mtk14">cd</span><span class="mtk1"></span><span class="mtk12">apps/web</span></div></div><div class="code-line" data-line-number="9" data-line-start="9" data-line-end="9"><div class="line-content"><span class="mtk14">npm</span><span class="mtk1"></span><span class="mtk12">run</span><span class="mtk1"></span><span class="mtk12">dev</span></div></div><div class="code-line" data-line-number="10" data-line-start="10" data-line-end="10"><div class="line-content"><span class="mtk14">npm</span><span class="mtk1"></span><span class="mtk12">run</span><span class="mtk1"></span><span class="mtk12">lint</span></div></div></div></div></div></pre>

### Manual Verification

1. Access Django Admin untuk input sample products
2. Test API endpoint `/api/v1/catalog/products/` via browser
3. Verify POS UI displays products from API
4. Test cart add/remove functionality
