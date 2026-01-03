import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Button,
} from "@react-email/components";
import * as React from "react";

interface AbuseDetectionEmailProps {
  name?: string;
}

const baseUrl = "https://aistagingapp.com";

export const AbuseDetectionEmail = ({ name }: AbuseDetectionEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Action Required: Account Restriction Notice</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src={`${baseUrl}/logo.png`}
              width="40"
              height="40"
              alt="AI Staging App"
              style={logo}
            />
            <Text style={logoText}>AI Staging App</Text>
          </Section>
          
          <Section style={contentSection}>
            <Heading style={heading}>
              Account Restricted
            </Heading>
            
            <Text style={text}>
              {name ? `Hi ${name}, ` : ''}
              We have detected multiple free accounts associated with your IP address.
            </Text>

            <Section style={alertBox}>
              <Text style={alertText}>
                Free tier features have been temporarily blocked for your account.
              </Text>
            </Section>

            <Text style={text}>
              To continue using our services, please upgrade to a paid plan.
            </Text>

            <Section style={buttonSection}>
              <Button
                href={`${baseUrl}/pricing`}
                style={button}
              >
                UPGRADE PLAN
              </Button>
            </Section>
            
            <Text style={footerText}>
              If you believe this is a mistake, please contact support.
            </Text>
          </Section>

          <Text style={copyright}>
            © 2026 AI Staging App. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#FFFCF5",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "480px",
};

const logoSection = {
  marginTop: "32px",
  marginBottom: "32px",
  textAlign: "center" as const,
};

const logo = {
  display: "inline-block",
  verticalAlign: "middle",
  borderRadius: "8px",
  marginRight: "8px",
};

const logoText = {
  display: "inline-block",
  verticalAlign: "middle",
  fontSize: "20px",
  fontWeight: "bold",
  color: "#111",
  margin: "0",
};

const contentSection = {
  backgroundColor: "#ffffff",
  padding: "40px",
  borderRadius: "12px",
  border: "2px solid #000000",
  boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
  textAlign: "center" as const,
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#000000",
  marginBottom: "24px",
};

const text = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#000000",
  marginBottom: "24px",
};

const alertBox = {
  backgroundColor: "#FEF2F2",
  border: "2px solid #FECACA",
  borderRadius: "4px",
  padding: "16px",
  marginBottom: "24px",
};

const alertText = {
  fontSize: "16px",
  lineHeight: "24px",
  fontWeight: "bold",
  color: "#000000",
  margin: "0",
};

const buttonSection = {
  marginBottom: "24px",
};

const button = {
  backgroundColor: "#000000",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "900",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 24px",
  borderRadius: "8px",
  border: "2px solid #000000",
  boxShadow: "4px 4px 0px 0px rgba(0,0,0,0.5)",
};

const footerText = {
  fontSize: "14px",
  color: "#6B7280",
  margin: "0",
};

const copyright = {
  textAlign: "center" as const,
  fontSize: "12px",
  color: "#9CA3AF",
  marginTop: "32px",
};
