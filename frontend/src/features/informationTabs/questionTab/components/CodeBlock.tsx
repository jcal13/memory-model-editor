import { Highlight } from "prism-react-renderer";
import styles from "./CodeBlock.module.css";

interface CodeBlockProps {
  code: string;
  language: "python" | "javascript" | "typescript" | "java" | string;
  showLineNumbers?: boolean;
  startLineNumber?: number;
  checkableLines?: Set<number>;
  selectedLine?: number | null;
  onLineClick?: (lineNumber: number) => void;
}

export default function CodeBlock({
  code,
  language,
  showLineNumbers = true,
  startLineNumber = 1,
  checkableLines,
  selectedLine,
  onLineClick,
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
            const {
              key: _lineKey,
              className: lineClassNameFromProps,
              ...restLineProps
            } = getLineProps({ line, key: index });
            const isCheckable = checkableLines?.has(lineNumber) ?? false;
            const isSelected = selectedLine === lineNumber;

            const lineClassName = [
              styles.line,
              lineClassNameFromProps ?? "",
              isCheckable ? styles.checkableLine : "",
              isSelected ? styles.selectedLine : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div
                key={index}
                className={lineClassName}
                onClick={
                  isCheckable && onLineClick
                    ? () => onLineClick(lineNumber)
                    : undefined
                }
                title={isCheckable ? `Check answer at line ${lineNumber}` : undefined}
                {...restLineProps}
              >
                {showLineNumbers && (
                  <span
                    className={`${styles.gutter} ${isCheckable ? styles.checkableGutter : ""}`}
                    aria-hidden="true"
                  >
                    {lineNumber}
                  </span>
                )}
                <span className={styles.code}>
                  {line.map((token, tokenIndex) => {
                    const { key: _tokenKey, ...tokenProps } = getTokenProps({
                      token,
                      key: tokenIndex,
                    });

                    return <span key={tokenIndex} {...tokenProps} />;
                  })}
                </span>
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}
