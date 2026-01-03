# Plan/Tier Implementation Guide

## Current State
- All users are hardcoded to 'free' tier in `src/services/uploadService.ts`
- The `getUserTier()` function returns 'free' for everyone

## Option 1: Quick Testing (Temporary)
Modify `src/services/uploadService.ts`:

```typescript
export const getUserTier = async (userId: string): Promise<PricingTier> => {
  // For testing - change this value:
  return 'basic';  // or 'pro' or 'free'
};
```

## Option 2: Implement Database-Based Plans

### 1. Update User Document Schema
Add a `plan` field to user documents in Firestore:

```typescript
// In src/services/authService.ts - createUserDocument function
const userData = {
  uid,
  email,
  displayName: displayName || '',
  photoURL: photoURL || '',
  plan: 'free', // Add default plan
  createdAt,
  updatedAt,
  ...additionalData
};
```

### 2. Update getUserTier Function
```typescript
// In src/services/uploadService.ts
import { doc, getDoc } from 'firebase/firestore';

export const getUserTier = async (userId: string): Promise<PricingTier> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.plan || 'free'; // Default to free if no plan set
    }
    
    return 'free'; // Default for new users
  } catch (error) {
    console.error('Error fetching user tier:', error);
    return 'free'; // Default on error
  }
};
```

### 3. Add Plan Update Function
```typescript
// In src/services/uploadService.ts or new pricingService.ts
import { doc, updateDoc } from 'firebase/firestore';

export const updateUserPlan = async (userId: string, newPlan: PricingTier): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      plan: newPlan,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user plan:', error);
    throw error;
  }
};
```

### 4. Testing Different Plans
```typescript
// Test function to change a user's plan
export const setTestUserPlan = async (userId: string, plan: PricingTier) => {
  await updateUserPlan(userId, plan);
  console.log(`User ${userId} plan updated to: ${plan}`);
};

// Usage:
// setTestUserPlan('your-user-id', 'basic');
// setTestUserPlan('your-user-id', 'pro');
// setTestUserPlan('your-user-id', 'free');
```

## Current Plan Benefits:
- **Free**: 1 image per day
- **Basic ($10/mo)**: 20 images per month, no daily limits
- **Pro ($20/mo)**: 50 images per month, no daily limits

## Files to Check/Modify:
- `src/services/uploadService.ts` - getUserTier function
- `src/services/authService.ts` - user document creation
- `src/hooks/useUploadLimit.ts` - uses getUserTier
- `src/components/Navigation.tsx` - displays current plan
- `src/components/PricingSection.tsx` - plan selection UI

## Testing Steps:
1. Change the return value in `getUserTier()` function
2. Refresh the app to see the new limits
3. Check the navigation bar for plan display
4. Try uploading to test the limits
5. Check the pricing section behavior

## Database Structure (If Implementing Option 2):
```
users/{userId} {
  uid: string,
  email: string,
  displayName: string,
  plan: 'free' | 'basic' | 'pro',  // NEW FIELD
  createdAt: timestamp,
  updatedAt: timestamp
}
```
