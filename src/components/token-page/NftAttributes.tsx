import { useState } from "react";

export function NftAttributes({
  attributes,
}: {
  attributes: Record<string, unknown> | Record<string, unknown>[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  /**
   * Assume the NFT attributes follow the conventional format
   */
  // Normalize attributes to array format
  const attributesArray = Array.isArray(attributes) ? attributes : [attributes];
  const items = attributesArray.filter(
    (item: Record<string, unknown>) => item.trait_type
  );
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="text-left font-medium text-gray-900">Traits</span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-wrap gap-3">
            {items.map((item) => (
              <div
                key={item.trait_type as string}
                className="flex flex-col gap-2 py-2 px-4 bg-white border border-gray-200 rounded-lg min-w-20"
              >
                {item.trait_type != null && (
                  <p className="text-sm text-center text-gray-600 leading-tight">
                    {String(item.trait_type)}
                  </p>
                )}
                <p className="text-center font-bold text-gray-900">
                  {typeof item.value === "object"
                    ? JSON.stringify(item.value || {})
                    : String(item.value || "")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
