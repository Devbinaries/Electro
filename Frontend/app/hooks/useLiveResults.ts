import { useEffect, useState } from "react";
import { socket } from "~/services/socket";

export function useLiveResults() {
  const [results, setResults] =
    useState([]);

  useEffect(() => {
    socket.on(
      "results:update",
      (payload) => {
        setResults(payload);
      }
    );

    return () => {
      socket.off(
        "results:update"
      );
    };
  }, []);

  return results;
}