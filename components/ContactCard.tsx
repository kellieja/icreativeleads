import React from 'react';
import { Contact } from '../types';
import Icon from './Icon';

interface ContactCardProps {
  contact: Contact;
}

const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  // Basic regex for email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const ContactCard: React.FC<ContactCardProps> = ({ contact }) => {
  const initials = contact.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  const isEmailValid = isValidEmail(contact.email);

  return (
    <div className="flex items-start p-4 bg-white rounded-lg border border-slate-200 h-full">
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-100 text-primary-dark rounded-full font-bold text-lg">
        {initials}
      </div>
      <div className="ml-4 overflow-hidden">
        <h4 className="text-md font-semibold text-slate-800 truncate">{contact.name}</h4>
        <p className="text-sm text-slate-500">{contact.title}</p>
        <div className="flex items-center mt-2 text-sm text-slate-500">
          <Icon icon="at" className="w-4 h-4 mr-2 flex-shrink-0" />
          {isEmailValid ? (
            <a href={`mailto:${contact.email}`} className="text-primary hover:underline truncate" title={contact.email}>
              {contact.email}
            </a>
          ) : (
            <span className="truncate text-slate-500" title="Invalid email format">
              {contact.email || 'No email provided'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactCard;