export const en = {
  common: {
    loading: 'Loading…',
    save: 'Save',
    cancel: 'Cancel',
    retry: 'Retry',
    error: 'Something went wrong',
  },
  auth: {
    login: 'Log in',
    signUp: 'Sign up',
    email: 'Email',
    password: 'Password',
    logout: 'Log out',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
  },
  student: {
    dashboard: 'Dashboard',
    universities: 'Universities',
    documents: 'Documents',
    events: 'Events',
    progress: 'Your progress',
    nextSteps: 'Next steps',
  },
  counselor: {
    students: 'Students',
    search: 'Search students',
  },
};

// Value types are `string` (not literals), so translations enforce key parity
// with English without requiring identical text.
export type TranslationResource = typeof en;
