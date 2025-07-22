// components/CodeBlock.tsx
import { Highlight } from "prism-react-renderer";
import styles from "../styles/CodeBlock.module.css";

interface Props {
  code: string;
  language: "python" | "javascript" | "typescript" | "java" | string;
}

export default function CodeBlock({ code, language }: Props) {
  return (
    <Highlight code={code} language={language as any} theme={undefined}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre className={styles.container} style={style}>
          {tokens.map((line, i) => (
            <div {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
