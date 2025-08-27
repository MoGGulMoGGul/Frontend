"use client";

import SearchIcon from "../icons/SearchIcon";
import { useEffect, useState } from "react";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  defaultValue?: string;
}

export default function SearchBar({
  placeholder = "검색어를 입력하세요",
  onSearch,
  defaultValue = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  const runSearch = () => {
    onSearch?.(query.trim());
  };

  return (
    <div className="mt-5 flex items-center relative mb-12">
      <input
        type="text"
        className="w-full border border-[#D9D9D9] h-16 rounded-4xl px-6 outline-none ring-0 focus:border-[#D9D9D9]"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            runSearch();
          }
        }}
      />
      <div
        className="absolute top-1/2 right-6 transform -translate-y-1/2 hover:cursor-pointer p-2"
        onClick={runSearch}
      >
        <SearchIcon />
      </div>
    </div>
  );
}
