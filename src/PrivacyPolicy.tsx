const C = {
  parchment: "#F2D9B8",
  sandLight: "#F7EDD8",
  cream: "#FBF3E8",
  white: "#FFFDF8",
  maroon: "#6B1A2A",
  maroonLight: "#A84050",
  bronze: "#7A4828",
  deep: "#3D0A12",
} as const;

const sections = [
  {
    title: "Information We Collect",
    body:
      "We may collect your name, phone number, email address, batch preference, payment details, and messages you send to us through Instagram, WhatsApp, forms, or our website.",
  },
  {
    title: "How We Use Information",
    body:
      "We use this information to respond to enquiries, reserve batch slots, process registrations and payments, send class-related updates, and improve our student support experience.",
  },
  {
    title: "Instagram And Messaging Data",
    body:
      "If you contact Anandamayi Nrityalaya through Instagram, we may receive your public profile information and message content through Meta's messaging platform. This data is used only to reply to your enquiry, guide registration, and provide batch or payment support.",
  },
  {
    title: "Sharing Of Data",
    body:
      "We do not sell personal information. Data may be shared only with trusted service providers involved in hosting, payments, or communication support when required to operate our services.",
  },
  {
    title: "Data Retention",
    body:
      "We retain information only for as long as necessary to manage admissions, student support, legal obligations, and internal records.",
  },
  {
    title: "Your Choices",
    body:
      "You may contact us to request correction or deletion of your information, subject to any legal or operational requirements that apply.",
  },
  {
    title: "Contact Us",
    body:
      "For privacy-related questions, please contact Anandamayi Nrityalaya at Anandamayinrityalaya@gmail.com or call 9849299953.",
  },
];

export default function PrivacyPolicy() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${C.sandLight}, ${C.cream})`,
        color: C.deep,
        padding: "48px 20px 72px",
        fontFamily: "'Manrope','Segoe UI',sans-serif",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.maroon}18`,
            borderRadius: 28,
            padding: "32px 28px",
            boxShadow: "0 18px 48px rgba(61,10,18,0.08)",
          }}
        >
          <p
            style={{
              fontSize: 12,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: C.maroonLight,
              marginBottom: 10,
            }}
          >
            Anandamayi Nrityalaya
          </p>
          <h1
            style={{
              fontFamily: "'DM Serif Display',serif",
              fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
              color: C.maroon,
              marginBottom: 10,
            }}
          >
            Privacy Policy
          </h1>
          <p style={{ color: C.bronze, lineHeight: 1.8, marginBottom: 8 }}>
            Effective date: March 22, 2026
          </p>
          <p style={{ color: C.bronze, lineHeight: 1.9, marginBottom: 28 }}>
            Anandamayi Nrityalaya respects your privacy. This policy explains how we collect, use,
            and protect information shared through our website, forms, payments, and social
            messaging channels including Instagram.
          </p>

          <div style={{ display: "grid", gap: 18 }}>
            {sections.map((section) => (
              <section
                key={section.title}
                style={{
                  padding: "18px 20px",
                  background: `${C.parchment}45`,
                  border: `1px solid ${C.maroon}12`,
                  borderRadius: 18,
                }}
              >
                <h2
                  style={{
                    fontFamily: "'DM Serif Display',serif",
                    fontSize: 24,
                    color: C.deep,
                    marginBottom: 8,
                  }}
                >
                  {section.title}
                </h2>
                <p style={{ color: C.bronze, lineHeight: 1.85 }}>{section.body}</p>
              </section>
            ))}
          </div>

          <div
            style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop: `1px solid ${C.maroon}14`,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <a
              href="/"
              style={{
                color: C.maroon,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Back To Website
            </a>
            <a
              href="mailto:Anandamayinrityalaya@gmail.com"
              style={{
                color: C.maroon,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Anandamayinrityalaya@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
