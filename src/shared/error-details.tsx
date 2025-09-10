export const ErrorDetails: React.FC<{ error: unknown }> = ({ error }) => {
  return (
    <pre className="overflow-x-auto border font-mono whitespace-pre">
      {JSON.stringify(error, undefined, 4)}
    </pre>
  );
};
