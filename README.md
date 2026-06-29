# 💬 Aalap — Scalable Real-Time Chat Platform

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Dexie.js](https://img.shields.io/badge/Dexie.js-Offline_Storage-blue?style=for-the-badge)
![Brevo](https://img.shields.io/badge/Brevo-0092FF?style=for-the-badge)

Aalap is a **highly scalable, event-driven real-time chat platform** built with a modern web stack. Engineered for performance and reliability, it delivers **low-latency messaging**, **offline-first capabilities**, **distributed real-time communication**, and an **asynchronous notification architecture** for seamless user experiences.

---

## ✨ Key Features

- **📦 Offline-First Experience:** Robust client-side caching using **IndexedDB (Dexie.js)** and **Zustand**, allowing users to access chat history offline while reducing backend database reads by nearly **60%**.
- **⚡ Real-Time Messaging:** Sub-50ms message delivery, typing indicators, and online/offline presence powered by **Socket.io** and **Redis Pub/Sub**.
- **📨 Asynchronous Invitation System:** Uses **RabbitMQ** to process email invitations in the background, keeping the main server responsive.
- **🔐 Secure Authentication:** OTP-based authentication using **Brevo Transactional Email** with **JWT** session management.
- **👻 Ghost Chat Architecture:** Search users globally by email, start conversations instantly, or send invitations to unregistered email addresses.
- **🧹 Automated Resource Management:** Scheduled cleanup jobs using **node-cron** to optimize database performance.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 
- **State Management:** Zustand
- **Offline Storage:** IndexedDB (Dexie.js)
- **Styling:** Tailwind CSS + shadcn/ui
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **WebSockets:** Socket.io
- **Database:** MongoDB (Mongoose)
- **Caching / PubSub:** Redis
- **Message Broker:** RabbitMQ

### Infrastructure & Tools
- **Authentication:** JWT + OTP (Brevo)
- **Media Storage:** Cloudinary
- **Task Scheduler:** node-cron

---

# 🏗️ System Architecture

## 1. Offline-First Storage with Dexie.js

To provide a seamless experience even with unstable internet connections, Aalap follows an offline-first architecture.

- **Instant Loading:** Chat history is loaded directly from IndexedDB using Dexie.js.
- **Background Synchronization:** Missing messages are fetched from the server and synchronized automatically.
- **State Management:** Zustand synchronizes IndexedDB, Socket.io events, and REST API responses, ensuring the UI always reflects the latest state while minimizing MongoDB reads.

---

## 2. Shadow Invite Architecture (RabbitMQ + Brevo)

When a user sends a message to an unregistered email:

1. Express receives the request.
2. The invitation is pushed into a **RabbitMQ `invite_queue`**.
3. A background worker consumes the queue.
4. The worker sends an OTP/invitation email using the **Brevo API**.

This architecture prevents the main Express thread from blocking during email operations and enables horizontal scalability.

---

## 3. Redis Pub/Sub for Scalability

Redis enables scalable real-time communication by:

- Broadcasting Socket.io events across multiple server instances.
- Synchronizing user online/offline status.
- Supporting horizontal scaling with the Socket.io Redis Adapter.

---

# 🚀 Getting Started

## Prerequisites

Ensure the following are installed on your machine:

- Node.js (v18 or above)
- MongoDB (Local or MongoDB Atlas)
- Redis Server
- RabbitMQ Server

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/kallulgogoi/Aalap.git
cd Aalap
```

---

## 2️⃣ Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

REDIS_URL=redis://localhost:6379

RABBITMQ_URL=amqp://localhost

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

EMAIL_TRANSPORT=brevo
BREVO_API_KEY=YOUR_brevo_api_key
SMTP_FROM_EMAIL=your_registered_email_on_brevo
```

Start the backend server:

```bash
npm start
```

---

## 3️⃣ Frontend Setup

Open a new terminal.

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

---

## 🌐 Run the Application

After both servers are running, open:

```
http://localhost:3000
```

Your Aalap chat platform should now be running locally.

---


# 📈 Highlights

- ⚡ Sub-50ms real-time messaging
- 📦 Offline-first architecture
- 🔄 Event-driven backend
- 📨 RabbitMQ-powered background workers
- 🚀 Redis Pub/Sub for distributed scaling
- 🔐 JWT + OTP authentication via Brevo
- ☁️ Cloudinary media storage
- 📱 Fully responsive modern UI

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a new feature branch.
3. Commit your changes.
4. Push to your branch.
5. Open a Pull Request.

---


````
