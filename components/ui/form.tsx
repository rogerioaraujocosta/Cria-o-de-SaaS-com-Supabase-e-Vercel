// components/ui/form.tsx
import React from 'react';

export function Form(props: React.FormHTMLAttributes<HTMLFormElement>) {
  return <form {...props}>{props.children}</form>;
}
export function FormField(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{props.children}</div>;
}
export function FormItem(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{props.children}</div>;
}
export function FormLabel(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props}>{props.children}</label>;
}
export function FormControl(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}
export function FormMessage(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{props.children}</div>;
}

// Adicione isto:
export function FormDescription(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{props.children}</div>;
}
