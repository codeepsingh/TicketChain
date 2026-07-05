import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-container-lowest relative w-full border-t border-outline-variant mt-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop py-stack-lg max-w-container-max mx-auto">
        <div className="col-span-2 md:col-span-1 mb-6 md:mb-0">
          <div className="font-headline-lg-mobile text-headline-lg-mobile text-primary mb-4">TicketChain</div>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6">The future of secure, transparent, and premium event ticketing on the blockchain.</p>
          <div className="flex gap-4 text-on-surface-variant">
            <span className="material-symbols-outlined hover:text-secondary transition-colors cursor-pointer">public</span>
            <span className="material-symbols-outlined hover:text-secondary transition-colors cursor-pointer">share</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-label-sm text-label-sm text-on-surface mb-2">Platform</h4>
          <Link className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" to="/events">Events</Link>
          <Link className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" to="/create-event">Create Event</Link>
          <Link className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" to="/dashboard/organizer">Organizer Overview</Link>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-label-sm text-label-sm text-on-surface mb-2">Company</h4>
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#">About</a>
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#">Press</a>
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#">Contact</a>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-label-sm text-label-sm text-on-surface mb-2">Legal</h4>
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#">Privacy Policy</a>
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#">Terms of Service</a>
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">© 2024 TicketChain. Built on Stellar.</p>
      </div>
    </footer>
  );
};
