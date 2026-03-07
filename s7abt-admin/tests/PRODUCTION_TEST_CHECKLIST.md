# S7abt CMS Production Test Checklist

## Pre-Launch Testing Guide

**Date:** 2026-02-07
**API Endpoint:** https://wtti9qhhe3.execute-api.us-east-1.amazonaws.com/prod
**Admin Panel:** Your S3-hosted frontend URL

---

## 1. API Health Check Results

| Endpoint | Status | Notes |
|----------|--------|-------|
| /admin/sections | ✅ 401 | Working (auth required) |
| /admin/tags | ✅ 401 | Working (auth required) |
| /admin/articles | ✅ 401 | Working (auth required) |
| /admin/news | ✅ 401 | Working (auth required) |
| /admin/tweets | ✅ 401 | Working (auth required) |
| /admin/analytics/insights | ✅ 401 | Working (auth required) |
| /admin/auth/me | ✅ 401 | Working (auth required) |
| /admin/dashboard/stats | ✅ 401 | Working (auth required) |

---

## 2. Authentication Tests

### 2.1 Login Flow
- [ ] Navigate to admin panel URL
- [ ] Login page loads correctly
- [ ] Enter valid credentials (Cognito user)
- [ ] Click Login button
- [ ] Redirected to dashboard after successful login
- [ ] JWT token stored in localStorage/sessionStorage

### 2.2 Session Management
- [ ] Refresh page - stay logged in
- [ ] Open new tab - stay logged in
- [ ] Close browser and reopen - check session persistence
- [ ] Logout button works
- [ ] After logout, redirected to login page
- [ ] Cannot access protected routes after logout

### 2.3 Error Handling
- [ ] Wrong password shows error message
- [ ] Non-existent user shows error message
- [ ] Network error handled gracefully

---

## 3. Dashboard Tests

### 3.1 Dashboard Load
- [ ] Dashboard loads without errors
- [ ] Statistics cards display correctly
- [ ] Recent articles section shows data
- [ ] Analytics charts render (if any)

### 3.2 Navigation
- [ ] All sidebar menu items are clickable
- [ ] Active menu item is highlighted
- [ ] Mobile menu works (responsive)

---

## 4. Sections Module

### 4.1 List Sections
- [ ] Sections page loads
- [ ] Section list displays correctly
- [ ] Pagination works
- [ ] Empty state shown if no sections

### 4.2 Create Section
- [ ] Click "New Section" button
- [ ] Form opens/modal appears
- [ ] Fill in section name (Arabic/English)
- [ ] Submit form
- [ ] Success message appears
- [ ] New section appears in list

### 4.3 Edit Section
- [ ] Click edit button on a section
- [ ] Form pre-filled with existing data
- [ ] Modify section name
- [ ] Save changes
- [ ] Updated data reflects in list

### 4.4 Delete Section
- [ ] Click delete button
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] Section removed from list
- [ ] Cancel deletion works

---

## 5. Tags Module

### 5.1 List Tags
- [ ] Tags page loads
- [ ] Tags display correctly
- [ ] Search/filter works
- [ ] Pagination works

### 5.2 CRUD Operations
- [ ] Create new tag
- [ ] Edit existing tag
- [ ] Delete tag (with confirmation)
- [ ] Bulk operations (if available)

---

## 6. Articles Module

### 6.1 List Articles
- [ ] Articles page loads
- [ ] Article list displays with thumbnails
- [ ] Filter by section works
- [ ] Filter by status works
- [ ] Search by title works
- [ ] Pagination works
- [ ] Sort by date works

### 6.2 Create Article
- [ ] Click "New Article" button
- [ ] Article editor loads
- [ ] Enter title (Arabic)
- [ ] Select section from dropdown
- [ ] Enter content in rich text editor
- [ ] Upload featured image
- [ ] Add tags
- [ ] Set publish status (draft/published)
- [ ] Save as draft
- [ ] Publish article

### 6.3 Edit Article
- [ ] Click edit on existing article
- [ ] All fields pre-populated correctly
- [ ] Modify content
- [ ] Save changes
- [ ] Changes reflected in list

### 6.4 Delete Article
- [ ] Delete article with confirmation
- [ ] Article removed from list
- [ ] Soft delete (if implemented)

### 6.5 Image Upload
- [ ] Click image upload in editor
- [ ] Select image file
- [ ] Image uploads to S3
- [ ] Image displays in editor
- [ ] Image URL is correct

---

## 7. News Module

### 7.1 List News
- [ ] News page loads
- [ ] News items display correctly
- [ ] Pagination works

### 7.2 CRUD Operations
- [ ] Create news item
- [ ] Edit news item
- [ ] Delete news item
- [ ] Status toggle (if available)

---

## 8. Tweets Module

### 8.1 List Tweets
- [ ] Tweets page loads (now fixed with s7b_tweets table)
- [ ] Tweet list displays (empty initially)
- [ ] Filter by status works
- [ ] Pagination works

### 8.2 Tweet Operations
- [ ] Generate tweets from article (if Bedrock enabled)
- [ ] Edit tweet text
- [ ] Schedule tweet
- [ ] Delete tweet

---

## 9. Analytics Module

### 9.1 Analytics Dashboard
- [ ] Analytics page loads
- [ ] Date range selector works (7d, 30d, 90d)
- [ ] Content type filter works
- [ ] Charts render correctly
- [ ] Statistics display correctly

---

## 10. User Management (if available)

### 10.1 List Users
- [ ] Users page loads
- [ ] User list displays
- [ ] Role badges shown

### 10.2 User Operations
- [ ] Create new user (Cognito)
- [ ] Edit user role
- [ ] Disable/enable user
- [ ] Delete user

---

## 11. Performance Tests

### 11.1 Load Times
- [ ] Dashboard loads < 3 seconds
- [ ] Article list loads < 2 seconds
- [ ] Image upload < 5 seconds

### 11.2 Responsiveness
- [ ] Desktop (1920px) - layout correct
- [ ] Tablet (768px) - responsive layout
- [ ] Mobile (375px) - mobile layout

---

## 12. Error Handling

### 12.1 Network Errors
- [ ] Offline mode shows appropriate message
- [ ] Slow connection handled gracefully
- [ ] Retry buttons work

### 12.2 API Errors
- [ ] 400 errors show validation messages
- [ ] 401 errors redirect to login
- [ ] 500 errors show user-friendly message

---

## 13. Security Tests

### 13.1 Authentication
- [ ] Cannot access API without token
- [ ] Expired token redirects to login
- [ ] Token refresh works (if implemented)

### 13.2 Authorization
- [ ] Users can only access allowed resources
- [ ] Admin-only features hidden from regular users

---

## Test Summary

| Module | Tests Passed | Tests Failed | Notes |
|--------|-------------|--------------|-------|
| Auth | /  | | |
| Dashboard | /  | | |
| Sections | /  | | |
| Tags | /  | | |
| Articles | /  | | |
| News | /  | | |
| Tweets | /  | | |
| Analytics | /  | | |
| Users | /  | | |

**Overall Status:** ⬜ Ready for Launch / ⬜ Needs Fixes

**Tested By:** _______________
**Date:** _______________

---

## Quick Commands

```bash
# Run API health check
powershell -ExecutionPolicy Bypass -File tests/api-health-check.ps1

# Run automated tests (requires AUTH_TOKEN)
set AUTH_TOKEN=your_jwt_token
node tests/production-test.js
```
