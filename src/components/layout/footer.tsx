"use client";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t mt-auto">
      <div className="container-page py-6">
        <p className="text-center text-sm text-gray-600">
          &copy; {currentYear} Turing Biosciences. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
