import React from 'react';

declare module 'react' {
  interface VideoHTMLAttributes<T> extends HTMLAttributes<T> {
    referrerPolicy?: string;
  }
} 