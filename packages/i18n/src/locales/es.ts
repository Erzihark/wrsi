import type { TranslationResource } from './en';

// Typed as TranslationResource so the compiler enforces key parity with English.
export const es: TranslationResource = {
  common: {
    loading: 'Cargando…',
    save: 'Guardar',
    cancel: 'Cancelar',
    retry: 'Reintentar',
    error: 'Algo salió mal',
  },
  auth: {
    login: 'Iniciar sesión',
    signUp: 'Registrarse',
    email: 'Correo electrónico',
    password: 'Contraseña',
    logout: 'Cerrar sesión',
    noAccount: '¿No tienes una cuenta?',
    haveAccount: '¿Ya tienes una cuenta?',
  },
  student: {
    dashboard: 'Panel',
    universities: 'Universidades',
    documents: 'Documentos',
    events: 'Eventos',
    progress: 'Tu progreso',
    nextSteps: 'Próximos pasos',
  },
  counselor: {
    students: 'Alumnos',
    search: 'Buscar alumnos',
  },
};
