# 📚 Library Management System (LMS) - Full-Stack AI Integrated

A sophisticated, production-ready Library Management System designed for modern libraries. This application automates complex administrative tasks, leverages **Gemini AI** for member assistance, and ensures high security with role-based access control.

---

## 🌟 Key Features

### 🤖 AI-Powered Library Assistant
- **Gemini AI Integration**: A smart chatbot that provides book recommendations, explains library policies, and answers questions about library hours using real-time catalog context.
- **Context-Aware**: The AI understands the current state of the library inventory to provide accurate availability info.

### 🔐 Advanced Security & Auth
- **Multi-Step Registration**: Secure user onboarding with **OTP (One-Time Password)** verification via email.
- **Role-Based Access Control (RBAC)**: Distinct permissions for **Admins** (Inventory/User management) and **Members** (Borrowing/Profile).
- **JWT Authentication**: Secure stateless sessions using JSON Web Tokens and HTTP-only cookies.
- **Password Protection**: Industry-standard password hashing using **Bcrypt**.

### 📖 Inventory & Borrowing System
- **Dynamic Catalog**: Full CRUD operations for books with real-time stock tracking.
- **Smart Borrowing**: Automated tracking of due dates, return statuses, and borrowing history.
- **Fine Management**: Integrated utility that calculates overdue fines based on precise return timestamps.

### ⚙️ Automation & Background Services
- **Automated Reminders**: A background cron service sends automated email notifications for overdue books every 30 minutes.
- **Self-Cleaning Database**: Automated cleanup of unverified or expired accounts to maintain database efficiency.

---

## 🛠️ Technology Stack

### Backend (Node.js Ecosystem)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI Engine**: Google Generative AI (@google/generative-ai)
- **Automation**: Node-cron
- **File Storage**: Cloudinary (User Avatars & Book Covers)
- **Email Service**: Nodemailer (SMTP)
- **Security**: JWT, Bcrypt, Cookie-parser

### Frontend (React Ecosystem)
- **Library**: React 18 with TypeScript
- **Styling**: Tailwind CSS for a modern, responsive UI
- **Animations**: Motion (Framer Motion)
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

### Installation
1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/rrana58/Library_Management_System-LMS-.git
    ```
2.  **Backend Setup**:
    ```bash
    cd server
    npm install
    # Create /config/config.env and add your MONGO_URI, JWT_SECRET, and GEMINI_API_KEY
    npm run dev
    ```
3.  **Frontend Setup**:
    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```

---

## 📄 License
This project is licensed under the ISC License.

---
*Built with ❤️ for a better library experience.*
