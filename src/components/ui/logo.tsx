import Image from "next/image";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-12 w-auto" }: LogoProps) {
  return (
    <Image
      src="/turing-biosciences-logo.svg"
      alt="Turing Biosciences"
      width={200}
      height={48}
      className={className}
      style={{ width: "auto", height: "auto" }}
      priority
    />
  );
}
