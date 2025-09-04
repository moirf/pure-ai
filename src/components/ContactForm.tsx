'use client';

import { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export default function ContactForm() {
  const form = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // EmailJS configuration - you'll need to set up these values
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'your_service_id';
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'your_template_id';
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'your_public_key';

      if (form.current) {
        await emailjs.sendForm(serviceId, templateId, form.current, publicKey);
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Send a Message</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Use the form below to send me a direct email. I'll get back to you as soon as possible.
        </p>
      </div>

      {submitStatus === 'success' && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-700 dark:text-green-300 text-sm">
            ✓ Message sent successfully! I'll get back to you soon.
          </p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">
            ✗ Failed to send message. Please try again or use the email address above.
          </p>
        </div>
      )}

      <form ref={form} onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors 
                ${errors.name 
                  ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500' 
                  : 'border-neutral-300 dark:border-neutral-700 focus:border-blue-500 focus:ring-blue-500'
                }
                bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
                focus:outline-none focus:ring-2 focus:ring-opacity-50`}
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors 
                ${errors.email 
                  ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500' 
                  : 'border-neutral-300 dark:border-neutral-700 focus:border-blue-500 focus:ring-blue-500'
                }
                bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
                focus:outline-none focus:ring-2 focus:ring-opacity-50`}
              disabled={isSubmitting}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-1">
            Subject *
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors 
              ${errors.subject 
                ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500' 
                : 'border-neutral-300 dark:border-neutral-700 focus:border-blue-500 focus:ring-blue-500'
              }
              bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
              focus:outline-none focus:ring-2 focus:ring-opacity-50`}
            disabled={isSubmitting}
          />
          {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            value={formData.message}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors resize-vertical 
              ${errors.message 
                ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500' 
                : 'border-neutral-300 dark:border-neutral-700 focus:border-blue-500 focus:ring-blue-500'
              }
              bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
              focus:outline-none focus:ring-2 focus:ring-opacity-50`}
            disabled={isSubmitting}
          />
          {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full md:w-auto px-6 py-2 rounded-lg text-sm font-medium transition-colors
            ${isSubmitting 
              ? 'bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white'
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}