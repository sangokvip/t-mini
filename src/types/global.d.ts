declare module 'react' {
  interface VideoHTMLAttributes<T> extends HTMLAttributes<T> {
    referrerPolicy?: string;
  }
} 