import React from "react";
import { useLocation } from "wouter";
import logoOriginal from "../assets/recycleczs-logo-new.svg";
import logoApp from "../assets/recycleczs-logo-app.svg";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "w-full h-full" }: LogoProps) {
  const [location] = useLocation();
  
  // Usar a logo original apenas na página Welcome
  const isWelcomePage = location === "/welcome";
  const logoSrc = isWelcomePage ? logoOriginal : logoApp;

  return (
    <img src={logoSrc} alt="Recycleczs Logo" className={className} />
  );
}
