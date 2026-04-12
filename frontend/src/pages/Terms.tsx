import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Scale, FileText, Lock, ArrowLeft } from 'lucide-react';

const Terms: React.FC = () => {
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
            <Scale className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Terms of Service</h1>
        </div>

        <div className="prose prose-blue dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              1. Professional Standards
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Professionalism in the field of computing extends far beyond technical competence. It encompasses the adherence to agreed-upon standards of conduct, integrity, and responsibility towards stakeholders. By using "My Library," you agree to maintain these standards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              2. User Responsibility
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Users are responsible for the safety of their accounts. Sharing credentials or attempting to bypass system security (RBAC) is strictly prohibited. We implement robust security measures, including OTP verification and encrypted data storage, to protect your identity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold flex items-center">
              <Lock className="w-5 h-5 mr-2 text-blue-600" />
              3. Legal Compliance
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Our system complies with Nepal's Electronic Transaction Act (2063) and international standards like GDPR. We respect intellectual property rights and copyright laws. Any unauthorized reproduction of digital content is a violation of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">4. Late Fines and Payments</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Late fines are calculated automatically based on the due date. Payments can be made securely through our integrated payment gateways (e.g., Khalti). Failure to return books on time may result in temporary suspension of borrowing privileges.
            </p>
          </section>

          <section className="pt-8 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 italic">
              Last updated: April 5, 2026. These terms are designed to ensure a socio-technical responsibility towards our library community.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default Terms;
