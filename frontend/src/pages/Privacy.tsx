import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Eye, Trash2, Lock, UserCheck, ArrowLeft } from 'lucide-react';

const Privacy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link 
        to="/" 
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800"
      >
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Privacy Policy</h1>
        </div>

        <div className="prose prose-blue dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold flex items-center">
              <Eye className="w-5 h-5 mr-2 text-blue-600" />
              1. Data Minimization
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We collect only the data necessary for the library's operation. This includes your name, email, and borrowing history. We do not store sensitive personal information beyond what is required for authentication and notification.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold flex items-center">
              <Trash2 className="w-5 h-5 mr-2 text-blue-600" />
              2. Right to Erasure (GDPR)
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              In accordance with GDPR, users have the "Right to Erasure." You can delete your account at any time from your dashboard. This will permanently remove or anonymize your personal data from our system.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold flex items-center">
              <Lock className="w-5 h-5 mr-2 text-blue-600" />
              3. Data Security
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              All user data is stored securely. We use JWT for session management and Bcrypt for password hashing. Two-factor authentication (OTP) is implemented to ensure that only authorized users can access their accounts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold flex items-center">
              <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
              4. Transparency and Consent
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              By registering, you consent to receive email notifications for OTP verification and library updates. We are transparent about how your data is used and will never sell your information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">5. AI and Algorithmic Bias</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Our AI Library Assistant is designed to provide unbiased recommendations. We regularly audit our algorithms to ensure fairness and prevent digital exclusion.
            </p>
          </section>

          <section className="pt-8 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 italic">
              Last updated: April 5, 2026. Protecting your privacy is central to our design philosophy.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default Privacy;
