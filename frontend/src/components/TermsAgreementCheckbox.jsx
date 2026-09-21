import { Link } from 'react-router-dom'

/**
 * Mandatory terms acceptance for signup / payment flows (UI-only gate).
 */
export default function TermsAgreementCheckbox({
  checked,
  onChange,
  disabled = false,
  id = 'accept-terms',
  includeRefund = false,
  error = '',
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-teal-700 focus:ring-teal-500 disabled:cursor-not-allowed"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span className="min-w-0 text-sm leading-6 text-slate-700">
          I agree to the{' '}
          <Link
            to="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-teal-700 hover:text-teal-800"
            onClick={(e) => e.stopPropagation()}
          >
            Terms of Use
          </Link>
          ,{' '}
          <Link
            to="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-teal-700 hover:text-teal-800"
            onClick={(e) => e.stopPropagation()}
          >
            Privacy Policy
          </Link>
          {includeRefund ? (
            <>
              {' '}
              and{' '}
              <Link
                to="/refund-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-teal-700 hover:text-teal-800"
                onClick={(e) => e.stopPropagation()}
              >
                Refund &amp; Cancellation Policy
              </Link>
            </>
          ) : null}
          . <span className="text-slate-500">Required to continue.</span>
        </span>
      </label>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
