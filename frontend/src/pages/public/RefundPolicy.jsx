import { Link } from 'react-router-dom'
import { LegalPage } from './Terms'
import { SITE_EMAIL, mailtoHref } from '../../utils/siteContact'

export default function RefundPolicy() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Refund & Cancellation Policy"
      updated="14 July 2026"
    >
      <p>
        This Refund &amp; Cancellation Policy applies to paid SocietyWale subscriptions purchased for housing-society
        workspaces on <strong>societywale.in</strong> (including annual society signup payments collected via Razorpay).
        By completing payment, you agree to this policy.
      </p>

      <h2>What you are purchasing</h2>
      <p>
        SocietyWale sells digital software access (SaaS): an annual society workspace for committee administrators and
        residents. Payment unlocks account creation and continued use of the product features available at the time of
        purchase. We are not selling physical goods.
      </p>

      <h2>No refund once payment is successful</h2>
      <p>
        <strong>All subscription fees are non-refundable once payment is successfully completed</strong> (including UPI,
        cards, netbanking or any other method processed through Razorpay). This includes early-bird, launch, offer, or
        full-price plans.
      </p>
      <p>
        After a successful payment, the society workspace and administrator account are considered delivered digital
        services. We do not issue refunds, chargebacks-friendly reversals, partial refunds, or proportional credits for
        unused time, change of mind, incorrect society details entered by you, or because you later decide not to use
        the product.
      </p>

      <h2>Cancellation</h2>
      <p>
        You may stop using SocietyWale at any time and choose not to renew when your paid period ends. Cancellation of
        future use does <strong>not</strong> entitle you to a refund of amounts already paid for the current subscription
        period.
      </p>
      <p>
        Committee administrators remain responsible for their society data and for offboarding members as needed. Member
        (resident) signup into an existing paid society does not create a separate refundable purchase unless a separate
        paid product is clearly offered at checkout.
      </p>

      <h2>Failed, duplicate, or incomplete payments</h2>
      <p>
        If a payment fails, is declined, or is not captured, no workspace is activated for that attempt and no fee is
        owed for that failed attempt.
      </p>
      <p>
        If you are charged more than once for the same successful subscription due to a technical error, contact us
        promptly with your Razorpay payment ID / order ID and bank SMS. Genuine duplicate successful charges for the same
        undelivered purchase will be reviewed and corrected. This exception does not create a general refund right after
        a successful single payment that already activated your workspace.
      </p>

      <h2>Payment gateway</h2>
      <p>
        Payments are processed securely by Razorpay. Card/UPI credentials are handled by the payment provider — not
        stored on SocietyWale servers. Payment receipts for successful society signup are emailed to the paying
        administrator as part of the welcome message.
      </p>

      <h2>Contact for billing queries</h2>
      <p>
        For payment confirmation or duplicate-charge queries (not general refund requests after successful signup), email{' '}
        <a className="font-semibold text-orange-600" href={mailtoHref('Billing / payment enquiry')}>
          {SITE_EMAIL}
        </a>{' '}
        with your society name, admin email, and Razorpay payment ID, or use our{' '}
        <Link className="font-semibold text-orange-600" to="/contact">
          Contact
        </Link>{' '}
        page. Also see our{' '}
        <Link className="font-semibold text-orange-600" to="/terms">
          Terms &amp; Conditions
        </Link>{' '}
        and{' '}
        <Link className="font-semibold text-orange-600" to="/privacy">
          Privacy policy
        </Link>
        .
      </p>
    </LegalPage>
  )
}
