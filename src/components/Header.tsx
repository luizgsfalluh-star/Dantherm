export default function Header() {
  return (
    <header className="w-full bg-dantherm-black">
      <div className="max-w-[1600px] mx-auto h-16 flex items-center justify-between px-4">
        {/* Left side: Logo + tagline */}
        <div className="flex items-center gap-3">
          {/* Red arrow/chevron icon */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M6 4L22 14L6 24V4Z"
              fill="#C41230"
            />
          </svg>
          <div className="flex flex-col">
            <span className="text-white font-bold text-xl leading-tight tracking-wide">
              DANTHERM
            </span>
            <span className="text-gray-400 text-xs leading-tight">
              Referência em troca térmica desde 1968
            </span>
          </div>
        </div>

        {/* Right side: App title */}
        <h1 className="text-white text-lg font-medium hidden sm:block">
          Calculadora de Trocador de Calor
        </h1>
      </div>
    </header>
  );
}
