# refinishing-

## Refinishing Department - Daily Production Management System
### Aditya Birla Lifestyle Brands

A responsive web and mobile application (PWA ready) for real-time tracking, target recalibration, vehicle logistics, attendance register, and production auditing in the Refinishing Department.

---

## 🚀 Features

- **Dashboard & KPIs:** Real-time production progress bar, daily target vs achieved comparison, hourly run-rate, and efficiency metrics.
- **Dynamic Target Recalibration:** Set daily scanning targets and auto-distribute across all 8 shift slots (08:30 AM – 05:00 PM with lunch break 12:30 PM – 01:00 PM), or use Adaptive Catch-Up Mode.
- **Hourly Scanning Entry:** Slot-by-slot tracking with live difference calculations (+/-) and status indicators (Above / On / Below / Critical).
- **Batch Production Management:** Track and log in-process garments and batches per shift hour.
- **Vehicle Logistics:**
  - **Inward / Unloading:** Track incoming vehicles, vendor source, box count, and quantities.
  - **Outward / Loading:** Track dispatch vehicles, destination distribution, boxes, and quantities.
- **Daily Attendance Register:** Track operator attendance, present/absent roster, and auto-populate shift attendance.
- **Seen / Audit Tracking:** Track viewer role access logs per hour with timestamps and operator credentials.
- **Role-Based Access Control:**
  - `DATA ENTRY`: Full write, update, and recalculation capabilities.
  - `VIEWER`: Read-only access with audit logging.
- **Google Cloud Firestore Integration:** Real-time cloud sync with offline local cache fallback.
- **Cross-Platform Responsive Design:** Full desktop layout with sidebar + mobile navigation drawer and bottom bar for smartphones and tablets.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite 8, Lucide React Icons
- **Styling:** Vanilla CSS design system with responsive flex/grid layouts
- **Database & Auth:** Google Firebase (Cloud Firestore & Firebase Auth)
- **Deployment:** GitHub Pages / Firebase Hosting / Vercel

---

## 💻 Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Gagan9025/refinishing-.git
   cd refinishing-
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🔐 Demo Credentials

- **Data Entry Role:**
  - Username: `entry`
  - Password: `entry123`
- **Viewer Role:**
  - Username: `viewer`
  - Password: `viewer123`
