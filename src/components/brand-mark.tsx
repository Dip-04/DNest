export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className={className} fill="none">
      <path
        d="M8.5 25.5C7.8 15.1 14.5 8 24.3 8c9.7 0 16.4 7.2 15.5 17.4-.8 9.1-7.1 14.5-15.8 14.5-8.8 0-14.9-5.5-15.5-14.4Z"
        stroke="currentColor"
        strokeWidth="2.3"
      />
      <path
        d="M5.8 29.2c4.7-7.4 10.6-11.1 18-11.1 7.5 0 13.6 3.8 18.4 11.4M8.7 34.6c4.8-6 9.9-8.9 15.4-8.9 5.6 0 10.6 3 15.1 8.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".66"
      />
      <path
        d="M18.2 18.4v12.4h5.3c4.6 0 7.4-2.2 7.4-6.2 0-3.9-2.8-6.2-7.4-6.2h-5.3Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <circle cx="19" cy="34.8" r="1.7" fill="currentColor" />
      <circle cx="29" cy="34.8" r="1.7" fill="currentColor" />
    </svg>
  );
}
