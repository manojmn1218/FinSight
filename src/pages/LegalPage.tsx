import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  FileText,
  Lock,
  Scale,
  Mail,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import FinSightLogo from '../components/FinSightLogo';

type SectionId = 'dmca' | 'privacy' | 'terms' | 'coppa' | 'gdpr' | 'canspam';

export default function LegalPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<SectionId>('dmca');

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (['dmca', 'privacy', 'terms', 'coppa', 'gdpr', 'canspam'].includes(hash)) {
      setActiveTab(hash as SectionId);
    }
  }, [location.hash]);

  const navItems = [
    { id: 'dmca' as SectionId, label: 'DMCA & Copyright Agent', icon: Scale, badge: '$6 Filing' },
    { id: 'privacy' as SectionId, label: 'Privacy & CIPA No-Wiretap', icon: Lock, badge: 'Cal. § 631' },
    { id: 'terms' as SectionId, label: 'Terms & Auto-Renewal (ARL)', icon: FileText, badge: 'Cal. ARL' },
    { id: 'coppa' as SectionId, label: 'COPPA Age Compliance', icon: UserCheck, badge: '18+ / 13+' },
    { id: 'gdpr' as SectionId, label: 'GDPR & Self-Hosted Fonts', icon: ShieldCheck, badge: 'IP Shielded' },
    { id: 'canspam' as SectionId, label: 'CAN-SPAM Communications', icon: Mail, badge: 'FTC Verified' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: 80 }}>
      {/* Top Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: 'var(--shadow)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text2)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
              <ArrowLeft size={16} /> Back to FinSight
            </Link>
            <div style={{ width: 1, height: 18, background: 'var(--border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FinSightLogo size={28} className="app-logo" />
              <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: -0.3 }}>FinSight Legal &amp; Compliance Hub</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'rgba(52, 211, 153, 0.1)', color: 'var(--green)', border: '1px solid rgba(52, 211, 153, 0.25)', fontWeight: 600 }}>
              ✓ Audited 2026 Standards
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: 1200, margin: '36px auto 0', padding: '0 24px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32 }}>
        
        {/* Left Sidebar Navigation */}
        <aside>
          <div style={{
            position: 'sticky',
            top: 96,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '16px 12px',
            boxShadow: 'var(--shadow)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)', margin: '4px 10px 12px' }}>
              Statutory Protections
            </p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navItems.map(item => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: active ? 'rgba(99, 102, 241, 0.14)' : 'transparent',
                      border: `1px solid ${active ? 'rgba(99, 102, 241, 0.4)' : 'transparent'}`,
                      color: active ? '#ffffff' : 'var(--text2)',
                      fontWeight: active ? 650 : 500,
                      fontSize: 14,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <Icon size={18} color={active ? 'var(--purple)' : 'var(--text3)'} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 10,
                        background: active ? 'var(--purple)' : 'rgba(255,255,255,0.06)',
                        color: active ? '#ffffff' : 'var(--text3)',
                        fontWeight: 650,
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div style={{ marginTop: 24, padding: '14px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text2)' }}>Legal Headquarters:</p>
              <p style={{ margin: '4px 0 0' }}>FinSight Technologies Inc.<br />548 Market St, Suite 300<br />San Francisco, CA 94104<br />USA</p>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <main>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '36px 40px',
              boxShadow: 'var(--shadow)',
              lineHeight: 1.7,
            }}
          >
            {/* 1. DMCA & COPYRIGHT AGENT NOTICE */}
            {activeTab === 'dmca' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Scale size={22} color="var(--purple)" />
                  </div>
                  <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>DMCA Safe Harbor &amp; Registered Agent Notice</h1>
                    <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>Digital Millennium Copyright Act Notice (17 U.S.C. § 512(c))</p>
                  </div>
                </div>

                <div style={{ margin: '24px 0', padding: '16px 20px', borderRadius: 'var(--radius-sm)', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={16} /> Safe Harbor Protection Active
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text2)' }}>
                    FinSight implements strict notice-and-takedown procedures under 17 U.S.C. § 512. Maintaining a registered DMCA designated agent protects against third-party user uploads and averts statutory infringement liabilities up to $150,000 per asset.
                  </p>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 10, color: 'var(--text)' }}>1. Designated DMCA Agent Contact Information</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
                  Notifications of claimed copyright infringement must be submitted directly to our designated agent:
                </p>

                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '20px 24px', fontSize: 13, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div>
                    <span style={{ color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>Service Provider</span>
                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>FinSight Technologies Inc.</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>Designated Agent</span>
                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>DMCA Compliance Officer</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>Email Address</span>
                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>
                      <a href="mailto:dmca@finsight.com" style={{ color: 'var(--purple)', textDecoration: 'underline' }}>dmca@finsight.com</a>
                    </p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>Telephone Contact</span>
                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>
                      <a href="tel:+14158905412" style={{ color: 'var(--text)', textDecoration: 'underline' }}>+1 (415) 890-5412</a>
                    </p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>Physical Address</span>
                    <p style={{ margin: '4px 0 0' }}>548 Market St, Suite 300, San Francisco, CA 94104</p>
                  </div>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 10, color: 'var(--text)' }}>2. Submitting a Takedown Notice</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
                  To submit an effective notification under 17 U.S.C. § 512(c)(3), your notice must include:
                </p>
                <ul style={{ paddingLeft: 20, fontSize: 13, color: 'var(--text2)', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                  <li>Physical or electronic signature of the authorized copyright owner.</li>
                  <li>Identification of the copyrighted work claimed to have been infringed.</li>
                  <li>Identification of the material to be removed, including specific URLs or transaction metadata.</li>
                  <li>Your address, telephone number, and email address.</li>
                  <li>A statement of good faith belief that use of the material is not authorized by the copyright owner.</li>
                  <li>A statement under penalty of perjury that information in the notification is accurate.</li>
                </ul>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 10, color: 'var(--text)' }}>3. Repeat Infringer Policy</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                  In accordance with § 512(i)(1)(A), FinSight has adopted a policy of terminating, in appropriate circumstances, accounts of subscribers who are repeat infringers.
                </p>
              </div>
            )}

            {/* 2. PRIVACY & CIPA (NO WIRETAPPING) */}
            {activeTab === 'privacy' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={22} color="var(--blue)" />
                  </div>
                  <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Privacy &amp; CIPA Non-Wiretapping Statement</h1>
                    <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>California Invasion of Privacy Act (Cal. Penal Code § 631) &amp; CCPA Compliance</p>
                  </div>
                </div>

                <div style={{ margin: '24px 0', padding: '16px 20px', borderRadius: 'var(--radius-sm)', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={16} /> Zero Keystroke Interception &amp; No Session Replay Wiretapping
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text2)' }}>
                    FinSight does <strong>not</strong> install session replay surveillance (such as Hotjar, FullStory, or LogRocket) and does <strong>not</strong> intercept or record keystrokes in violation of California wiretapping laws ($5,000 statutory damages per session).
                  </p>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>1. Data Collection Architecture</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
                  FinSight operates on a privacy-by-design model. We only process financial data that you deliberately submit (such as uploaded statement PDFs or manual entries). All client-side storage is restricted to authenticated token storage in your browser.
                </p>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>2. Input Masking &amp; Data Protection</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
                  Sensitive inputs—including passwords, verification OTPs, and financial account identifiers—use privacy masking attributes (<code style={{ color: 'var(--purple)', background: 'var(--bg2)', padding: '2px 6px', borderRadius: 4 }}>data-private="true"</code>, <code style={{ color: 'var(--purple)', background: 'var(--bg2)', padding: '2px 6px', borderRadius: 4 }}>type="password"</code>) and are never logged or transmitted to unauthorized analytics endpoints.
                </p>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>3. California Consumer Privacy Act (CCPA) Rights</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                  California residents have the right to request deletion of their data, request disclosure of categories collected, and opt out of any data sharing. We do not sell your personal data to any third party.
                </p>
              </div>
            )}

            {/* 3. TERMS & AUTOMATIC RENEWAL (ARL) */}
            {activeTab === 'terms' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(244, 114, 182, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={22} color="var(--pink)" />
                  </div>
                  <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Terms of Service &amp; Automatic Renewal Terms</h1>
                    <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>California Automatic Renewal Law (Cal. Bus. &amp; Prof. Code § 17602) Disclosure</p>
                  </div>
                </div>

                <div style={{ margin: '24px 0', padding: '16px 20px', borderRadius: 'var(--radius-sm)', background: 'rgba(244, 114, 182, 0.08)', border: '1px solid rgba(244, 114, 182, 0.25)' }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--pink)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={16} /> Transparent Automatic Renewal &amp; 1-Click Online Cancellation
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text2)' }}>
                    Under California ARL, automatic renewal terms must be presented in visual proximity to the purchase button. Subscribers maintain the right to cancel their subscription online at any time without onerous retention hurdles.
                  </p>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>1. Continuous Service &amp; Recurring Billing</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
                  By selecting a paid tier (FinSight Pro or FinSight Wealth), you authorize FinSight to charge your chosen payment method on a recurring monthly or annual basis at the disclosed rates until cancelled.
                </p>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>2. 1-Click Online Cancellation Mechanism</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
                  You may cancel your subscription at any time by navigating to your <strong>Account Profile &gt; Subscription &gt; Manage Plan</strong> and clicking "Cancel Auto-Renewal". Alternatively, email <a href="mailto:support@finsight.com?subject=Cancel%20Subscription" style={{ color: 'var(--purple)', textDecoration: 'underline' }}>support@finsight.com</a> with "Cancel Subscription" at least 24 hours prior to your scheduled renewal date.
                </p>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>3. Refund &amp; Trial Terms</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                  Paid subscriptions include a 14-day refund window for initial billing cycles. Notice of material fee changes is dispatched 30 calendar days in advance via email.
                </p>
              </div>
            )}

            {/* 4. COPPA COMPLIANCE & AGE GATE */}
            {activeTab === 'coppa' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(240, 180, 41, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={22} color="var(--amber)" />
                  </div>
                  <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>COPPA Compliance &amp; Protection of Minors</h1>
                    <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>Children's Online Privacy Protection Act (15 U.S.C. §§ 6501–6506)</p>
                  </div>
                </div>

                <div style={{ margin: '24px 0', padding: '16px 20px', borderRadius: 'var(--radius-sm)', background: 'rgba(240, 180, 41, 0.08)', border: '1px solid rgba(240, 180, 41, 0.25)' }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--amber)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} /> Strict 18+ General Service / Minimum Age 13 Gate
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text2)' }}>
                    COPPA imposes statutory penalties up to $53,044 per violation for knowingly collecting personal data from children under 13 without verifiable parental consent.
                  </p>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>1. Affirmative Age Verification</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
                  FinSight is intended for adult account holders with legal capacity to manage banking and financial accounts. Every new registrant is required to complete an affirmative age verification checkpoint asserting they are 18 years of age or older (or at least 13 with verified parental consent).
                </p>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>2. Immediate Account Deletion for Underage Submissions</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                  If FinSight learns that personal data of an individual under 13 has been collected without parental consent, we immediately purge all associated records, uploaded statements, and telemetry. Parents may contact <a href="mailto:privacy@finsight.com" style={{ color: 'var(--purple)', textDecoration: 'underline' }}>privacy@finsight.com</a> for inquiries.
                </p>
              </div>
            )}

            {/* 5. GDPR & SELF-HOSTED FONTS */}
            {activeTab === 'gdpr' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(52, 211, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={22} color="var(--green)" />
                  </div>
                  <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>GDPR &amp; Self-Hosted Asset Infrastructure</h1>
                    <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>EU General Data Protection Regulation (Regulation (EU) 2016/679)</p>
                  </div>
                </div>

                <div style={{ margin: '24px 0', padding: '16px 20px', borderRadius: 'var(--radius-sm)', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={16} /> 100% Self-Hosted Fonts &amp; Zero Unauthorized IP Transmission
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text2)' }}>
                    In accordance with the Munich Regional Court ruling (Case 3 O 17493/20), FinSight self-hosts all Inter typography packages locally. Your IP address is never automatically routed to external font CDN servers.
                  </p>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>1. IP Address Protection</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
                  Dynamic font stylesheets and static assets are served directly from our origin domain, preventing cross-border data leakage and ensuring compliance with European privacy mandates.
                </p>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>2. Strict Content Security Policy (CSP)</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                  FinSight enforces HTTP CSP rules that block unapproved external stylesheet scripts and tracking pixels, guaranteeing that your device information remains isolated.
                </p>
              </div>
            )}

            {/* 6. CAN-SPAM ACT */}
            {activeTab === 'canspam' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(129, 140, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={22} color="var(--purple)" />
                  </div>
                  <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>CAN-SPAM Act Compliance Standards</h1>
                    <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>Controlling the Assault of Non-S solicitation and Marketing Act (15 U.S.C. § 7701)</p>
                  </div>
                </div>

                <div style={{ margin: '24px 0', padding: '16px 20px', borderRadius: 'var(--radius-sm)', background: 'rgba(129, 140, 248, 0.08)', border: '1px solid rgba(129, 140, 248, 0.25)' }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--purple)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={16} /> Commercial Email Transparency &amp; Valid Physical Address
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text2)' }}>
                    All outbound transactional and marketing communications include a valid physical postal address and accessible unsubscribe and notification preferences mechanisms, avoiding statutory penalties up to $53,088 per email.
                  </p>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>1. Mandatory Header &amp; Routing Integrity</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
                  All outgoing emails are dispatched with verified Sender Identity headers (SPF, DKIM, and DMARC aligned) identifying FinSight Technologies Inc. as the sole sender.
                </p>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>2. Physical Postal Location</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
                  As required by 15 U.S.C. § 7704(a)(5)(A), our physical address is published in every email footer:<br />
                  <strong style={{ color: 'var(--text)' }}>FinSight Technologies Inc. • 548 Market St, Suite 300, San Francisco, CA 94104, USA</strong>
                </p>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>3. Instant Unsubscribe &amp; Opt-Out Mechanism</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                  Users may opt out of non-essential marketing notifications with one click or by emailing <a href="mailto:support@finsight.com?subject=Unsubscribe" style={{ color: 'var(--purple)', textDecoration: 'underline' }}>support@finsight.com</a> with "Unsubscribe" in the subject line. Opt-out requests are processed immediately and honored permanently.
                </p>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

