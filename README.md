# Library Management System (LMS)

A robust, full-stack application designed to streamline library operations, automate member notifications, and manage book inventories. Built with **Node.js**, **Express**, and **MongoDB**.

## Key Features

### Authentication & Security
- **Secure Registration**: Multi-step registration with OTP verification.
- **JWT Authorization**: Role-based access control (Admin vs. User) using JSON Web Tokens.
- **Data Protection**: Industry-standard password hashing using **Bcrypt**.

### Book & Inventory Management
- **Full CRUD**: Admins can add, update, and delete books from the catalog.
- **Real-time Availability**: Automatic tracking of book quantities and availability status.

### Borrowing & Fine System
- **Borrowing Workflow**: Users can borrow books; the system records due dates and borrower details.
- **Smart Returns**: Automatic stock updates upon book return.
- **Fine Calculator**: Integrated utility to calculate hourly fines for overdue books.

### Automation & AI (Background Tasks & Chatbot)
- **AI Library Assistant**: Integrated Gemini AI chatbot to help users with book recommendations, library hours, and policy queries.
- **Overdue Notifications**: A cron job runs every 30 minutes to identify overdue books and send automated email reminders to users.
- **Database Cleanup**: An automated service runs every 5 minutes to remove unverified accounts that have expired, keeping the database optimized.

---

## Tech Stack

- **Server**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Automation**: Node-cron (Scheduled Tasks)
- **Media**: Cloudinary (Admin/User Avatars)
- **Email**: Nodemailer (SMTP Integration)
- **Security**: JWT, Bcrypt, Cookie-parser

---

