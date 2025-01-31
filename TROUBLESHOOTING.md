# Troubleshooting Guide

This document provides solutions for common issues you might encounter while developing or using Notes PWA.

## Common Development Issues

### Build Failures

1. **TypeScript Errors**

```bash
Error: Cannot find module '@/components/ui/button'
```

**Solution**: Check your path aliases in `tsconfig.json` and verify import paths.

2. **Environment Variables**

```bash
Error: Firebase App not initialized
```

**Solution**: Verify your `.env` file exists and contains all required variables.

3. **Dependencies Issues**

```bash
Error: Cannot resolve dependency
```

**Solution**:

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### Runtime Issues

1. **Firebase Authentication**

- Issue: Sign-in not working
- Solution: Check Firebase Console for enabled auth methods

2. **Database Sync**

- Issue: Notes not syncing
- Solution: Check IndexedDB permissions and network connectivity

3. **Editor Issues**

- Issue: Content not saving
- Solution: Check browser console for errors and verify permissions

## Common User Issues

### Installation

1. **PWA Not Installing**

- Verify HTTPS connection
- Check if service worker is registered
- Clear browser cache and try again

2. **App Not Loading**

- Clear browser cache
- Check internet connection
- Verify browser compatibility

### Data Sync

1. **Notes Not Syncing**

- Check internet connection
- Verify user is signed in
- Check permissions in Firebase Console

2. **Calendar Events Missing**

- Verify calendar permissions
- Check event sharing settings
- Confirm sync status in app settings

## Debugging Tools

1. **Browser Developer Tools**

- Network tab for API calls
- Application tab for IndexedDB/LocalStorage
- Console for JavaScript errors

2. **Firebase Tools**

- Firebase Console for auth issues
- Firestore logs for database issues
- Analytics for usage patterns

3. **React Developer Tools**

- Component inspection
- State management debugging
- Performance profiling

## Error Messages

### Firebase Errors

1. **Permission Denied**

```bash
Error: Missing or insufficient permissions
```

**Solution**: Check Firestore rules and user authentication status

2. **Configuration Error**

```bash
Error: Firebase not initialized
```

**Solution**: Verify Firebase config in environment variables

### React Errors

1. **Render Error**

```bash
Error: Maximum update depth exceeded
```

**Solution**: Check useEffect dependencies and state updates

2. **Context Error**

```bash
Error: Cannot read property of undefined
```

**Solution**: Verify context provider wrapping

## Performance Issues

1. **Slow Loading**

- Implement code splitting
- Optimize image loading
- Use proper caching strategies

2. **Memory Leaks**

- Clean up useEffect hooks
- Properly dispose of subscriptions
- Monitor memory usage

## Getting Help

If you're still experiencing issues:

1. Check existing GitHub issues
2. Create a new issue with:
   - Detailed description
   - Steps to reproduce
   - Error messages
   - Environment details

## Reporting Security Issues

For security issues, please email [dangphung4@gmail.com] directly instead of creating a public issue.