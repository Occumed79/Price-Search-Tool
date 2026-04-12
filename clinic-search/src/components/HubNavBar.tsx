import { Link } from "wouter";

const LOGO_URL = "https://media.base44.com/images/public/69db321c6efb66daf94886ba/ad765f27e_omLogo_header.png";

export default function HubNavBar() {
  return (
    <header className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-5">
      <Link href="/">
        <img src={LOGO_URL} alt="Occu-Med" className="h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity cursor-pointer" />
      </Link>
      <span className="text-xs text-white/25 tracking-widest uppercase font-medium">
        Network Search Hub
      </span>
    </header>
  );
}
