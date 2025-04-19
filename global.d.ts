// global.d.ts
// já existente…
declare module 'next/font/google';

// stubs para Radix UI
declare module '@radix-ui/react-dialog';
declare module '@radix-ui/react-dropdown-menu';
declare module '@radix-ui/react-label';
declare module '@radix-ui/react-select';
declare module '@radix-ui/react-tabs';
declare module '@radix-ui/react-toast';

// stubs para ícones
declare module 'lucide-react';

// stubs para resolvers (caso ainda não tenha)
/* já deve ter:
declare module '@hookform/resolvers/zod';
*/
// e para vitest, se usar testes:
declare module 'vitest';
