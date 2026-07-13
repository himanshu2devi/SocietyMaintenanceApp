import { Link } from 'react-router-dom'
import { LegalPage } from './Terms'
import { SITE_EMAIL, mailtoHref } from '../../utils/siteContact'

export default function Privacy() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      updated="13 July 2026"
    >
      <p>
        SocietyWale respects the privacy of committee users and residents. This policy explains what information we handle
        and how it is used to operate society workspaces, in line with responsible data practices for Indian organisations
        (including principles under the Digital Personal Data Protection Act, 2023, as applicable).
      </p>
      <h2>Information we process</h2>
      <p>
        Account details such as name, email, mobile, flat number and society association; operational records like
        maintenance charges, expenses, notices, bank account details published by committee, audit document links and
        payment claims entered by your society.
      </p>
      <h2>How we use information</h2>
      <p>
        To authenticate users, power dashboards and reports, deliver in-app notice alerts, and keep committee and member
        views in sync. We do not sell personal data.
      </p>
      <h2>Access control</h2>
      <p>
        Role-based access separates admin and member permissions. Societies control which members are active in their
        workspace. Each society’s operational data is scoped to that society.
      </p>
      <h2>Retention and security</h2>
      <p>
        Data is retained to support society operations and audit history. Sessions expire after inactivity.
        Use strong passwords and the forgot-password option when needed. Your connection to SocietyWale is encrypted in production.
      </p>
      <h2>Your choices</h2>
      <p>
        Committee admins can update or deactivate member accounts in their directory. For privacy requests related to
        your SocietyWale account, contact us using the details below.
      </p>
      <h2>Contact</h2>
      <p>
        Privacy questions? Email{' '}
        <a className="font-semibold text-orange-600" href={mailtoHref('Privacy enquiry')}>{SITE_EMAIL}</a>
        {' '}or visit the <Link className="font-semibold text-orange-600" to="/contact">Contact</Link> page.
      </p>
    </LegalPage>
  )
}
