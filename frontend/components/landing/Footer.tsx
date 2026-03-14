"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, Linkedin, Twitter, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black/40 border-t border-white/5 pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Column 1: Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                    <Image src="/logo.jpeg" alt="Logo" fill className="object-cover" />
                </div>
                <span className="text-xl font-black tracking-tighter text-white">
                    <span className="text-mint">Mitti</span>Mitra
                </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Maximizing farmer net realization through hyper-local temporal arbitrage and blockchain-backed transparency.
            </p>
            <div className="flex space-x-4">
               <SocialLink href="https://github.com/Team-Technexis/MittiMitra" icon={<Github className="w-5 h-5" />} />
               <SocialLink href="#" icon={<Linkedin className="w-5 h-5" />} />
               <SocialLink href="#" icon={<Twitter className="w-5 h-5" />} />
            </div>
          </div>

          {/* Column 2: Technology */}
          <div>
            <h4 className="text-white font-bold mb-6 tracking-tight">The Stack</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><FooterLink href="#">Next.js 15 & React 19</FooterLink></li>
              <li><FooterLink href="#">FastAPI Decision Engine</FooterLink></li>
              <li><FooterLink href="#">Groq / Llama 3 (Agri-Vakeel)</FooterLink></li>
              <li><FooterLink href="#">Supabase PostGIS</FooterLink></li>
            </ul>
          </div>

          {/* Column 3: Ecosystem */}
          <div>
            <h4 className="text-white font-bold mb-6 tracking-tight">Ecosystem</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><FooterLink href="#">Market Arbitrage Engine</FooterLink></li>
              <li><FooterLink href="#">Q10 Spoilage Matrix</FooterLink></li>
              <li><FooterLink href="#">Blockchain Explorer</FooterLink></li>
              <li><FooterLink href="#">Transparency Ledger</FooterLink></li>
            </ul>
          </div>

          {/* Column 4: Support */}
          <div>
            <h4 className="text-white font-bold mb-6 tracking-tight">Compliance</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><FooterLink href="/privacy">Privacy Policy (DPDP)</FooterLink></li>
              <li><FooterLink href="#">Terms of Service</FooterLink></li>
              <li><FooterLink href="#">Cookie Settings</FooterLink></li>
              <li>
                <Link href="/login" className="inline-flex items-center space-x-2 text-mint font-bold hover:underline">
                    <span>Developer Portal</span>
                    <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs">
            © 2026 MittiMitra (KrishiAI) by Team Technexis. Built for Indian smallholder farmers.
          </p>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
             <span className="w-2 h-2 rounded-full bg-mint animate-pulse"></span>
             <span>System Status: Fully Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-mint/50 hover:bg-white/5 transition-all"
    >
      {icon}
    </Link>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="hover:text-mint transition-colors">
      {children}
    </Link>
  );
}
