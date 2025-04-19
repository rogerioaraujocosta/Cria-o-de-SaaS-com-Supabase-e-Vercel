import React from 'react';

export function Dialog(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{props.children}</div>;
}
