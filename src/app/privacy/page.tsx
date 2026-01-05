import React from 'react';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <Navigation />
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white border-2 border-black rounded-xl p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-4xl font-black text-gray-900 mb-8">Privacy Policy</h1>
          <p className="text-gray-600 mb-8 font-medium">Last updated: January 3, 2026</p>

          <div className="space-y-8 text-gray-800">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="mb-4">
                Welcome to AI Staging App ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice or our practices with regard to your personal information, please contact us at support@aistagingapp.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
              <p className="mb-4">
                We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website, or otherwise when you contact us.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Personal Information Provided by You:</strong> We collect names; email addresses; passwords; and other similar information.</li>
                <li><strong>Payment Data:</strong> We may collect data necessary to process your payment if you make purchases, such as your payment instrument number, and the security code associated with your payment instrument. All payment data is stored by Stripe.</li>
                <li><strong>Uploaded Content:</strong> We collect and store the images you upload for staging purposes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
              <p className="mb-4">
                We use personal information collected via our website for a variety of business purposes described below:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To facilitate account creation and logon process.</li>
                <li>To send you marketing and promotional communications.</li>
                <li>To fulfill and manage your orders.</li>
                <li>To deliver and facilitate delivery of services to the user.</li>
                <li>To respond to user inquiries/offer support to users.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Sharing Your Information</h2>
              <p className="mb-4">
                We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We may process or share your data that we hold based on the following legal basis:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Consent:</strong> We may process your data if you have given us specific consent to use your personal information for a specific purpose.</li>
                <li><strong>Legitimate Interests:</strong> We may process your data when it is reasonably necessary to achieve our legitimate business interests.</li>
                <li><strong>Performance of a Contract:</strong> Where we have entered into a contract with you, we may process your personal information to fulfill the terms of our contract.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Data Retention</h2>
              <p className="mb-4">
                We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Security of Your Information</h2>
              <p className="mb-4">
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Contact Us</h2>
              <p className="mb-4">
                If you have questions or comments about this policy, you may email us at support@aistagingapp.com.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
