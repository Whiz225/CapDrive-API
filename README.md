# CapDrive - Backend API

The backend API for CapDrive - a comprehensive car marketplace and ride booking platform built with Node.js, Express, and MongoDB.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Features

- **Authentication & Authorization**

  - JWT-based authentication
  - Role-based access control (User, Dealer, Admin)
  - Email and phone verification
  - Password reset functionality
  - Google OAuth 2.0 integration

- **Car Marketplace**

  - Car listing management (CRUD)
  - Advanced search and filtering
  - Favorites system
  - Dealer profiles with subscription plans
  - Featured listings
  - View count tracking

- **Ride Booking**

  - Real-time ride requests
  - Multiple ride types (Standard, Premium, XL, Luxury)
  - Fare calculation
  - Ride status tracking
  - Driver-rider matching
  - Ride history

- **Payment Integration**

  - Paystack payment gateway
  - Flutterwave payment gateway
  - Payment verification
  - Transaction history

- **Real-time Features**

  - Encrypted chat system (Socket.IO)
  - Typing indicators
  - Read receipts
  - Push notifications

- **Admin Dashboard**
  - User management
  - Car listing moderation
  - Ride monitoring
  - Analytics and reports
  - System configuration

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, Passport.js, bcrypt
- **Real-time**: Socket.IO
- **File Storage**: Cloudinary, AWS S3
- **Caching**: Redis
- **Email**: Nodemailer
- **SMS**: Twilio
- **Payments**: Paystack, Flutterwave
- **Validation**: express-validator
- **Security**: Helmet, CORS, express-mongo-sanitize, xss
- **Logging**: Winston
- **Testing**: Jest, Supertest

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v6 or higher)
- Redis (optional, for caching)
- npm or yarn

### Steps

```bash
# Clone the repository
git clone https://github.com/yourusername/capdrive.git
cd capdrive/backend

# Install dependencies
npm install

# Create environment file
cp config.env.example config.env

# Update environment variables
nano config.env

# Start MongoDB (if running locally)
mongod

# Start Redis (if running locally)
redis-server

# Run the application
npm run dev
```
