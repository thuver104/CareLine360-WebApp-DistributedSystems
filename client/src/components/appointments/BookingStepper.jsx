import { Check } from "lucide-react";

export default function BookingStepper({ currentStep, steps }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((label, i) => {
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;

        return (
          <div key={label} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  isCompleted
                    ? "bg-[#0d9488] text-white shadow-md"
                    : isActive
                    ? "bg-[#0d9488] text-white shadow-lg ring-4 ring-[#0d9488]/20"
                    : "bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium ${
                  isActive
                    ? "text-[#0d9488] dark:text-teal-400"
                    : isCompleted
                    ? "text-gray-600 dark:text-gray-300"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-1 mt-[-18px] transition-colors duration-300 ${
                  i < currentStep ? "bg-[#0d9488]" : "bg-gray-200 dark:bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
