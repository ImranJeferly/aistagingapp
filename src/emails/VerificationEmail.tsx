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
} from "@react-email/components";
import * as React from "react";

interface VerificationEmailProps {
  code: string;
  name?: string;
}

const baseUrl = "https://aistagingapp.com";

export const VerificationEmail = ({ code, name }: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your verification code for AI Staging App</Preview>
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
                Verify your{' '}
                <span className="bg-[#FACC15] text-black px-2 py-1 rounded inline-block border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-2">
                  email
                </span>
              </Heading>
              
              <Text className="text-black text-[16px] leading-[24px] mb-[24px]">
                {name ? `Hi ${name}, ` : ''}Welcome to AI Staging App! We're excited to have you. Use the code below to unlock your account:
              </Text>

              <Section className="bg-[#A3E635] rounded-[8px] py-[24px] px-[24px] mb-[24px] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Text className="text-black text-[36px] font-black tracking-[8px] m-0 leading-none font-sans">
                  {code}
                </Text>
              </Section>
              
              <Text className="text-gray-500 text-[14px] leading-[20px] m-0">
                This code expires in 10 minutes.
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

export default VerificationEmail;
