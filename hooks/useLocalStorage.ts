import { useEffect, useState } from "react";

/**
 * Custom hook for managing localStorage state with SSR safety
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  serialize: (value: T) => string = JSON.stringify,
  deserialize: (value: string) => T = JSON.parse
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(defaultValue);

  // Load from localStorage only after mount (client-side)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        setState(deserialize(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key, deserialize]);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.setItem(key, serialize(state));
    } catch (error) {
      console.warn(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, state, serialize]);

  return [state, setState];
}

/**
 * Specialized version for string values
 */
export function useLocalStorageString(key: string, defaultValue: string) {
  return useLocalStorage(key, defaultValue, String, String);
}

/**
 * Specialized version for number values
 */
export function useLocalStorageNumber(key: string, defaultValue: number) {
  return useLocalStorage(
    key,
    defaultValue,
    String,
    (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : defaultValue;
    }
  );
}

/**
 * Specialized version for boolean values
 */
export function useLocalStorageBoolean(key: string, defaultValue: boolean) {
  return useLocalStorage(
    key,
    defaultValue,
    String,
    (value) => value !== "false"
  );
}