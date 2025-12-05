// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract DeBountyManager {
    address payable public owner;

    constructor() {
        owner = payable(msg.sender);
    }

    struct Task {
    address creator;
    string description;
    uint bounty;
    address assignee;
    string fileCid;
    string solutionCid;
    bool submitted;
    bool approved;
    bool rejected;
    bool open;
    address rejectedUser; 
}


    Task[] public tasks;

    event TaskCreated(uint taskId, address creator, string description, uint bounty);
    event TaskAssigned(uint taskId, address assignee);
    event TaskSubmitted(uint taskId, address assignee, string solutionCid);
    event TaskApproved(uint taskId, address assignee, uint payout);
    event TaskRejected(uint taskId, address assignee);

    // ADMIN: Create a new mission
    function createTask(string memory _description, string memory _fileCid)
        public
        payable
    {
        require(msg.value > 0, "Bounty must be greater than 0");

        tasks.push(Task({
            creator: msg.sender,
            description: _description,
            bounty: msg.value,
            assignee: address(0),
            fileCid: _fileCid,
            solutionCid: "",
            submitted: false,
            approved: false,
            rejected: false,
            open: true,
            rejectedUser: address(0)
        }));

        emit TaskCreated(tasks.length - 1, msg.sender, _description, msg.value);
    }

    // USER: Claim a task
    function assignTask(uint _taskId) public {
        Task storage task = tasks[_taskId];
        require(task.open, "Task is not available");
        require(task.assignee == address(0), "Already assigned");

        task.assignee = msg.sender;
        task.open = false;

        emit TaskAssigned(_taskId, msg.sender);
    }

    // USER: Submit solution
    function submitTask(uint _taskId, string memory _solutionCid) public {
        Task storage task = tasks[_taskId];
        require(task.assignee == msg.sender, "Not assigned to you");
        require(!task.submitted, "Already submitted");

        task.solutionCid = _solutionCid;
        task.submitted = true;
        task.rejected = false; // Clear old rejected state

        emit TaskSubmitted(_taskId, msg.sender, _solutionCid);
    }

    // ADMIN: Approve solution and release bounty
    function approveTask(uint _taskId) public {
        require(msg.sender == owner, "Only admin");
        Task storage task = tasks[_taskId];
        require(task.submitted, "Nothing to approve");
        require(!task.approved, "Already approved");

        task.approved = true;
        payable(task.assignee).transfer(task.bounty);

        emit TaskApproved(_taskId, task.assignee, task.bounty);
    }

    // ADMIN: Reject solution
    function rejectTask(uint _taskId) public {
    require(msg.sender == owner, "Only admin");
    Task storage task = tasks[_taskId];
    require(task.submitted, "Nothing to reject");

    task.rejected = true;
    task.submitted = false;
    task.solutionCid = "";
    task.open = true; // allow others to claim

    // Save rejected user address
    address rejectedUser = task.assignee;
    task.rejectedUser = rejectedUser;

    // Reset assignee so it's not assigned anymore
    task.assignee = address(0);

    emit TaskRejected(_taskId, rejectedUser);
}



    function getTaskCount() public view returns (uint) {
        return tasks.length;
    }
}


