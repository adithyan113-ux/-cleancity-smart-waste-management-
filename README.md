# AI-Powered Smart Waste Management and Dynamic Collection Optimization System
## Mobile-First Responsive Design & WCAG 2.2 AA Accessibility (CleanCity)

A unified **React + Django** full-stack web application engineered for all screen sizes from **320px compact mobile screens** up to **1440px+ widescreen desktops**. No separate mobile app required.

---

### Key Features & Acceptance Verification

#### 1. Mobile-First Responsive Layout (320px to 1440px+)
- **Fluid Breakpoints**: Supports 320px, 375px (iPhone SE), 390px (iPhone 14/15/16), 768px (iPad / Tablets), 1024px (Small Laptops), and 1440px (Desktop).
- **Touch-Friendly Controls**: Interactive elements, buttons, and form inputs are sized to at least **44 × 44 CSS pixels** with generous tap padding.
- **No Horizontal Scroll**: Zero horizontal page overflow across all mobile screens. Tables convert to responsive cards on smaller viewports.
- **Embedded Viewport Tester**: An interactive top toolbar allows instant previewing at 320px, 375px, 390px, 768px, 1024px, and 1440px.

#### 2. Mobile Navigation
- **Responsive Top Bar**: Displays logo, live citizen reward points pill, role switcher, and hamburger menu.
- **Slide-in Mobile Drawer**: Accessible (`role="dialog"`, Esc key close, backdrop tap close) navigation drawer with user summary and demo role switcher.
- **Mobile Thumb-Friendly Bottom Navigation**: Quick access to Dashboard, Map, Rewards, Driver Stops, and a prominent floating **+ Report Waste** camera button.

#### 3. Mobile Garbage Reporting
- **Dual Camera & Gallery**:
  - Live photo capture directly via phone camera (`capture="environment"`).
  - Existing photo upload from device gallery.
- **Client-Side Image Compression**: Compresses photos client-side using HTML5 Canvas down to max 1280px / 80% JPEG before upload, dramatically reducing mobile data usage and upload times.
- **Interactive Map Location Picker**: Leaflet map with drag-and-drop pin and tap-to-select coordinates.
- **On-Demand Browser Geolocation**: Requests GPS permission only when the user taps "Use My GPS". Never forces permission just to browse.
- **Server-Side AI Vision Model Inference**: Automatically classifies waste (Plastic, Organic, E-Waste, Hazardous, Glass & Metal, Mixed Debris), calculates urgency severity, confidence score, and awards **+20 Reward Points**.
- **Duplicate Submission Prevention**: Submit button disables immediately with a live progress state to prevent double submissions.
- **Inline Accessible Validation**: Field-level validation messages with `aria-invalid` and `role="alert"`.

#### 4. Mobile Citizen Dashboard
- **Reward Points**: Live balance counter (+20 pts per approved report).
- **Milestone Progress Bar**: Visual progress tracker toward the next 100-point voucher milestone with progress percentages and points remaining.
- **Report Statistics**: Real-time counts for Approved, Pending, In Progress, and Resolved reports.
- **Recent Report Cards**: Mobile-optimized report cards with thumbnail, severity tag, and multi-channel status pills (icon + color + text label).
- **Active Vouchers**: Lists redeemed vouchers with a 1-tap clipboard copy button.

#### 5. Mobile Map & Route Interface
- **Orientation Resilience**: Leaflet map auto-resizes via `invalidateSize()` upon device rotation or viewport resize.
- **Touch Markers**: 44px color-coded markers (Red for Urgent, Orange for High, Blue for Medium, Green for Resolved).
- **Dynamic Route Optimization**: Priority-weighted nearest-neighbor algorithm optimizes collection stop sequences for municipal vehicles.
- **Turn-by-Turn Navigation**: Direct Google Maps GPS navigation links for collection workers.
- **Transparent Simulation Notice**: Clearly displays simulated demo routing without fabricating GPS tracking.

#### 6. Accessibility (WCAG 2.2 AA)
- **High Contrast Mode**: Accessible contrast toggle exceeding 4.5:1 ratios.
- **Text Resizing**: Scalable font settings (100%, 115%, 125%) without breaking layouts.
- **Keyboard Navigation**: Skip-to-main-content link, logical tab indexes, and `:focus-visible` emerald outlines.
- **Multi-Modal Status**: Never relies on color alone; every status includes descriptive text and icons.
- **Reduced Motion**: Full support for `prefers-reduced-motion` media query.

#### 7. Progressive Web App (PWA) Support
- Web App Manifest (`manifest.json`) enabling **Add to Home Screen** on Android, iOS, and desktop browsers.
- Service Worker (`sw.js`) provides app shell offline caching while keeping report submissions and status checks strictly network-first for data integrity.

---

#### 8. Unified Role-Based Login & Auto-Redirection
- **Single Entry Point**: One unified, user-attractive login page for Citizens, Sanitation Drivers, and Municipal Admins.
- **Smart Role-Based Redirection**:
  - **Citizen** $\rightarrow$ Automatically redirects to **Citizen Dashboard** (`dashboard`).
  - **Worker** $\rightarrow$ Automatically redirects to **Driver Collection Routes & Stops** (`worker`).
  - **Admin** $\rightarrow$ Automatically redirects to **Municipal Supervision & Dispatch Portal** (`admin`).
- **Single Superuser Admin Enforcement**:
  - Exactly **one admin account** (`admin1`) exists for the entire project.
  - The admin is strictly configured as a Django **superuser** (`is_superuser=True`, `is_staff=True`).
  - Registration and model-level constraints strictly reject any attempt to create a second administrator.
- **1-Tap Quick Demo Access**: Interactive cards to immediately test Citizen (`citizen1`), Worker (`worker1`), or Admin (`admin1`) with automated redirection.
- **Log Out & Switch User**: Accessible 1-tap Logout buttons in desktop and mobile navigation allow returning to the login page anytime.

---

### Demo Accounts & Quick Switcher

You can log in manually or use the 1-Tap Quick Demo buttons on the login page:

| Role | Username / Email | Password | Full Name | Status | Automatic Redirect Landing Page |
|---|---|---|---|---|---|
| **Citizen** | `citizen1` | `password123` | Sarah Jenkins | Citizen User | **Citizen Dashboard** (Points, Reports, Vouchers) |
| **Worker** | `worker1` | `password123` | Dave Miller | Field Driver | **Driver Routes Console** (Stops, GPS Navigation, Status) |
| **Admin** | `admin1` | `password123` | Elena Martinez | **Exclusive Superuser (Only 1 Admin)** | **Municipal Admin Portal** (Report Review & TSP Dispatch) |

---

### Running the System Locally

#### 1. Backend (Django REST Framework)
```powershell
cd C:\Users\LOQ\.gemini\antigravity\scratch\smart_waste_system\backend
python manage.py runserver 127.0.0.1:8000
```
- API Base: `http://127.0.0.1:8000/api/`
- Admin Panel: `http://127.0.0.1:8000/admin/`

#### 2. Frontend (React + Vite + Tailwind CSS)
```powershell
cd C:\Users\LOQ\.gemini\antigravity\scratch\smart_waste_system\frontend
npm.cmd run dev
```
- Local URL: `http://localhost:5173/`
- Network URL: Accessible from any phone on the local Wi-Fi!

#### 3. Running Backend Tests
```powershell
cd C:\Users\LOQ\.gemini\antigravity\scratch\smart_waste_system\backend
python manage.py test api
```
*(11 tests verify unified login, role redirection, email authentication, reporting, voucher redemption, role restrictions, and route status updates)*
