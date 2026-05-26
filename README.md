# 📚 Library Management System (LMS) - Full-Stack AI Integrated

A sophisticated, production-ready Library Management System designed for modern libraries. This application automates complex administrative tasks, leverages **Gemini AI** for member assistance, processes secure payments via **Stripe**, and ensures high security with role-based access control.

---

## Key Features

### AI-Powered Library Assistant
- **Gemini AI Integration**: A smart chatbot that provides book recommendations, explains library policies, and answers questions about library hours using real-time catalog context.
- **Context-Aware**: The AI understands the current state of the library inventory to provide accurate availability info.

### Financial & Transaction Management
- **Stripe Payment Gateway**: Securely process fine payments and other financial transactions.
- **Comprehensive Tracking**: Complete financial oversight with a dedicated transaction tracking system that records payments, fines, and historical data.

### Dashboard Analytics & Visualizations
- **Admin Dashboard**: Interactive visualizations (Pie and Bar charts) for inventory distribution, borrowing trends, and financial revenue.
- **Advanced Filtering & Search**: Efficiently manage library records by filtering through active, overdue, and returned books, alongside instant text-search capabilities by user name and email.

### Advanced Security & Auth
- **Multi-Step Registration**: Secure user onboarding with **OTP (One-Time Password)** verification via email.
- **Role-Based Access Control (RBAC)**: Distinct permissions for **Admins** (Inventory/User management, Financial oversight) and **Members** (Borrowing/Profile, Payments).
- **JWT Authentication**: Secure stateless sessions using JSON Web Tokens and HTTP-only cookies.
- **Password Protection**: Industry-standard password hashing using **Bcrypt**.

### Personalized User Experience
- **User Profiles**: Customizable user profiles with avatar uploads powered by **Cloudinary**.
- **Bookmarking**: Users can save or bookmark their favorite books to a personal reading list.
- **Account Management**: Comprehensive account controls including password recovery via OTP and options for soft or permanent account deletion.

### Inventory & Borrowing System
- **Dynamic Catalog**: Full CRUD operations for books with real-time stock tracking and directional arrow navigation.
- **Smart Borrowing**: Automated tracking of due dates, return statuses, and borrowing history.
- **Reservations**: Users can easily reserve books and manually cancel them at any time.
- **Fine Management**: Integrated utility that calculates overdue fines based on precise return timestamps.

### Interactive Notification System
- **Dynamic Alerts**: Real-time bell icon notifications that alert users to unread updates (e.g., overdue warnings, payment confirmations) and automatically update their state once read.

### Automation & Background Services
- **Automated Reminders**: A background cron service sends automated email notifications for overdue books every 30 minutes.
- **Self-Cleaning Database**: Automated cleanup of unverified or expired accounts to maintain database efficiency.
- **Reservation Management**: A dedicated background service that automatically expires and cancels uncollected book reservations after 24 hours, returning the stock to the catalog.

---

## Technology Stack

### Backend (Node.js Ecosystem)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI Engine**: Google Generative AI (@google/generative-ai)
- **Payments**: Stripe API
- **Automation**: Node-cron
- **File Storage**: Cloudinary (User Avatars)
- **Email Service**: Nodemailer (SMTP)
- **Security**: JWT, Bcrypt, Cookie-parser

### Frontend (React Ecosystem)
- **Library**: React 18 with TypeScript
- **Styling**: Tailwind CSS for a modern, responsive UI
- **Animations**: Motion (Framer Motion)
- **Data Visualization**: Interactive Charts (e.g., Recharts)
- **Icons**: Lucide React
- **Networking**: Axios
- **State Management**: Context API
- **Tooling**: Vite (Build tool), ES Lint

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas or local instance
- Gemini API Key (from Google AI Studio)
- Stripe API Keys

### Installation
1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/rrana58/Library_Management_System-LMS-.git
    ```
2.  **Backend Setup**:
    ```bash
    cd server
    npm install
    # Create /config/config.env and add your MONGO_URI, JWT_SECRET, GEMINI_API_KEY, and STRIPE_SECRET_KEY
    npm run dev
    ```
3.  **Frontend Setup**:
    ```bash
    cd ../frontend
    npm install
    # Set up frontend .env variables (e.g., VITE_STRIPE_PUBLIC_KEY)
    npm run dev
    ```

---

## License
This project is licensed under the ISC License.

---
*Built with ❤️ for a better library experience.*
