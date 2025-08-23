import { Highlight } from "prism-react-renderer";
import styles from "../styles/CodeBlock.module.css";

interface Props {
  code: string;
  language: "python" | "javascript" | "typescript" | "java" | string;
  showLineNumbers?: boolean;
  startLineNumber?: number;
}

export default function CodeBlock({
  code,
  language,
  showLineNumbers = true,
  startLineNumber = 1,
}: Props) {
  return (
    <Highlight code={code} language={language as any} theme={undefined}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre className={styles.container} style={style} role="region">
          {tokens.map((line, i) => {
            const lineNumber = startLineNumber + i;
            const lineProps = getLineProps({ line, key: i });
            return (
              <div
                key={i}
                className={`${styles.line} ${lineProps.className ?? ""}`}
                {...Object.fromEntries(
                  Object.entries(lineProps).filter(
                    ([key]) => key !== "className"
                  )
                )}
              >
                {showLineNumbers && (
                  <span className={styles.gutter} aria-hidden="true">
                    {lineNumber}
                  </span>
                )}
                <span className={styles.code}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token, key })} />
                  ))}
                </span>
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}
