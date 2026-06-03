# Blog Application Backend

MERN stack blogging platform backend with MVC architecture, RBAC, Google OAuth, 2FA, real-time features, and Redis caching.

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB Atlas (Mongoose)
- **Cache/Pub-Sub**: Redis Cloud (ioredis)
- **Real-time**: Socket.io
- **Image Uploads**: Cloudinary
- **Auth**: JWT + Passport.js (Google OAuth 2.0)
- **2FA**: Email OTP (Resend) + SMS OTP (Twilio)
- **Email**: Resend

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Redis Cloud account
- Cloudinary account
- Google Cloud OAuth credentials
- Resend API key
- Twilio account (for SMS 2FA)

### Setup

1. **Clone and install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in all values in `.env`.

3. **Google OAuth Setup**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a project → APIs & Services → Credentials
   - Create OAuth client ID (Web application)
   - Add redirect URI: `http://localhost:5000/api/auth/google/callback`
   - Copy Client ID and Secret to `.env`

4. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Auth (`/api/auth`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login with email/password |
| POST | `/send-otp` | Send OTP (email or SMS) |
| POST | `/verify-otp` | Verify OTP |
| GET | `/google` | Google OAuth login |
| GET | `/google/callback` | Google OAuth callback |
| POST | `/refresh-token` | Refresh access token |
| POST | `/logout` | Logout (blacklist token) |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password |

### Users (`/api/users`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/me` | Get current user profile |
| PUT | `/me` | Update profile |
| PUT | `/me/avatar` | Update avatar |
| PUT | `/me/password` | Change password |
| GET | `/me/liked-posts` | Get liked posts |
| GET | `/:id` | Get public profile |
| GET | `/:id/blogs` | Get user's blogs |
| POST | `/:id/follow` | Toggle follow/unfollow |
| GET | `/:id/followers` | Get followers |
| GET | `/:id/following` | Get following |

### Blogs (`/api/blogs`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/` | Create blog |
| GET | `/` | List blogs (paginated) |
| GET | `/feed` | Personalized feed |
| GET | `/:slug` | Get blog by slug |
| PUT | `/:id` | Update blog |
| PATCH | `/:id/visibility` | Toggle visibility |
| DELETE | `/:id` | Delete blog |
| POST | `/:blogId/like` | Toggle like |
| GET | `/:blogId/like` | Get like status |
| POST | `/:blogId/comments` | Add comment |
| GET | `/:blogId/comments` | Get comments |
| DELETE | `/:blogId/comments/:commentId` | Delete comment |

### Notifications (`/api/notifications`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Get notifications |
| PATCH | `/read-all` | Mark all read |
| PATCH | `/:id/read` | Mark one read |

### Drafts (`/api/drafts`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List drafts |
| GET | `/:id` | Get draft |
| DELETE | `/:id` | Delete draft |

### Admin (`/api/admin`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/dashboard` | Dashboard stats |
| GET | `/users` | List all users |
| PATCH | `/users/:id/approve` | Approve user |
| PATCH | `/users/:id/role` | Change role |
| DELETE | `/users/:id` | Delete user |
| DELETE | `/blogs/:id` | Delete any blog |

## WebSocket Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `draft:save` | `{ draftId?, title, content, tags, category }` | Auto-save draft |
| `blog:join` | `blogId` | Join blog room for real-time updates |
| `blog:leave` | `blogId` | Leave blog room |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `draft:saved` | `{ draftId, lastSavedAt }` | Draft saved confirmation |
| `draft:error` | `{ message }` | Draft save error |
| `like:update` | `{ blogId, likesCount, userId, liked }` | Real-time like update |
| `comment:new` | Comment object | New comment on blog |
| `notification:new` | Notification object | New notification |

## Architecture

```
src/
├── config/       # Service configurations
├── controllers/  # Request handlers
├── events/       # Socket.io event handlers
├── middlewares/   # Auth, RBAC, upload, validation, rate limiting
├── models/       # Mongoose schemas
├── routes/       # Express route definitions
├── services/     # Business logic (email, SMS, OTP, cache, notifications)
├── utils/        # Helpers (tokens, constants, API response)
├── validators/   # Joi validation schemas
└── app.js        # Express app setup
```
