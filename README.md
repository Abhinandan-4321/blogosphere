# 🌐 Blogosphere

<div align="center">

![MERN Stack](https://img.shields.io/badge/MERN-Stack-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![AI Powered](https://img.shields.io/badge/AI-Powered-purple?style=for-the-badge)

**A modern, AI-powered blogging platform with real-time collaboration and creator monetization**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Configuration](#-configuration) • [API Endpoints](#-api-endpoints)

</div>

---

## 📝 About

Blogosphere is a full-stack, AI-powered blogging platform built with the MERN stack. It delivers a refined writing and reading experience with real-time collaboration, AI writing assistance, creator monetization, and a beautiful forest green and cream UI. Every feature is built with thoughtfulness — for writers who treat their craft seriously.

## ✨ Features

### 🤖 AI Features (Powered by Groq — Free Tier)
- **AI Writing Assistant** - Integrated into the editor toolbar with actions: autocomplete, grammar fix, tone adjustment, simplify, and expand
- **AI Blog Chat** - Readers can chat with an AI about any article; floating panel (desktop) or bottom sheet (mobile) with multi-turn conversation
- **Smart Tag Suggestions** - AI suggests relevant tags based on blog content and title
- **Quick Actions** - Pre-configured prompts: Summarize, Key Takeaways, Simplify, Quiz Me, Related Topics
- **Context-Aware** - AI understands the full article content for accurate, relevant answers
- **Rate Limited** - 10 AI requests per user per 15 minutes to prevent abuse

### ✍️ Writing & Editor
- **TipTap Rich Text Editor** - Feature-rich editor with full formatting toolbar
- **Complete Toolbar** - Headings (H1–H3), bold, italic, underline, strikethrough, inline code, blockquote, bullet/ordered lists, code blocks, tables, links, and horizontal rules
- **Draft Autosave** - Drafts save automatically with clear status indicator ("Saving…", "Saved X min ago")
- **Cover Image Upload** - Cloudinary integration for optimized cover images
- **Tags & Categories** - Organize with custom tags and 6 categories (Technology, Lifestyle, Travel, Food, Design, General)
- **Reading Time** - Automatically calculated based on word count
- **Scrollable Editor** - Editor and toolbar contained in a fixed-height scrollable box; content never goes behind navbar

### 📖 Reading Experience
- **Clean Article View** - Distraction-free reading with beautiful typography
- **AI Chat Panel** - Ask AI anything about the article without leaving the page
- **Like & Bookmark** - Save articles to custom folders for later reading
- **Comment System** - Engage with authors and readers
- **Share** - Native share functionality
- **Author Bio** - Author info and follow button on every article

### 👥 Social Features
- **User Profiles** - Customizable profiles with bio, avatar, and stats
- **50+ Unique Avatars** - Diverse avatar picker
- **Follow System** - Follow writers; accurate follower/following counts
- **Real-time Messaging** - Chat with mutual followers using Socket.io
- **Collaborative Whiteboard** - Draw and brainstorm together in real-time
- **Notifications** - Real-time alerts for likes, comments, follows, and donations
- **User Discovery** - Find and connect with other writers

### 💰 Monetization
- **Buy Me a Coffee** - Razorpay-powered coffee donations (₹50/coffee, 1–100 coffees)
- **Landing Page CTA** - Buy Me a Coffee prominently shown on the creator's landing page section
- **Supporters Leaderboard** - Top supporters showcased on creator profiles
- **Payment Analytics** - Earnings dashboard with history and monthly trends
- **Anonymous Donations** - Option for private support
- **Custom Messages** - Personal messages with each donation

### 🔐 Authentication & Security
- **Email/Password Auth** - Registration with OTP email verification
- **Google OAuth** - One-click sign-in with Google
- **JWT + Refresh Tokens** - Secure, stateless authentication
- **Redis Sessions** - Fast session management and token caching
- **Rate Limiting** - API and AI request protection
- **Password Reset** - Secure email-based recovery flow
- **Admin Dashboard** - User management, approvals, and content moderation

### 🎨 Design & UX
- **Responsive Design** - Optimized for desktop, tablet, and mobile
- **Custom Theme** - Forest green (`#306D29`) and cream (`#FBF5DD`) color palette
- **Mobile Bottom Sheets** - Native-feeling panels on mobile (AI chat, comments)
- **Toast Notifications** - Themed feedback with react-hot-toast
- **Smooth Animations** - Polished transitions throughout
- **Sticky Toolbar** - Editor toolbar always visible while writing
- **Empty & Error States** - Helpful fallbacks everywhere

---

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library with hooks
- **Vite** - Lightning-fast build tool
- **React Router v6** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework with custom design tokens
- **TipTap** - Headless rich text editor with full extension support
- **Socket.io Client** - Real-time bidirectional communication
- **React Hot Toast** - Themed toast notifications
- **Lucide React** - Icon library
- **Axios** - HTTP client with interceptors

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - WebSocket server for real-time features
- **Redis** - Session caching and rate limit storage
- **JWT** - Access + refresh token authentication
- **Passport.js** - Google OAuth 2.0
- **Groq SDK** - Free-tier AI via LLaMA 3 models
- **Razorpay** - Payment gateway
- **Cloudinary** - Image upload and optimization
- **Multer** - File upload handling
- **Bcrypt** - Password hashing
- **Express Rate Limit** - API and AI rate limiting

### DevOps & Tools
- **Nodemon** - Auto-restart in development
- **dotenv** - Environment variable management
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers
- **Compression** - Response compression

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

> AI features require a free [Groq API key](https://console.groq.com). Add `GROQ_API_KEY` to your backend `.env`.

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

### AI Writing Assistant
- Integrated directly into the TipTap editor toolbar
- **Actions**: Autocomplete, Fix Grammar, Adjust Tone, Simplify, Expand
- Operates on selected text only (or cursor position for autocomplete)
- AI suggestion modal with accept/reject/edit before applying
- Powered by `llama-3.3-70b-versatile` via Groq's free tier
- Rate limited: 10 requests per user per 15 minutes

### AI Blog Chat
- Floating button on every article page (right edge)
- Slide-in panel on desktop, bottom sheet on mobile
- Pre-loaded quick action chips on first open (Summarize, Key Takeaways, Simplify, Quiz, Related Topics)
- Multi-turn conversation with full article context
- Auto-scrolls to latest message, animated typing indicator
- Clear chat button, auto-cleans state per page visit

### Real-time Messaging
- Socket.io instant messaging between mutual followers
- Read receipts and timestamps
- Conversation list with last message preview
- Hide/unhide conversations
- Graceful handling of deleted users

### Collaborative Whiteboard
- Real-time drawing canvas via Socket.io
- Multi-user simultaneous drawing
- Color picker and brush size controls
- Clear canvas and save functionality

### Payment Integration
- Razorpay gateway with HMAC SHA256 signature verification
- ₹50 per coffee, 1–100 coffees per transaction
- Anonymous and public donation options
- Custom messages with each donation
- Earnings dashboard, payment history, monthly trends
- Top supporters leaderboard on profiles
- Buy Me a Coffee CTA on landing page creator section

### Bookmark System
- Save articles to named folders
- Stale bookmark auto-cleanup when a bookmarked blog is deleted
- Accurate folder counts via MongoDB aggregation

### Admin Dashboard
- User management (approve, change role, delete)
- Content moderation
- Platform statistics and recent activity

### Notification System
- Real-time alerts for: new followers, likes, comments, donations, admin approvals
- Unread count badge
- Mark individual or all as read

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
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users/me` - Get current user
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/avatar` - Update avatar
- `PUT /api/users/password` - Change password
- `POST /api/users/follow/:id` - Follow/unfollow user
- `GET /api/users/:id/followers` - Get followers
- `GET /api/users/:id/following` - Get following

### Blogs
- `GET /api/blogs` - Get all published blogs (filterable)
- `GET /api/blogs/:slug` - Get blog by slug
- `POST /api/blogs` - Create blog
- `PUT /api/blogs/:id` - Update blog
- `DELETE /api/blogs/:id` - Delete blog
- `POST /api/blogs/:id/like` - Toggle like
- `GET /api/blogs/:id/comments` - Get comments
- `POST /api/blogs/:id/comments` - Add comment

### Bookmarks
- `GET /api/bookmarks` - Get all bookmarked blogs
- `POST /api/bookmarks/:blogId` - Toggle bookmark
- `GET /api/bookmarks/folders` - Get bookmark folders
- `PATCH /api/bookmarks/:blogId/folder` - Move to folder
- `GET /api/bookmarks/:blogId/status` - Check bookmark status

### AI
- `POST /api/ai/writing-assist` - Writing assistant (editor)
- `POST /api/ai/suggest-tags` - Auto-suggest tags
- `POST /api/ai/blog-chat` - Chat with AI about a blog

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment signature
- `GET /api/payments/received` - Received payments
- `GET /api/payments/sent` - Sent payments
- `GET /api/payments/supporters/:userId` - Public supporters list
- `GET /api/payments/stats` - Payment statistics

### Messages
- `GET /api/chat/conversations` - Get conversations
- `GET /api/chat/messages/:conversationId` - Get messages
- `POST /api/chat/messages` - Send message
- `PUT /api/chat/messages/:id/read` - Mark as read
- `POST /api/chat/hide/:conversationId` - Hide conversation

### Notifications
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread-count` - Unread count
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

- [ ] AI-generated cover images (DALL-E / Stable Diffusion)
- [ ] AI content recommendations (personalized feed)
- [ ] Blog post scheduling
- [ ] Email notifications for followers and comments
- [ ] Advanced search with Elasticsearch
- [ ] Blog series/collections
- [ ] Export to PDF/Markdown
- [ ] Dark mode toggle
- [ ] Blog analytics (views, read time, engagement)
- [ ] Multi-language support

---

## 👨‍💻 Author

**Abhinandan Gupta**
- GitHub: [@Abhinandan-4321](https://github.com/Abhinandan-4321)
- LinkedIn: [Abhinandan Gupta](https://www.linkedin.com/in/hey-abhinandan-gupta/)
- Email: abhinandan.develops@gmail.com

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI library
- [Express.js](https://expressjs.com/) - Backend framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Socket.io](https://socket.io/) - Real-time engine
- [Razorpay](https://razorpay.com/) - Payment gateway
- [Cloudinary](https://cloudinary.com/) - Image hosting
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [TipTap](https://tiptap.dev/) - Rich text editor
- [Groq](https://groq.com/) - Free-tier AI inference

---

## 📊 Project Stats

- **Lines of Code**: 18,000+
- **React Components**: 35+
- **API Endpoints**: 55+
- **Features**: 50+
- **AI Actions**: 8 (3 routes, 5 writing actions)

---

<div align="center">

Made with ❤️ and ☕

**⭐ Star this repo if you find it helpful!**

[Report Bug](https://github.com/Abhinandan-4321/blogosphere/issues) • [Request Feature](https://github.com/Abhinandan-4321/blogosphere/issues)

</div>
