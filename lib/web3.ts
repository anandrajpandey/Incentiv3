import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";

export const DEBOUNTY_ABI = [
  // Constructor
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },

  // EVENTS
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "taskId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "bounty",
        type: "uint256",
      },
    ],
    name: "TaskCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "taskId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "assignee",
        type: "address",
      },
    ],
    name: "TaskAssigned",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "taskId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "assignee",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "solutionCid",
        type: "string",
      },
    ],
    name: "TaskSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "taskId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "assignee",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "payout",
        type: "uint256",
      },
    ],
    name: "TaskApproved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "taskId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "assignee",
        type: "address",
      },
    ],
    name: "TaskRejected",
    type: "event",
  },

  // FUNCTIONS
  {
    inputs: [
      { internalType: "string", name: "_description", type: "string" },
      { internalType: "string", name: "_fileCid", type: "string" },
    ],
    name: "createTask",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_taskId", type: "uint256" }],
    name: "assignTask",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_taskId", type: "uint256" },
      { internalType: "string", name: "_solutionCid", type: "string" },
    ],
    name: "submitTask",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_taskId", type: "uint256" }],
    name: "approveTask",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_taskId", type: "uint256" }],
    name: "rejectTask",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getTaskCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Updated tasks struct READ
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "tasks",
    outputs: [
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "uint256", name: "bounty", type: "uint256" },
      { internalType: "address", name: "assignee", type: "address" },
      { internalType: "string", name: "fileCid", type: "string" },
      { internalType: "string", name: "solutionCid", type: "string" },
      { internalType: "bool", name: "submitted", type: "bool" },
      { internalType: "bool", name: "approved", type: "bool" },
      { internalType: "bool", name: "rejected", type: "bool" }, // NEW
      { internalType: "bool", name: "open", type: "bool" }, // NEW
    ],
    stateMutability: "view",
    type: "function",
  },
];

export async function getProvider() {
  if (typeof window === "undefined" || !window.ethereum) return null;
  return new BrowserProvider(window.ethereum);
}

export async function getSigner() {
  const provider = await getProvider();
  if (!provider) throw new Error("Wallet not connected");
  return provider.getSigner();
}
export async function getConnectedAddress() {
  try {
    const provider = await getProvider();
    if (!provider) return null;

    const accounts = await provider.listAccounts();
    return accounts.length > 0 ? accounts[0].address : null;
  } catch (err) {
    console.error("Failed to get connected address:", err);
    return null;
  }
}
export const DEBOUNTY_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_DEBOUNTY_CONTRACT_ADDRESS || "";

export async function getContract() {
  const signer = await getSigner();
  return new Contract(DEBOUNTY_CONTRACT_ADDRESS, DEBOUNTY_ABI, signer);
}

export { parseEther, formatEther };
