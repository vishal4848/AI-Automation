import React from 'react';

export function Footer() {
  return (
    <footer className="border-t border-border py-4 px-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto">
      <div>
        © {new Date().getFullYear()} <span className="font-semibold text-foreground">AI Automation</span>. All rights reserved.
      </div>
      <div className="flex items-center gap-4 text-[11px]">
        <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
        <a href="#" className="hover:text-foreground transition-colors">API Status</a>
        <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
      </div>
    </footer>
  );
}
