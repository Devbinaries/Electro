import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { verifyStudentId } from "~/services/voter";

export default function VerifyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [studentId, setStudentId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const electionId =
    searchParams.get("election") ?? localStorage.getItem("voterElectionId") ?? undefined;

  const handleGetOtp = async () => {
    const trimmedId = studentId.trim();

    if (!trimmedId) {
      alert("Please enter your student ID.");
      return;
    }

    setIsVerifying(true);

    try {
      const response = await verifyStudentId(trimmedId, electionId ?? undefined);

      if (!response.valid) {
        alert(response.error ?? "Student ID is not eligible to vote.");
        return;
      }

      localStorage.setItem("voterStudentId", trimmedId);
      localStorage.setItem("voterElectionId", response.electionId);
      localStorage.setItem("voterId", response.voterId);
      navigate("/voter/otp");
    } catch (error) {
      console.error(error);
      alert("Unable to verify the student ID. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-900 mb-6">
          Enter your Student ID
        </h1>

        <input
          type="text"
          inputMode="numeric"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="Student ID"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleGetOtp}
          className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Verify
        </button>
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Powered by Electro
      </p>
    </div>
  );
}