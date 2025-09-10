import { type PropsWithChildren, useImperativeHandle, useRef } from "react";

export type ModalRef = {
  open: () => void;
};

export type ModalProps = PropsWithChildren<{
  header: string;
  ref: React.Ref<ModalRef>;
}>;

export const Modal: React.FC<ModalProps> = ({ header, children, ref }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useImperativeHandle(
    ref,
    (): ModalRef => ({
      open: () => {
        dialogRef.current?.showModal();
      },
    }),
    [],
  );

  return (
    // Inspired by https://flowbite.com/docs/components/modal/
    <dialog
      {...dialogProps}
      className="m-auto max-w-full min-w-2xl space-y-2 overflow-x-hidden overflow-y-auto rounded-lg bg-white backdrop:bg-gray-900/50"
      ref={dialogRef}
    >
      {/* Header */}
      <div className="flex items-center justify-between rounded-t border-b border-gray-200 p-4 md:p-5">
        <h3 className="text-xl font-semibold text-gray-900">{header}</h3>

        <button
          className="ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900"
          onClick={() => {
            dialogRef.current?.close();
          }}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 14 14"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>

          <span className="sr-only">Close modal</span>
        </button>
      </div>

      {/* Body */}
      {children}
    </dialog>
  );
};

// https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/73633
// For some reason `closedby` isn't in the types.
// ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog#closedby
const dialogProps: Record<string, unknown> = {
  closedby: "any",
};
