# 🌐 Blogosphere

<div align="center">

![MERN Stack](https://img.shields.io/badge/MERN-Stack-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

**A modern, feature-rich blogging platform with real-time collaboration and monetization**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Configuration](#-configuration) • [Documentation](#-documentation)

</div>

---

## 📝 About

Blogosphere is a full-stack blogging platform that combines the power of modern web technologies to deliver a seamless writing and reading experience. Built with the MERN stack, it features real-time messaging, collaborative whiteboards, payment integration, and a beautiful, responsive UI with a custom forest green and cream color palette.

## ✨ Features

### 📱 Core Features
- **Rich Text Editor** - Create beautiful blog posts with Quill.js
- **Markdown Support** - Write in Markdown with live preview
- **Draft System** - Save and manage drafts before publishing
- **Tags & Categories** - Organize content with tags (Technology, Lifestyle, Travel, Food, Design, General)
- **Search & Filter** - Find articles by title, content, or tags
- **Reading Time** - Automatic reading time calculation
- **Favorites & Likes** - Bookmark and like your favorite posts
- **Image Upload** - Cloudinary integration for optimized images

### 👥 Social Features
- **User Profiles** - Customizable profiles with 50+ unique avatars
- **Follow System** - Follow your favorite writers
- **Real-time Messaging** - Chat with mutual followers using Socket.io
- **Collaborative Whiteboard** - Draw and brainstorm together in real-time
- **Notifications** - Stay updated with likes, comments, follows, and donations
- **Comments** - Engage with nested comment threads
- **User Discovery** - Find and connect with other writers

### 💰 Monetization
- **Buy Me a Coffee** - Support creators with Razorpay integration
- **Supporters Leaderboard** - Showcase top supporters on profiles
- **Payment Analytics** - Track earnings, donations, and monthly trends
- **Anonymous Support** - Option for private donations
- **Custom Messages** - Send personal messages with donations
- **Public/Private Visibility** - Control supporter list visibility

### 🔐 Authentication & Security
- **Email/Password Auth** - Traditional registration with OTP verification
- **Google OAuth** - Quick sign-in with Google
- **JWT Tokens** - Secure authentication with access and refresh tokens
- **Redis Sessions** - Fast session management and caching
- **Rate Limiting** - API protection against abuse
- **Password Reset** - Secure password recovery flow
- **Admin Dashboard** - User management and content moderation

### 🎨 Design & UX
- **Responsive Design** - Works seamlessly on all devices
- **Custom Theme** - Forest green (#306D29) and cream (#FBF5DD) color palette
- **Toast Notifications** - Beautiful feedback messages with react-hot-toast
- **Loading States** - Smooth loading indicators throughout
- **Empty States** - Helpful messages when no content is available
- **Avatar Picker** - Choose from 50+ unique avatars
- **Smooth Animations** - Polished transitions and hover effects

---

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library with hooks
- **Vite** - Lightning-fast build tool
- **React Router v6** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Quill.js** - Rich text editor
- **Socket.io Client** - Real-time bidirectional communication
- **React Hot Toast** - Toast notifications
- **Lucide React** - Beautiful icon library
- **Axios** - HTTP client

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - WebSocket server for real-time features
- **Redis** - In-memory data store for caching
- **JWT** - JSON Web Tokens for authentication
- **Passport.js** - Authentication middleware with Google OAuth
- **Razorpay** - Payment gateway integration
- **Cloudinary** - Cloud-based image management
- **Multer** - File upload handling
- **Bcrypt** - Password hashing
- **Express Validator** - Request validation
- **Express Rate Limit** - API rate limiting

### DevOps & Tools
- **Nodemon** - Auto-restart development server
- **ESLint** - Code linting
- **dotenv** - Environment variable management
- **CORS** - Cross-origin resource sharing

---

## 🚀 Installation

### Prerequisites
- Node.js >= 18.0.0
- MongoDB >= 5.0
- Redis (optional, for caching)
- Cloudinary account
- Razorpay account (for payments)
- Google OAuth credentials (optional)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/blogosphere.git
cd blogosphere
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in `backend/` directory:
```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/blogosphere

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_ACCESS_SECRET=your_access_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email (optional - Resend)
RESEND_API_KEY=your_resend_api_key

# SMS (optional - Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create `.env` file in `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 4. Run the Application

**Start Backend:**
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:5000`

**Start Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

Visit `http://localhost:5173` in your browser 🎉

---

## ⚙️ Configuration

### MongoDB Setup
1. Install MongoDB locally or use MongoDB Atlas
2. Create a database named `blogosphere`
3. Update `MONGO_URI` in backend `.env`

### Redis Setup (Optional)
1. Install Redis locally or use Redis Cloud
2. Update Redis credentials in backend `.env`
3. If Redis is not available, the app will fall back to memory storage

### Razorpay Setup
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/signup)
2. Navigate to Settings → API Keys
3. Generate **Test Mode** API Keys
4. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to backend `.env`
5. Add `VITE_RAZORPAY_KEY_ID` to frontend `.env`
6. Test with card: `4111 1111 1111 1111`, CVV: `123`, Expiry: Any future date

For detailed setup, see [docs/RAZORPAY_SETUP.md](docs/RAZORPAY_SETUP.md)

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to backend `.env`

### Cloudinary Setup
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and API Secret from Dashboard
3. Add credentials to backend `.env`

---

## 📚 Documentation

- [Razorpay Integration Guide](docs/RAZORPAY_INTEGRATION.md) - Complete payment setup
- [Quick Start Guide](docs/QUICK_START.md) - Get started in 5 minutes
- [Payment Setup](docs/PAYMENT_SETUP.md) - Detailed payment configuration

---

## 🗂 Project Structure

```
blogosphere/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuration files (DB, Redis, Passport, etc.)
│   │   ├── controllers/      # Route controllers
│   │   ├── middlewares/      # Custom middlewares (auth, validation, etc.)
│   │   ├── models/           # Mongoose models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic services
│   │   ├── utils/            # Utility functions
│   │   ├── events/           # Socket.io event handlers
│   │   └── app.js            # Express app configuration
│   ├── server.js             # Entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── context/          # Context providers (Auth, etc.)
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service layer
│   │   ├── utils/            # Utility functions
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Entry point
│   ├── public/               # Static assets
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js    # Tailwind configuration
│   └── .env.example
├── docs/                     # Documentation
├── .gitignore
└── README.md
```

---

## 🔑 Key Features Explained

### Real-time Messaging
- Socket.io powered instant messaging between mutual followers
- Message read status and timestamps
- Conversation list with last message preview
- Hide/unhide conversations
- Deleted user handling with graceful degradation

### Collaborative Whiteboard
- Real-time drawing canvas using Socket.io
- Multiple users can draw simultaneously
- Color picker and brush size controls
- Clear canvas and save drawing functionality
- Perfect for brainstorming and collaboration

### Payment Integration
- Razorpay payment gateway integration
- Coffee-based donation system (₹50 per coffee, 1-100 coffees)
- HMAC SHA256 signature verification for security
- Anonymous and public support options
- Custom messages with donations
- Payment history and analytics
- Earnings dashboard for creators
- Top supporters leaderboard

### Admin Dashboard
- User management (approve/delete users)
- Content moderation capabilities
- Platform statistics and analytics
- Recent activity monitoring
- Pending user approvals

### Notification System
- Real-time notifications for:
  - New followers
  - Likes on posts
  - Comments on posts
  - Coffee donations received
  - Admin approvals
- Unread notification count
- Mark as read functionality

---

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/send-otp` - Send OTP for verification
- `POST /api/auth/verify-otp` - Verify OTP
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users/me` - Get current user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/avatar` - Update avatar
- `PUT /api/users/password` - Change password
- `POST /api/users/follow/:id` - Follow/unfollow user
- `GET /api/users/:id/followers` - Get user followers
- `GET /api/users/:id/following` - Get user following

### Blogs
- `GET /api/blogs` - Get all blogs (with filters)
- `GET /api/blogs/:slug` - Get blog by slug
- `POST /api/blogs` - Create new blog
- `PUT /api/blogs/:id` - Update blog
- `DELETE /api/blogs/:id` - Delete blog
- `POST /api/blogs/:id/like` - Like/unlike blog
- `GET /api/blogs/:id/comments` - Get blog comments
- `POST /api/blogs/:id/comments` - Add comment

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/received` - Get received payments
- `GET /api/payments/sent` - Get sent payments
- `GET /api/payments/supporters/:userId` - Get public supporters
- `GET /api/payments/stats` - Get payment statistics

### Messages
- `GET /api/chat/conversations` - Get all conversations
- `GET /api/chat/messages/:conversationId` - Get messages
- `POST /api/chat/messages` - Send message
- `PUT /api/chat/messages/:id/read` - Mark message as read
- `POST /api/chat/hide/:conversationId` - Hide conversation

### Notifications
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- Follow existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes before submitting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🐛 Known Issues

- Redis is optional; app falls back to memory storage if unavailable
- File uploads require Cloudinary configuration
- Email/SMS features require Resend/Twilio setup

---

## 🔮 Future Enhancements

- [ ] Email notifications for new followers and comments
- [ ] Blog post scheduling
- [ ] Advanced search with Elasticsearch
- [ ] Blog series/collections
- [ ] Reading lists
- [ ] User badges and achievements
- [ ] Export blog posts to PDF/Markdown
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Blog post analytics (views, engagement)

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Name](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI library
- [Express.js](https://expressjs.com/) - Backend framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Socket.io](https://socket.io/) - Real-time engine
- [Razorpay](https://razorpay.com/) - Payment gateway
- [Cloudinary](https://cloudinary.com/) - Image hosting
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [Quill.js](https://quilljs.com/) - Rich text editor

---

## 📊 Project Stats

- **Lines of Code**: 15,000+
- **Components**: 30+
- **API Endpoints**: 50+
- **Features**: 40+

---

<div align="center">

Made with ❤️ and ☕

**⭐ Star this repo if you find it helpful!**

[Report Bug](https://github.com/yourusername/blogosphere/issues) • [Request Feature](https://github.com/yourusername/blogosphere/issues)

</div>
