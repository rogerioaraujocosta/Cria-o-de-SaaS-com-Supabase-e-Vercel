import React from 'react';

export function Button(props: any) {
  return <div {...props}>{props.children}</div>;
}