import React from "react";
import Line from "@theme-original/CodeBlock/Line";

export default function LineWrapper(props) {
  // console.log('From LineWrapper, props:', props)

  return (
    <>
      <Line {...props} />
    </>
  );
}
