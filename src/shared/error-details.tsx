export const ErrorDetails: React.FC<{ error: unknown }> = ({ error }) => {
  let msg: string;
  if (error instanceof Error) {
    const lines = [`${error.name}: ${error.message}`];
    const properties = JSON.stringify(error, undefined, 4);
    if (properties !== "{}") {
      lines.push(properties);
    }
    msg = lines.join("\n");
  } else {
    msg = JSON.stringify(error, undefined, 4);
  }
  return (
    <pre className="overflow-x-auto border p-1 font-mono whitespace-pre">
      {msg}
    </pre>
  );
};
