import { formatError } from "../utils/format-error";

export const ErrorDetails: React.FC<{ error: unknown }> = ({ error }) => {
  return (
    <pre className="overflow-x-auto border p-1 font-mono whitespace-pre">
      {formatError(error)}
    </pre>
  );
};
