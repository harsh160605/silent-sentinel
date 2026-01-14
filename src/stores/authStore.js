import { create } from 'zustand';
import { signInAnonymouslyHelper, observeAuthState } from '../services/firebase';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  initializeAuth: () => {
    try {
      // Listen to auth state changes
      const unsubscribe = observeAuthState(async (user) => {
        if (user) {
          // User is signed in
          set({ user, loading: false });
        } else {
          // No user, sign in anonymously
          try {
            const anonUser = await signInAnonymouslyHelper();
            set({ user: anonUser, loading: false });
          } catch (error) {
            console.error('Failed to sign in anonymously:', error);
            // Set demo user for UI purposes
            set({ user: { uid: 'demo-user', isAnonymous: true }, loading: false });
          }
        }
      });

      // Return cleanup function
      return unsubscribe;
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Set demo user for UI purposes
      set({ user: { uid: 'demo-user', isAnonymous: true }, loading: false });
    }
  },
}));

