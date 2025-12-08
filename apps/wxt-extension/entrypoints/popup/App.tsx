import { useState } from "react";

import { Button } from "@sassy/ui/button";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-w-64 p-4">
      <h1 className="text-foreground mb-4 text-xl font-bold">
        EngageKit WXT POC
      </h1>
      <p className="text-muted-foreground mb-4 text-sm">
        This is a proof of concept for the WXT-based extension.
      </p>
      <Button onClick={() => setCount((c) => c + 1)}>Count: {count}</Button>
    </div>
  );
}
