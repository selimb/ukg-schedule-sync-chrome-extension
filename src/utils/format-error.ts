export function formatError(error: unknown): string {
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
  return msg;
}
