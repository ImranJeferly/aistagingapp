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
  Tailwind,
  Link,
  Button,
} from "@react-email/components";
import * as React from "react";

interface ResetPasswordEmailProps {
  resetLink: string;
  name?: string;
}

const baseUrl = "https://aistagingapp.com";

export const ResetPasswordEmail = ({ resetLink, name }: ResetPasswordEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your password for AI Staging App</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#A3E635",
                offWhite: "#FFFCF5",
              },
            },
          },
        }}
      >
        <Body 
          className="bg-offWhite my-auto mx-auto font-sans"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        >
          <Container className="my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px] mb-[32px] text-center">
              <Img
                src={`${baseUrl}/logo.png`}
                width="40"
                height="40"
                alt="AI Staging App"
                className="inline-block align-middle rounded-lg mr-2"
              />
              <Text className="inline-block align-middle text-gray-900 font-bold text-[20px] tracking-wide m-0">
                AI Staging App
              </Text>
            </Section>
            
            <Section className="bg-white p-[40px] text-center rounded-[12px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Heading className="text-black text-[24px] font-bold text-center p-0 my-0 mx-0 mb-[24px]">
                Reset your{' '}
                <span className="bg-[#F472B6] text-black px-2 py-1 rounded inline-block border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-2">
                  password
                </span>
              </Heading>
              
              <Text className="text-black text-[16px] leading-[24px] mb-[24px]">
                {name ? `Hi ${name}, ` : ''}We received a request to reset your password. Click the button below to choose a new one:
              </Text>

              <Section className="mb-[24px]">
                <Button
                  href={resetLink}
                  className="bg-[#A3E635] text-black font-black text-[16px] px-[24px] py-[16px] rounded-[8px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] no-underline inline-block text-center"
                >
                  RESET PASSWORD
                </Button>
              </Section>
              
              <Text className="text-gray-500 text-[14px] leading-[20px] m-0">
                This link expires in 5 minutes. If you didn't request this, please ignore this email.
              </Text>
            </Section>

            <Section className="mt-[32px] text-center">
              <Text className="text-[12px] text-gray-400">
                © 2026 AI Staging App. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ResetPasswordEmail;
