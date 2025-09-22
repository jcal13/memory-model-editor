import { Highlight } from "prism-react-renderer";
import styles from "./CodeBlock.module.css";

interface CodeBlockProps {
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
}: CodeBlockProps) {
  return (
    <Highlight code={code} language={language as any} theme={undefined}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={styles.container}
          style={style}
          role="region"
          aria-label="Code block"
        >
          {tokens.map((line, index) => {
            const lineNumber = startLineNumber + index;
            const lineProps = getLineProps({ line, key: index });

            return (
              <div
                key={index}
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
                  {line.map((token, tokenIndex) => (
                    <span
                      key={tokenIndex}
                      {...getTokenProps({ token, key: tokenIndex })}
                    />
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
