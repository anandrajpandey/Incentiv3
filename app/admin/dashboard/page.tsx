"use client";

import type React from "react";
import { uploadToPinata } from "@/lib/pinata";
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
import { Input } from "@/components/ui/input";
import {
  LogOut,
  Plus,
  CheckCircle,
  Loader,
  Eye,
  Sparkles,
  XCircle,
} from "lucide-react";
import { WalletButton } from "@/components/wallet-button";
import { getContract, getProvider, formatEther, parseEther } from "@/lib/web3";

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

export default function AdminDashboard() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({ description: "", bounty: "" });
  const [taskFile, setTaskFile] = useState<File | null>(null);

  const [reviewTask, setReviewTask] = useState<Task | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("userRole") !== "admin") router.push("/");
    setUsername(localStorage.getItem("username") || "");
  }, [router]);

  const loadTasks = async () => {
    try {
      const contract = await getContract();
      const count = await contract.getTaskCount();
      const all: Task[] = [];

      for (let i = 0; i < count; i++) {
        const t = await contract.tasks(i);

        let status: Task["status"] = "open";

        if (
          !t.open &&
          !t.submitted &&
          t.assignee !== "0x0000000000000000000000000000000000000000"
        )
          status = "assigned";

        if (t.submitted && !t.approved && !t.rejected) status = "submitted";

        if (t.approved) status = "approved";

        if (t.rejected) status = "rejected";

        all.push({
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
      setTasks(all.reverse());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    const id = setInterval(loadTasks, 6000);
    return () => clearInterval(id);
  }, []);

  const approve = async (id: number) => {
    setProcessing(true);
    try {
      const contract = await getContract(true);
      await (await contract.approveTask(id)).wait();
      setReviewTask(null);
      loadTasks();
    } finally {
      setProcessing(false);
    }
  };

  const reject = async (id: number) => {
    setProcessing(true);
    try {
      const contract = await getContract(true);
      await (await contract.rejectTask(id)).wait();
      setReviewTask(null);
      loadTasks();
    } finally {
      setProcessing(false);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      let cid = "";
      if (taskFile) cid = await uploadToPinata(taskFile);

      const contract = await getContract(true);
      await (
        await contract.createTask(formData.description, cid, {
          value: parseEther(formData.bounty),
        })
      ).wait();

      setShowCreateForm(false);
      setFormData({ description: "", bounty: "" });
      setTaskFile(null);
      loadTasks();
    } finally {
      setIsCreating(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    router.push("/");
  };

  const badge = (status: Task["status"]) => {
    return status === "approved"
      ? "text-emerald-300 border-emerald-500/30 bg-emerald-600/20"
      : status === "submitted"
      ? "text-yellow-300 border-yellow-500/30 bg-yellow-600/20"
      : status === "assigned"
      ? "text-sky-300 border-sky-500/30 bg-sky-600/20"
      : status === "rejected"
      ? "text-red-300 border-red-500/30 bg-red-600/20"
      : "text-amber-300 border-amber-500/30 bg-amber-600/20";
  };

  return (
    <main className="relative min-h-screen bg-[#030014] text-white">
      <div className="absolute inset-0 bg-[url('/stars2.png')] opacity-50 animate-stars" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-10">
        <header className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 bg-violet-700/30 border border-violet-500/30 px-3 py-1 rounded-full text-xs">
              <Sparkles className="h-3 w-3" /> Incentiv3 Creator Hub
            </div>
            <h1 className="text-3xl mt-2 font-semibold">
              Welcome, <span className="text-violet-300">{username}</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <WalletButton />
            <Button onClick={logout} className="bg-red-700/40">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </header>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Missions"
            value={tasks.length}
            color="violet"
          />
          <StatCard
            title="Waiting Review"
            value={tasks.filter((t) => t.status === "submitted").length}
            color="yellow"
          />
          <StatCard
            title="Completed"
            value={tasks.filter((t) => t.status === "approved").length}
            color="emerald"
          />
          <StatCard
            title="Rejected"
            value={tasks.filter((t) => t.status === "rejected").length}
            color="red"
          />
        </div>

        {/* TASK LIST */}
        <Card className="bg-black/30 border border-violet-500/30">
          <CardHeader className="flex justify-between">
            <div>
              <CardTitle>Bounty Missions</CardTitle>
              <CardDescription>Review & Approve Submissions</CardDescription>
            </div>
            <Button
              className="bg-violet-600 hover:bg-violet-700"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <Plus className="mr-2 h-4 w-4" /> New Mission
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* CREATE FORM */}
            {showCreateForm && (
              <form
                onSubmit={createTask}
                className="p-4 bg-black/50 rounded-lg border border-violet-300/20 space-y-3"
              >
                <Input
                  placeholder="Task Description"
                  className="bg-black/60"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
                <Input
                  placeholder="Bounty (ETH)"
                  type="number"
                  className="bg-black/60"
                  value={formData.bounty}
                  onChange={(e) =>
                    setFormData({ ...formData, bounty: e.target.value })
                  }
                />
                <Input
                  type="file"
                  className="bg-black/60"
                  onChange={(e) => setTaskFile(e.target.files?.[0] || null)}
                />

                <Button className="w-full bg-violet-700" disabled={isCreating}>
                  {isCreating ? <Loader className="animate-spin" /> : "Create"}
                </Button>
              </form>
            )}

            {isLoading ? (
              <p className="text-center">Loading...</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex justify-between p-4 bg-black/50 rounded-lg border border-slate-700"
                >
                  <div>
                    <p>{task.description}</p>
                    <p className="text-xs text-gray-400">ID: {task.id}</p>

                    {task.solutionCid && (
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${task.solutionCid}`}
                        target="_blank"
                        className="text-xs underline text-cyan-300"
                      >
                        <Eye className="inline h-3 w-3 mr-1" />
                        Review Solution
                      </a>
                    )}
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded ${badge(
                        task.status
                      )}`}
                    >
                      {task.status}
                    </span>

                    {task.status === "submitted" && (
                      <Button
                        size="sm"
                        onClick={() => setReviewTask(task)}
                        className="mt-2 bg-yellow-600"
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* REVIEW MODAL */}
      {reviewTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <Card className="bg-slate-900 border border-violet-500/30 p-6 max-w-lg w-full">
            <CardHeader>
              <CardTitle>Review Submission</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <a
                href={`https://gateway.pinata.cloud/ipfs/${reviewTask.solutionCid}`}
                target="_blank"
                className="underline text-cyan-300 text-sm flex items-center gap-2"
              >
                <Eye className="w-4 h-4" /> Open Work
              </a>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  className="border-red-500/40 text-red-300"
                  disabled={processing}
                  onClick={() => reject(reviewTask.id)}
                >
                  <XCircle className="mr-1 h-4 w-4" /> Reject
                </Button>

                <Button
                  className="bg-emerald-600"
                  disabled={processing}
                  onClick={() => approve(reviewTask.id)}
                >
                  <CheckCircle className="mr-1 h-4 w-4" /> Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

function StatCard({ title, value, color }: any) {
  const glow: any = {
    violet: "border-violet-500/40 shadow-[0_0_18px_rgba(139,92,246,0.4)]",
    yellow: "border-yellow-500/40 shadow-[0_0_18px_rgba(255,200,0,0.4)]",
    emerald: "border-emerald-500/40 shadow-[0_0_18px_rgba(0,200,120,0.4)]",
    red: "border-red-500/40 shadow-[0_0_18px_rgba(220,50,50,0.4)]",
  };
  return (
    <Card className={`bg-black/40 border ${glow[color]} backdrop-blur-lg`}>
      <CardHeader>
        <CardTitle className="text-xs">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-3xl font-bold">{value}</CardContent>
    </Card>
  );
}
