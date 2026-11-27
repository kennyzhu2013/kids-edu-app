import { GUARDIAN_CONSENT_BODY, GUARDIAN_CONSENT_CHECKBOX, GUARDIAN_CONSENT_TITLE } from "@/lib/privacy";

export function GuardianConsentNotice({
  checked,
  onChange,
  disabled = false,
  recordedAt,
}: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  recordedAt?: string | null;
}) {
  return (
    <section className="rounded-[22px] bg-white p-4 text-left shadow-sm">
      <h2 className="font-black">{GUARDIAN_CONSENT_TITLE}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{GUARDIAN_CONSENT_BODY}</p>
      {recordedAt ? (
        <p className="mt-3 text-sm font-bold text-primary">已记录同意：{formatConsentTime(recordedAt)}</p>
      ) : onChange ? (
        <label className="mt-3 flex items-start gap-3 text-sm font-bold leading-6">
          <input
            type="checkbox"
            className="mt-1 size-5 accent-primary"
            checked={Boolean(checked)}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span>{GUARDIAN_CONSENT_CHECKBOX}</span>
        </label>
      ) : null}
    </section>
  );
}

function formatConsentTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("zh-CN", { hour12: false });
}
