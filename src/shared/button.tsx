import type React from "react";

type HTMLButtonProps = React.ComponentPropsWithoutRef<"button">;

export type ButtonProps = Pick<
  HTMLButtonProps,
  "className" | "disabled" | "onClick" | "children"
> & {
  readonly type: NonNullable<HTMLButtonProps["type"]>;
};

export const Button: React.FC<ButtonProps> = (props) => {
  return (
    // eslint-disable-next-line react/button-has-type -- Should be provided by caller.
    <button
      className="cursor-pointer rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    />
  );
};
