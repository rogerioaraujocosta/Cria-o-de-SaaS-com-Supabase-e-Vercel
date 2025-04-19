import React from 'react';

// Componente principal
export function Dialog(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{props.children}</div>;
}

// Sub‑componentes usados pelo shadcn/UI
export function DialogContent(
  props: React.HTMLAttributes<HTMLDivElement>
) {
  return <div {...props}>{props.children}</div>;
}

export function DialogHeader(
  props: React.HTMLAttributes<HTMLDivElement>
) {
  return <header {...props}>{props.children}</header>;
}

export function DialogTitle(
  props: React.HTMLAttributes<HTMLHeadingElement>
) {
  return <h2 {...props}>{props.children}</h2>;
}

export function DialogFooter(
  props: React.HTMLAttributes<HTMLDivElement>
) {
  return <footer {...props}>{props.children}</footer>;
}
