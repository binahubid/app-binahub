// Test harness only, never an application route or authentication bypass.
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/app/globals.css';
import { IndividualTrial } from '../../../src/components/individual-trial';
createRoot(document.getElementById('root')!).render(<main className="min-h-screen bg-[#f5f7fa] p-4 sm:p-8"><IndividualTrial /></main>);
