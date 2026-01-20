# LinkUp API Documentation

## Overview

**LinkUp** is a comprehensive Event Management REST API built with Node.js, Express.js, MongoDB, and TypeScript. This API enables users to create, manage, and participate in events with features like authentication, user management, event creation, categories, and real-time chat capabilities.

### Base Information

- **Base URL**: `http://localhost:5002/api/v1`
- **Version**: 1.0.0
- **Protocol**: HTTP/HTTPS
- **Authentication**: JWT (JSON Web Tokens)
- **Content-Type**: `application/json`

### Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Database**: MongoDB with Mongoose ODM
- **Language**: TypeScript
- **Authentication**: JWT + Passport.js
- **File Upload**: Multer with Cloudinary
- **Real-time**: Socket.IO
- **Validation**: Zod
- **Security**: Helmet, Rate Limiting, XSS Protection, MongoDB Sanitization

---

## Features

### 🔐 Authentication & Authorization

- JWT-based authentication with access & refresh tokens
- Password hashing with bcrypt
- OTP-based email verification
- Password reset functionality
- Role-based access control (USER, ADMIN, ORGANIZER)

### 👤 User Management

- User registration with email verification
- Profile management with avatar upload
- Interest-based user preferences
- Soft delete functionality
- Phone number validation (E.164 format)

### 👥 Social Features

- **Friend System**: Send, accept, reject friend requests
- **Blocking**: Block/unblock users
- **Real-time Notifications**: Push notifications for friend activities

### 💬 Messaging System

- **Direct Messages**: 1-to-1 private messaging
- **Group Chats**: Create and manage group conversations
- **Message Status**: Sent, Delivered, Seen indicators
- **Reply to Messages**: Thread-based replies
- **Real-time Updates**: Socket.IO powered live messaging

### 🎉 Event Management

- Create events with multiple images
- Location-based event discovery (GeoJSON)
- Interest-based event recommendations
- Event categories with icons
- Event status management (Active, Completed, Cancelled)
- Co-host functionality
- Automatic notifications to friends on event creation

### 📱 Real-time Features

- Socket.IO integration for live updates
- Online/offline user tracking
- Real-time message delivery
- Live notification system

### 🔔 Notifications

- Push notifications (FCM support)
- In-app notifications
- Notification types: Friend, Event, Chat, System

### 🛡️ Security

- Helmet for HTTP headers security
- Rate limiting to prevent abuse
- XSS protection
- MongoDB query sanitization
- Input validation with Zod schemas

### 📁 File Management

- Image upload with Cloudinary
- Automatic image optimization
- Multiple file upload support

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Friends Management](#friends-management)
4. [Groups Management](#groups-management)
5. [Direct Messages](#direct-messages)
6. [Notifications](#notifications)
7. [Blocked Users](#blocked-users)
8. [Events](#events)
9. [Event Categories](#event-categories)
10. [Favourites](#favourites)
11. [Booking](#booking)
12. [Payments](#payments)
13. [Sponsored](#sponsored)
14. [Dashboard](#dashboard)
15. [Voting](#voting)
16. [Error Handling](#error-handling)
17. [Rate Limiting](#rate-limiting)
18. [Response Format](#response-format)

---

## Authentication

All authenticated endpoints require a valid JWT access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### User Roles

- `USER`: Regular user
- `ORGANIZER`: Event organizer
- `ADMIN`: Administrator with full access

### 1.1 Login

**Endpoint**: `POST /auth/login`

**Description**: Authenticate user with email and password credentials.

**Authorization**: None required

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response** (403 Forbidden):

```json
{
  "success": false,
  "statusCode": 403,
  "message": "Invalid credentials"
}
```

**Possible Exceptions**:

| Error Message                  | Description                                                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `Please Login with instagram!` | User registered with Instagram OAuth and cannot login with email/password credentials. They must use Instagram login instead. |
| `Incorrect password!`          | The password provided does not match the stored password for this account.                                                    |
| `Passport Local login error`   | Generic Passport.js authentication error. This may occur due to internal authentication issues or misconfiguration.           |

---

### 1.2 Refresh Access Token

**Endpoint**: `POST /auth/refresh`

**Description**: Generate a new access token using a valid refresh token.

**Authorization**: None required

**Request Body**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "New accessToken generated!",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Possible Exceptions**:

| Error Message                      | Description                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `Refresh token needed!`            | No refresh token was provided in the request body.                           |
| `User Doesn't Exist`               | The user associated with this token no longer exists in the database.        |
| `The User "blocked" or "inactive"` | The user account has been blocked or marked as inactive by an administrator. |
| `The user was "deleted"`           | The user account has been soft-deleted.                                      |

---

### 1.3 Change Password

**Endpoint**: `POST /auth/change-password`

**Description**: Change the password for an authenticated user.

**Authorization**: Required (All roles)

**Request Body**:

```json
{
  "oldPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password has been changed!",
  "data": null
}
```

**Possible Exceptions**:

| Error Message                       | Description                                                    |
| ----------------------------------- | -------------------------------------------------------------- |
| `User not found!`                   | No user found with the authenticated user ID.                  |
| `Please provide your old password!` | Old password field is missing from the request body.           |
| `Please provide your new password!` | New password field is missing from the request body.           |
| `Password doesn't matched!`         | The old password provided does not match the current password. |

---

### 1.4 Forget Password

**Endpoint**: `GET /auth/forget-password/:email`

**Description**: Send a password reset OTP to the user's email.

**Authorization**: None required

**URL Parameters**:

- `email` (string, required): User's email address

**Example**: `GET /auth/forget-password/user@example.com`

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset OTP send to your email!",
  "data": null
}
```

**Possible Exceptions**:

| Error Message       | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| `User not found!`   | No user exists with the provided email address.                   |
| `User was deleted!` | The user account has been soft-deleted and cannot reset password. |
| `User is INACTIVE`  | The user account is inactive and cannot reset password.           |
| `User is BLOCKED`   | The user account is blocked and cannot reset password.            |

---

### 1.5 Reset Password

**Endpoint**: `POST /auth/reset-password/:email/:otp`

**Description**: Reset password using OTP received via email.

**Authorization**: None required

**URL Parameters**:

- `email` (string, required): User's email address
- `otp` (string, required): One-time password received via email

**Request Body**:

```json
{
  "newPassword": "NewSecurePassword789"
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset success!",
  "data": null
}
```

**Possible Exceptions**:

| Error Message         | Description                                                |
| --------------------- | ---------------------------------------------------------- |
| `Email required!`     | Email parameter is missing from the URL.                   |
| `No user found!`      | No user exists with the provided email address.            |
| `Wrong OTP!`          | The OTP is invalid or less than 6 characters.              |
| `OTP has expired!`    | The OTP has expired (valid for 2 minutes only).            |
| `OTP is not matched!` | The provided OTP does not match the one sent to the email. |

---

## User Management

### 2.1 User Registration

**Endpoint**: `POST /user/registration`

**Description**: Register a new user account.

**Authorization**: None required

**Request Body**:

```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123",
  "phone": "+1234567890",
  "role": "USER",
  "gender": "male"
}
```

**Field Definitions**:

- `fullName` (string, optional): User's full name
- `organizationName` (string, optional): Organization name (for ORGANIZER role)
- `email` (string, required): Valid email address
- `password` (string, required): Strong password
- `phone` (string, optional): Phone number
- `role` (enum, required): `USER`, `ADMIN`, or `ORGANIZER`
- `gender` (string, optional): User's gender
- `bio` (string, optional): User biography
- `instagramHandle` (string, optional): Instagram handle
- `interests` (array, optional): Array of category IDs

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users created successfully!",
  "data": {
    "email": "john.doe@example.com",
    "message": "OTP sent to your email"
  }
}
```

**Possible Exceptions**:

| Error Message                        | Description                                          |
| ------------------------------------ | ---------------------------------------------------- |
| `User aleready exist. Please login!` | A user with this email already exists in the system. |

---

### 2.2 Verify User

**Endpoint**: `GET /user/verify/:otp`

**Description**: Verify user account with OTP sent to email.

**Authorization**: None required (email stored in cookies)

**URL Parameters**:

- `otp` (string, required): One-time password

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User verified successfully!",
  "data": {
    "data": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "role": "USER",
      "isVerified": true
    }
  }
}
```

**Possible Exceptions**:

| Error Message                   | Description                                          |
| ------------------------------- | ---------------------------------------------------- |
| `OTP required!`                 | OTP parameter is missing or email cookie is not set. |
| `User not found by this email!` | No user found with the email stored in cookies.      |

---

### 2.3 Resend OTP

**Endpoint**: `GET /user/resend-otp`

**Description**: Resend verification OTP to user's email.

**Authorization**: None required (email stored in cookies)

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP Sent Successfully!",
  "data": null
}
```

**Possible Exceptions**:

| Error Message                   | Description                                                |
| ------------------------------- | ---------------------------------------------------------- |
| `Email required!`               | Email cookie is not set or has expired.                    |
| `User not found by this email!` | No user found with the email stored in cookies.            |
| `User already verified!`        | The user account is already verified and doesn't need OTP. |

---

### 2.4 Get Current User (Get Me)

**Endpoint**: `GET /user/get_me`

**Description**: Get authenticated user's profile information.

**Authorization**: Required (All roles)

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User fetched successfully!",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "role": "USER",
    "avatar": "https://res.cloudinary.com/...",
    "phone": "+1234567890",
    "gender": "male",
    "bio": "Event enthusiast",
    "interests": ["507f1f77bcf86cd799439012"],
    "isVerified": true,
    "isActive": "ACTIVE"
  }
}
```

**Possible Exceptions**:

| Error Message    | Description                                    |
| ---------------- | ---------------------------------------------- |
| `User not found` | No user exists with the authenticated user ID. |

---

### 2.5 Get All Users

**Endpoint**: `GET /user`

**Description**: Get a list of all users with pagination, search, sorting, and filtering using QueryBuilder.

**Authorization**: None required

**Query Parameters**:

- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `search` (string, optional): Text search across user fields
- `sort` (string, optional): Sort field (e.g., `createdAt`, `-fullName`)
- `fields` (string, optional): Select specific fields to return

**Example**: `GET /user?page=1&limit=10&search=john&sort=-createdAt`

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users fetched successful!",
  "data": {
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    },
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "role": "USER",
        "avatar": "https://res.cloudinary.com/...",
        "isVerified": true,
        "isActive": "ACTIVE"
      }
    ]
  }
}
```

---

### 2.6 Update User

**Endpoint**: `PATCH /user/:userId`

**Description**: Update user profile information.

**Authorization**: Required (All roles - users can only update their own profile)

**Content-Type**: `multipart/form-data`

**URL Parameters**:

- `userId` (string, required): User ID to update

**Request Body** (Form Data):

```
fullName: John Updated Doe
bio: Updated biography
phone: +1234567891
gender: male
instagramHandle: @johndoe
file: <avatar image file>
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User updated successfully!",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "fullName": "John Updated Doe",
    "avatar": "https://res.cloudinary.com/...",
    "bio": "Updated biography"
  }
}
```

**Possible Exceptions**:

| Error Message                                     | Description                                                                       |
| ------------------------------------------------- | --------------------------------------------------------------------------------- |
| `User not found!`                                 | No user exists with the provided user ID.                                         |
| `You can only update your own profile`            | USER/ORGANIZER attempting to update another user's profile.                       |
| `You can't update your password from this route!` | Password field included in update request - use change password endpoint instead. |
| `You are not allowed to update roles!`            | USER/ORGANIZER attempting to change their role.                                   |
| `You are not allowed to update account status!`   | USER/ORGANIZER attempting to update isActive, isDeleted, or isVerified.           |
| `You are not allowed to update: {field}`          | USER/ORGANIZER attempting to update a restricted field.                           |
| `Invalid phone number format`                     | Phone number does not conform to E.164 format.                                    |

---

### 2.7 Delete User

**Endpoint**: `DELETE /user/:userId`

**Description**: Soft delete a user account (marks as deleted).

**Authorization**: Required (All roles - users can only delete their own account)

**URL Parameters**:

- `userId` (string, required): User ID to delete

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User deleted successfully!",
  "data": null
}
```

**Possible Exceptions**:

| Error Message              | Description                                                 |
| -------------------------- | ----------------------------------------------------------- |
| `User not found!`          | No user exists with the provided user ID.                   |
| `User already deleted!`    | The user account has already been soft-deleted.             |
| `You can't delete others!` | Non-admin user attempting to delete another user's account. |

---

## Friends Management

### 3.1 Get All Friends

**Endpoint**: `GET /friend`

**Description**: Get a list of all accepted friends for the authenticated user.

**Authorization**: Required (All roles)

**Query Parameters**:

- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Example**: `GET /friend?page=1&limit=10`

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Friends fetched successfully!",
  "data": {
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPage": 3
    },
    "friends": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "fullName": "Jane Smith",
        "email": "jane.smith@example.com",
        "avatar": "https://res.cloudinary.com/..."
      }
    ]
  }
}
```

---

### 3.2 Get Friend Requests

**Endpoint**: `GET /friend/requests`

**Description**: Get pending friend requests or blocked users.

**Authorization**: Required (All roles)

**Query Parameters**:

- `status` (enum, optional): Filter by status (`PENDING` or `BLOCKED`, default: `PENDING`)
- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Example**: `GET /friend/requests?status=PENDING&page=1&limit=10`

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Friend requests fetched successfully!",
  "data": {
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPage": 1
    },
    "friendRequest": [
      {
        "_id": "507f1f77bcf86cd799439099",
        "sender": {
          "_id": "507f1f77bcf86cd799439012",
          "fullName": "Jane Smith",
          "email": "jane.smith@example.com",
          "avatar": "https://res.cloudinary.com/..."
        },
        "status": "PENDING",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

### 3.3 Send Friend Request

**Endpoint**: `POST /friend/request/:receiverId`

**Description**: Send a friend request to another user.

**Authorization**: Required (All roles)

**URL Parameters**:

- `receiverId` (string, required): User ID of the person to send request to

**Success Response** (201 Created):

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Friend request sent successfully!",
  "data": {
    "_id": "507f1f77bcf86cd799439099",
    "sender": "507f1f77bcf86cd799439011",
    "receiver": "507f1f77bcf86cd799439012",
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Possible Exceptions**:

| Error Message                                 | Description                                           |
| --------------------------------------------- | ----------------------------------------------------- |
| `You cannot send friend request to yourself!` | User trying to send request to their own ID.          |
| `User not found!`                             | The receiver user does not exist.                     |
| `Friend request already sent!`                | A pending request already exists between these users. |
| `You are already friends!`                    | The users are already friends (request was accepted). |
| `Cannot send friend request to this user!`    | One of the users has blocked the other.               |

---

### 3.4 Accept Friend Request

**Endpoint**: `PATCH /friend/accept/:requestId`

**Description**: Accept a pending friend request.

**Authorization**: Required (All roles)

**URL Parameters**:

- `requestId` (string, required): Friend request ID to accept

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Friend request accepted!",
  "data": {
    "_id": "507f1f77bcf86cd799439099",
    "sender": "507f1f77bcf86cd799439012",
    "receiver": "507f1f77bcf86cd799439011",
    "status": "ACCEPTED"
  }
}
```

**Possible Exceptions**:

| Error Message                                    | Description                               |
| ------------------------------------------------ | ----------------------------------------- |
| `Friend request not found!`                      | No request exists with the provided ID.   |
| `You are not authorized to accept this request!` | User is not the receiver of this request. |
| `Friend request already accepted!`               | The request has already been accepted.    |

---

### 3.5 Remove Friend

**Endpoint**: `DELETE /friend/remove/:friendId`

**Description**: Remove a friend from your friends list.

**Authorization**: Required (All roles)

**URL Parameters**:

- `friendId` (string, required): User ID of the friend to remove

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Friend removed successfully!",
  "data": {
    "message": "Friend removed successfully!"
  }
}
```

**Possible Exceptions**:

| Error Message                  | Description                                        |
| ------------------------------ | -------------------------------------------------- |
| `Friend connection not found!` | No accepted friendship exists between these users. |

---

### 3.6 Block User

**Endpoint**: `PATCH /friend/block/:friendId`

**Description**: Block a user (prevents friend requests and interactions).

**Authorization**: Required (All roles)

**URL Parameters**:

- `friendId` (string, required): User ID to block

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User blocked successfully!",
  "data": {
    "message": "User blocked successfully!"
  }
}
```

**Possible Exceptions**:

| Error Message     | Description                       |
| ----------------- | --------------------------------- |
| `User not found!` | The user to block does not exist. |

---

## Groups Management

### 4.1 Create Group

**Endpoint**: `POST /group/create`

**Description**: Create a new group chat.

**Authorization**: Required (All roles)

**Request Body**:

```json
{
  "group_name": "Tech Enthusiasts",
  "group_description": "A group for tech lovers",
  "group_image": "https://example.com/image.jpg"
}
```

**Success Response** (201 Created):

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Group created successfully!",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "group_name": "Tech Enthusiasts",
    "group_description": "A group for tech lovers",
    "group_admin": "507f1f77bcf86cd799439011",
    "group_members": [
      {
        "user": "507f1f77bcf86cd799439011",
        "role": "SUPERADMIN",
        "joinedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

**Possible Exceptions**:

| Error Message                            | Description                               |
| ---------------------------------------- | ----------------------------------------- |
| `Only verified users can create groups!` | Unverified user trying to create a group. |
| `Group name already exists!`             | A group with this name already exists.    |

---

### 4.2 Get User's Groups

**Endpoint**: `GET /group`

**Description**: Get all groups the authenticated user is a member of.

**Authorization**: Required

**Query Parameters**:

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `sort` (string, optional): Sort field (default: `-createdAt`)

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Groups fetched successfully!",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "group_name": "Tech Enthusiasts",
      "group_image": "https://example.com/image.jpg"
    }
  ]
}
```

---

### 4.3 Get Single Group

**Endpoint**: `GET /group/:groupId`

**Description**: Get detailed information about a specific group.

**Authorization**: Required

**URL Parameters**:

- `groupId` (string, required): Group ID

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Group fetched successfully!",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "group_name": "Tech Enthusiasts",
    "group_description": "A group for tech lovers",
    "group_admin": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "avatar": "https://res.cloudinary.com/..."
    },
    "group_members": [
      {
        "user": {
          "_id": "507f1f77bcf86cd799439011",
          "fullName": "John Doe",
          "avatar": "https://res.cloudinary.com/..."
        },
        "role": "SUPERADMIN",
        "joinedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "event": null
  }
}
```

**Possible Exceptions**:

| Error Message                         | Description                           |
| ------------------------------------- | ------------------------------------- |
| `Group not found!`                    | No group exists with the provided ID. |
| `You are not a member of this group!` | User is not a member of the group.    |

---

### 4.4 Invite Users to Group

**Endpoint**: `POST /group/:groupId/invite`

**Description**: Add users to a group (Admin/Superadmin only).

**Authorization**: Required

**URL Parameters**:

- `groupId` (string, required): Group ID

**Request Body**:

```json
{
  "userIds": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users added to group successfully!",
  "data": { ... }
}
```

**Possible Exceptions**:

| Error Message                                | Description                              |
| -------------------------------------------- | ---------------------------------------- |
| `Group not found!`                           | No group exists with the provided ID.    |
| `Only admins can invite users to the group!` | Non-admin trying to invite users.        |
| `User are already members!`                  | All specified users are already members. |
| `Some users not found!`                      | One or more user IDs do not exist.       |

---

### 4.5 Send Group Message

**Endpoint**: `POST /group/:groupId/message`

**Description**: Send a message to a group chat.

**Authorization**: Required

**URL Parameters**:

- `groupId` (string, required): Group ID

**Request Body**:

```json
{
  "text": "Hello everyone!",
  "image": "https://example.com/image.jpg",
  "replyTo": "507f1f77bcf86cd799439030"
}
```

**Success Response** (201 Created):

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Message sent!",
  "data": {
    "_id": "507f1f77bcf86cd799439040",
    "sender": "507f1f77bcf86cd799439011",
    "group": "507f1f77bcf86cd799439020",
    "message": {
      "text": "Hello everyone!",
      "image": ""
    },
    "status": "SENT"
  }
}
```

**Possible Exceptions**:

| Error Message                         | Description                           |
| ------------------------------------- | ------------------------------------- |
| `Group not found!`                    | No group exists with the provided ID. |
| `You are not a member of this group!` | User is not a member of the group.    |

---

### 4.6 Get Group Messages

**Endpoint**: `GET /group/:groupId/messages`

**Description**: Get messages from a group chat.

**Authorization**: Required

**URL Parameters**:

- `groupId` (string, required): Group ID

**Query Parameters**:

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `sort` (string, optional): Sort field (default: `createdAt`)

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Messages fetched successfully!",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "sender": {
        "_id": "507f1f77bcf86cd799439011",
        "fullName": "John Doe",
        "avatar": "https://res.cloudinary.com/..."
      },
      "message": {
        "text": "Hello everyone!",
        "image": ""
      },
      "status": "SENT",
      "createdAt": "2024-01-15T10:35:00.000Z"
    }
  ]
}
```

**Possible Exceptions**:

| Error Message                         | Description                           |
| ------------------------------------- | ------------------------------------- |
| `Group not found!`                    | No group exists with the provided ID. |
| `You are not a member of this group!` | User is not a member of the group.    |

---

### 4.7 Leave Group

**Endpoint**: `DELETE /group/:groupId/leave`

**Description**: Leave a group chat.

**Authorization**: Required

**URL Parameters**:

- `groupId` (string, required): Group ID

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Left group successfully!",
  "data": {
    "message": "Left group successfully!"
  }
}
```

**Possible Exceptions**:

| Error Message                         | Description                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `Group not found!`                    | No group exists with the provided ID.                      |
| `You are not a member of this group!` | User is not a member of the group.                         |
| `Superadmin cannot leave the group!`  | Group creator must transfer ownership or delete the group. |

---

### 4.8 Remove Member

**Endpoint**: `DELETE /group/:groupId/member/:memberId`

**Description**: Remove a member from the group (Admin/Superadmin only).

**Authorization**: Required

**URL Parameters**:

- `groupId` (string, required): Group ID
- `memberId` (string, required): User ID of member to remove

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Member removed successfully!",
  "data": {
    "message": "Member removed successfully!"
  }
}
```

**Possible Exceptions**:

| Error Message                     | Description                           |
| --------------------------------- | ------------------------------------- |
| `Group not found!`                | No group exists with the provided ID. |
| `Only admins can remove members!` | Non-admin trying to remove members.   |
| `Cannot remove the superadmin!`   | Trying to remove the group creator.   |

---

### 4.9 Delete Group

**Endpoint**: `DELETE /group/:groupId`

**Description**: Delete a group entirely (Superadmin only).

**Authorization**: Required

**URL Parameters**:

- `groupId` (string, required): Group ID

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Group deleted successfully!",
  "data": {
    "message": "Group deleted successfully!"
  }
}
```

**Possible Exceptions**:

| Error Message                           | Description                                |
| --------------------------------------- | ------------------------------------------ |
| `Group not found!`                      | No group exists with the provided ID.      |
| `Only superadmin can delete the group!` | Non-superadmin trying to delete the group. |

---

## Direct Messages

### 5.1 Get Conversations

**Endpoint**: `GET /message/conversations`

**Description**: Get list of all conversations (users you've chatted with) with last message and unread count.

**Authorization**: Required

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Conversations fetched successfully!",
  "data": [
    {
      "user": {
        "_id": "507f1f77bcf86cd799439012",
        "fullName": "Jane Smith",
        "email": "jane@example.com",
        "avatar": "https://res.cloudinary.com/..."
      },
      "lastMessage": {
        "_id": "507f1f77bcf86cd799439050",
        "message": {
          "text": "Hey, how are you?",
          "image": ""
        },
        "createdAt": "2024-01-15T11:00:00.000Z"
      },
      "unreadCount": 3
    }
  ]
}
```

---

### 5.2 Send Direct Message

**Endpoint**: `POST /message/send/:receiverId`

**Description**: Send a direct message to another user.

**Authorization**: Required

**URL Parameters**:

- `receiverId` (string, required): User ID of the recipient

**Request Body**:

```json
{
  "text": "Hello!",
  "image": "https://example.com/image.jpg",
  "replyTo": "507f1f77bcf86cd799439045"
}
```

**Success Response** (201 Created):

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Message sent!",
  "data": {
    "_id": "507f1f77bcf86cd799439050",
    "sender": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "avatar": "https://res.cloudinary.com/..."
    },
    "receiver": "507f1f77bcf86cd799439012",
    "message": {
      "text": "Hello!",
      "image": ""
    },
    "status": "SENT"
  }
}
```

**Possible Exceptions**:

| Error Message                         | Description                            |
| ------------------------------------- | -------------------------------------- |
| `Receiver not found!`                 | The recipient user does not exist.     |
| `Sender not found!`                   | The sender user does not exist.        |
| `Message must contain text or image!` | Empty message (no text or image).      |
| `Reply message not found!`            | The replyTo message ID does not exist. |

---

### 5.3 Get Direct Messages

**Endpoint**: `GET /message/:userId`

**Description**: Get all messages with a specific user.

**Authorization**: Required

**URL Parameters**:

- `userId` (string, required): User ID of the chat partner

**Query Parameters**:

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `sort` (string, optional): Sort field (default: `createdAt`)

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Messages fetched successfully!",
  "data": {
    "messages": [
      {
        "_id": "507f1f77bcf86cd799439050",
        "sender": {
          "_id": "507f1f77bcf86cd799439011",
          "fullName": "John Doe",
          "avatar": "https://res.cloudinary.com/..."
        },
        "receiver": {
          "_id": "507f1f77bcf86cd799439012",
          "fullName": "Jane Smith",
          "avatar": "https://res.cloudinary.com/..."
        },
        "message": {
          "text": "Hello!",
          "image": ""
        },
        "status": "DELIVERED",
        "createdAt": "2024-01-15T11:00:00.000Z"
      }
    ],
    "metaData": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPage": 3
    }
  }
}
```

**Possible Exceptions**:

| Error Message     | Description                           |
| ----------------- | ------------------------------------- |
| `User not found!` | The chat partner user does not exist. |

---

### 5.4 Mark Messages as Seen

**Endpoint**: `PATCH /message/:userId/seen`

**Description**: Mark all messages from a user as seen.

**Authorization**: Required

**URL Parameters**:

- `userId` (string, required): User ID whose messages to mark as seen

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Messages marked as seen!",
  "data": {
    "message": "Messages marked as seen!",
    "count": 5
  }
}
```

**Possible Exceptions**:

| Error Message     | Description              |
| ----------------- | ------------------------ |
| `User not found!` | The user does not exist. |

---

## Notifications

### 6.1 Get Notification Preferences

**Endpoint**: `GET /notification/preferences`

**Description**: Get user's notification preferences settings.

**Authorization**: Required

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notification preferences fetched!",
  "data": {
    "push_notifications": true,
    "email_notifications": true,
    "friend_requests": true,
    "event_updates": true
  }
}
```

---

### 6.2 Update Notification Preferences

**Endpoint**: `PATCH /notification/preferences`

**Description**: Update user's notification preferences.

**Authorization**: Required

**Request Body**:

```json
{
  "push_notifications": true,
  "email_notifications": false,
  "friend_requests": true
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notification preferences updated!",
  "data": { ... }
}
```

---

### 6.3 Get My Notifications

**Endpoint**: `GET /notification/my_notifications`

**Description**: Get all notifications for the authenticated user.

**Authorization**: Required (All roles)

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notifications fetched!",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439099",
      "type": "FRIEND",
      "title": "New Friend Request",
      "description": "John Doe sent you a friend request",
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 6.4 Send System Notification

**Endpoint**: `POST /notification/send_system_notificatin`

**Description**: Send a system notification to users.

**Authorization**: Required (ADMIN only)

**Request Body**:

```json
{
  "title": "System Update",
  "description": "New features available!",
  "targetUsers": ["all"]
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "System notification sent!",
  "data": null
}
```

---

## Blocked Users

### 7.1 Block User

**Endpoint**: `POST /blocked_user`

**Description**: Block a user to prevent interactions.

**Authorization**: Required (All roles)

**Request Body**:

```json
{
  "blockedUserId": "507f1f77bcf86cd799439012"
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User blocked successfully!",
  "data": {
    "blocker": "507f1f77bcf86cd799439011",
    "blockedUser": "507f1f77bcf86cd799439012"
  }
}
```

---

### 7.2 Get Blocked Users

**Endpoint**: `GET /blocked_user`

**Description**: Get list of all blocked users.

**Authorization**: Required (All roles)

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Blocked users fetched!",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439099",
      "blockedUser": {
        "_id": "507f1f77bcf86cd799439012",
        "fullName": "Jane Doe",
        "avatar": "https://res.cloudinary.com/..."
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 7.3 Unblock User

**Endpoint**: `GET /blocked_user/unblock/:blockedUserId`

**Description**: Unblock a previously blocked user.

**Authorization**: Required (All roles)

**URL Parameters**:

- `blockedUserId` (string, required): ID of the blocked user to unblock

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User unblocked successfully!",
  "data": null
}
```

---

## Events

### 8.1 Create Event

**Endpoint**: `POST /event`

**Description**: Create a new event.

**Authorization**: Required (All roles)

**Content-Type**: `multipart/form-data`

**Request Body** (Form Data):

```
title: Summer Music Festival
description: Join us for an amazing music festival
venue: Central Park Amphitheater
event_start: 2024-07-15T18:00:00Z
event_end: 2024-07-15T23:00:00Z
time_zone: America/New_York
category: 507f1f77bcf86cd799439012
price: 50
max_attendence: 500
age_limit: 18
visibility: PUBLIC
city: New York
state: NY
postal: 10001
country: USA
files: <image file 1>
files: <image file 2>
```

**Field Definitions**:

- `title` (string, required): Event title
- `description` (string, required): Event description
- `images` (array, optional): Event images (uploaded as files)
- `venue` (string, required): Venue name
- `event_start` (date, required): Event start date/time
- `event_end` (date, required): Event end date/time
- `time_zone` (string, required): Timezone
- `category` (ObjectId, required): Event category ID
- `price` (number, required): Ticket price
- `max_attendence` (number, required): Maximum attendees
- `age_limit` (number, required): Minimum age
- `visibility` (enum, required): `PUBLIC` or `PRIVATE`
- `address` (object, required): City, state, postal, country

**Success Response** (201 Created):

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Event created successfully!",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "host": "507f1f77bcf86cd799439011",
    "title": "Summer Music Festival",
    "description": "Join us for an amazing music festival",
    "images": [
      "https://res.cloudinary.com/...",
      "https://res.cloudinary.com/..."
    ],
    "venue": "Central Park Amphitheater",
    "event_start": "2024-07-15T18:00:00.000Z",
    "event_end": "2024-07-15T23:00:00.000Z",
    "category": "507f1f77bcf86cd799439012",
    "price": 50,
    "max_attendence": 500,
    "age_limit": 18,
    "visibility": "PUBLIC",
    "event_status": "ACTIVE",
    "address": {
      "city": "New York",
      "state": "NY",
      "postal": "10001",
      "country": "USA"
    }
  }
}
```

**Possible Exceptions**:

| Error Message                              | Description                                                                |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| `Please verify your profile!`              | The user's profile is not verified. Only verified users can create events. |
| `Category must be include!`                | No category ID was provided in the request.                                |
| `An event already exists with this title!` | An event with the same title already exists in the database.               |
| `Coord is empty`                           | The geocoding service could not convert the address to coordinates.        |

---

### 8.2 Get Events

**Endpoint**: `GET /event`

**Description**: Get a list of events with optional filtering.

**Authorization**: Required (All roles)

**Query Parameters**:

- `category` (string, optional): Filter by category ID
- `status` (string, optional): Filter by event status
- `visibility` (string, optional): Filter by visibility
- `search` (string, optional): Search by title or description
- `page` (number, optional): Page number for pagination
- `limit` (number, optional): Items per page

**Example**: `GET /event?category=507f1f77bcf86cd799439012&status=ACTIVE&page=1&limit=10`

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Event fetched successfully!",
  "data": {
    "events": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "host": {
          "_id": "507f1f77bcf86cd799439011",
          "fullName": "John Doe",
          "avatar": "https://res.cloudinary.com/..."
        },
        "title": "Summer Music Festival",
        "description": "Join us for an amazing music festival",
        "images": ["https://res.cloudinary.com/..."],
        "venue": "Central Park Amphitheater",
        "event_start": "2024-07-15T18:00:00.000Z",
        "event_end": "2024-07-15T23:00:00.000Z",
        "category": {
          "_id": "507f1f77bcf86cd799439012",
          "category_name": "Music",
          "category_icon": "🎵"
        },
        "price": 50,
        "max_attendence": 500,
        "visibility": "PUBLIC",
        "event_status": "ACTIVE"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
}
```

---

### 8.3 Get Interest Based Events

**Endpoint**: `GET /event/interested_event`

**Description**: Get events based on user's interests (categories they follow).

**Authorization**: Required (All roles)

**Query Parameters**:

- `page` (number, optional): Page number for pagination
- `limit` (number, optional): Items per page
- `sort` (string, optional): Sort field

**Example**: `GET /event/interested_event?page=1&limit=10`

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Interest based events fetched successfully!",
  "data": {
    "metaData": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    },
    "events": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "title": "Summer Music Festival",
        "category": "507f1f77bcf86cd799439012",
        "event_start": "2024-07-15T18:00:00.000Z",
        "visibility": "PUBLIC"
      }
    ]
  }
}
```

---

### 8.4 Get Event Details

**Endpoint**: `GET /event/details/:eventId`

**Description**: Get detailed information about a specific event.

**Authorization**: Required (All roles)

**URL Parameters**:

- `eventId` (string, required): Event ID

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Event details fetched successfully!",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "host": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "avatar": "https://res.cloudinary.com/...",
      "role": "ORGANIZER"
    },
    "title": "Summer Music Festival",
    "description": "Join us for an amazing music festival with top artists...",
    "images": [
      "https://res.cloudinary.com/...",
      "https://res.cloudinary.com/..."
    ],
    "venue": "Central Park Amphitheater",
    "event_start": "2024-07-15T18:00:00.000Z",
    "event_end": "2024-07-15T23:00:00.000Z",
    "time_zone": "America/New_York",
    "category": {
      "_id": "507f1f77bcf86cd799439012",
      "category_name": "Music",
      "category_icon": "🎵"
    },
    "co_host": null,
    "price": 50,
    "max_attendence": 500,
    "age_limit": 18,
    "visibility": "PUBLIC",
    "event_status": "ACTIVE",
    "avg_rating": 4.5,
    "address": {
      "city": "New York",
      "state": "NY",
      "postal": "10001",
      "country": "USA"
    },
    "location": {
      "type": "Point",
      "coordinates": [-73.968285, 40.785091]
    }
  }
}
```

**Possible Exceptions**:

| Error Message        | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `Event id required!` | No event ID was provided in the URL parameters.        |
| `User not found!`    | The authenticated user does not exist in the database. |
| `No event found!`    | No event exists with the provided event ID.            |

---

### 8.5 Update Event

**Endpoint**: `PATCH /event/:eventId`

**Description**: Update an existing event. Different fields have different permission levels.

**Authorization**: Required (All roles)

**Content-Type**: `multipart/form-data`

**URL Parameters**:

- `eventId` (string, required): Event ID to update

**Request Body** (Form Data):

```
title: Updated Festival Name
description: Updated description
venue: New Venue Location
event_start: 2024-08-15T18:00:00Z
event_end: 2024-08-15T23:00:00Z
visibility: PRIVATE
event_status: ACTIVE
co_host: 507f1f77bcf86cd799439020
files: <new image files>
deletedImages: ["https://cloudinary.com/old-image.jpg"]
```

**Field Permission Levels**:

- **Host & Co-Host only**: `venue`, `visibility`, `event_status`
- **Host only**: `co_host`
- **Admin only**: `featured`

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Event updated successfully!",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "title": "Updated Festival Name",
    "description": "Updated description",
    "venue": "New Venue Location"
  }
}
```

**Possible Exceptions**:

| Error Message                                                        | Description                                                     |
| -------------------------------------------------------------------- | --------------------------------------------------------------- |
| `Event not found!`                                                   | No event exists with the provided event ID.                     |
| `You can't update location manually!`                                | Location updates are done automatically based on venue changes. |
| `Only Admin can change featured status!`                             | Non-admin user trying to change featured status.                |
| `Only host and co-host can change venue!`                            | Unauthorized user trying to change venue.                       |
| `Only host and co-host can change event visibility!`                 | Unauthorized user trying to change visibility.                  |
| `You can't change co-host!`                                          | Co-host trying to change the co-host field.                     |
| `You can't update event status to "COMPLETED" before the event end!` | Trying to mark event as completed before end date.              |
| `You can't cancel an event before refund attendenced money!`         | Trying to cancel event without processing refunds.              |

---

## Event Categories

### 9.1 Create Event Category

**Endpoint**: `POST /category`

**Description**: Create a new event category.

**Authorization**: Required (ADMIN only)

**Request Body**:

```json
{
  "category_name": "Music",
  "category_icon": "🎵"
}
```

**Success Response** (201 Created):

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Created event category!",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "category_name": "Music",
    "category_icon": "🎵",
    "isDeleted": false
  }
}
```

**Possible Exceptions**:

| Error Message                      | Description                                                   |
| ---------------------------------- | ------------------------------------------------------------- |
| `Category name must required!`     | No category name was provided in the request body.            |
| `{category_name} - already exist!` | A category with the same name already exists in the database. |

---

### 9.2 Get Event Categories

**Endpoint**: `GET /category`

**Description**: Get all event categories.

**Authorization**: Required (All roles)

**Query Parameters**:

- `isDeleted` (boolean, optional): Include deleted categories (default: false)

**Example**: `GET /category?isDeleted=false`

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Category fetched success!",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "category_name": "Music",
      "category_icon": "🎵",
      "isDeleted": false
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "category_name": "Sports",
      "category_icon": "⚽",
      "isDeleted": false
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "category_name": "Technology",
      "category_icon": "💻",
      "isDeleted": false
    }
  ]
}
```

---

### 9.3 Update Event Category

**Endpoint**: `PATCH /category/:categoryId`

**Description**: Update an existing event category.

**Authorization**: Required (ADMIN only)

**URL Parameters**:

- `categoryId` (string, required): Category ID to update

**Request Body**:

```json
{
  "category_name": "Live Music",
  "category_icon": "🎸"
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Category updated success!",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "category_name": "Live Music",
    "category_icon": "🎸",
    "isDeleted": false
  }
}
```

**Possible Exceptions**:

| Error Message         | Description                                       |
| --------------------- | ------------------------------------------------- |
| `Category not found!` | No category exists with the provided category ID. |

---

### 9.4 Delete Event Category

**Endpoint**: `DELETE /category/:categoryId`

**Description**: Soft delete an event category.

**Authorization**: Required (ADMIN only)

**URL Parameters**:

- `categoryId` (string, required): Category ID to delete

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Category deleted success!",
  "data": null
}
```

**Possible Exceptions**:

| Error Message                       | Description                                       |
| ----------------------------------- | ------------------------------------------------- |
| `Category not found!`               | No category exists with the provided category ID. |
| `This category is already deleted!` | The category has already been soft-deleted.       |

---

## Favourites

### 10.1 Add Event to Favourites

**Endpoint**: `POST /favourite/add`

**Description**: Add an event to user's favourites list.

**Authorization**: Required (All roles)

**Request Body**:

```json
{
  "eventId": "507f1f77bcf86cd799439015"
}
```

**Success Response** (201 Created):

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Event added to favourites!",
  "data": {
    "user": "507f1f77bcf86cd799439011",
    "event": "507f1f77bcf86cd799439015"
  }
}
```

---

### 10.2 Get Favourite Events

**Endpoint**: `GET /favourite`

**Description**: Get all favourite events for the authenticated user.

**Authorization**: Required (All roles)

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Favourite events fetched!",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439099",
      "event": {
        "_id": "507f1f77bcf86cd799439015",
        "title": "Summer Music Festival",
        "images": ["https://res.cloudinary.com/..."]
      }
    }
  ]
}
```

---

### 10.3 Remove from Favourites

**Endpoint**: `DELETE /favourite/:eventId`

**Description**: Remove an event from favourites.

**Authorization**: Required (All roles)

**URL Parameters**:

- `eventId` (string, required): Event ID to remove

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Event removed from favourites!",
  "data": null
}
```

---

## Booking

### 11.1 Book Event

**Endpoint**: `POST /booking`

**Description**: Book/register for an event.

**Authorization**: Required (All roles)

**Request Body**:

```json
{
  "eventId": "507f1f77bcf86cd799439015",
  "tickets": 2
}
```

**Success Response** (201 Created):

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Event booked successfully!",
  "data": {
    "_id": "507f1f77bcf86cd799439099",
    "user": "507f1f77bcf86cd799439011",
    "event": "507f1f77bcf86cd799439015",
    "status": "CONFIRMED"
  }
}
```

---

### 11.2 Get My Bookings

**Endpoint**: `GET /booking/my_bookings`

**Description**: Get all bookings for the authenticated user.

**Authorization**: Required (All roles)

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Bookings fetched!",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439099",
      "event": {
        "_id": "507f1f77bcf86cd799439015",
        "title": "Summer Music Festival"
      },
      "status": "CONFIRMED",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## Payments

### 12.1 Create Stripe Connect Account

**Endpoint**: `GET /payment/create_stripe_connect/:countryCode`

**Description**: Create a Stripe Connect account for receiving payments.

**Authorization**: Required (All roles)

**URL Parameters**:

- `countryCode` (string, required): Country code (e.g., "US", "GB")

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Stripe Connect account created!",
  "data": {
    "accountLink": "https://connect.stripe.com/..."
  }
}
```

---

### 12.2 Check Stripe Account Status

**Endpoint**: `GET /payment/check_stripe_connect`

**Description**: Check if user has a connected Stripe account.

**Authorization**: Required (All roles)

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Stripe status checked!",
  "data": {
    "hasAccount": true,
    "accountStatus": "ACTIVE"
  }
}
```

---

### 12.3 Get Connected Bank Account

**Endpoint**: `GET /payment/connected_payout_bank_account`

**Description**: Get the connected bank account details from Stripe.

**Authorization**: Required (All roles)

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Bank account fetched!",
  "data": {
    "bankName": "Chase",
    "last4": "4242"
  }
}
```

---

### 12.4 Get Transaction History

**Endpoint**: `GET /payment/transaction_history`

**Description**: Get user's transaction history.

**Authorization**: Required (All roles)

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Transactions fetched!",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439099",
      "amount": 50,
      "type": "PAYMENT",
      "status": "COMPLETED",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 12.5 Get All Transactions (Admin)

**Endpoint**: `GET /payment/all_transaction_history`

**Description**: Get all transactions in the system.

**Authorization**: Required (ADMIN only)

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "All transactions fetched!",
  "data": { ... }
}
```

---

## Sponsored

### 13.1 Create Sponsored Package (Admin)

**Endpoint**: `POST /sponsored/create_package`

**Description**: Create a new sponsored event package.

**Authorization**: Required (ADMIN only)

**Request Body**:

```json
{
  "name": "Premium Package",
  "price": 99.99,
  "duration": 7,
  "features": ["Featured placement", "Priority listing"]
}
```

**Success Response** (201 Created):

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Package created!",
  "data": { ... }
}
```

---

### 13.2 Get Available Packages

**Endpoint**: `GET /sponsored/available_package`

**Description**: Get all available sponsored packages.

**Authorization**: Required (All roles)

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Packages fetched!",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439099",
      "name": "Premium Package",
      "price": 99.99,
      "duration": 7
    }
  ]
}
```

---

### 13.3 Update Package (Admin)

**Endpoint**: `PATCH /sponsored/update_package/:packageId`

**Description**: Update an existing sponsored package.

**Authorization**: Required (ADMIN only)

**URL Parameters**:

- `packageId` (string, required): Package ID to update

---

### 13.4 Request Event Sponsorship

**Endpoint**: `POST /sponsored/event_sponsore`

**Description**: Request sponsorship for an event.

**Authorization**: Required (All roles)

**Request Body**:

```json
{
  "eventId": "507f1f77bcf86cd799439015",
  "packageId": "507f1f77bcf86cd799439099"
}
```

---

### 13.5 Get Random Sponsored Events

**Endpoint**: `GET /sponsored/random_sponsored_events`

**Description**: Get random sponsored events for display.

**Authorization**: Required (All roles)

---

### 13.6 Get All Sponsored Events

**Endpoint**: `GET /sponsored/sponsored_events`

**Description**: Get all sponsored events.

**Authorization**: Required (All roles)

---

## Dashboard (Admin Only)

### 14.1 Get Dashboard Statistics

**Endpoint**: `GET /dashboard/dasboard_states`

**Description**: Get overall dashboard statistics.

**Authorization**: Required (ADMIN only)

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Dashboard stats fetched!",
  "data": {
    "totalUsers": 1500,
    "totalEvents": 320,
    "totalBookings": 890,
    "revenue": 45000
  }
}
```

---

### 14.2 Get User Activity

**Endpoint**: `GET /dashboard/users_activity`

**Description**: Get user activity analytics.

**Authorization**: Required (ADMIN only)

---

### 14.3 Get Revenue

**Endpoint**: `GET /dashboard/revenue`

**Description**: Get revenue analytics.

**Authorization**: Required (ADMIN only)

---

### 14.4 Get Sponsor Analytics

**Endpoint**: `GET /dashboard/sponsore_analytics`

**Description**: Get sponsored events analytics.

**Authorization**: Required (ADMIN only)

---

### 14.5 Get Boosted Analytics

**Endpoint**: `GET /dashboard/boosted_analytics`

**Description**: Get boosted events analytics.

**Authorization**: Required (ADMIN only)

---

### 14.6 Get Booking Analytics

**Endpoint**: `GET /dashboard/booking_analytics`

**Description**: Get booking analytics.

**Authorization**: Required (ADMIN only)

---

## Voting

### 15.1 Add Vote

**Endpoint**: `GET /voting/add_vote/:eventId`

**Description**: Add a vote to an event.

**Authorization**: Required (All roles)

**URL Parameters**:

- `eventId` (string, required): Event ID to vote for

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Vote added!",
  "data": {
    "eventId": "507f1f77bcf86cd799439015",
    "totalVotes": 42
  }
}
```

---

### 15.2 Get Event Vote Count

**Endpoint**: `GET /voting/get_event_vote/:eventId`

**Description**: Get total vote count for an event.

**Authorization**: Required (All roles)

**URL Parameters**:

- `eventId` (string, required): Event ID

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Vote count fetched!",
  "data": {
    "totalVotes": 42
  }
}
```

---

### 15.3 Check User Vote

**Endpoint**: `GET /voting/check_vote/:eventId`

**Description**: Check if user has already voted for an event.

**Authorization**: Required (All roles)

**URL Parameters**:

- `eventId` (string, required): Event ID

**Success Response** (200 OK):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Vote status checked!",
  "data": {
    "hasVoted": true
  }
}
```

---

## Error Handling

The API uses consistent error response format across all endpoints:

### Error Response Format

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common HTTP Status Codes

| Status Code | Description                                            |
| ----------- | ------------------------------------------------------ |
| 200         | Success - Request completed successfully               |
| 201         | Created - Resource created successfully                |
| 400         | Bad Request - Invalid input or validation error        |
| 401         | Unauthorized - Missing or invalid authentication token |
| 403         | Forbidden - User doesn't have permission               |
| 404         | Not Found - Resource not found                         |
| 409         | Conflict - Resource already exists                     |
| 429         | Too Many Requests - Rate limit exceeded                |
| 500         | Internal Server Error - Server-side error              |

### Common Error Scenarios

#### 1. Validation Error (400)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

#### 2. Authentication Error (401)

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid or expired token"
}
```

#### 3. Authorization Error (403)

```json
{
  "success": false,
  "statusCode": 403,
  "message": "You don't have permission to perform this action"
}
```

#### 4. Not Found Error (404)

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Resource not found"
}
```

#### 5. Rate Limit Error (429)

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many requests, please try again later."
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Window**: Configurable (default: 15 minutes)
- **Max Requests**: Configurable per window
- **Applies to**: All endpoints
- **Response**: 429 status code when limit exceeded

To check your remaining requests, examine the response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1625097600
```

---

## Response Format

All API responses follow a consistent structure:

### Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "errors": [
    // Optional validation errors
  ]
}
```

---

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with configurable salt rounds
- **Rate Limiting**: Protection against brute force attacks
- **XSS Protection**: Input sanitization to prevent XSS attacks
- **MongoDB Injection Protection**: Query sanitization
- **CORS**: Configurable Cross-Origin Resource Sharing
- **Helmet**: Security HTTP headers
- **Session Management**: Express sessions with configurable storage
- **Input Validation**: Zod schema validation for all inputs

---

## File Upload

The API supports file uploads for avatars and event images:

- **Provider**: Cloudinary
- **Supported Formats**: JPEG, PNG, GIF, WebP
- **Max File Size**: Configurable
- **Fields**:
  - User avatar: Single file upload
  - Event images: Multiple file upload (array)

**Upload Example** (User Avatar):

```
Content-Type: multipart/form-data

file: <image file>
fullName: John Doe
bio: Event enthusiast
```

---

## Additional Features

### Socket.IO Integration

The API includes real-time functionality using Socket.IO for:

- Real-time messaging
- Event notifications
- Live updates

### Firebase Cloud Messaging (FCM)

Push notifications are supported through Firebase:

- New message notifications
- Updates to follow-up events

### Email Notifications

Automated emails are sent for:

- Account verification (OTP)
- Password reset (OTP)
- Event confirmations
- Event updates

---

## Getting Started

### Prerequisites

- Node.js 14+ installed
- MongoDB database
- Cloudinary account for file storage
- Email service credentials
- Firebase project (for push notifications)

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server
PORT=5002
NODE_ENV=development
BACKEND_URL=http://localhost:5002

# Database
MONGO_URI=mongodb://localhost:27017/linkup

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRATION=7d

# Bcrypt
BCRYPT_SALT_ROUND=10

# Cloudinary
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_SECRET=your_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=your_redis_password

# Rate Limiting
REQUEST_RATE_LIMIT=100
REQUEST_RATE_LIMIT_TIME=15

# Session
EXPRESS_SESSION_SECRET=your_session_secret

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Installation & Running

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Format code
npm run format

# Lint code
npm run lint
```

The server will start on `http://localhost:5002` (or your configured PORT).

---

## Support & Contact

For issues, questions, or contributions, please contact the development team or create an issue in the project repository.

---

**Last Updated**: December 2024  
**API Version**: 1.0.0
