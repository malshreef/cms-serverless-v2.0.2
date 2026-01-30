# Loading Icon Fix - News Page

## Issue
The News page kept showing the loading icon indefinitely and never displayed any content.

## Root Cause
The `setLoading(false)` was missing in the success case of the `fetchNews()` function. It was only being called in the error handler, so when the API call succeeded, the loading state remained `true`.

## Solution
Moved `setLoading(false)` to a `finally` block to ensure it's called whether the API call succeeds or fails.

### Code Change:

**Before:**
```javascript
try {
  const response = await newsAPI.list(params);
  // ... process data
} catch (error) {
  console.error('Error fetching news:', error);
  setLoading(false); // Only called on error
}
```

**After:**
```javascript
try {
  const response = await newsAPI.list(params);
  // ... process data
} catch (error) {
  console.error('Error fetching news:', error);
  alert('حدث خطأ في تحميل الأخبار: ' + error.message);
} finally {
  setLoading(false); // Always called
}
```

## Installation
1. Replace your `src/pages/News.jsx` with the fixed version
2. Refresh your browser

## Expected Behavior
- Loading spinner shows briefly while fetching data
- News list appears after data is loaded
- If there's an error, an alert message is shown and loading stops

