"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogOut, TrendingUp, Briefcase, Clock, Loader } from "lucide-react";
import { WalletButton } from "@/components/wallet-button";
import { getContract, formatEther, getConnectedAddress } from "@/lib/web3";
import { uploadToPinata } from "@/lib/pinata";

interface Task {
  id: number;
  description: string;
  bounty: number;
  status: "open" | "assigned" | "submitted" | "approved" | "rejected";
  creator: string;
  assignee: string;
  fileCid?: string;
  solutionCid?: string;
}

export default function UserDashboard() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [claimingTaskId, setClaimingTaskId] = useState<number | null>(null);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitTaskId, setSubmitTaskId] = useState<number | null>(null);
  const [solutionNotes, setSolutionNotes] = useState("");
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [isSubmittingSolution, setIsSubmittingSolution] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const role = localStorage.getItem("userRole");
      const storedUsername = localStorage.getItem("username");
      if (role !== "user") {
        router.push("/");
        return;
      }
      setUsername(storedUsername || "");
      setUserAddress(await getConnectedAddress());
    };
    checkAuth();
  }, [router]);

  const loadTasks = async () => {
    try {
      const contract = await getContract();
      const count = await contract.getTaskCount();
      const arr: Task[] = [];

      for (let i = 0; i < count; i++) {
        const t = await contract.tasks(i);

        let status: Task["status"] = "open";

        if (
          t.rejected &&
          t.rejectedUser?.toLowerCase() === userAddress?.toLowerCase()
        ) {
          status = "rejected";
        } else if (t.approved) {
          status = "approved";
        } else if (t.submitted) {
          status = "submitted";
        } else if (
          t.assignee !== "0x0000000000000000000000000000000000000000"
        ) {
          status = "assigned";
        }

        arr.push({
          id: i,
          description: t.description,
          bounty: Number(formatEther(t.bounty)),
          status,
          creator: t.creator,
          assignee: t.assignee,
          fileCid: t.fileCid,
          solutionCid: t.solutionCid,
        });
      }

      setTasks(arr);
    } catch (err) {
      console.error("Task load error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    const id = setInterval(loadTasks, 6000);
    return () => clearInterval(id);
  }, []);

  const claimTask = async (id: number) => {
    setClaimingTaskId(id);
    try {
      const contract = await getContract(true as any);
      await (await contract.assignTask(id)).wait();
      loadTasks();
    } catch {
      alert("Error claiming task!");
    } finally {
      setClaimingTaskId(null);
    }
  };

  const openSubmitModal = (id: number) => {
    setSubmitTaskId(id);
    setSolutionFile(null);
    setSolutionNotes("");
    setShowSubmitModal(true);
  };

  const handleSubmitSolution = async () => {
    if (!solutionFile && !solutionNotes.trim())
      return alert("Provide a file or notes");
    if (submitTaskId === null) return;

    setIsSubmittingSolution(true);

    try {
      let cid = "";
      if (solutionFile) {
        cid = await uploadToPinata(solutionFile);
      } else {
        const blob = new Blob([solutionNotes], { type: "text/plain" });
        const f = new File([blob], "notes.txt", { type: "text/plain" });
        cid = await uploadToPinata(f);
      }

      const contract = await getContract(true as any);
      await (await contract.submitTask(submitTaskId, cid)).wait();

      setShowSubmitModal(false);
      loadTasks();
    } finally {
      setIsSubmittingSolution(false);
    }
  };

  const statusBadge = (s: Task["status"]) =>
    s === "approved"
      ? "bg-emerald-600/20 text-emerald-300 border-emerald-400/30"
      : s === "submitted"
      ? "bg-purple-600/20 text-purple-300 border-purple-400/30"
      : s === "rejected"
      ? "bg-red-600/20 text-red-300 border-red-400/30"
      : s === "assigned"
      ? "bg-sky-600/20 text-sky-300 border-sky-400/30"
      : "bg-amber-600/20 text-amber-300 border-amber-400/30";

  const isMine = (task: Task) =>
    task.assignee?.toLowerCase() === userAddress?.toLowerCase();

  const openTasks = tasks.filter((t) => t.status === "open").length;
  const myAssigned = tasks.filter((t) => isMine(t));
  const potential = myAssigned.reduce((s, t) => s + t.bounty, 0);

  return (
    <main className="relative min-h-screen bg-[#030014] text-white">
      <div className="absolute inset-0 bg-[url('/stars2.png')] opacity-60 animate-stars" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(80,35,201,0.5),_transparent_75%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-10">
        {/* HEADER */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl mt-2">
              Welcome, <span className="text-violet-300">{username}</span>
            </h1>
            <p className="text-sm text-violet-300/50">
              Earn crypto by completing missions!
            </p>
          </div>

          <div className="flex gap-3">
            <WalletButton />
            <Button
              className="bg-red-600/40"
              onClick={() => {
                localStorage.clear();
                router.push("/");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </header>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Open Missions"
            value={openTasks}
            glow="amber"
            icon={<Clock />}
          />
          <StatCard
            title="Assigned to Me"
            value={myAssigned.length}
            glow="cyan"
            icon={<Briefcase />}
          />
          <StatCard
            title="Potential Rewards"
            value={`${potential.toFixed(3)} ETH`}
            glow="emerald"
            icon={<TrendingUp />}
          />
        </div>

        {/* TASK LIST */}
        <Card className="bg-black/30 border border-violet-500/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Missions</CardTitle>
            <CardDescription>Choose and conquer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <Loader className="mx-auto mt-6 animate-spin text-violet-400" />
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex justify-between p-4 bg-black/50 border border-slate-600/50 rounded-md"
                >
                  <div>
                    <p className="font-medium">{task.description}</p>

                    {task.fileCid && isMine(task) && (
                      <a
                        className="text-xs underline text-cyan-300 block"
                        target="_blank"
                        href={`https://gateway.pinata.cloud/ipfs/${task.fileCid}`}
                      >
                        📄 View Mission File
                      </a>
                    )}

                    {task.solutionCid && (
                      <a
                        className="text-xs underline text-purple-300 block"
                        target="_blank"
                        href={`https://gateway.pinata.cloud/ipfs/${task.solutionCid}`}
                      >
                        🔍 Submitted Work
                      </a>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-violet-300">
                      {task.bounty} ETH
                    </p>

                    <span
                      className={`text-xs border px-2 py-1 rounded ${statusBadge(
                        task.status
                      )}`}
                    >
                      {task.status === "submitted"
                        ? "Waiting for Approval"
                        : task.status.charAt(0).toUpperCase() +
                          task.status.slice(1)}
                    </span>

                    {/* ACTION BUTTONS */}
                    {task.status === "open" && (
                      <Button
                        size="sm"
                        className="mt-2 bg-violet-600 hover:bg-violet-500"
                        disabled={claimingTaskId === task.id}
                        onClick={() => claimTask(task.id)}
                      >
                        {claimingTaskId === task.id ? (
                          <Loader className="h-3 w-3 animate-spin" />
                        ) : (
                          "Claim"
                        )}
                      </Button>
                    )}

                    {task.status === "assigned" && isMine(task) && (
                      <Button
                        size="sm"
                        className="mt-2 bg-emerald-600 hover:bg-emerald-500"
                        onClick={() => openSubmitModal(task.id)}
                      >
                        Submit Work
                      </Button>
                    )}

                    {task.status === "rejected" && isMine(task) && (
                      <Button
                        size="sm"
                        className="mt-2 bg-red-600 hover:bg-red-500"
                        onClick={() => openSubmitModal(task.id)}
                      >
                        Resubmit
                      </Button>
                    )}

                    {task.status === "approved" && isMine(task) && (
                      <p className="text-emerald-400 text-xs font-semibold mt-2">
                        🎉 Reward Released!
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* SUBMIT MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-slate-900 border-purple-500/40">
            <CardHeader>
              <CardTitle>Submit Solution</CardTitle>
              <CardDescription>Upload your work for review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                rows={4}
                className="w-full p-2 bg-black/40 border border-slate-600 rounded"
                placeholder="Notes (optional)"
                value={solutionNotes}
                onChange={(e) => setSolutionNotes(e.target.value)}
              />
              <input
                type="file"
                className="w-full text-sm"
                onChange={(e) => setSolutionFile(e.target.files?.[0] || null)}
              />

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={isSubmittingSolution}
                  onClick={() => setShowSubmitModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={isSubmittingSolution}
                  onClick={handleSubmitSolution}
                >
                  {isSubmittingSolution ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

function StatCard({ title, value, glow, icon }: any) {
  const glowStyle: any = {
    amber: "border-amber-500/40 shadow-[0_0_16px_rgba(251,191,36,0.4)]",
    cyan: "border-cyan-500/40 shadow-[0_0_16px_rgba(6,182,212,0.4)]",
    emerald: "border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.4)]",
  };
  return (
    <Card className={`bg-black/40 backdrop-blur-lg border ${glowStyle[glow]}`}>
      <CardHeader>
        <CardTitle className="text-xs text-gray-300">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold flex gap-1 items-center">
        {icon} {value}
      </CardContent>
    </Card>
  );
}
