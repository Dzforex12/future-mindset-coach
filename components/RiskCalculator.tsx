"use client";

import { useState } from "react";

type RiskResult = {
  riskAmount: number;
  positionSize: number;
  reward: number;
  rr: string;
};

export default function RiskCalculator() {
  const [balance, setBalance] = useState("");
  const [riskPercent, setRiskPercent] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [result, setResult] = useState<RiskResult | null>(null);

  const calculate = () => {
    const bal = parseFloat(balance);
    const risk = parseFloat(riskPercent);
    const sl = parseFloat(stopLoss);

    if (!bal || !risk || !sl) return;

    const riskAmount = (bal * risk) / 100;
    const positionSize = (riskAmount / sl) * 10000; // pip value approx
    const reward = riskAmount * 2; // 1:2 RR

    setResult({
      riskAmount,
      positionSize,
      reward,
      rr: "1:2",
    });
  };

  return (
    <div className="bg-[#0f0f1a] p-6 rounded-xl border border-purple-700 shadow-lg">
      <h2 className="text-xl font-bold text-purple-400 mb-4">Risk Calculator</h2>

      <div className="space-y-3">
        <input
          type="number"
          placeholder="Account Balance ($)"
          className="w-full p-2 rounded bg-[#1a1a2e] text-white"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
        />

        <input
          type="number"
          placeholder="Risk %"
          className="w-full p-2 rounded bg-[#1a1a2e] text-white"
          value={riskPercent}
          onChange={(e) => setRiskPercent(e.target.value)}
        />

        <input
          type="number"
          placeholder="Stop Loss (pips)"
          className="w-full p-2 rounded bg-[#1a1a2e] text-white"
          value={stopLoss}
          onChange={(e) => setStopLoss(e.target.value)}
        />

        <button
          onClick={calculate}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded"
        >
          Calculate
        </button>
      </div>

      {result && (
        <div className="mt-5 bg-[#1a1a2e] p-4 rounded-lg text-white space-y-2">
          <p>Risk Amount: ${result.riskAmount.toFixed(2)}</p>
          <p>Position Size: {result.positionSize.toFixed(0)} units</p>
          <p>Reward (1:2): ${result.reward.toFixed(2)}</p>
          <p>R:R: {result.rr}</p>
        </div>
      )}
    </div>
  );
}
