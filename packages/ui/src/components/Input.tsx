import type { InputHTMLAttributes } from 'react';

export function Input({
  label,
  error,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <input
        className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 outline-none transition ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
            : 'border-gray-200 focus:border-brand-500 focus:ring-brand-100'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
