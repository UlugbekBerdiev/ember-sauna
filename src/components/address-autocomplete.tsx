"use client";

import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import {
  formatPostalAddress,
  isCompletePostal,
  parseManualAddress,
  readResolvedAddress,
  readSuggestions,
  type AddressSuggestion,
  type PostalAddress,
} from "@/lib/address-suggest";

const emptyAddress: PostalAddress = { address: "", city: "", state: "", zip: "" };

export function AddressAutocomplete({
  id,
  value,
  onChange,
  error = "",
}: {
  id: string;
  value: Partial<PostalAddress>;
  onChange: (next: PostalAddress) => void;
  error?: string;
}) {
  const listId = useId();
  const selected = isCompletePostal(value) ? formatPostalAddress(value) : "";
  const [query, setQuery] = useState(selected);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [notice, setNotice] = useState("");
  const suggestRequest = useRef(0);
  const resolveRequest = useRef(0);
  const applied = useRef(selected);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected || selected === applied.current) return;
    applied.current = selected;
    setQuery(selected);
  }, [selected]);

  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3 || trimmed === selected || parseManualAddress(trimmed)) return;
    const current = ++suggestRequest.current;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/address-suggest?q=${encodeURIComponent(trimmed)}`);
        const suggestions = readSuggestions(await response.json());
        if (current !== suggestRequest.current) return;
        if (!response.ok) {
          setSuggestions([]);
          setNotice("Address suggestions are unavailable. Enter Street, City, ST ZIP.");
          setOpen(false);
          return;
        }
        setSuggestions(suggestions);
        setActive(suggestions.length ? 0 : -1);
        setNotice(suggestions.length ? "" : "No matching addresses. Enter Street, City, ST ZIP.");
        setOpen(suggestions.length > 0);
      } catch {
        if (current !== suggestRequest.current) return;
        setSuggestions([]);
        setNotice("Address suggestions are unavailable. Enter Street, City, ST ZIP.");
        setOpen(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, selected]);

  function updateQuery(next: string) {
    setQuery(next);
    setNotice("");
    setSuggestions([]);
    setOpen(false);
    const manual = parseManualAddress(next);
    if (manual) {
      applied.current = formatPostalAddress(manual);
      onChange(manual);
      return;
    }
    if (selected) {
      applied.current = "";
      onChange(emptyAddress);
    }
    setOpen(true);
  }

  async function choose(suggestion: AddressSuggestion) {
    const current = ++resolveRequest.current;
    suggestRequest.current += 1;
    const parsed = parseManualAddress(suggestion.label);
    setOpen(false);
    setSuggestions([]);
    setQuery(parsed ? formatPostalAddress(parsed) : suggestion.label);
    if (parsed) {
      applied.current = formatPostalAddress(parsed);
      onChange(parsed);
    }
    try {
      const response = await fetch(`/api/address-suggest?id=${encodeURIComponent(suggestion.id)}`);
      const resolved = readResolvedAddress(await response.json());
      if (current !== resolveRequest.current) return;
      if (!resolved) {
        if (!parsed) setNotice("That address could not be completed. Try another suggestion.");
        return;
      }
      applied.current = formatPostalAddress(resolved);
      setQuery(formatPostalAddress(resolved));
      onChange(resolved);
      setNotice("");
    } catch {
      if (current !== resolveRequest.current || parsed) return;
      setNotice("That address could not be completed. Try another suggestion.");
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      void choose(suggestions[active]);
    }
  }

  const listOpen = open && suggestions.length > 0 && !error;

  useEffect(() => {
    if (!listOpen) return;
    rootRef.current?.querySelector(".address-menu")?.scrollIntoView({ block: "nearest" });
  }, [listOpen]);

  return (
    <div className="field">
      <label htmlFor={id}>Delivery address</label>
      <div className="address-field" ref={rootRef}>
        <input
          className="input"
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={listOpen}
          aria-controls={listId}
          aria-activedescendant={listOpen && active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          required
          placeholder="Start typing a street address"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          onFocus={() => { if (suggestions.length) setOpen(true); }}
          onKeyDown={onKeyDown}
        />
        {listOpen && (
          <ul className="address-menu" id={listId} role="listbox">
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.id} role="presentation">
                <button
                  id={`${listId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    void choose(suggestion);
                  }}
                >
                  {suggestion.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="placeholder-note">Choose a suggestion, or enter Street, City, ST ZIP.</p>
      <p className="placeholder-note">Address suggestions by Esri.</p>
      <p className="sr-only" aria-live="polite">{listOpen ? `${suggestions.length} address suggestions.` : ""}</p>
      {notice && <p className="field-error" role="status">{notice}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
