# Library Management System (LMS)

A full-stack backend application for managing library operations, built with Node.js, Express, and MongoDB.

## Features Completed

### Authentication & Security
- **User Registration & Login**: Secure entry for users and librarians.
- **JWT Authentication**: Protected routes using JSON Web Tokens.
- **Role-Based Authorization**: Separate permissions for Admins and regular Users.
- **Password Management**: Secure password hashing using Bcrypt.

### User Management (New ✨)
- **Admin Management**: Capability to register new Admin accounts.
- **User Directory**: Implementation of `getAllUsers` to retrieve all registered members.
- **Media Uploads**: Integrated Cloudinary for handling profile pictures.

### Book Management
- **Full CRUD Operations**: Create, Read, Update, and Delete books.
- **Database Integration**: Scalable MongoDB schemas for books and users.

### Borrowing & Fines 
- **Borrow Record**: Track which user has which book.
- **Return Logic**: Update book availability automatically upon return.
- **Fine Calculation**: Automated utility to calculate fines if the due date is exceeded.

## Tech Stack
- **Node.js & Express** (Backend Framework)
- **MongoDB & Mongoose** (Database & Modeling)
- **Cloudinary** (Media Management & Storage)
- **Bcrypt** (Password Encryption)
- **JWT** (Security Tokens)
- **Dotenv** (Environment Configuration)

## Project Structure
- `server/controllers`: Logic for Auth, Books, Borrowing, and **User Management**.
- `server/models`: Database Schemas.
- `server/routes`: API Endpoints.
- `server/utils`: Utility functions like the Fine Calculator.
