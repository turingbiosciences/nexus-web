import React from 'react';

const Markdown = ({ children }: { children?: string | null }) =>
  React.createElement(React.Fragment, null, children);

export default Markdown;
