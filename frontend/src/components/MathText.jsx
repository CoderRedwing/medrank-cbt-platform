import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Renders text that may contain inline LaTeX wrapped in $...$
// Example: "The value of $x^2 + y^2$ is:" renders math inline
export default function MathText({ text, style, className }) {
  const ref = useRef();

  useEffect(() => {
    if (!ref.current || !text) return;

    // Split text into math and non-math segments
    const parts = text.split(/(\$[^$]+\$)/g);
    const html  = parts.map((part) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1);
        try {
          return katex.renderToString(math, {
            throwOnError: false,
            displayMode:  false,
          });
        } catch {
          return part; // fallback to raw if katex fails
        }
      }
      // Escape HTML in plain text segments
      return part
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }).join('');

    ref.current.innerHTML = html;
  }, [text]);

  return <span ref={ref} style={style} className={className} />;
}