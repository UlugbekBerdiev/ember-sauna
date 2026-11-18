"use client";

export function StatusActionForm({
  action,
  label,
  destructive = false,
}: {
  action: () => Promise<void>;
  label: string;
  destructive?: boolean;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (destructive && !window.confirm("Cancel this booking? This action is recorded in the audit log.")) {
          event.preventDefault();
        }
      }}
    >
      <button className={destructive ? "button button-outline admin-danger" : "button"} type="submit">{label}</button>
    </form>
  );
}
