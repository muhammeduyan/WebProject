# Fullstack Gorev Yonetim Sistemi

Bu proje, React + Vite + Tailwind arayuzu ile Node.js/Express API katmanini birlestiren cift kaynakli bir CRUD uygulamasidir.
Arayuzde iki ayri panel bulunur:

- **LocalStorage Paneli:** Ekle/Guncelle/Sil islemleri bu panelden yapilir.
- **API Paneli (Salt Okunur):** API verilerini listeler. API mutation islemleri Swagger UI ile yapilir.

## Gereksinimler

- Node.js 18+
- npm

## Kurulum

### 1) Client (React)

```bash
npm install
```

### 2) Server (Express)

```bash
cd server
npm install
cd ..
```

## Calistirma

Iki ayri terminal acarak client ve server'i birlikte calistirin.

### Terminal 1 - API

```bash
cd server
npm run dev
```

API varsayilan olarak `http://localhost:4000` adresinde calisir.
Swagger UI: `http://localhost:4000/api/docs`

### Terminal 2 - React Client

```bash
npm run dev
```

Client varsayilan olarak `http://localhost:5173` adresinde calisir (gerekirse otomatik olarak `5174` gibi baska bir porta gecebilir).
Frontend istekleri varsayilan olarak Vite proxy ile `/api` uzerinden API'ye yonlendirilir.

## Ortam Degiskenleri

### Client (`.env`)

```bash
# API farkli bir hostta calisiyorsa tanimlayin (opsiyonel)
VITE_API_BASE_URL=http://localhost:4000

# Vite dev proxy hedefini degistirmek icin (opsiyonel)
VITE_API_PROXY_TARGET=http://localhost:4000
```

### Server (`server/.env` veya terminal)

```bash
# API portu (opsiyonel)
PORT=4000

# CORS icin ek izinli origin listesi (virgulle ayri)
CLIENT_ORIGIN=http://localhost:5173,http://localhost:4173
```

## API Endpoint'leri

- `GET /api/health` -> API durum kontrolu
- `GET /api/tasks` -> Tum gorevleri listeler
- `POST /api/tasks` -> Yeni gorev ekler
- `PUT /api/tasks/:id` -> Var olan gorevi gunceller
- `DELETE /api/tasks/:id` -> Gorevi siler
- `GET /api/openapi.json` -> OpenAPI dokumani

### Ornek POST/PUT Body

```json
{
  "title": "TypeScript tekrar et",
  "description": "Generics ve utility type konularini bitir",
  "status": "Devam Ediyor"
}
```

## Build ve Lint

```bash
npm run lint
npm run build
```

## Netlify Deploy Notlari

- Build command: `npm run build`
- Publish directory: `dist`
- SPA fallback icin repo kokunde `netlify.toml` dosyasi eklidir.
- API panelinin Netlify'da veri gostermesi icin API'yi ayri bir ortamda yayinlayip Netlify environment variable olarak `VITE_API_BASE_URL` degeri girilmelidir.
- `VITE_API_BASE_URL` yoksa production ortaminda API paneli otomatik olarak pasif kalir ve sadece bilgilendirme mesaji gosterir.

## Sorun Giderme

- UI'da `Failed to fetch` gorurseniz once API'nin calistigini kontrol edin: `cd server && npm run dev`
- Ardindan client'i tekrar baslatin: `npm run dev`
- API'de CRUD denemeleri icin browser'da `http://localhost:4000/api/docs` adresini acin.
